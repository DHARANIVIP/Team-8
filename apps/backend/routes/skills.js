import express from 'express';
import Skill from '../models/Skill.js';
import CareerPath from '../models/CareerPath.js';

const router = express.Router();

/**
 * GET /api/skills
 * Retrieve all skills or filter by career ID
 */
router.get('/', async (req, res) => {
  try {
    const { careerId } = req.query;
    
    if (careerId) {
      const career = await CareerPath.findById(careerId).populate('requiredSkills');
      if (!career) return res.status(404).json({ error: 'Career not found' });
      // TODO: Inject Live Job Skills using Adzuna/JSearch API here
      return res.json(career.requiredSkills);
    }
    
    const skills = await Skill.find();
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
    const { name, category, description, difficultyLevel } = req.body;
    const skill = new Skill({ name, category, description, difficultyLevel });
    await skill.save();
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
    
    const career1 = await CareerPath.findById(career_id_1).populate('requiredSkills');
    const career2 = await CareerPath.findById(career_id_2).populate('requiredSkills');
    
    if (!career1 || !career2) {
      return res.status(404).json({ error: 'One or both careers not found' });
    }

    const skills1 = career1.requiredSkills.map(s => s._id.toString());
    const skills2 = career2.requiredSkills.map(s => s._id.toString());
    
    const overlap = career1.requiredSkills.filter(s => skills2.includes(s._id.toString()));
    const uniqueTo1 = career1.requiredSkills.filter(s => !skills2.includes(s._id.toString()));
    const uniqueTo2 = career2.requiredSkills.filter(s => !skills1.includes(s._id.toString()));

    res.json({
      overlap,
      uniqueTo1,
      uniqueTo2,
      overlapPercentage: (overlap.length / Math.max(skills1.length, skills2.length)) * 100
    });
  } catch (error) {
    console.error('Error calculating skill matrix:', error);
    res.status(500).json({ error: 'Failed to calculate skill matrix' });
  }
});

export default router;
