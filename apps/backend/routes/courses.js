import express from 'express';
import { getAllCourses, getCoursesBySkill, createCourse, getRecommendedCourses, getSkillById, syncCoursesCache } from '../services/supabaseService.js';

const router = express.Router();

/**
 * GET /api/courses
 * Retrieve all available courses
 */
router.get('/', async (req, res) => {
  try {
    const courses = await getAllCourses();
    res.json(courses);
  } catch (error) {
    console.error('⚠️ Courses retrieval failed. Returning mock data.', error.message);
    
    const mockCourses = [
      { id: '1', title: 'JavaScript: The Advanced Concepts', provider: 'Udemy', url: '#', difficulty: 'Advanced', price: '₹455', skill_id: 'c7078e8e-d9c1-4b13-911e-0899f8d1634b' },
      { id: '2', title: 'Introduction to Python', provider: 'Coursera', url: '#', difficulty: 'Beginner', price: 'Free', skill_id: 'd1193d20-80c1-4f80-bdc2-7cb8e293dbef' }
    ];
    
    res.json(mockCourses);
  }
});

/**
 * GET /api/courses/by-skill/:skillId
 * Retrieve courses associated with a specific skill (With on-demand search sync)
 */
router.get('/by-skill/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    let courses = await getCoursesBySkill(skillId);
    
    if (!courses || courses.length === 0) {
      const skill = await getSkillById(skillId);
      if (skill) {
        console.log(`⚠️ Course cache miss for skill: "${skill.name}". Syncing courses...`);
        courses = await syncCoursesCache(skillId, skill.name);
      }
    }
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses by skill:', error.message);
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
    
    if (!skillIds || !Array.isArray(skillIds)) {
      return res.status(400).json({ error: 'skillIds must be an array' });
    }

    // Ensure all missing skills have their courses synced/cached in the DB
    for (const skillId of skillIds) {
      try {
        const cached = await getCoursesBySkill(skillId);
        if (!cached || cached.length === 0) {
          const skill = await getSkillById(skillId);
          if (skill) {
            await syncCoursesCache(skillId, skill.name);
          }
        }
      } catch (err) {
        console.warn(`Could not sync courses for skillId ${skillId}:`, err.message);
      }
    }

    const recommendations = await getRecommendedCourses(skillIds);
    res.json({ courses: recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    res.json({ courses: [] });
  }
});

/**
 * POST /api/courses
 * Create a new course entry
 */
router.post('/', async (req, res) => {
  try {
    const { title, provider, url, difficulty, price, skill_id, targetSkills } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Support both SQL single relation (skill_id) and MongoDB array relation (targetSkills)
    const effectiveSkillId = skill_id || (targetSkills && targetSkills.length > 0 ? targetSkills[0] : null);

    const courseData = {
      title,
      provider,
      url,
      difficulty,
      price,
      skill_id: effectiveSkillId
    };

    const newCourse = await createCourse(courseData);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

export default router;
