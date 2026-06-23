import express from 'express';
import CareerPath from '../models/CareerPath.js';

const router = express.Router();

/**
 * POST /api/compare/metrics
 * Calculate comparison metrics between two careers
 */
router.post('/metrics', async (req, res) => {
  try {
    const { career_id_1, career_id_2 } = req.body;
    
    const career1 = await CareerPath.findById(career_id_1).populate('requiredSkills');
    const career2 = await CareerPath.findById(career_id_2).populate('requiredSkills');
    
    if (!career1 || !career2) {
      return res.status(404).json({ error: 'One or both careers not found' });
    }

    const metrics = {
      career1: {
        title: career1.title,
        salary: career1.averageSalary,
        growth: career1.growthRate,
        demand: career1.demandLevel,
        topCompanies: career1.topCompanies
      },
      career2: {
        title: career2.title,
        salary: career2.averageSalary,
        growth: career2.growthRate,
        demand: career2.demandLevel,
        topCompanies: career2.topCompanies
      },
      // TODO: Inject Live Job Demand from Adzuna/JSearch
      // TODO: Inject Industry Stability from Finnhub/Yahoo Finance based on topCompanies
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error calculating metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

export default router;
