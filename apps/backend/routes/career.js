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
  getSkillsByCareer,
  getUserSkills,
  getRoadmapSummaryForCareer,
  getRecommendedCourses,
  supabase,
  findOrCreateCareerByName
} from '../services/supabaseService.js';
import { mongoIdToUuid } from '../services/supabaseService.js';
import { 
  generateCareerRecommendations, 
  generateSkillGapAnalysis,
  generateLearningPath,
  generateCareerComparisonSummary
} from '../services/geminiCareerService.js';

const router = express.Router();
const careerGenerationLocks = new Set();

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
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Failed to fetch career analysis:', errorMsg);
    res.status(500).json({ error: 'Failed to fetch career analysis', details: errorMsg });
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
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Failed to fetch career domains:', errorMsg);
    res.status(500).json({ error: 'Failed to fetch career domains', details: errorMsg });
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
    if (careerGenerationLocks.has(userId)) {
      return res.status(202).json({ message: 'Career recommendations are already being generated. Please refresh shortly.', inProgress: true });
    }
    careerGenerationLocks.add(userId);
    res.on('finish', () => careerGenerationLocks.delete(userId));
    
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
    
    // Dynamically find or create each recommended career in the database
    const enrichedRecommendations = [];
    for (const rec of aiRecommendations) {
      try {
        const dbCareer = await findOrCreateCareerByName(rec.careerName);
        if (dbCareer) {
          rec.careerId = dbCareer.id;
          enrichedRecommendations.push(rec);
        }
      } catch (err) {
        console.error(`Failed to find or create career for recommendation ${rec.careerName}:`, err.message);
      }
    }

    // Delete ALL previous recommendations before saving new ones
    try {
      await deleteCareerRecommendations(userId);
      console.log(`🗑️ Cleared old recommendations for user ${userId}`);
    } catch (deleteErr) {
      console.warn('⚠️ Failed to clear old recommendations:', deleteErr.message);
    }

    // Save top 5 recommendations to career_recommendations table
    const savedRecommendations = [];
    for (const rec of enrichedRecommendations.slice(0, 5)) {
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
    for (const rec of enrichedRecommendations.slice(0, 5)) {
      const industry = getIndustryForCareer(rec.careerName);
      if (!domainMap[industry] || domainMap[industry] < rec.matchPercentage) {
        domainMap[industry] = rec.matchPercentage;
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
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Failed to generate career recommendations:', errorMsg);
    res.status(500).json({ 
      error: 'Failed to generate career recommendations',
      details: errorMsg 
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

    const learningPath = await generateLearningPath(
      profile,
      career,
      skillGap.skillsToLearn || [],
      skillGap.careerSkills || []
    );
    
    res.json({ 
      career: career.name,
      learningPath,
      readinessScore: skillGap.readiness
    });
  } catch (error) {
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Failed to generate learning path:', errorMsg);
    res.status(500).json({ error: 'Failed to generate learning path', details: errorMsg });
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
    if (careerGenerationLocks.has(userId)) {
      return res.status(202).json({ message: 'Career recommendations are already being generated. Please refresh shortly.', inProgress: true });
    }
    careerGenerationLocks.add(userId);
    res.on('finish', () => careerGenerationLocks.delete(userId));
    
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
    
    // Dynamically find or create each recommended career in the database
    const enrichedRecommendations = [];
    for (const rec of aiRecommendations) {
      try {
        const dbCareer = await findOrCreateCareerByName(rec.careerName);
        if (dbCareer) {
          rec.careerId = dbCareer.id;
          enrichedRecommendations.push(rec);
        }
      } catch (err) {
        console.error(`Failed to find or create career for recommendation ${rec.careerName}:`, err.message);
      }
    }

    // Delete ALL previous recommendations before saving new ones
    try {
      await deleteCareerRecommendations(userId);
      console.log(`🗑️ Cleared old recommendations for user ${userId}`);
    } catch (deleteErr) {
      console.warn('⚠️ Failed to clear old recommendations:', deleteErr.message);
    }

    // Save fresh recommendations
    const updatedCount = [];
    for (const rec of enrichedRecommendations.slice(0, 5)) {
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
    for (const rec of enrichedRecommendations.slice(0, 5)) {
      const industry = getIndustryForCareer(rec.careerName);
      if (!domainMap[industry] || domainMap[industry] < rec.matchPercentage) {
        domainMap[industry] = rec.matchPercentage;
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
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Failed to refresh career analysis:', errorMsg);
    res.status(500).json({ 
      error: 'Failed to refresh career analysis',
      details: errorMsg 
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
    const userId = req.user.userId;
    
    if (!careerIds || !Array.isArray(careerIds) || careerIds.length < 2 || careerIds.length > 3) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Provide exactly 2 to 3 career IDs to compare' 
      });
    }

    // 1. Verify User Profile & User Skills
    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found. Complete onboarding first.' });
    }

    const userSkills = await getUserSkills(userId);
    const userSkillsMap = new Map((userSkills || []).map(us => [us.skill_name?.toLowerCase(), us]));

    // 2. Validate Selected Career IDs against user's career recommendations
    const recommendations = await getCareerRecommendations(userId);
    const recIds = new Set(recommendations.map(r => mongoIdToUuid(r.career_id)));
    const invalidIds = careerIds.filter(id => !recIds.has(mongoIdToUuid(id)));
    
    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: 'Invalid selection',
        message: 'You may only compare careers that the AI has previously recommended for you.'
      });
    }

    // 3. Fetch details for each career
    const comparedCareers = [];
    for (const id of careerIds) {
      const career = await getCategoryById(mongoIdToUuid(id));
      if (career) {
        comparedCareers.push(career);
      }
    }

    if (comparedCareers.length < 2) {
      return res.status(404).json({ error: 'Not enough valid careers found' });
    }

    // 4. Score salary and growth rates
    function parseAverageSalary(salaryStr) {
      if (!salaryStr) return 1000000;
      const matches = salaryStr.match(/\d+/g);
      if (matches && matches.length >= 2) {
        const min = parseFloat(matches[0]);
        const max = parseFloat(matches[1]);
        return ((min + max) / 2) * 100000;
      } else if (matches && matches.length === 1) {
        return parseFloat(matches[0]) * 100000;
      }
      return 1000000;
    }

    const salaries = comparedCareers.map(c => c.average_salary || parseAverageSalary(c.salary_range));
    const minSalary = Math.min(...salaries);
    const maxSalary = Math.max(...salaries);

    const growths = comparedCareers.map(c => parseFloat(c.growth_rate) || 15);
    const minGrowth = Math.min(...growths);
    const maxGrowth = Math.max(...growths);

    // 5. Score experience mapping
    const expLevels = { 'Beginner': 50, 'Intermediate': 80, 'Expert': 100 };
    const experienceMatch = expLevels[profile.years_experience] || 70;

    // 6. Pre-fetch career skills and batch query courses for all missing skills at once
    const allMissingSkillIds = [];
    const careerSkillsMap = new Map();
    for (const career of comparedCareers) {
      const careerSkills = await getSkillsByCareer(career.id);
      careerSkillsMap.set(career.id, careerSkills);
      
      for (const reqSkill of careerSkills) {
        const userSkill = userSkillsMap.get(reqSkill.name?.toLowerCase());
        if (!userSkill && reqSkill.id) {
          allMissingSkillIds.push(reqSkill.id);
        }
      }
    }

    let coursesMap = new Map();
    if (allMissingSkillIds.length > 0) {
      try {
        const courses = await getRecommendedCourses(allMissingSkillIds);
        for (const course of courses || []) {
          if (course.skill_id) {
            if (!coursesMap.has(course.skill_id)) {
              coursesMap.set(course.skill_id, []);
            }
            coursesMap.get(course.skill_id).push(course);
          }
        }
      } catch (coursesErr) {
        console.warn('⚠️ Failed to pre-fetch courses for comparison:', coursesErr.message);
      }
    }

    // 7. Build side-by-side profiles
    let comparisons = [];
    for (const career of comparedCareers) {
      const careerSkills = careerSkillsMap.get(career.id) || [];
      
      let matchedCount = 0;
      const matchedSkills = [];
      const missingSkills = [];
      const expertSkillsUsed = [];
      const courseSuggestions = [];

      function isProficiencyAtOrAbove(userProf, reqDiff) {
        const userLevels = { 'Beginner': 1, 'Intermediate': 2, 'Expert': 3 };
        const reqLevels = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        const uVal = userLevels[userProf] || 2;
        const rVal = reqLevels[reqDiff] || 2;
        return uVal >= rVal;
      }

      for (const reqSkill of careerSkills) {
        const userSkill = userSkillsMap.get(reqSkill.name?.toLowerCase());
        if (userSkill) {
          const satisfies = isProficiencyAtOrAbove(userSkill.proficiency, reqSkill.difficulty_level);
          if (satisfies) {
            matchedCount++;
            matchedSkills.push({
              name: reqSkill.name,
              proficiency: userSkill.proficiency
            });
          } else {
            missingSkills.push(reqSkill.name);
          }

          if (userSkill.proficiency === 'Expert' || (userSkill.progress_percentage || 0) >= 80) {
            expertSkillsUsed.push(reqSkill.name);
          }
        } else {
          missingSkills.push(reqSkill.name);
        }

        // Get courses from pre-fetched map
        if (!userSkill && reqSkill.id) {
          const skillCourses = coursesMap.get(reqSkill.id) || [];
          if (skillCourses.length > 0) {
            courseSuggestions.push(skillCourses[0]);
          }
        }
      }

      const matchPercent = careerSkills.length > 0 ? Math.round((matchedCount / careerSkills.length) * 100) : 0;

      // Interests overlap match
      const userInterests = profile.interests || [];
      const careerText = `${career.name} ${career.description} ${career.industry_tags?.join(' ') || ''}`.toLowerCase();
      const interestMatches = userInterests.filter(interest => careerText.includes(interest.toLowerCase()));
      const interestScoreRaw = userInterests.length > 0 
        ? Math.round((interestMatches.length / userInterests.length) * 100)
        : 70;
      const interestMatch = Math.max(60, interestScoreRaw);

      // Normalized salary
      const careerAvgSal = career.average_salary || parseAverageSalary(career.salary_range);
      const salaryScore = maxSalary === minSalary ? 100 : Math.round(((careerAvgSal - minSalary) / (maxSalary - minSalary)) * 100);

      // Normalized growth
      const careerGrowth = parseFloat(career.growth_rate) || 15;
      const growthScore = maxGrowth === minGrowth ? 100 : Math.round(((careerGrowth - minGrowth) / (maxGrowth - minGrowth)) * 100);

      // Fetch roadmap summary
      const roadmap = await getRoadmapSummaryForCareer(career.name);

      comparisons.push({
        careerId: career.id,
        title: career.name,
        matchPercent,
        interestMatch,
        salaryScore,
        growthScore,
        matchedSkills,
        missingSkills,
        expertSkillsUsed,
        courses: courseSuggestions.slice(0, 3),
        growth: career.growth_rate || 'N/A',
        industry: getIndustryForCareer(career.name),
        avgSalary: careerAvgSal,
        roadmap
      });
    }

    // 7. Calculate total Suitability scores using formula weights
    comparisons = comparisons.map(c => {
      const overallScore = Math.round(
        (c.matchPercent * 0.40) + 
        (experienceMatch * 0.20) + 
        (c.interestMatch * 0.15) + 
        (c.salaryScore * 0.15) + 
        (c.growthScore * 0.10)
      );
      
      // Remove temporary variables from clean response
      const { interestMatch, salaryScore, growthScore, ...cleanItem } = c;
      return {
        ...cleanItem,
        overallScore
      };
    });

    // 8. Sort descending
    comparisons.sort((a, b) => b.overallScore - a.overallScore);
    const comparisonOrder = comparisons.map(c => c.careerId);

    // 9. Generate AI Synthesis Summary via Gemini
    const aiSummary = await generateCareerComparisonSummary(profile, comparisons);

    // 10. Record this comparison in user history (non-blocking background task)
    supabase.from('comparisons').insert({
      user_id: mongoIdToUuid(userId),
      career_id_1: mongoIdToUuid(careerIds[0]),
      career_id_2: mongoIdToUuid(careerIds[1])
    }).then(({ error }) => {
      if (error) {
        console.warn('⚠️ Could not save comparison to history database:', error.message);
      }
    }).catch(saveHistoryErr => {
      console.warn('⚠️ Could not save comparison to history database:', saveHistoryErr.message);
    });

    res.json({
      summary: aiSummary,
      comparisons,
      comparisonOrder
    });
  } catch (error) {
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Failed side-by-side comparison logic:', errorMsg);
    res.status(500).json({ error: 'Failed to perform career comparison', details: errorMsg });
  }
});

/**
 * GET /api/career/recommended
 * Retrieve all AI-recommended careers for the authenticated user
 */
router.get('/recommended', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const recommendationRows = await getCareerRecommendations(userId);
    
    const careers = [];
    for (const rec of recommendationRows) {
      const cleanId = mongoIdToUuid(rec.career_id);
      const career = await getCategoryById(cleanId);
      if (career) {
        careers.push({
          id: cleanId,
          name: career.name,
          description: career.description,
          icon: career.icon || '💼',
          salary_range: career.salary_range,
          average_salary: career.average_salary,
          growth_rate: career.growth_rate,
          demand_level: career.demand_level,
          matchPercentage: rec.match_percentage,
          reason: rec.reason
        });
      }
    }
    
    res.json({ careers });
  } catch (error) {
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Failed to fetch user recommended careers:', errorMsg);
    res.status(500).json({ error: 'Failed to retrieve career recommendations', details: errorMsg });
  }
});

/**
 * GET /api/career/compare/results
 * Get history of user comparisons
 */
router.get('/compare/results', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data: list, error } = await supabase
      .from('comparisons')
      .select('*')
      .eq('user_id', mongoIdToUuid(userId))
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const enriched = [];
    for (const comp of list || []) {
      const c1 = await getCategoryById(comp.career_id_1).catch(() => null);
      const c2 = await getCategoryById(comp.career_id_2).catch(() => null);
      enriched.push({
        id: comp.id,
        career1: c1 ? { id: c1.id, name: c1.name } : null,
        career2: c2 ? { id: c2.id, name: c2.name } : null,
        createdAt: comp.created_at
      });
    }

    res.json(enriched);
  } catch (error) {
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Failed to retrieve comparison history:', errorMsg);
    res.status(500).json({ error: 'Failed to retrieve comparison history', details: errorMsg });
  }
});

/**
 * GET /api/career/:id
 * Retrieve specific career by ID
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const career = await getCategoryById(mongoIdToUuid(id));
    if (!career) {
      return res.status(404).json({ error: 'Career not found' });
    }
    res.json(career);
  } catch (error) {
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Failed to fetch career details:', errorMsg);
    res.status(500).json({ error: 'Failed to retrieve career path details', details: errorMsg });
  }
});

/**
 * GET /api/career/:id/skills
 * Retrieve list of skills for a career by ID
 */
router.get('/:id/skills', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const skills = await getSkillsByCareer(mongoIdToUuid(id));
    res.json(skills || []);
  } catch (error) {
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    console.error('❌ Failed to fetch career skills:', errorMsg);
    res.status(500).json({ error: 'Failed to retrieve career skills', details: errorMsg });
  }
});

export default router;
