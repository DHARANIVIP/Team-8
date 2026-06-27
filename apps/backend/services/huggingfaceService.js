import axios from 'axios';
import OpenAI from 'openai';

const HF_API_KEY = process.env.HF_API_KEY || process.env.HF_TOKEN;

// New Hugging Face router URLs
const CLASSIFIER_URL = 'https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli';
const EMBEDDINGS_URL = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-mpnet-base-v2';

/**
 * Helper to call Hugging Face Inference API
 */
async function queryHF(url, payload) {
  if (!HF_API_KEY) {
    throw new Error('HF_API_KEY (or HF_TOKEN) is not configured in backend .env');
  }

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 20000 // 20s timeout
  });
  return response.data;
}

/**
 * Get OpenAI client pointing to Hugging Face serverless completions endpoint
 */
function getHFOpenAIClient() {
  if (!HF_API_KEY) {
    throw new Error('HF_API_KEY (or HF_TOKEN) is not configured in backend .env');
  }
  return new OpenAI({
    baseURL: 'https://router.huggingface.co/v1',
    apiKey: HF_API_KEY
  });
}

/**
 * Generate sentence embeddings vector (768 dimensions for all-mpnet-base-v2)
 */
export async function getResumeEmbeddings(text) {
  try {
    console.log('🤖 Querying Hugging Face all-mpnet-base-v2 embeddings...');
    const cleanedText = (text || '').replace(/\s+/g, ' ').substring(0, 1500); // Token limits hygiene
    const response = await queryHF(EMBEDDINGS_URL, {
      inputs: cleanedText
    });
    
    if (Array.isArray(response)) {
      return response; // Returns flat 768 dimensional array of floats
    } else if (response && Array.isArray(response[0])) {
      return response[0];
    }
    throw new Error('Invalid embeddings format returned from Hugging Face');
  } catch (err) {
    console.error('❌ Embedding generation failed:', err.message);
    throw new Error(`Hugging Face Embeddings Error: ${err.message}`);
  }
}

/**
 * Classify resume text against a list of target labels (career categories)
 */
export async function classifyResumeText(resumeText, careersList) {
  try {
    console.log('🤖 Querying Hugging Face BART Large MNLI classifier...');
    if (!careersList || careersList.length === 0) {
      throw new Error('No career paths provided for zero-shot classification');
    }

    const careerLabels = careersList.map(c => c.name);
    const cleanedText = (resumeText || '').substring(0, 2000);
    
    const result = await queryHF(CLASSIFIER_URL, {
      inputs: cleanedText,
      parameters: { candidate_labels: careerLabels }
    });

    const careerScores = {};
    if (result && result.labels && result.scores) {
      result.labels.forEach((label, i) => {
        careerScores[label] = Math.round(result.scores[i] * 100);
      });
      return careerScores;
    }
    throw new Error('Invalid zero-shot classification response format from Hugging Face');
  } catch (err) {
    console.error('❌ Resume classification service error:', err.message);
    throw new Error(`Hugging Face Classification Error: ${err.message}`);
  }
}

/**
 * Generate structural resume insights (skills, certifications, growth plan) using Meta Llama 3 model
 */
export async function generateResumeInsights(resumeText, targetCareer) {
  try {
    console.log(`🤖 Querying Hugging Face Llama-3-8B model for career: "${targetCareer}"...`);
    const client = getHFOpenAIClient();

    const systemPrompt = `You are a professional career guidance counselor and skills gap parser.
    Analyze the provided resume text in the context of the target career: "${targetCareer}".
    
    Extract:
    1. A list of candidate skills that are present in the resume.
    2. A list of 3-4 highly relevant industry certifications for the target career (e.g. "AWS Certified Solutions Architect" for Cloud Architect, "Google Data Analytics Professional" for Data Analyst).
    3. Detailed growth_suggestions (1-2 paragraphs of actionable career guidance).
    4. Highest education background found (e.g. "Undergrad", "Postgrad").
    
    You MUST output valid JSON only conforming to the schema below. Do not output markdown, notes, or explanations outside the JSON object:
    {
      "skills": ["Python", "SQL", "Git"],
      "certifications": ["AWS Solutions Architect", "Certified Kubernetes Administrator"],
      "growth_suggestions": "Focus on building a portfolio with web projects...",
      "education": "Undergrad"
    }`;

    const completion = await client.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct:together',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Resume text:\n\"\"\"\n${resumeText.substring(0, 3000)}\n\"\"\"` }
      ],
      temperature: 0.2
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    // Clean potential markdown blocks from response
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('❌ Hugging Face Llama 3 completion failed:', err.message);
    throw new Error(`Hugging Face LLM Error: ${err.message}`);
  }
}
