import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import { protect } from '../middleware/auth.js';
import { 
  updateUserProfile, 
  getUserProfile,
  upsertUserRecommendations, 
  getAllCategories, 
  getAllSkills, 
  getAllCourses,
  getUserRecommendations,
  getOnboardingStatus,
  saveResumeAnalysis,
  getResumeAnalysis
} from '../services/supabaseService.js';
import { getGeminiAI, markKeyExhausted, isRateLimitError, parseRetryDelay } from '../services/geminiKeyManager.js';

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';



// Multer memory storage configuration for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF resumes are supported currently.'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Helper to categorize careers into industries
 */
const getIndustryForCareerName = (careerName) => {
  const name = (careerName || '').toLowerCase();
  if (name.includes('software') || name.includes('cloud') || name.includes('architect') || name.includes('engineer')) {
    if (name.includes('data')) return 'Data & AI';
    return 'Technology';
  }
  if (name.includes('data') || name.includes('scientist') || name.includes('ai') || name.includes('analyst')) {
    if (name.includes('cyber') || name.includes('security')) return 'Security';
    return 'Data & AI';
  }
  if (name.includes('design') || name.includes('ux') || name.includes('ui') || name.includes('designer')) return 'Design';
  if (name.includes('product') || name.includes('manager') || name.includes('business')) return 'Business';
  return 'Technology';
};

/**
 * POST /api/onboarding/submit
 * Process onboarding details and resume upload (Forwards to Python FastAPI service)
 */
router.post('/submit', protect, upload.single('resume'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      education, major, learningStyle, interests, skills: formSkills,
      targetRole, salaryExpectation, careerGoal, institutionName, 
      graduationYear, wantsCertifications, yearsExperience, availability 
    } = req.body;

    // Enforce that a PDF resume is mandatory
    if (!req.file) {
      return res.status(400).json({ error: 'A PDF resume is required for AI-based career classification.' });
    }

    // Parse study_hours_per_week from availability string
    const availabilityMap = { '< 5 hours/week': 3, '5-10 hours/week': 7, '10-20 hours/week': 15, '20+ hours/week': 25 };
    const studyHoursPerWeek = availabilityMap[availability] || 10;
    
    // Parse JSON arrays safely
    let parsedLearningStyle = [];
    try {
      parsedLearningStyle = typeof learningStyle === 'string' ? JSON.parse(learningStyle) : (learningStyle || []);
    } catch (e) {
      parsedLearningStyle = Array.isArray(learningStyle) ? learningStyle : [];
    }

    let parsedInterests = [];
    try {
      parsedInterests = typeof interests === 'string' ? JSON.parse(interests) : (interests || []);
    } catch (e) {
      parsedInterests = Array.isArray(interests) ? interests : [];
    }

    let parsedFormSkills = [];
    try {
      parsedFormSkills = typeof formSkills === 'string' ? JSON.parse(formSkills) : (formSkills || []);
    } catch (e) {
      parsedFormSkills = Array.isArray(formSkills) ? formSkills : [];
    }

    // 1. Fetch baseline datasets from PostgreSQL Supabase
    let allCareers = [];
    let allSkills = [];
    let allCourses = [];
    try {
      allCareers = (await getAllCategories()) || [];
      allSkills = (await getAllSkills()) || [];
      allCourses = (await getAllCourses()) || [];
    } catch (dbErr) {
      console.error('❌ Failed to fetch baseline data from Supabase:', dbErr.message);
      return res.status(500).json({ error: 'Failed to fetch career data from database. Please ensure migrations have been run.' });
    }

    if (!allCareers.length) {
      return res.status(404).json({ error: 'No careers found in database. Please seed the database first.' });
    }

    // 2. Parse PDF resume text directly in Node.js
    console.log('🤖 Parsing PDF resume text...');
    let resumeText = '';
    try {
      const parser = new PDFParse(new Uint8Array(req.file.buffer));
      await parser.load();
      const textResult = await parser.getText();
      // pdf-parse v2.x returns { pages: [{ text: "..." }, ...] }
      if (textResult && Array.isArray(textResult.pages)) {
        resumeText = textResult.pages.map(p => p.text || '').join('\n');
      } else if (typeof textResult === 'string') {
        resumeText = textResult;
      }
      parser.destroy();
      if (!resumeText.trim()) {
        throw new Error('No text content found in the PDF.');
      }
    } catch (pdfErr) {
      console.error('❌ PDF extraction failed:', pdfErr.message);
      return res.status(400).json({ error: 'Failed to extract text from PDF resume. Ensure the PDF is not empty or scanned image-only.', details: pdfErr.message });
    }

    // 3. Use Gemini API for resume analysis and career matching
    console.log('🤖 Analyzing resume with Gemini AI...');
    let insights = { skills: [], certifications: [], growth_suggestions: '', education: '', strengths: [] };
    let careerScores = {};

    try {
      const ai = getGeminiAI();
      if (ai) {
        const maxKeyAttempts = 5;
        let geminiSuccess = false;

        for (let keyAttempt = 0; keyAttempt < maxKeyAttempts && !geminiSuccess; keyAttempt++) {
          const currentAI = keyAttempt === 0 ? ai : getGeminiAI();
          if (!currentAI) break;
          const model = currentAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

          const prompt = `
          Analyze this resume and provide structured insights. Return ONLY valid JSON.
          
          Resume Text:
          ${resumeText.substring(0, 3000)}
          
          Available Career Domains: ${allCareers.map(c => c.name).join(', ')}
          
          Return a JSON object with this exact structure:
          {
            "skills": ["skill1", "skill2", ...],
            "certifications": ["cert1", ...],
            "education": "detected education level",
            "strengths": ["strength1", "strength2", ...],
            "growth_suggestions": "2-3 sentences about strengths and recommendations",
            "careerScores": {
              "Career Name 1": 85,
              "Career Name 2": 72
            }
          }
        `;

          try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Parse JSON from response
            const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/) || text.match(/(\{[\s\S]*\})/);
            const jsonStr = jsonMatch ? jsonMatch[1] : text;
            const geminiResponse = JSON.parse(jsonStr);
            
            insights = {
              skills: geminiResponse.skills || [],
              certifications: geminiResponse.certifications || [],
              growth_suggestions: geminiResponse.growth_suggestions || '',
              education: geminiResponse.education || education || 'Undergrad',
              strengths: geminiResponse.strengths || []
            };
            careerScores = geminiResponse.careerScores || {};
            
            console.log('✅ Gemini analysis complete');
            geminiSuccess = true;
          } catch (geminiAttemptErr) {
            if (isRateLimitError(geminiAttemptErr)) {
              markKeyExhausted(null, parseRetryDelay(geminiAttemptErr));
              console.log(`🔄 Onboarding Gemini 429 — rotating to next key (attempt ${keyAttempt + 1}/${maxKeyAttempts})...`);
              continue;
            }
            throw geminiAttemptErr; // non-429 error, propagate
          }
        }

        if (!geminiSuccess) {
          return res.status(500).json({ error: 'All Gemini API keys are rate-limited. Please try again later or add more GEMINI_API_KEY_N to .env.' });
        }
      } else {
        return res.status(500).json({ error: 'AI service not configured. Please set GEMINI_API_KEY environment variable.' });
      }
    } catch (geminiErr) {
      console.error('❌ Gemini analysis failed:', geminiErr.message);
      return res.status(500).json({ error: 'AI resume analysis failed. Please try again.', details: geminiErr.message });
    }

    // Merge manual skills from form with LLM-extracted skills
    const finalSkillsList = Array.from(new Set([
      ...parsedFormSkills,
      ...(insights?.skills || [])
    ]));

    // Sort to find the highest-scoring matching career
    const careerMatches = allCareers.map(c => {
      const careerName = c.name || '';
      const score = careerScores[careerName] || 0;
      return {
        id: c.id,
        name: careerName,
        score: score,
        industry: getIndustryForCareerName(careerName)
      };
    });

    const sortedCareers = [...careerMatches].sort((a, b) => b.score - a.score);
    const topCareer = sortedCareers[0] || { name: 'Software Engineer', id: allCareers[0]?.id };

    // Group matching scores by industry
    const industryMap = {};
    careerMatches.forEach(cm => {
      if (!industryMap[cm.industry]) {
        industryMap[cm.industry] = [];
      }
      industryMap[cm.industry].push(cm.score);
    });

    const matchedDomains = Object.keys(industryMap).map(ind => {
      const scores = industryMap[ind];
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return { name: ind, score: avg };
    }).sort((a, b) => b.score - a.score);

    // 4. Calculate skill gaps & suggest courses (strict dataset mapping)
    const topCareerIds = sortedCareers.slice(0, 3).map(tc => tc.id);
    const targetSkills = allSkills.filter(s => s && topCareerIds.includes(s.career_id));
    
    const gapSkills = targetSkills.filter(ts => 
      ts && ts.name && !finalSkillsList.some(fs => fs && fs.toLowerCase() === ts.name.toLowerCase())
    );

    const gapSkillIds = gapSkills.map(gs => gs.id);
    const suggestedCourses = allCourses.filter(course => course && gapSkillIds.includes(course.skill_id));

    // 5. Update user profile in Supabase (persist ALL onboarding data)
    let profileSaved = false;
    try {
      await updateUserProfile(userId, {
        education_background: insights.education || education || 'Undergrad',
        major_stream: major || 'Computer Science',
        learning_style: parsedLearningStyle,
        onboarding_completed: true,
        current_skills: finalSkillsList,
        interests: parsedInterests,
        strengths: insights.strengths || [],
        target_career: targetRole || topCareer.name,
        salary_goal: salaryExpectation || '₹15L+',
        career_goal: careerGoal || '',
        institution_name: institutionName || '',
        graduation_year: graduationYear || '',
        wants_certifications: wantsCertifications === true,
        resume_raw_text: resumeText,
        years_experience: yearsExperience || 'Beginner',
        availability: availability || '',
        study_hours_per_week: studyHoursPerWeek
      });
      profileSaved = true;
    } catch (profileErr) {
      console.warn('⚠️ Supabase profile update failed during onboarding:', profileErr.message);
    }

    // 5a. CRITICAL: Ensure onboarding_completed flag is set even if full profile update failed
    if (!profileSaved) {
      try {
        await updateUserProfile(userId, { onboarding_completed: true });
        console.log('✅ onboarding_completed flag saved via fallback');
      } catch (flagErr) {
        console.error('❌ CRITICAL: Failed to save onboarding_completed flag:', flagErr.message);
        // Return error — onboarding cannot be considered complete without this flag
        return res.status(500).json({ 
          error: 'Failed to save onboarding status. Please ensure database migrations are up to date.',
          details: flagErr.message 
        });
      }
    }

    // 5b. Save resume analysis to dedicated table
    try {
      await saveResumeAnalysis(userId, {
        skills: insights.skills || [],
        certifications: insights.certifications || [],
        education: insights.education || '',
        strengths: insights.strengths || [],
        careerScores,
        growth_suggestions: insights.growth_suggestions || '',
        raw_resume_text: resumeText
      });
    } catch (raErr) {
      console.warn('⚠️ Failed to save resume analysis:', raErr.message);
    }

    // 6. Save AI recommendations in recommendations table
    const recPayload = {
      matched_domains: matchedDomains,
      suggested_career_paths: topCareerIds,
      recommended_skills: gapSkillIds.slice(0, 8),
      recommended_courses: suggestedCourses.slice(0, 6).map(c => c.id),
      certifications: insights.certifications || [],
      growth_suggestions: insights.growth_suggestions || ''
    };

    try {
      await upsertUserRecommendations(userId, recPayload);
    } catch (recErr) {
      console.warn('⚠️ Supabase recommendations upsert failed:', recErr.message);
    }

    res.json({
      message: 'Onboarding completed successfully!',
      topCareer: topCareer.name,
      matchedDomains,
      strengths: insights.growth_suggestions || 'Profile setup complete.'
    });
  } catch (error) {
    console.error('❌ Onboarding submit failed:', error);
    res.status(500).json({ error: 'Failed to process onboarding details', details: error.message });
  }
});

/**
 * GET /api/onboarding/recommendations
 * Fetch dynamic career matches and recommendations for categories page
 */
router.get('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    let recommendations = null;
    
    try {
      recommendations = await getUserRecommendations(userId);
    } catch (dbErr) {
      console.warn('⚠️ Failed to fetch recommendations from Supabase:', dbErr.message);
    }

    if (!recommendations) {
      return res.status(404).json({ error: 'No onboarding recommendations found. Please complete onboarding first.' });
    }

    // Fetch related detail information from careers, skills, courses
    let allCareers = [];
    let allSkills = [];
    let allCourses = [];
    try {
      allCareers = (await getAllCategories()) || [];
      allSkills = (await getAllSkills()) || [];
      allCourses = (await getAllCourses()) || [];
    } catch (dbErr) {
      console.error('❌ Failed to fetch baseline data:', dbErr.message);
      return res.status(500).json({ error: 'Failed to fetch career data.' });
    }

    // Map career path details
    const suggestedCareers = allCareers
      .filter(c => c && (recommendations.suggested_career_paths || []).includes(c.id))
      .map(c => {
        const careerSkills = allSkills.filter(s => s && s.career_id === c.id);
        const domainMatch = (recommendations.matched_domains || []).find(d => d && d.name === getIndustryForCareerName(c.name));
        const score = domainMatch ? domainMatch.score : 60;

        return {
          id: c.id,
          name: c.name,
          description: c.description,
          icon: c.icon,
          growth_rate: c.growth_rate,
          salary_range: c.salary_range,
          demand_level: c.demand_level,
          skills: careerSkills,
          matchScore: score
        };
      });

    // Map recommended courses
    const suggestedCourses = allCourses.filter(course => 
      course && (recommendations.recommended_courses || []).includes(course.id)
    );

    // Map gap skills
    const gapSkills = allSkills.filter(skill => 
      skill && (recommendations.recommended_skills || []).includes(skill.id)
    );

    res.json({
      matched_domains: recommendations.matched_domains,
      suggestedCareers,
      gapSkills,
      suggestedCourses,
      certifications: recommendations.certifications || [],
      growth_suggestions: recommendations.growth_suggestions || ''
    });
  } catch (error) {
    console.error('❌ Failed to fetch recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations', details: error.message });
  }
});

/**
 * GET /api/onboarding/status
 * Check if the current authenticated user has completed onboarding
 */
router.get('/status', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = await getOnboardingStatus(userId);
    res.json({ completed: status });
  } catch (err) {
    console.error('❌ Failed to check onboarding status:', err.message);
    // Return 500 instead of { completed: false } to prevent false redirects to onboarding
    res.status(500).json({ error: 'Failed to check onboarding status', details: err.message });
  }
});

export default router;
