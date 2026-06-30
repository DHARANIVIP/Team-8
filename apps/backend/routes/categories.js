import express from 'express';
import { getAllCategories, getCategoryById, createCategory, syncCareerCache, getPersonalizedCareerData, toggleSavedCareer, getCareerDeepDiveInsights, getUserProfile, findOrCreateCareerByName, saveCareerRecommendation } from '../services/supabaseService.js';
import { generateCareerRecommendationsFromProfile } from '../services/openapiService.js';
import { getIndustryNews } from '../services/industryService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// List of standard careers to ensure are cached in the system
const STANDARD_CAREERS = [
  'Software Engineer',
  'Data Scientist',
  'UX Designer',
  'Cybersecurity Analyst',
  'Product Manager',
  'Cloud Architect'
];

/**
 * GET /api/categories
 * Retrieve all career categories/paths (Enriched with Industry Health)
 */
router.get('/', async (req, res) => {
  try {
    let categories = await getAllCategories();
    
    // Check if we are missing any standard careers in the cache
    const cachedNames = categories.map(c => c.name);
    const missingCareers = STANDARD_CAREERS.filter(name => !cachedNames.includes(name));

    if (missingCareers.length > 0) {
      console.log(`⚠️ Missing standard careers in cache: ${missingCareers.join(', ')}. Syncing now...`);
      for (const name of missingCareers) {
        await syncCareerCache(name);
      }
      // Re-fetch populated list
      categories = await getAllCategories();
    }

    const news = await getIndustryNews('Technology Career Trends');
    res.json({ categories, latestNews: news });
  } catch (error) {
    console.error('⚠️ Category retrieval failed. Returning mock data.', error.message);
    
    // Mock Data Fallback
    const mockCategories = [
      { id: 'b3a985d8-c923-42bf-be0d-6e828d11634b', name: 'Software Engineer', description: 'Careers in web and app development', icon: '💻', salary_range: '₹8L – ₹25L', growth_rate: '28%', demand_level: 'High' },
      { id: 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf', name: 'Data Scientist', description: 'Data analysis and machine learning', icon: '📊', salary_range: '₹10L – ₹30L', growth_rate: '36%', demand_level: 'High' },
      { id: 'a1288c80-60b6-4b8c-85a2-3f8c8d8b1bfb', name: 'UX Designer', description: 'Create intuitive and user-friendly designs.', icon: '🎨', salary_range: '₹6L – ₹18L', growth_rate: '22%', demand_level: 'Medium' }
    ];
    
    res.json({ categories: mockCategories, latestNews: [] });
  }
});

/**
 * GET /api/categories/personalized
 * Retrieve all career categories customized to user's match score and skill gaps
 */
router.get('/personalized', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const personalizedData = await getPersonalizedCareerData(userId);
    res.json({ categories: personalizedData });
  } catch (error) {
    console.error('❌ Personalized categories retrieval failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch personalized career paths', details: error.message });
  }
});

/**
 * POST /api/categories/:id/toggle-save
 * Toggle save/bookmark state of a specific career path
 */
router.post('/:id/toggle-save', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const careerId = req.params.id;
    const result = await toggleSavedCareer(userId, careerId);
    res.json(result);
  } catch (error) {
    console.error('❌ Toggle saved career failed:', error.message);
    res.status(500).json({ error: 'Failed to toggle bookmark status', details: error.message });
  }
});

/**
 * POST /api/categories/recommendation
 * Generate live AI career recommendations for the authenticated user.
 */
router.post('/recommendation', protect, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user profile access' });
    }

    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    let careers = [];
    try {
      careers = await getAllCategories();
    } catch (loadError) {
      console.warn('⚠️ Failed to load careers from DB, using standard fallback list:', loadError.message || loadError);
      careers = STANDARD_CAREERS.map((name) => ({ id: null, name, description: `${name} career path`, salary_range: '₹8L – ₹22L', growth_rate: '25%', demand_level: 'High' }));
    }

    if (!careers || careers.length === 0) {
      careers = STANDARD_CAREERS.map((name) => ({ id: null, name, description: `${name} career path`, salary_range: '₹8L – ₹22L', growth_rate: '25%', demand_level: 'High' }));
    }

    let aiRecommendations = [];
    try {
      aiRecommendations = await generateCareerRecommendationsFromProfile(profile, careers);
    } catch (aiError) {
      console.error('⚠️ AI recommendation generation failed, using fallback:', aiError.message || aiError);
      aiRecommendations = [];
    }

    if (!Array.isArray(aiRecommendations) || aiRecommendations.length === 0) {
      console.warn('⚠️ AI did not return structured recommendations, using fallback career list.');
      aiRecommendations = careers.slice(0, 3).map((career) => ({
        career_name: career.name,
        match_percentage: 70,
        reason: `Fallback career recommendation for ${career.name} based on available career data.`,
        recommended_skills: [],
        missing_skills: []
      }));
    }

    const normalizeName = (value) => {
      if (!value) return '';
      return value.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    };

    const savedRecommendations = [];
    const topMatches = aiRecommendations
      .map((rec) => {
        const careerName = (rec.career_name || rec.name || '').trim();
        const normalizedTarget = normalizeName(careerName);
        const careerMatch = careers.find((c) => normalizeName(c.name) === normalizedTarget)
          || careers.find((c) => normalizeName(c.name).includes(normalizedTarget))
          || careers.find((c) => normalizedTarget.includes(normalizeName(c.name)));

        return {
          careerName: careerName || careerMatch?.name || 'Career Role',
          career: careerMatch || null,
          match_percentage: Number(rec.match_percentage || rec.matchPercentage || 65),
          reason: rec.reason || rec.explanation || 'Strong match based on your onboarding profile.',
          recommended_skills: Array.isArray(rec.recommended_skills) ? rec.recommended_skills : [],
          missing_skills: Array.isArray(rec.missing_skills) ? rec.missing_skills : [],
        };
      })
      .filter((rec) => !!rec.careerName)
      .slice(0, 5);

    for (const recommendation of topMatches) {
      const careerName = recommendation.careerName;
      let careersRecordId = recommendation.career?.id || null;
      let careerRecordName = recommendation.career?.name || careerName;

      if (recommendation.career && careersRecordId) {
        try {
          await saveCareerRecommendation(userId, careersRecordId, recommendation.match_percentage, recommendation.reason);
        } catch (saveError) {
          console.warn(`⚠️ Failed to persist career recommendation for ${careerName}:`, saveError.message || saveError);
        }
      }

      savedRecommendations.push({
        career_id: careersRecordId,
        career_name: careerRecordName,
        match_percentage: recommendation.match_percentage ?? 65,
        reason: recommendation.reason || 'Recommended based on your learning profile.',
        recommended_skills: recommendation.recommended_skills || [],
        missing_skills: recommendation.missing_skills || [],
      });
    }

    res.json({ recommendations: savedRecommendations });
  } catch (error) {
    console.error('❌ Career recommendation generation failed:', error.message || error);
    res.status(500).json({ error: 'Failed to generate career recommendations', details: error.message || error });
  }
});

/**
 * POST /api/categories/:id/insights
 * Retrieve cached insights or query Llama-3-8B dynamically for career guidance
 */
router.post('/:id/insights', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const careerId = req.params.id;
    
    const career = await getCategoryById(careerId);
    if (!career) {
      return res.status(404).json({ error: 'Target career not found' });
    }

    const result = await getCareerDeepDiveInsights(userId, careerId, career.name);
    res.json(result);
  } catch (error) {
    console.error('❌ Dynamic insights generation failed:', error.message);
    res.status(500).json({ error: 'Failed to compile AI insights deep-dive', details: error.message });
  }
});

/**
 * GET /api/categories/:id
 * Retrieve a specific category and its associated career paths
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Career path not found' });
    }
    
    // Since categories and career paths are combined in the 'careers' table,
    // we return the category itself, and an empty array of sub-careers.
    res.json({ category, careers: [] });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch career path' });
  }
});

/**
 * POST /api/categories
 * Create a new career category
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, salary_range, average_salary, growth_rate, demand_level, top_companies } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const categoryData = {
      name,
      description,
      icon,
      salary_range,
      average_salary: average_salary ? parseInt(average_salary) : 0,
      growth_rate,
      demand_level,
      top_companies
    };

    const newCategory = await createCategory(categoryData);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create career path' });
  }
});

export default router;
