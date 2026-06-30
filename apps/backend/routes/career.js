import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  getUserProfile, 
  getAllCategories,
  getCategoryById,
  getCareerRecommendations,
  deleteCareerRecommendations,
  saveCareerRecommendation,
  getSkillGapAnalysis,
  getSkillsByCareer
} from '../services/supabaseService.js';
import { mongoIdToUuid } from '../services/supabaseService.js';
import { 
  generateCareerRecommendations, 
  generateSkillGapAnalysis,
  generateLearningPath 
} from '../services/geminiCareerService.js';

const router = express.Router();

/**
 * GET /api/career/analysis
 * Fetch the user's complete AI career analysis with latest recommendations
 */
router.get('/analysis', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (!profile.onboarding_completed) {
      return res.status(400).json({ 
        error: 'Onboarding not completed',
        message: 'Please complete onboarding to receive career analysis' 
      });
    }

    // Fetch latest recommendations from DB
    let recommendationRows = [];
    try {
      recommendationRows = await getCareerRecommendations(userId);
    } catch (dbErr) {
      console.warn('⚠️ career_recommendations table not available:', dbErr.message);
    }

    // Enrich recommendations with career details for frontend display
    const savedCareers = [];
    const domainMap = {};
    for (const rec of recommendationRows) {
      try {
        // Convert career_id to UUID format for DB lookup
        const cleanCareerId = mongoIdToUuid(rec.career_id);
        const career = await getCategoryById(cleanCareerId);
        if (career) {
          savedCareers.push({
            careerId: cleanCareerId,
            careerName: career.name,
            matchPercentage: rec.match_percentage,
            reason: rec.reason || '',
            strengths: profile.current_skills?.slice(0, 3) || [],
            missingSkills: [],
            salaryRange: career.salary_range || 'Competitive',
            demandLevel: career.demand_level || 'Medium',
            growthRate: career.growth_rate || '15%',
          });
          // Aggregate domain scores from career industry mapping
          const industry = getIndustryForCareer(career.name);
          if (!domainMap[industry] || domainMap[industry] < rec.match_percentage) {
            domainMap[industry] = rec.match_percentage;
          }
        }
      } catch (careerErr) {
        console.warn(`⚠️ Could not enrich recommendation ${rec.career_id}:`, careerErr.message);
      }
    }

    const matched_domains = Object.entries(domainMap).map(([name, score]) => ({ name, score }));

    res.json({ 
      profile, 
      recommendations: {
        saved_careers: savedCareers,
        matched_domains,
      },
      analysisDate: recommendationRows[0]?.recommended_at || new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to fetch career analysis:', error.message);
    res.status(500).json({ error: 'Failed to fetch career analysis' });
  }
});

function getIndustryForCareer(careerName) {
  const name = (careerName || '').toLowerCase();
  if (name.includes('data') || name.includes('ai') || name.includes('scientist') || name.includes('analyst')) return 'Data & AI';
  if (name.includes('security') || name.includes('cyber')) return 'Security';
  if (name.includes('design') || name.includes('ux') || name.includes('ui')) return 'Design';
  if (name.includes('product') || name.includes('manager') || name.includes('business')) return 'Business';
  return 'Technology';
}

/**
 * GET /api/career/domains
 * Get matched career domains with scores
 */
router.get('/domains', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    let recommendationRows = [];
    try {
      recommendationRows = await getCareerRecommendations(userId);
    } catch (dbErr) {
      console.warn('⚠️ career_recommendations table not available:', dbErr.message);
    }
    
    // Compute domain scores from recommendations
    const domainMap = {};
    for (const rec of recommendationRows) {
      try {
        const cleanCareerId = mongoIdToUuid(rec.career_id);
        const career = await getCategoryById(cleanCareerId);
        if (career) {
          const industry = getIndustryForCareer(career.name);
          if (!domainMap[industry] || domainMap[industry] < rec.match_percentage) {
            domainMap[industry] = rec.match_percentage;
          }
        }
      } catch (e) {}
    }
    const domains = Object.entries(domainMap).map(([name, score]) => ({ name, score }));

    res.json({ 
      domains,
      message: domains.length ? 'Domains retrieved successfully' : 'No domains found. Complete onboarding first.'
    });
  } catch (error) {
    console.error('❌ Failed to fetch career domains:', error.message);
    res.status(500).json({ error: 'Failed to fetch career domains' });
  }
});

/**
 * POST /api/career/recommendations
 * Generate fresh AI-powered career recommendations via Gemini
 * Deletes all previous recommendations before saving new ones
 */
router.post('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const profile = await getUserProfile(userId);
    if (!profile || !profile.onboarding_completed) {
      return res.status(400).json({ 
        error: 'Profile incomplete',
        message: 'Please complete onboarding to receive career recommendations' 
      });
    }

    const allCareers = await getAllCategories();
    if (!allCareers || allCareers.length === 0) {
      return res.status(404).json({ error: 'No careers available in database' });
    }

    console.log(`🤖 Generating AI career recommendations for user ${userId}...`);
    
    const aiRecommendations = await generateCareerRecommendations(profile, allCareers);
    
    // Delete ALL previous recommendations before saving new ones
    try {
      await deleteCareerRecommendations(userId);
      console.log(`🗑️ Cleared old recommendations for user ${userId}`);
    } catch (deleteErr) {
      console.warn('⚠️ Failed to clear old recommendations:', deleteErr.message);
    }

    // Save top 5 recommendations to career_recommendations table
    const savedRecommendations = [];
    for (const rec of aiRecommendations.slice(0, 5)) {
      try {
        const saved = await saveCareerRecommendation(
          userId, 
          rec.careerId, 
          rec.matchPercentage, 
          rec.reason
        );
        savedRecommendations.push(saved);
      } catch (saveErr) {
        console.warn(`⚠️ Failed to save recommendation for ${rec.careerName}:`, saveErr.message);
      }
    }
    
    console.log(`✅ Saved ${savedRecommendations.length} fresh career recommendations`);

    // Compute matched domains from saved recommendations
    const domainMap = {};
    for (const rec of aiRecommendations.slice(0, 5)) {
      const career = allCareers.find(c => c.id === rec.careerId);
      if (career) {
        const industry = getIndustryForCareer(career.name);
        if (!domainMap[industry] || domainMap[industry] < rec.matchPercentage) {
          domainMap[industry] = rec.matchPercentage;
        }
      }
    }
    const matched_domains = Object.entries(domainMap).map(([name, score]) => ({ name, score }));
    
    res.json({ 
      recommendations: aiRecommendations,
      matched_domains,
      saved: savedRecommendations.length,
      message: 'Career recommendations generated successfully'
    });
  } catch (error) {
    console.error('❌ Failed to generate career recommendations:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate career recommendations',
      details: error.message 
    });
  }
});

/**
 * GET /api/career/:id/details
 * Get full career details including skill gap analysis
 */
router.get('/:id/details', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const career = await getCategoryById(id);
    if (!career) {
      return res.status(404).json({ error: 'Career not found' });
    }

    // Get skill gap analysis
    const skillGap = await getSkillGapAnalysis(userId, id);
    
    // Get career skills
    const careerSkills = await getSkillsByCareer(id);
    
    // Get user profile for context
    const profile = await getUserProfile(userId);
    
    res.json({ 
      career,
      skillGap,
      careerSkills,
      userProfile: {
        current_skills: profile?.current_skills || [],
        experience_level: profile?.years_experience || 'Beginner'
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch career details:', error.message);
    res.status(500).json({ error: 'Failed to fetch career details' });
  }
});

/**
 * POST /api/career/:id/learning-path
 * Generate learning path for a specific career
 */
router.post('/:id/learning-path', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const career = await getCategoryById(id);
    if (!career) {
      return res.status(404).json({ error: 'Career not found' });
    }

    const profile = await getUserProfile(userId);
    const skillGap = await getSkillGapAnalysis(userId, id);
    
    // Generate AI-powered learning path
    const learningPath = await generateLearningPath(
      career.name,
      skillGap.skills?.filter(s => !s.acquired) || [],
      profile?.years_experience
    );
    
    res.json({ 
      career: career.name,
      learningPath,
      readinessScore: skillGap.readiness
    });
  } catch (error) {
    console.error('❌ Failed to generate learning path:', error.message);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

/**
 * POST /api/career/refresh
 * Re-trigger AI analysis with updated profile
 * Deletes all previous recommendations before saving new ones
 */
router.post('/refresh', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const profile = await getUserProfile(userId);
    if (!profile || !profile.onboarding_completed) {
      return res.status(400).json({ 
        error: 'Profile incomplete',
        message: 'Please complete onboarding first' 
      });
    }

    const allCareers = await getAllCategories();
    
    console.log(`🔄 Refreshing AI career analysis for user ${userId}...`);
    
    const aiRecommendations = await generateCareerRecommendations(profile, allCareers);
    
    // Delete ALL previous recommendations before saving new ones
    try {
      await deleteCareerRecommendations(userId);
      console.log(`🗑️ Cleared old recommendations for user ${userId}`);
    } catch (deleteErr) {
      console.warn('⚠️ Failed to clear old recommendations:', deleteErr.message);
    }

    // Save fresh recommendations
    const updatedCount = [];
    for (const rec of aiRecommendations.slice(0, 5)) {
      try {
        await saveCareerRecommendation(userId, rec.careerId, rec.matchPercentage, rec.reason);
        updatedCount.push(rec.careerId);
      } catch (saveErr) {
        console.warn(`⚠️ Failed to save recommendation:`, saveErr.message);
      }
    }
    
    console.log(`✅ Refreshed ${updatedCount.length} career recommendations`);

    // Compute matched domains from saved recommendations
    const domainMap = {};
    for (const rec of aiRecommendations.slice(0, 5)) {
      const career = allCareers.find(c => c.id === rec.careerId);
      if (career) {
        const industry = getIndustryForCareer(career.name);
        if (!domainMap[industry] || domainMap[industry] < rec.matchPercentage) {
          domainMap[industry] = rec.matchPercentage;
        }
      }
    }
    const matched_domains = Object.entries(domainMap).map(([name, score]) => ({ name, score }));
    
    res.json({ 
      recommendations: aiRecommendations,
      matched_domains,
      refreshed: updatedCount.length,
      message: 'Career analysis refreshed successfully'
    });
  } catch (error) {
    console.error('❌ Failed to refresh career analysis:', error.message);
    res.status(500).json({ 
      error: 'Failed to refresh career analysis',
      details: error.message 
    });
  }
});

/**
 * POST /api/career/compare
 * Compare two or more careers side-by-side
 */
router.post('/compare', protect, async (req, res) => {
  try {
    const { careerIds } = req.body;
    
    if (!careerIds || !Array.isArray(careerIds) || careerIds.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Provide at least 2 career IDs to compare' 
      });
    }

    const careers = [];
    for (const id of careerIds.slice(0, 3)) {
      const career = await getCategoryById(id);
      if (career) {
        careers.push(career);
      }
    }

    if (careers.length < 2) {
      return res.status(404).json({ error: 'Not enough valid careers found' });
    }

    res.json({ 
      careers,
      message: 'Career comparison data retrieved'
    });
  } catch (error) {
    console.error('❌ Failed to compare careers:', error.message);
    res.status(500).json({ error: 'Failed to compare careers' });
  }
});

export default router;
