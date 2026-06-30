import OpenAI from 'openai';
import { getGeminiAI, markKeyExhausted, isRateLimitError, parseRetryDelay } from './geminiKeyManager.js';

/**
 * AI Service (Gemini Router + HuggingFace Fallback)
 * Uses Google Gemini as primary, HuggingFace Llama as fallback.
 * Supports multiple GEMINI_API_KEY rotation on 429 rate limits.
 */

const HF_TOKEN = process.env.HF_TOKEN || process.env.HF_API_KEY;

function getHFClient() {
  if (!HF_TOKEN) return null;
  return new OpenAI({
    baseURL: 'https://router.huggingface.co/v1',
    apiKey: HF_TOKEN
  });
}

export async function chat(message, context = {}) {
  const systemInstruction = `You are an expert career advisor helping students navigate career pathways. 
  You provide personalized guidance on skill development, career transitions, and learning opportunities.
  Be encouraging, informative, and practical in your advice.`;

  const userMessage = context.careerHistory 
    ? `${message}\n\nCareer Context: ${JSON.stringify(context.careerHistory)}`
    : message;

  // 1. Try Gemini models (with automatic key rotation on 429)
  {
    const maxKeyAttempts = 5;
    let geminiDone = false;
    for (let keyAttempt = 0; keyAttempt < maxKeyAttempts && !geminiDone; keyAttempt++) {
      const ai = getGeminiAI();
      if (!ai) break;
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
      for (const modelName of modelsToTry) {
        try {
          console.log(`Chatbot trying model: "${modelName}"...`);
          const model = ai.getGenerativeModel({ model: modelName, systemInstruction });
          const result = await model.generateContent(userMessage);
          if (result?.response) {
            const text = await result.response.text();
            return formatResponse(text);
          }
        } catch (err) {
          if (isRateLimitError(err)) {
            markKeyExhausted(null, parseRetryDelay(err));
            console.log(`🔄 Chatbot Gemini 429 — rotating key (attempt ${keyAttempt + 1}/${maxKeyAttempts})...`);
            break; // break model loop, retry with next key
          }
          console.warn(`Chatbot model "${modelName}" failed:`, err.message?.substring(0, 100));
        }
      }
      geminiDone = true;
    }
    console.warn('All Gemini keys exhausted, trying HuggingFace fallback...');
  }

  // 2. Try HuggingFace Llama
  const hfClient = getHFClient();
  if (hfClient) {
    try {
      console.log('Chatbot trying HuggingFace Llama...');
      const completion = await hfClient.chat.completions.create({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct:together',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7
      });
      const text = completion.choices[0]?.message?.content || '';
      if (text) return formatResponse(text);
    } catch (err) {
      console.warn('HuggingFace chatbot failed:', err.message?.substring(0, 100));
    }
  }

  // 3. Final fallback
  return formatResponse("I'm having trouble connecting to the AI right now. As a general recommendation: Focus on building full-stack applications with React and Node.js to strengthen your resume!");
}

function cleanJsonText(text) {
  if (!text) return text;
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  const lastBrace = text.lastIndexOf('}');
  const lastBracket = text.lastIndexOf(']');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return text.substring(firstBracket, lastBracket + 1);
  }
  return text;
}

function parseRecommendationJson(responseText) {
  if (!responseText) return [];
  const cleaned = cleanJsonText(responseText);
  try {
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (item && typeof item === 'object') return item;
        return null;
      }).filter(Boolean);
    }

    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.recommendations)) {
        return parsed.recommendations;
      }
      if (Array.isArray(parsed.items)) {
        return parsed.items;
      }
      if (parsed.recommendations && typeof parsed.recommendations === 'object') {
        return [parsed.recommendations];
      }
    }

    return [];
  } catch (parseError) {
    console.warn('Failed to parse AI response JSON, using fallback:', parseError.message);
    return [];
  }
}

function buildCareerFallback(availableCareers = []) {
  const baseCareers = (availableCareers || []).slice(0, 3).map((career, index) => ({
    career_name: career.name,
    match_percentage: 85 - index * 10,
    reason: `Based on your profile, ${career.name} is a strong match among available career options.`,
    recommended_skills: [],
    missing_skills: []
  }));
  return baseCareers.length > 0 ? baseCareers : [{
    career_name: 'Software Engineer',
    match_percentage: 75,
    reason: 'Fallback recommendation for software engineering when AI results are unavailable.',
    recommended_skills: [],
    missing_skills: []
  }];
}

function extractCareerNamesFromText(responseText, availableCareers = []) {
  if (!responseText) return [];
  const lowerText = responseText.toLowerCase();
  const recommendations = [];
  for (const career of availableCareers) {
    if (lowerText.includes(career.name.toLowerCase())) {
      recommendations.push({
        career_name: career.name,
        match_percentage: 75,
        reason: `AI response mentioned ${career.name}, so it is considered a likely match.`,
        recommended_skills: [],
        missing_skills: []
      });
    }
  }
  return recommendations.slice(0, 5);
}

export async function generateCareerRecommendationsFromProfile(profile, availableCareers = []) {
  const studentProfile = {
    degree: profile.education_background || profile.major_stream || profile.target_career || 'General Science',
    year: profile.year || 1,
    interests: profile.interests || [],
    strengths: profile.strengths || [],
    weaknesses: profile.weaknesses || [],
    current_skills: profile.current_skills || [],
    experience_level: profile.experience_level || 'Beginner',
    study_hours_per_week: profile.study_hours_per_week || 10,
    preferred_learning: profile.preferred_learning || profile.learning_style?.[0] || 'Video'
  };

  const formattedCareers = (availableCareers || []).slice(0, 20).map(career => ({
    name: career.name,
    description: career.description || career.title || '',
    salary_range: career.salary_range || '',
    growth_rate: career.growth_rate || career.demand_level || ''
  }));

  const careerListText = formattedCareers.map((career, index) =>
    `${index + 1}. ${career.name} - ${career.description}`
  ).join('\n');

  const prompt = `You are an expert career advisor. A student has the following profile:\n${JSON.stringify(studentProfile, null, 2)}\n\nAvailable careers:\n${careerListText}\n\nReturn a strict JSON object with a top-level key named "recommendations". Each recommendation should include:\n- career_name\n- match_percentage\n- reason\n- recommended_skills\n- missing_skills\n\nOnly include careers from the available careers list. Return exactly valid JSON with no additional commentary. If the AI is not able to produce structured JSON, return an object with a "recommendations" array and no extra text.`;

  const aiResponse = await chat(prompt);
  const parsed = parseRecommendationJson(aiResponse.response);
  if (parsed.length > 0) {
    return parsed;
  }

  const extracted = extractCareerNamesFromText(aiResponse.response, availableCareers);
  if (extracted.length > 0) {
    return extracted;
  }

  return buildCareerFallback(availableCareers);
}

export async function generateLearningPath(userProfile, targetSkills) {
  try {
    const prompt = `Create a personalized learning path for a student with the following profile:\n    Current Skills: ${userProfile.currentSkills?.join(', ') || 'None'}\n    Experience Level: ${userProfile.experienceLevel || 'Beginner'}\n    Target Skills: ${targetSkills?.join(', ') || 'Unknown'}\n    \n    Provide a step-by-step learning plan with estimated timeframes and resource recommendations.`;

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
