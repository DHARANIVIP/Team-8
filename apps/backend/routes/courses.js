import express from 'express';
import Course from '../models/Course.js';

const router = express.Router();

/**
 * GET /api/courses
 * Retrieve all available courses
 */
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('targetSkills');
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * GET /api/courses/by-skill/:skillId
 * Retrieve courses associated with a specific skill
 */
router.get('/by-skill/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const courses = await Course.find({ targetSkills: skillId });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses by skill:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * POST /api/courses/recommendations
 * Get personalized course recommendations based on missing skills using AI matching
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { skillIds } = req.body;
    
    // First, find explicit matches in the database
    const dbRecommendations = await Course.find({ targetSkills: { $in: skillIds } }).populate('targetSkills');
    
    // TODO: Inject LLM (OpenAI/Anthropic) here to suggest optimal learning paths 
    // based on learning style, or suggest courses not in the DB.
    
    res.json({ courses: dbRecommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

/**
 * POST /api/courses
 * Create a new course entry
 */
router.post('/', async (req, res) => {
  try {
    const { title, provider, url, difficulty, price, targetSkills } = req.body;
    const course = new Course({ title, provider, url, difficulty, price, targetSkills });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

export default router;
