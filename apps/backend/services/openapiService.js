import OpenAI from 'openai';

/**
 * OpenAI Service
 * Handles AI processing queries for student advising
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Send a chat message to OpenAI and get a response
 * @param {string} message - The user's message
 * @param {object} context - Additional context for the conversation
 * @returns {object} - Response with message and suggestions
 */
export async function chat(message, context = {}) {
  try {
    const systemPrompt = `You are an expert career advisor helping students navigate career pathways. 
    You provide personalized guidance on skill development, career transitions, and learning opportunities.
    Be encouraging, informative, and practical in your advice.`;

    const userMessage = context.careerHistory 
      ? `${message}\n\nCareer Context: ${JSON.stringify(context.careerHistory)}`
      : message;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const advice = response.choices[0]?.message?.content || 'No response generated';

    // Extract actionable suggestions from the response
    const suggestions = extractSuggestions(advice);

    return {
      response: advice,
      suggestions,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

/**
 * Generate personalized learning path
 * @param {object} userProfile - User's current skills and interests
 * @param {array} targetSkills - Skills the user wants to develop
 * @returns {object} - Learning path recommendation
 */
export async function generateLearningPath(userProfile, targetSkills) {
  try {
    const prompt = `Create a personalized learning path for a student with the following profile:
    Current Skills: ${userProfile.currentSkills?.join(', ') || 'None'}
    Experience Level: ${userProfile.experienceLevel || 'Beginner'}
    Target Skills: ${targetSkills.join(', ')}
    
    Provide a step-by-step learning plan with estimated timeframes and resource recommendations.`;

    const response = await chat(prompt, userProfile);
    return response;
  } catch (error) {
    console.error('Error generating learning path:', error);
    throw error;
  }
}

/**
 * Extract actionable suggestions from AI response
 * @param {string} text - The AI response text
 * @returns {array} - Array of extracted suggestions
 */
function extractSuggestions(text) {
  const suggestions = [];
  
  // Look for common suggestion patterns
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

  return suggestions.slice(0, 5); // Return top 5 suggestions
}
