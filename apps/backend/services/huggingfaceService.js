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

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000 // 20s timeout
    });
    return response.data;
  } catch (err) {
    if (err.response?.data) {
      console.error('❌ Hugging Face API Error response body:', JSON.stringify(err.response.data));
    }
    throw err;
  }
}

/**
 * Get OpenAI client pointing to Hugging Face serverless completions endpoint
 */
export function getHFOpenAIClient() {
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

/**
 * Generate dynamic deep-dive insights for a specific target career path
 */
export async function generateCareerDeepDiveInsights(resumeText, careerName) {
  try {
    console.log(`🤖 Querying Llama-3-8B for deep-dive insights on career: "${careerName}"...`);
    const client = getHFOpenAIClient();

    const systemPrompt = `You are an elite career advisor.
    Provide a dynamic, highly personalized deep-dive match analysis between the user's resume and the target career: "${careerName}".
    
    Extract or generate:
    1. why_recommended: 2-3 sentences explaining exactly why this career is a strong match for their background.
    2. strengths: 3 bullet points showing their core strengths/assets relevant to this career.
    3. gaps: 3 bullet points highlighting their key skill gaps for this career.
    4. learning_priorities: 3 actionable steps they should prioritize first.
    5. job_roles: 3 concrete target job roles under this career.
    6. certifications: 2 highly valued industry certifications for this career.
    7. industry_trends: A brief sentence summarizing a key technology trend for this career.
    8. roadmap: A structured 3-phase growth timeline (e.g. ["Phase 1 (Month 1-2): ...", "Phase 2 (Month 3-4): ...", "Phase 3 (Month 5-6): ..."]).
    
    You MUST output valid JSON only conforming to the schema below. Do not output markdown, notes, or explanations outside the JSON object:
    {
      "why_recommended": "Text...",
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "gaps": ["Gap 1", "Gap 2", "Gap 3"],
      "learning_priorities": ["Priority 1", "Priority 2", "Priority 3"],
      "job_roles": ["Role 1", "Role 2", "Role 3"],
      "certifications": ["Cert 1", "Cert 2"],
      "industry_trends": "Trend text...",
      "roadmap": ["Phase 1: ...", "Phase 2: ...", "Phase 3: ..."]
    }`;

    const completion = await client.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct:together',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Resume text:\n\"\"\"\n${resumeText.substring(0, 3000)}\n\"\"\"` }
      ],
      temperature: 0.3
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    let jsonString = '{}';
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = responseText.substring(firstBrace, lastBrace + 1);
    } else {
      jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('❌ Llama 3 Deep-dive insights generation failed:', err.message);
    // Return a rich, structured fallback matching the schema
    return {
      why_recommended: `Your general technical background matches the requirements for ${careerName}.`,
      strengths: ['Core professional competencies', 'General problem solving skills', 'Adaptability to new frameworks'],
      gaps: ['Specific domain frameworks', 'Industry certifications', 'Advanced hands-on project experience'],
      learning_priorities: [`Learn the foundations of ${careerName} paths`, 'Complete industry-focused assignments', 'Build concrete portfolio projects'],
      job_roles: [`Associate ${careerName}`, `${careerName} Specialist`, `Consultant - ${careerName}`],
      certifications: ['General Industry Professional Certification'],
      industry_trends: 'Continuous shift toward automation, cloud integration, and low-latency systems.',
      roadmap: ['Phase 1 (Months 1-2): Master fundamentals and terminology', 'Phase 2 (Months 3-4): Work on practical assignments', 'Phase 3 (Months 5-6): Complete certifications and build portfolio']
    };
  }
}
