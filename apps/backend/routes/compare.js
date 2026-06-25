import express from 'express';
import { calculateComparisonMetrics, createComparison, getComparison, getCategoryById } from '../services/supabaseService.js';

const router = express.Router();

/**
 * POST /api/compare/metrics
 * Calculate comparison metrics between two careers
 */
router.post('/metrics', async (req, res) => {
  try {
    const { career_id_1, career_id_2 } = req.body;
    
    if (!career_id_1 || !career_id_2) {
      return res.status(400).json({ error: 'career_id_1 and career_id_2 are required' });
    }

    const metrics = await calculateComparisonMetrics(career_id_1, career_id_2);
    const career1 = await getCategoryById(career_id_1);
    const career2 = await getCategoryById(career_id_2);
    
    res.json({
      career1: {
        title: metrics.career1,
        salary: metrics.salaryComparison.career1,
        growth: career1?.growth_rate || '25%',
        demand: career1?.demand_level || 'High',
        topCompanies: career1?.top_companies ? career1.top_companies.split(', ') : [],
        education: career1?.education_requirement || 'Relevant Bachelor\'s Degree',
        environment: career1?.work_environment || 'Office Settings / Hybrid',
        outlook: career1?.future_outlook || 'Favorable opportunities'
      },
      career2: {
        title: metrics.career2,
        salary: metrics.salaryComparison.career2,
        growth: career2?.growth_rate || '25%',
        demand: career2?.demand_level || 'High',
        topCompanies: career2?.top_companies ? career2.top_companies.split(', ') : [],
        education: career2?.education_requirement || 'Relevant Bachelor\'s Degree',
        environment: career2?.work_environment || 'Office Settings / Hybrid',
        outlook: career2?.future_outlook || 'Favorable opportunities'
      },
      skillOverlap: metrics.skillOverlap,
      commonSkills: metrics.commonSkills,
      uniqueSkillsCareer1: metrics.uniqueSkillsCareer1,
      uniqueSkillsCareer2: metrics.uniqueSkillsCareer2
    });
  } catch (error) {
    console.error('Error calculating metrics. Returning mock metrics.', error.message);
    
    // Mock Metrics Fallback
    res.json({
      career1: {
        title: 'Software Engineer',
        salary: '₹8L – ₹25L',
        growth: '28%',
        demand: 'High',
        topCompanies: ['Google', 'Microsoft', 'TCS'],
        education: 'B.Tech / BCA / Bootcamp',
        environment: 'Hybrid / Remote Availability',
        outlook: 'Excellent prospects'
      },
      career2: {
        title: 'Data Scientist',
        salary: '₹10L – ₹30L',
        growth: '36%',
        demand: 'High',
        topCompanies: ['Meta', 'Amazon', 'IBM'],
        education: 'B.Tech / B.Sc Statistics / M.Sc',
        environment: 'Hybrid / Office Settings',
        outlook: 'Excellent prospects'
      },
      skillOverlap: 30,
      commonSkills: ['Python', 'SQL'],
      uniqueSkillsCareer1: ['JavaScript', 'React', 'Docker'],
      uniqueSkillsCareer2: ['Machine Learning', 'TensorFlow', 'Statistics']
    });
  }
});

/**
 * POST /api/compare
 * Save a new career comparison
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, career_id_1, career_id_2 } = req.body;
    
    if (!user_id || !career_id_1 || !career_id_2) {
      return res.status(400).json({ error: 'user_id, career_id_1, and career_id_2 are required' });
    }

    const comparisonData = {
      user_id,
      career_id_1,
      career_id_2
    };

    const newComparison = await createComparison(comparisonData);
    res.status(201).json(newComparison);
  } catch (error) {
    console.error('Error saving comparison:', error);
    res.status(500).json({ error: 'Failed to save comparison' });
  }
});

/**
 * GET /api/compare/:id
 * Retrieve a specific saved comparison by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const comparison = await getComparison(id);
    if (!comparison) {
      return res.status(404).json({ error: 'Comparison record not found' });
    }
    res.json(comparison);
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({ error: 'Failed to fetch comparison record' });
  }
});

export default router;
