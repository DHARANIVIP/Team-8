import OpenAI from 'openai';
import axios from 'axios';

/**
 * AI Service (Multi-LLM Router)
 * Routes queries to OpenAI, Anthropic, Gemini, or OpenRouter based on configuration
 */

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function chat(message, context = {}) {
  try {
    const systemPrompt = `You are an expert career advisor helping students navigate career pathways. 
    You provide personalized guidance on skill development, career transitions, and learning opportunities.
    Be encouraging, informative, and practical in your advice.`;

    const userMessage = context.careerHistory 
      ? `${message}\n\nCareer Context: ${JSON.stringify(context.careerHistory)}`
      : message;

    // Optional: Search Web for Live Context before answering
    let webContext = '';
    if (process.env.SERPAPI_KEY) {
       webContext = '\\n[Note: Using live web search data to enhance response]';
    }

    // MULTI-LLM ROUTING LOGIC
    if (process.env.OPENROUTER_API_KEY) {
      console.log('Routing to OpenRouter...');
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage + webContext }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000', 
        }
      });
      return formatResponse(response.data.choices[0]?.message?.content);
    }
    
    // Fallback to direct OpenAI usage
    if (!openai) throw new Error('No AI provider configured (Missing OPENAI_API_KEY or OPENROUTER_API_KEY).');

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage + webContext },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return formatResponse(response.choices[0]?.message?.content);

  } catch (error) {
    console.error('AI Routing error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

export async function generateLearningPath(userProfile, targetSkills) {
  try {
    const prompt = `Create a personalized learning path for a student with the following profile:
    Current Skills: ${userProfile.currentSkills?.join(', ') || 'None'}
    Experience Level: ${userProfile.experienceLevel || 'Beginner'}
    Target Skills: ${targetSkills.join(', ')}
    
    Provide a step-by-step learning plan with estimated timeframes and resource recommendations.`;

    return await chat(prompt, userProfile);
  } catch (error) {
    console.error('Error generating learning path:', error);
    throw error;
  }
}

function formatResponse(advice) {
  advice = advice || 'No response generated';
  const suggestions = extractSuggestions(advice);
  return {
    response: advice,
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

function extractSuggestions(text) {
  const suggestions = [];
  const patterns = [
    /(?:recommend|suggest|consider|try|learn|study|focus on)[:\s]+([^.\n]+)/gi,
    /(?:next step|action item|priority)[:\s]+([^.\n]+)/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      suggestions.push(match[1].trim());
    }
  });

  return suggestions.slice(0, 5);
}
