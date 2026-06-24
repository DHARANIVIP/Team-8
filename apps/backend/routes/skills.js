import express from 'express';
import { getAllSkills, getSkillsByCareer, createSkill, calculateSkillMatrix } from '../services/supabaseService.js';

const router = express.Router();

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
    console.error('⚠️ PostgreSQL connection failed. Returning mock skills.');
    
    const mockSkills = [
      { id: '1', name: 'Python', category: 'Languages', description: 'General scientific language', difficulty_level: 'Easy' },
      { id: '2', name: 'JavaScript', category: 'Languages', description: 'Web scripting language', difficulty_level: 'Medium' },
      { id: '3', name: 'React', category: 'Frontend Frameworks', description: 'Declarative UI library', difficulty_level: 'Medium' },
      { id: '4', name: 'SQL', category: 'Databases', description: 'Relational query language', difficulty_level: 'Easy' }
    ];
    
    res.json(mockSkills);
  }
});

/**
 * POST /api/skills
 * Create a new skill
 */
router.post('/', async (req, res) => {
  try {
    const { name, category, description, difficultyLevel, career_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const skillData = {
      name,
      category,
      description,
      difficulty_level: difficultyLevel,
      career_id
    };

    const newSkill = await createSkill(skillData);
    res.status(201).json(newSkill);
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
    
    if (!career_id_1 || !career_id_2) {
      return res.status(400).json({ error: 'career_id_1 and career_id_2 are required' });
    }

    const matrix = await calculateSkillMatrix(career_id_1, career_id_2);
    
    // Format response to match API contract
    res.json({
      overlap: matrix.commonSkills,
      uniqueTo1: matrix.uniqueToCareer1,
      uniqueTo2: matrix.uniqueToCareer2,
      overlapPercentage: matrix.overlapPercentage
    });
  } catch (error) {
    console.error('Error calculating skill matrix. Returning mock matrix.');
    
    // Mock Matrix Fallback
    res.json({
      overlap: ['Python', 'SQL'],
      uniqueTo1: ['JavaScript', 'React', 'AWS'],
      uniqueTo2: ['Machine Learning', 'TensorFlow', 'Statistics'],
      overlapPercentage: 25
    });
  }
});

export default router;
