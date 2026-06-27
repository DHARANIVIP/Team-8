import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import { protect } from '../middleware/auth.js';
import { 
  updateUserProfile, 
  upsertUserRecommendations, 
  getAllCategories, 
  getAllSkills, 
  getAllCourses,
  getUserRecommendations,
  getOnboardingStatus
} from '../services/supabaseService.js';
import { 
  getResumeEmbeddings, 
  classifyResumeText, 
  generateResumeInsights 
} from '../services/huggingfaceService.js';

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// In-memory fallback cache in case Supabase schema upgrades aren't run or tables fail
const recommendationsCache = new Map();

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
    const { education, major, learningStyle, interests, skills: formSkills } = req.body;

    // Enforce that a PDF resume is mandatory
    if (!req.file) {
      return res.status(400).json({ error: 'A PDF resume is required for AI-based career classification.' });
    }
    
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
      console.warn('⚠️ Failed to fetch baseline data from Supabase, using local defaults:', dbErr.message);
      allCareers = [
        { id: 'b3a985d8-c923-42bf-be0d-6e828d11634b', name: 'Software Engineer', description: 'Develop and maintain software applications and websites.', growth_rate: '28%', salary_range: '₹8L – ₹25L' },
        { id: 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf', name: 'Data Scientist', description: 'Analyze complex data and build Machine Learning models.', growth_rate: '36%', salary_range: '₹10L – ₹30L' },
        { id: 'a1288c80-60b6-4b8c-85a2-3f8c8d8b1bfb', name: 'UX Designer', description: 'Create intuitive and user-friendly digital designs.', growth_rate: '22%', salary_range: '₹6L – ₹18L' }
      ];
      allSkills = [
        { id: 'c7078e8e-d9c1-4b13-911e-0899f8d1634b', career_id: 'b3a985d8-c923-42bf-be0d-6e828d11634b', name: 'JavaScript' },
        { id: 'a9386d4d-cc8b-4a5f-be03-7cf8e02ab3bf', career_id: 'b3a985d8-c923-42bf-be0d-6e828d11634b', name: 'React' },
        { id: 'b0849d92-23c7-493d-bd88-6927e0293dbf', career_id: 'b3a985d8-c923-42bf-be0d-6e828d11634b', name: 'Node.js' },
        { id: 'd1193d20-80c1-4f80-bdc2-7cb8e293dbef', career_id: 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf', name: 'Python' },
        { id: 'e3984d93-3d02-402f-bc22-8dcb9283dbdf', career_id: 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf', name: 'Machine Learning' }
      ];
      allCourses = [
        { id: 'course-js-1', skill_id: 'c7078e8e-d9c1-4b13-911e-0899f8d1634b', name: 'JavaScript: The Advanced Concepts', provider: 'Udemy' },
        { id: 'course-py-1', skill_id: 'd1193d20-80c1-4f80-bdc2-7cb8e293dbef', name: 'Python for Everybody Specialization', provider: 'Coursera' }
      ];
    }

    // 2. Parse PDF resume text directly in Node.js
    console.log('🤖 Parsing PDF resume text directly in Node.js using PDFParse class...');
    let resumeText = '';
    let parser = null;
    try {
      parser = new PDFParse({ data: req.file.buffer });
      const pdfData = await parser.getText();
      resumeText = pdfData.text || '';
      if (!resumeText.trim()) {
        throw new Error('No text content found in the PDF.');
      }
    } catch (pdfErr) {
      console.error('❌ PDF extraction failed:', pdfErr.message);
      return res.status(400).json({ error: 'Failed to extract text from PDF resume. Ensure the PDF is not empty or scanned image-only.' });
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch (destroyErr) {
          console.warn('⚠️ PDFParse destroy failed:', destroyErr.message);
        }
      }
    }

    // 3. Convert extracted text into vector embeddings
    console.log('🤖 Generating resume embeddings via Hugging Face all-mpnet-base-v2...');
    let embeddings = [];
    try {
      embeddings = await getResumeEmbeddings(resumeText);
    } catch (embedErr) {
      console.warn('⚠️ Resume embedding generation failed. Using zero-vector fallback:', embedErr.message);
      embeddings = new Array(768).fill(0.0);
    }

    // 4. Classify Career Domains using Zero-Shot classification
    console.log('🤖 Performing zero-shot career classification via Hugging Face BART Large MNLI...');
    let careerScores = {};
    try {
      careerScores = await classifyResumeText(resumeText, allCareers);
    } catch (classErr) {
      console.warn('⚠️ Zero-shot career classification failed. Using uniform fallback scores:', classErr.message);
      allCareers.forEach(c => {
        careerScores[c.name] = 50;
      });
    }

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

    // 5. Generate structured insights via Hugging Face Llama 3 8B
    console.log(`🤖 Generating structured insights via Hugging Face Llama 3 for target career: "${topCareer.name}"...`);
    let insights = { skills: [], certifications: [], growth_suggestions: '', education: '' };
    try {
      insights = await generateResumeInsights(resumeText, topCareer.name);
    } catch (insightsErr) {
      console.warn('⚠️ Resume insights generation failed. Using default insights:', insightsErr.message);
      insights = {
        skills: parsedFormSkills,
        certifications: [],
        growth_suggestions: 'Successfully analyzed profile. Keep learning and updating your skills.',
        education: education || 'Undergrad'
      };
    }

    // Merge manual skills from form with LLM-extracted skills
    const finalSkillsList = Array.from(new Set([
      ...parsedFormSkills,
      ...(insights?.skills || [])
    ]));

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

    // 5. Update user profile in Supabase
    try {
      await updateUserProfile(userId, {
        education_background: insights.education || education || 'Undergrad',
        major_stream: major || 'Computer Science',
        learning_style: parsedLearningStyle,
        onboarding_completed: true,
        current_skills: finalSkillsList,
        target_career: topCareer.name,
        resume_embeddings: embeddings, // Save 768-dim vector embeddings
        career_goal: req.body.careerGoal || req.body.career_goal || '',
        years_experience: req.body.yearsExperience || req.body.years_experience || 'Beginner',
        availability: req.body.availability || ''
      });
    } catch (profileErr) {
      console.warn('⚠️ Supabase profile update failed during onboarding:', profileErr.message);
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
    
    // Cache inside memory
    recommendationsCache.set(userId, recPayload);

    try {
      await upsertUserRecommendations(userId, recPayload);
    } catch (recErr) {
      console.warn('⚠️ Supabase recommendations upsert failed. Saved to in-memory fallback:', recErr.message);
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
      console.warn('⚠️ Failed to fetch recommendations from Supabase, checking memory cache:', dbErr.message);
    }
    
    if (!recommendations) {
      recommendations = recommendationsCache.get(userId);
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
      console.warn('⚠️ Failed to fetch detail baseline data from Supabase, using defaults:', dbErr.message);
      allCareers = [
        { id: 'b3a985d8-c923-42bf-be0d-6e828d11634b', name: 'Software Engineer', description: 'Develop and maintain software applications and websites.', growth_rate: '28%', salary_range: '₹8L – ₹25L' },
        { id: 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf', name: 'Data Scientist', description: 'Analyze complex data and build Machine Learning models.', growth_rate: '36%', salary_range: '₹10L – ₹30L' },
        { id: 'a1288c80-60b6-4b8c-85a2-3f8c8d8b1bfb', name: 'UX Designer', description: 'Create intuitive and user-friendly digital designs.', growth_rate: '22%', salary_range: '₹6L – ₹18L' }
      ];
      allSkills = [
        { id: 'c7078e8e-d9c1-4b13-911e-0899f8d1634b', career_id: 'b3a985d8-c923-42bf-be0d-6e828d11634b', name: 'JavaScript' },
        { id: 'a9386d4d-cc8b-4a5f-be03-7cf8e02ab3bf', career_id: 'b3a985d8-c923-42bf-be0d-6e828d11634b', name: 'React' },
        { id: 'b0849d92-23c7-493d-bd88-6927e0293dbf', career_id: 'b3a985d8-c923-42bf-be0d-6e828d11634b', name: 'Node.js' },
        { id: 'd1193d20-80c1-4f80-bdc2-7cb8e293dbef', career_id: 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf', name: 'Python' },
        { id: 'e3984d93-3d02-402f-bc22-8dcb9283dbdf', career_id: 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf', name: 'Machine Learning' }
      ];
      allCourses = [
        { id: 'course-js-1', skill_id: 'c7078e8e-d9c1-4b13-911e-0899f8d1634b', name: 'JavaScript: The Advanced Concepts', provider: 'Udemy' },
        { id: 'course-py-1', skill_id: 'd1193d20-80c1-4f80-bdc2-7cb8e293dbef', name: 'Python for Everybody Specialization', provider: 'Coursera' }
      ];
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
    console.warn('⚠️ Failed to check onboarding status:', err.message);
    res.json({ completed: false });
  }
});

export default router;
