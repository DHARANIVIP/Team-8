import express from 'express';
import { getAllCourses, getCoursesBySkill, getRecommendedCourses, createCourse } from '../services/supabaseService.js';

const router = express.Router();

/**
 * [Teammate 4] Feature 3: Courses & Academic Curriculum Endpoints
 * Handles course suggestions and directory lookups
 */

/**
 * GET /api/courses
 * Retrieve all available courses
 */
router.get('/', async (req, res) => {
  try {
    const courses = await getAllCourses();
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
    const courses = await getCoursesBySkill(skillId);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses by skill:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * POST /api/courses/recommendations
 * Get personalized course recommendations based on missing skills
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { skillIds } = req.body;
    const recommendations = await getRecommendedCourses(skillIds);
    res.json(recommendations);
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
    const { title, description, provider, url, skill_id, duration_weeks, difficulty_level } = req.body;
    const course = await createCourse({
      title,
      description,
      provider,
      url,
      skill_id,
      duration_weeks,
      difficulty_level,
    });
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

export default router;
