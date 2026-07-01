import OpenAI from 'openai';
import { getGeminiAI, markKeyExhausted, isRateLimitError, parseRetryDelay, getKeyCount, getGeminiUnavailableMessage, isInvalidKeyError } from './geminiKeyManager.js';

/**
 * Gemini Career Service
 * Uses Google Gemini API (primary) with HuggingFace Llama fallback
 * for AI-powered career recommendations and skill gap analysis.
 * Supports multiple GEMINI_API_KEY rotation on 429 rate limits.
 */

const HF_TOKEN = process.env.HF_TOKEN || process.env.HF_API_KEY;

/**
 * Get HuggingFace OpenAI-compatible client
 */
function getHFClient() {
  if (!HF_TOKEN) return null;
  return new OpenAI({
    baseURL: 'https://router.huggingface.co/v1',
    apiKey: HF_TOKEN
  });
}

/**
 * Try multiple Gemini models with fallback.
 * Uses a fresh AI instance from the key manager each time.
 */
function getModel() {
  const ai = getGeminiAI();
  if (!ai) return null;
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
  for (const modelName of models) {
    try {
      return ai.getGenerativeModel({ model: modelName });
    } catch {
      continue;
    }
  }
  return ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

/**
 * Helper: run a Gemini prompt with automatic key rotation on 429.
 * Returns the parsed text response, or throws if all keys fail.
 */
async function runGeminiWithRotation(prompt, { json = false } = {}) {
  const maxAttempts = Math.max(getKeyCount(), 1);
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = getModel();
    if (!model) throw new Error(getGeminiUnavailableMessage());
    try {
      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      return text;
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error)) {
        const retrySec = parseRetryDelay(error);
        markKeyExhausted(null, retrySec);
        console.log(`Gemini 429; rotating key (attempt ${attempt + 1}/${maxAttempts})...`);
        continue;
      }
      if (isInvalidKeyError(error)) {
        throw new Error('Gemini API key is invalid or unauthorized. Check backend environment configuration.');
      }
      throw error; // non-retryable error, propagate immediately
    }
  }
  throw lastError || new Error('All Gemini keys exhausted.');
}

/**
 * Build the career recommendation prompt
 */
function buildCareerPrompt(userProfile, allCareers) {
  const careersSummary = allCareers.slice(0, 20).map(c => ({
    id: c.id,
    name: c.name,
    description: c.description?.substring(0, 100),
    salary_range: c.salary_range,
    growth_rate: c.growth_rate,
    demand_level: c.demand_level
  }));

  return `You are an expert career guidance counselor. Analyze this student's COMPLETE profile — not just their degree — and match them against available careers. A student may have studied in one field but want to build a career in another. Consider their interests, goals, skills, resume, and experience holistically. Return ONLY valid JSON.

Student Profile:
- Current Skills: ${JSON.stringify(userProfile.current_skills || [])}
- Education: ${userProfile.education_background || 'Not specified'}
- Major: ${userProfile.major_stream || 'Not specified'}
- Target Career: ${userProfile.target_career || 'Not specified'}
- Career Goal: ${userProfile.career_goal || 'Not specified'}
- Experience Level: ${userProfile.years_experience || 'Not specified'}
- Interests: ${JSON.stringify(userProfile.interests || [])}
- Strengths: ${JSON.stringify(userProfile.strengths || [])}
- Learning Style: ${JSON.stringify(userProfile.learning_style || [])}
- Resume Summary: ${(userProfile.resume_raw_text || '').substring(0, 800)}

Available Careers:
${JSON.stringify(careersSummary, null, 2)}

Return a JSON array of the top 3-5 career recommendations sorted by best match. Each recommendation must have this exact structure:
[
  {
    "careerId": "career-uuid-from-available-list",
    "careerName": "Career Name",
    "matchPercentage": 85,
    "reason": "2-3 sentence explanation why this role matches the student's complete profile (skills, interests, goals, resume)",
    "strengths": ["skill1", "skill2"],
    "missingSkills": ["skill3", "skill4"],
    "salaryRange": "Rs X - Rs Y",
    "demandLevel": "Low|Medium|High|Very High",
    "growthRate": "X%"
  }
]

Ensure:
- matchPercentage is between 0-100
- careerId matches one from the available careers list
- strengths are skills the user already has
- missingSkills are skills they need to develop
- Recommendations are based on the FULL profile, not just education
- Return ONLY the JSON array, no markdown or explanation`;
}

/**
 * Error thrown when all AI providers fail — no hardcoded/mock recommendations
 */
function noAIFallbackError() {
  return new Error('All AI providers (Gemini, HuggingFace) failed. Please check API keys and try again. No mock recommendations will be generated.');
}

/**
 * Generate career recommendations based on user profile and available careers
 * Tries Gemini -> HuggingFace Llama -> Rule-based fallback
 */
export async function generateCareerRecommendations(userProfile, allCareers) {
  const prompt = buildCareerPrompt(userProfile, allCareers);

  // 1. Try Gemini (with automatic key rotation on 429)
  try {
    const text = await runGeminiWithRotation(prompt);
    console.log('Gemini career raw:', text.substring(0, 200));

    const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/) || text.match(/(\[[\s\S]*\])/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const recommendations = JSON.parse(jsonStr);
    console.log(`Generated ${recommendations.length} career recommendations via Gemini`);
    return recommendations;
  } catch (error) {
    console.warn('Gemini career recommendations failed:', error.message);
  }

  // 2. Try HuggingFace Llama
  const hfClient = getHFClient();
  if (hfClient) {
    try {
      console.log('Trying HuggingFace Llama for career recommendations...');
      const completion = await hfClient.chat.completions.create({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct:together',
        messages: [
          { role: 'system', content: 'You are a career guidance counselor. Return ONLY valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });
      const text = completion.choices[0]?.message?.content || '';
      console.log('HF career raw:', text.substring(0, 200));

      const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/) || text.match(/(\[[\s\S]*\])/);
      const jsonStr = jsonMatch ? jsonMatch[1] : text;
      const recommendations = JSON.parse(jsonStr);
      console.log(`Generated ${recommendations.length} career recommendations via HuggingFace`);
      return recommendations;
    } catch (error) {
      console.warn('HuggingFace career recommendations failed:', error.message);
    }
  }

  // 3. All AI providers failed — throw error (no mock data)
  throw noAIFallbackError();
}

/**
 * Generate skill gap analysis comparing user skills vs required skills
 */
export async function generateSkillGapAnalysis(userSkills, requiredSkills, careerName) {
  if (!getGeminiAI()) {
    // Fallback: simple rule-based analysis
    const userSkillsLower = (userSkills || []).map(s => s.toLowerCase());
    const acquiredSkills = (requiredSkills || []).filter(s => 
      userSkillsLower.includes(s.name?.toLowerCase())
    );
    const gapSkills = (requiredSkills || []).filter(s => 
      !userSkillsLower.includes(s.name?.toLowerCase())
    );
    
    return {
      acquiredSkills: acquiredSkills.map(s => s.name),
      gapSkills: gapSkills.map(s => s.name),
      readinessScore: requiredSkills.length > 0 
        ? Math.round((acquiredSkills.length / requiredSkills.length) * 100) 
        : 0,
      learningPath: gapSkills.slice(0, 5).map(s => `Learn ${s.name}`)
    };
  }

  try {
    const prompt = `
Compare user skills against required skills for a career. Return ONLY valid JSON.

Career: ${careerName}
User Skills: ${JSON.stringify(userSkills || [])}
Required Skills: ${JSON.stringify(requiredSkills || [])}

Return a JSON object with this exact structure:
{
  "acquiredSkills": ["skill1", "skill2"],
  "gapSkills": ["skill3", "skill4"],
  "readinessScore": 75,
  "learningPath": ["Learn skill3", "Practice skill4", ...]
}

Requirements:
- acquiredSkills: skills the user already has
- gapSkills: skills they need to learn
- readinessScore: 0-100 indicating job readiness
- learningPath: ordered list of steps to close gaps
- Return ONLY the JSON object, no markdown or explanation
`;
    
    const text = await runGeminiWithRotation(prompt);
    
    const jsonMatch = text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('❌ Gemini skill gap analysis failed:', error.message);
    // Fallback to rule-based
    const userSkillsLower = (userSkills || []).map(s => s.toLowerCase());
    const acquiredSkills = (requiredSkills || []).filter(s => 
      userSkillsLower.includes(s.name?.toLowerCase())
    );
    const gapSkills = (requiredSkills || []).filter(s => 
      !userSkillsLower.includes(s.name?.toLowerCase())
    );
    
    return {
      acquiredSkills: acquiredSkills.map(s => s.name),
      gapSkills: gapSkills.map(s => s.name),
      readinessScore: requiredSkills.length > 0 
        ? Math.round((acquiredSkills.length / requiredSkills.length) * 100) 
        : 0,
      learningPath: gapSkills.slice(0, 5).map(s => `Learn ${s.name}`)
    };
  }
}

/**
 * Generate learning path recommendations
 */
export async function generateLearningPath(careerName, gapSkills, userLevel) {
  try {
    const prompt = `
Create a learning path for someone wanting to become a ${careerName}.
User Level: ${userLevel || 'Beginner'}
Skills to Learn: ${JSON.stringify(gapSkills.slice(0, 8).map(s => s.name || s))}

Return ONLY valid JSON with this structure:
{
  "steps": [
    {
      "step": 1,
      "skill": "Skill Name",
      "estimatedWeeks": 4,
      "resources": ["Resource 1", "Resource 2"]
    }
  ],
  "totalEstimatedWeeks": 24
}

Requirements:
- Order skills logically from foundational to advanced
- Estimate realistic timeframes (2-8 weeks per skill)
- Suggest 1-2 learning resources per skill
- Return ONLY the JSON object
`;
    
    const text = await runGeminiWithRotation(prompt);
    
    const jsonMatch = text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('❌ Gemini learning path generation failed:', error.message);
    throw new Error(`Learning path generation failed: ${error.message}`);
  }
}

/**
 * Generate ordered skill learning sequence based on student profile and missing skills
 * Workflow C: AI ranks skills by learning sequence, provides reason and prerequisites
 */
export async function generateSkillRecommendationOrder(profile, careerName, missingSkills, knownSkills) {
  if (!getGeminiAI()) {
    // Fallback: order by difficulty (Easy → Medium → Hard)
    const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    return missingSkills
      .sort((a, b) => (difficultyOrder[a.difficulty_level] || 2) - (difficultyOrder[b.difficulty_level] || 2))
      .map((skill, idx) => ({
        skill_id: skill.id,
        skill_name: skill.name,
        recommended_level: skill.difficulty_level || 'Intermediate',
        reason: `Learn this skill to progress toward ${careerName}`,
        prerequisites: [],
        priority_order: idx + 1
      }));
  }

  try {
    const prompt = `
You are an expert career coach. Order these skills into the optimal learning sequence for a student targeting ${careerName}.

Student Profile:
- Known Skills: ${JSON.stringify(knownSkills.map(s => s.name || s))}
- Interests: ${JSON.stringify(profile.interests || [])}
- Strengths: ${JSON.stringify(profile.strengths || [])}
- Study Hours/Week: ${profile.study_hours_per_week || 10}
- Experience Level: ${profile.years_experience || 'Beginner'}

Skills to Learn (missing/weak for target career):
${JSON.stringify(missingSkills.map(s => ({
  id: s.id,
  name: s.name,
  category: s.category,
  difficulty: s.difficulty_level
})), null, 2)}

Return ONLY valid JSON array ordered by optimal learning sequence:
[
  {
    "skill_id": "uuid-from-list",
    "skill_name": "Skill Name",
    "recommended_level": "Beginner|Intermediate|Expert",
    "reason": "Why this skill should be learned at this point in the sequence",
    "prerequisites": ["skill name already known or earlier in sequence"],
    "priority_order": 1
  }
]

Rules:
- Start with foundational skills before advanced ones
- Consider prerequisites naturally
- priority_order must be sequential starting from 1
- Return ONLY the JSON array, no markdown or explanation
`;

    const text = await runGeminiWithRotation(prompt);
    
    console.log('🤖 Gemini skill recommendation raw:', text.substring(0, 200));
    
    const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/) || text.match(/(\[[\s\S]*\])/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    
    const recommendations = JSON.parse(jsonStr);
    
    // Validate that all skill_ids exist in the missing skills list
    const validIds = new Set(missingSkills.map(s => s.id));
    const validated = recommendations.filter(r => validIds.has(r.skill_id));
    
    // Add any missing skills that AI didn't include
    const includedIds = new Set(validated.map(r => r.skill_id));
    let order = validated.length + 1;
    for (const skill of missingSkills) {
      if (!includedIds.has(skill.id)) {
        validated.push({
          skill_id: skill.id,
          skill_name: skill.name,
          recommended_level: skill.difficulty_level || 'Intermediate',
          reason: `Important skill for ${careerName}`,
          prerequisites: [],
          priority_order: order++
        });
      }
    }
    
    return validated;
  } catch (error) {
    console.error('❌ Gemini skill recommendation failed:', error.message);
    // Fallback: order by difficulty
    const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    return missingSkills
      .sort((a, b) => (difficultyOrder[a.difficulty_level] || 2) - (difficultyOrder[b.difficulty_level] || 2))
      .map((skill, idx) => ({
        skill_id: skill.id,
        skill_name: skill.name,
        recommended_level: skill.difficulty_level || 'Intermediate',
        reason: `Learn this skill to progress toward ${careerName}`,
        prerequisites: [],
        priority_order: idx + 1
      }));
  }
}

function generateDeterministicCourseRecommendations(allCourses, context = {}) {
  const skillGapSkills = context.skillGapSkills || [];
  const skillRecommendations = context.skillRecommendations || [];
  const gapIds = new Set(skillGapSkills.map(s => s.id).filter(Boolean));
  const gapNames = [
    ...skillGapSkills.map(s => s.name || s.skill_name),
    ...skillRecommendations.map(s => s.skill_name || s.name)
  ].filter(Boolean);
  const normalizedGapNames = gapNames.map(name => String(name).toLowerCase());

  const scored = (allCourses || []).map(course => {
    let score = 0;
    if (course.skill_id && gapIds.has(course.skill_id)) score += 6;
    const haystack = [course.title, course.description, course.category, ...(course.tags || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    for (const gapName of normalizedGapNames) {
      if (gapName && haystack.includes(gapName)) score += 3;
    }
    if (course.rating) score += Math.min(Number(course.rating) || 0, 5) / 5;
    return { course, score };
  })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const selected = scored.length > 0 ? scored : (allCourses || []).slice(0, 8).map(course => ({ course, score: 0 }));
  return {
    skillGap: gapNames.length ? Array.from(new Set(gapNames)).slice(0, 8) : ['General skill growth'],
    recommendedCourses: selected.map(({ course }, idx) => ({
      courseId: course.id,
      reason: gapNames.length
        ? 'Recommended from the course catalog because it matches your current skill gaps.'
        : 'Recommended from the available course catalog while AI recommendations are temporarily unavailable.',
      priority_order: idx + 1,
      learning_sequence: idx + 1,
      expected_outcome: course.learning_outcomes?.[0] || 'Build practical skills for your target career.'
    })),
    fallback: 'deterministic'
  };
}

/**
 * Workflow B: Generate course recommendations based on student profile and available courses
 * AI selects courses from the provided list that close the student's skill gap
 */
export async function generateCourseRecommendations(profile, allCourses, context = {}) {
  const { selectedCareer, skillGapSkills, skillRecommendations } = context;
  try {
    // Include up to 80 courses in the prompt (all available)
    const coursesSummary = allCourses.slice(0, 80).map(c => ({
      id: c.id,
      title: c.title,
      provider: c.provider,
      platform: c.platform,
      difficulty: c.difficulty,
      duration_weeks: c.duration_weeks,
      rating: c.rating,
      category: c.category,
      tags: c.tags || [],
      skill_id: c.skill_id
    }));

    // Build skill gap context
    const skillGapNames = skillGapSkills ? skillGapSkills.map(s => s.name) : [];
    const skillRecSummary = skillRecommendations ? skillRecommendations.slice(0, 15).map(s => ({
      name: s.skill_name || s.name,
      category: s.skill_category || s.category,
      difficulty: s.skill_difficulty || s.difficulty_level,
      status: s.status || 'pending',
      priority: s.priority_order
    })) : [];

    const prompt = `
You are an expert learning advisor. Analyze this student's COMPLETE profile and recommend the most relevant courses from the provided list to close their skill gaps and advance their career goals.

Student Profile:
- Name: ${profile.name || 'Student'}
- Current Skills: ${JSON.stringify(profile.current_skills || [])}
- Education: ${profile.education_background || 'Not specified'}
- Major: ${profile.major_stream || 'Not specified'}
- Target Career: ${profile.target_career || 'Not specified'}
- Career Goal: ${profile.career_goal || 'Not specified'}
- Experience Level: ${profile.years_experience || 'Beginner'}
- Interests: ${JSON.stringify(profile.interests || [])}
- Strengths: ${JSON.stringify(profile.strengths || [])}
- Learning Style: ${JSON.stringify(profile.learning_style || [])}
- Study Hours/Week: ${profile.study_hours_per_week || 10}
- Resume Summary: ${(profile.resume_raw_text || '').substring(0, 600)}
${selectedCareer ? `\nSelected Career Path: ${selectedCareer.name || 'Not specified'}\nCareer Description: ${selectedCareer.description || ''}` : ''}
${skillGapNames.length > 0 ? `\nSkill Gap (skills student needs to learn): ${JSON.stringify(skillGapNames)}` : ''}
${skillRecSummary.length > 0 ? `\nOrdered Skill Recommendations:\n${JSON.stringify(skillRecSummary, null, 2)}` : ''}

Available Courses (${coursesSummary.length} courses across multiple domains):
${JSON.stringify(coursesSummary, null, 2)}

Return ONLY valid JSON with this structure:
{
  "skillGap": ["skill1", "skill2"],
  "recommendedCourses": [
    {
      "courseId": "uuid-from-list",
      "reason": "Specific explanation of why this course helps this student",
      "priority_order": 1,
      "learning_sequence": 1,
      "expected_outcome": "What the student will gain"
    }
  ]
}

Rules:
- ONLY recommend courses from the provided list — never invent courses
- Recommend 5-10 courses maximum, ordered by impact and relevance
- skillGap should list the specific skills the student is missing for their target career
- Consider the student's FULL profile: resume, interests, goals, strengths — not just their degree
- Prioritize courses that directly address the skill gap
- Include a mix of difficulty levels appropriate to the student's current level
- courseId MUST match one from the available courses list exactly
- Return ONLY the JSON object, no markdown or explanation
`;

    const text = await runGeminiWithRotation(prompt);
    
    console.log('🤖 Gemini course recommendation raw:', text.substring(0, 200));
    
    const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate courseIds exist in the provided list
    const validIds = new Set(allCourses.map(c => c.id));
    parsed.recommendedCourses = (parsed.recommendedCourses || []).filter(rc => validIds.has(rc.courseId));
    if (parsed.recommendedCourses.length === 0) {
      return generateDeterministicCourseRecommendations(allCourses, context);
    }

    return parsed;
  } catch (error) {
    console.error('Gemini course recommendation failed:', error.message);
    console.log('Using deterministic course recommendations from the local course catalog.');
    return generateDeterministicCourseRecommendations(allCourses, context);
  }
}

/**
 * Generate AI-powered comparison summary for selected careers
 */
export async function generateCareerComparisonSummary(profile, comparisonsData) {
  const prompt = `You are an expert career guidance counselor. Compare the following careers side-by-side for the student and provide a structured comparison summary.
  
Student Profile:
- Current Skills: ${JSON.stringify(profile.current_skills || [])}
- Interests: ${JSON.stringify(profile.interests || [])}
- Experience Level: ${profile.years_experience || 'Beginner'}
- Education: ${profile.education_background || 'Not specified'}

Careers compared:
${JSON.stringify(comparisonsData.map(c => ({
  careerId: c.careerId,
  title: c.title,
  industry: c.industry,
  overallScore: c.overallScore,
  matchPercent: c.matchPercent,
  avgSalary: c.avgSalary,
  growth: c.growth,
  missingSkills: c.missingSkills
})), null, 2)}

Return ONLY valid JSON conforming to this structure:
{
  "bestCareer": "Name of the career that is the absolute best fit",
  "reason": "Detailed explanation matching their interests, skills and experience",
  "strengths": {
    "careerId_or_name": ["strength 1", "strength 2"],
    ...
  },
  "challenges": {
    "careerId_or_name": ["challenge 1", "challenge 2"],
    ...
  },
  "skillsToDevelop": {
    "careerId_or_name": ["skill 1", "skill 2"],
    ...
  },
  "recommendedPath": ["Step 1", "Step 2", "Step 3"]
}

Ensure:
- Return ONLY the JSON object, no markdown code blocks, no explanations outside the JSON.`;

  try {
    const text = await runGeminiWithRotation(prompt);
    console.log('🤖 Gemini career comparison raw:', text.substring(0, 200));
    const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('❌ Gemini career comparison summary failed:', error.message);
    // Return a structured fallback summary
    const bestCareer = comparisonsData[0]?.title || 'Selected Careers';
    const strengths = {};
    const challenges = {};
    const skillsToDevelop = {};
    comparisonsData.forEach(c => {
      strengths[c.careerId] = ['Strong interest alignment'];
      challenges[c.careerId] = ['Requires learning new skills'];
      skillsToDevelop[c.careerId] = c.missingSkills.slice(0, 3);
    });
    return {
      bestCareer,
      reason: `Based on your profile, ${bestCareer} aligns well with your compatibility score.`,
      strengths,
      challenges,
      skillsToDevelop,
      recommendedPath: [`Start by learning foundational skills for ${bestCareer}.`, 'Enroll in recommended courses.', 'Track your progress in the Skills tab.']
    };
  }
}

