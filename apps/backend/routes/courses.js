import express from 'express';
import { getAllCourses, getCoursesBySkill, createCourse, getRecommendedCourses, getSkillById, syncCoursesCache, getUserProfile, saveRecommendedCourses, getRecommendedCoursesForStudent, getUserSkills, getSkillsByCareer, getCategoryById, getCareerRecommendations, getSkillRecommendations, computeSkillGap, mongoIdToUuid, getUserRecommendations, findOrCreateCareerByName, getAllCategories } from '../services/supabaseService.js';
import { generateCourseRecommendations } from '../services/geminiCareerService.js';
import { protect } from '../middleware/auth.js';

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
    console.error('⚠️ Courses retrieval failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch courses from database', details: error.message });
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

/**
 * GET /api/courses/recommendation
 * Full-stack course recommendation chaining from Career + Skills modules.
 * Auto-generates if no saved recommendations exist.
 */
router.get('/recommendation', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const force = req.query.force === 'true';

    // 1. Check for existing saved recommendations (unless force refresh)
    if (!force) {
      const saved = await getRecommendedCoursesForStudent(userId);
      if (saved && saved.length > 0) {
        // Extract skill gap from saved data
        const skillGap = saved[0].skill_gap ? saved[0].skill_gap.split(', ').filter(Boolean) : [];
        return res.json({
          recommendations: saved,
          skillGap,
          cached: true,
          totalCourses: saved.length
        });
      }
    }

    // 2. Fetch student profile
    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Student profile not found. Complete onboarding first.' });
    }

    // 3. Fetch all courses from DB
    const allCourses = await getAllCourses();
    if (!allCourses || allCourses.length === 0) {
      return res.status(404).json({ error: 'No courses available in database. Run the seed SQL first.' });
    }

    // 4. Get latest career recommendation (selected/top career) — HARD GATE
    let selectedCareer = null;
    try {
      const careerRecs = await getCareerRecommendations(userId);
      if (careerRecs && careerRecs.length > 0) {
        const topCareer = careerRecs.sort((a, b) => (b.match_percentage || 0) - (a.match_percentage || 0))[0];
        if (topCareer && topCareer.career_id) {
          const careerId = mongoIdToUuid(topCareer.career_id);
          selectedCareer = await getCategoryById(careerId);
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch career recommendations:', err.message);
    }

    // Fallback 1: Check onboarding recommendations in user_recommendations table
    if (!selectedCareer) {
      try {
        const userRecs = await getUserRecommendations(userId);
        if (userRecs && userRecs.suggested_career_paths && userRecs.suggested_career_paths.length > 0) {
          const firstCareerId = mongoIdToUuid(userRecs.suggested_career_paths[0]);
          selectedCareer = await getCategoryById(firstCareerId);
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch from user_recommendations fallback:', err.message);
      }
    }

    // Fallback 2: Check student profile target_career name
    if (!selectedCareer && profile.target_career) {
      try {
        console.log(`🔍 Resolving career by target_career name: "${profile.target_career}"`);
        selectedCareer = await findOrCreateCareerByName(profile.target_career);
      } catch (err) {
        console.warn('⚠️ Could not resolve target_career fallback by name:', err.message);
      }
    }

    // Fallback 3: Get first available career category from DB
    if (!selectedCareer) {
      try {
        const allCats = await getAllCategories();
        if (allCats && allCats.length > 0) {
          selectedCareer = allCats[0];
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch fallback categories:', err.message);
      }
    }

    if (!selectedCareer) {
      return res.status(400).json({ 
        error: 'No career selected. Please complete AI Career Guidance first.',
        redirect: '/dashboard/career'
      });
    }

    // 5. Use shared deterministic skill gap computation
    const gapResult = await computeSkillGap(userId, selectedCareer.id);
    const { missingSkills, weakSkills, skillsToLearn } = gapResult;

    // Also fetch saved skill recommendations for AI context
    let skillRecs = [];
    let skillGapSkills = [];
    try {
      const cleanCareerId = mongoIdToUuid(selectedCareer.id);
      skillRecs = await getSkillRecommendations(userId, cleanCareerId) || [];
      skillGapSkills = skillRecs
        .filter(s => s.status !== 'completed')
        .map(s => ({
          id: s.skill_id,
          name: s.skill_name || s.name,
          category: s.skill_category || s.category,
          difficulty_level: s.skill_difficulty || s.difficulty_level,
          status: s.status || 'pending',
          priority_order: s.priority_order
        }));
      // If no saved skill recs, use the deterministic gap
      if (skillGapSkills.length === 0 && skillsToLearn.length > 0) {
        skillGapSkills = skillsToLearn.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          difficulty_level: s.difficulty_level,
          status: 'pending'
        }));
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch skill recommendations:', err.message);
      // Use deterministic gap as fallback
      skillGapSkills = skillsToLearn.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        difficulty_level: s.difficulty_level,
        status: 'pending'
      }));
    }

    // 6. Generate AI course recommendations with full context
    console.log(`🤖 Generating AI course recommendations for user ${userId}...`);
    const aiResult = await generateCourseRecommendations(profile, allCourses, {
      selectedCareer,
      skillGapSkills,
      skillRecommendations: skillRecs
    });

    // 7. Enrich recommended courses with full course details from DB
    const courseMap = new Map(allCourses.map(c => [c.id, c]));
    const enrichedCourses = (aiResult.recommendedCourses || [])
      .map(rc => {
        const course = courseMap.get(rc.courseId);
        if (!course) return null;
        return {
          ...rc,
          title: course.title,
          description: course.description,
          provider: course.provider,
          platform: course.platform,
          url: course.url,
          difficulty: course.difficulty,
          duration_weeks: course.duration_weeks,
          price: course.price,
          rating: course.rating,
          category: course.category,
          language: course.language,
          instructor: course.instructor,
          thumbnail_url: course.thumbnail_url,
          tags: course.tags || [],
          prerequisites: course.prerequisites || [],
          learning_outcomes: course.learning_outcomes || [],
          skill_id: course.skill_id
        };
      })
      .filter(Boolean);

    // 8. Save to recommended_courses table
    let savedRecs = [];
    try {
      await saveRecommendedCourses(
        userId,
        enrichedCourses.map((c, idx) => ({
          course_id: c.courseId,
          skill_id: c.skill_id,
          reason: c.reason,
          skill_gap: (aiResult.skillGap || []).join(', '),
          priority_order: c.priority_order || idx + 1
        }))
      );
      // Fetch saved data back for response (includes DB-generated fields)
      savedRecs = await getRecommendedCoursesForStudent(userId);
    } catch (saveErr) {
      console.warn('⚠️ Failed to save recommended courses:', saveErr.message);
      // Return enriched AI result even if save failed
      savedRecs = enrichedCourses.map((c, idx) => ({
        id: c.courseId,
        course_id: c.courseId,
        reason: c.reason,
        skill_gap: (aiResult.skillGap || []).join(', '),
        priority_order: c.priority_order || idx + 1,
        courses: c
      }));
    }

    // 9. Return response
    res.json({
      recommendations: savedRecs.length > 0 ? savedRecs : enrichedCourses,
      skillGap: aiResult.skillGap || [],
      cached: false,
      totalCourses: allCourses.length,
      career: selectedCareer ? { id: selectedCareer.id, name: selectedCareer.name } : null
    });
  } catch (error) {
    console.error('❌ Course recommendation failed:', error.message);
    res.status(500).json({ error: 'Failed to generate course recommendations', details: error.message });
  }
});

/**
 * GET /api/courses/recommendation/saved
 * Get previously saved course recommendations for the current user
 */
router.get('/recommendation/saved', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const saved = await getRecommendedCoursesForStudent(userId);
    res.json({ recommendations: saved });
  } catch (error) {
    console.error('❌ Failed to fetch saved recommendations:', error.message);
    res.status(500).json({ error: 'Failed to fetch saved recommendations', details: error.message });
  }
});

export default router;
