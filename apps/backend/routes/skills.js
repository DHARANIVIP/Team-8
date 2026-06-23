import express from 'express';
import { getAllSkills, getSkillsByCareer, createSkill, calculateSkillMatrix } from '../services/supabaseService.js';

const router = express.Router();

/**
 * [Teammate 3] Feature 2: Skills & Matrix Calculation Endpoints
 * Handles skill mapping and proficiency matrices
 */

/**
 * GET /api/skills
 * Retrieve all skills or filter by career ID
 */
router.get('/', async (req, res) => {
  try {
    const { careerId } = req.query;
    
    if (careerId) {
      const skills = await getSkillsByCareer(careerId);
      return res.json(skills);
    }
    
    const skills = await getAllSkills();
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

/**
 * POST /api/skills
 * Create a new skill
 */
router.post('/', async (req, res) => {
  try {
    const { name, category, description, proficiency_level } = req.body;
    const skill = await createSkill({
      name,
      category,
      description,
      proficiency_level: proficiency_level || 0,
    });
    res.status(201).json(skill);
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

/**
 * POST /api/skills/matrix
 * Calculate skill proficiency matrix for comparison
 */
router.post('/matrix', async (req, res) => {
  try {
    const { career_id_1, career_id_2 } = req.body;
    const matrix = await calculateSkillMatrix(career_id_1, career_id_2);
    res.json(matrix);
  } catch (error) {
    console.error('Error calculating skill matrix:', error);
    res.status(500).json({ error: 'Failed to calculate skill matrix' });
  }
});

export default router;
