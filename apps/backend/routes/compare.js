import express from 'express';
import { getComparison, createComparison, calculateComparisonMetrics } from '../services/supabaseService.js';

const router = express.Router();

/**
 * [Teammate 5] Feature 4: Career Comparison Endpoints
 * Handles side-by-side career metrics comparison and structural rules
 */

/**
 * GET /api/compare/:id
 * Retrieve a specific career comparison by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const comparison = await getComparison(id);
    if (!comparison) {
      return res.status(404).json({ error: 'Comparison not found' });
    }
    res.json(comparison);
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({ error: 'Failed to fetch comparison' });
  }
});

/**
 * POST /api/compare
 * Create a new comparison between two careers
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, career_id_1, career_id_2 } = req.body;
    
    // Calculate comparison metrics
    const metrics = await calculateComparisonMetrics(career_id_1, career_id_2);
    
    // Create comparison record
    const comparison = await createComparison({
      user_id,
      career_id_1,
      career_id_2,
      metrics,
    });
    
    res.status(201).json(comparison);
  } catch (error) {
    console.error('Error creating comparison:', error);
    res.status(500).json({ error: 'Failed to create comparison' });
  }
});

/**
 * POST /api/compare/metrics
 * Calculate comparison metrics between two careers without saving
 */
router.post('/metrics', async (req, res) => {
  try {
    const { career_id_1, career_id_2 } = req.body;
    const metrics = await calculateComparisonMetrics(career_id_1, career_id_2);
    res.json(metrics);
  } catch (error) {
    console.error('Error calculating metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

export default router;
