import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service (Gemini Router)
 * Uses Google Gemini as a free alternative since OpenAI quota is exceeded.
 */

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export async function chat(message, context = {}) {
  try {
    const systemInstruction = `You are an expert career advisor helping students navigate career pathways. 
    You provide personalized guidance on skill development, career transitions, and learning opportunities.
    Be encouraging, informative, and practical in your advice.`;

    const userMessage = context.careerHistory 
      ? `${message}\n\nCareer Context: ${JSON.stringify(context.careerHistory)}`
      : message;

    if (!genAI) {
      console.warn('⚠️ GEMINI_API_KEY missing. Returning mock AI response.');
      return formatResponse("I am currently in mock mode because the Gemini API key is missing. Focus on learning modern technologies like React and Node.js!");
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction 
    });

    const result = await model.generateContent(userMessage);
    const responseText = result.response.text();

    return formatResponse(responseText);

  } catch (error) {
    console.error('Gemini AI Routing error:', error.message);
    return formatResponse("I encountered an error connecting to the AI. As a fallback recommendation: Focus on building full-stack applications to build your resume.");
  }
}

export async function generateLearningPath(userProfile, targetSkills) {
  try {
    const prompt = `Create a personalized learning path for a student with the following profile:
    Current Skills: ${userProfile.currentSkills?.join(', ') || 'None'}
    Experience Level: ${userProfile.experienceLevel || 'Beginner'}
    Target Skills: ${targetSkills?.join(', ') || 'Unknown'}
    
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
    /\* \*\*([^*]+)\*\*/g // Match bold bullet points from Gemini
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      suggestions.push(match[1].trim());
    }
  });

  return suggestions.slice(0, 5);
}
