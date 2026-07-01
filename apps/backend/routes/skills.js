import express from 'express';
import { 
  getAllSkills, 
  getSkillsByCareer, 
  createSkill, 
  calculateSkillMatrix, 
  getCategoryById, 
  syncCareerCache,
  getUserSkills,
  updateUserSkillProgress,
  deleteUserSkill,
  getSkillGapAnalysis,
  getSkillsOverview,
  getCareerReadinessScores,
  getSkillsAdvisor,
  suggestSkills,
  updateUserProfile,
  getUserProfile,
  saveSkillRecommendations,
  getSkillRecommendations,
  updateSkillRecommendationStatus,
  computeSkillGap,
  mongoIdToUuid
} from '../services/supabaseService.js';
import { generateSkillRecommendationOrder } from '../services/geminiCareerService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/skills/overview
 * Aggregated KPIs and domain scores for the Skills page
 */
router.get('/overview', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { careerId } = req.query;
    const overview = await getSkillsOverview(userId, careerId || null);
    res.json(overview);
  } catch (error) {
    console.error('❌ Get skills overview failed:', error.message);
    res.status(500).json({ error: 'Failed to retrieve skills overview', details: error.message });
  }
});

/**
 * GET /api/skills/advisor
 * Data-driven learning guidance from profile, gaps, and recommendations
 */
router.get('/advisor', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { careerId } = req.query;
    const advisor = await getSkillsAdvisor(userId, careerId || null);
    res.json(advisor);
  } catch (error) {
    console.error('❌ Get skills advisor failed:', error.message);
    res.status(500).json({ error: 'Failed to retrieve skills advisor', details: error.message });
  }
});

/**
 * GET /api/skills/readiness
 * Readiness percentage for every career in the catalog
 */
router.get('/readiness', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const scores = await getCareerReadinessScores(userId);
    res.json({ careers: scores });
  } catch (error) {
    console.error('❌ Get career readiness failed:', error.message);
    res.status(500).json({ error: 'Failed to calculate career readiness', details: error.message });
  }
});

/**
 * GET /api/skills/suggest
 * Autocomplete search against the skills catalog
 */
router.get('/suggest', protect, async (req, res) => {
  try {
    const { q } = req.query;
    const suggestions = await suggestSkills(q || '');
    res.json({ suggestions });
  } catch (error) {
    console.error('❌ Skill suggest failed:', error.message);
    res.status(500).json({ error: 'Failed to search skills catalog', details: error.message });
  }
});

/**
 * GET /api/skills/profile
 * Retrieve granular user skills profile
 */
router.get('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const skills = await getUserSkills(userId);
    res.json(skills);
  } catch (error) {
    console.error('❌ Get user skills profile failed:', error.message);
    res.status(500).json({ error: 'Failed to retrieve skills profile', details: error.message });
  }
});

/**
 * POST /api/skills/profile
 * Add or update a granular user skill progress
 */
router.post('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillName, proficiency, progressPercentage } = req.body;

    if (!skillName) {
      return res.status(400).json({ error: 'skillName is required' });
    }

    const updated = await updateUserSkillProgress(userId, skillName, proficiency, progressPercentage, 'user');
    res.json(updated);
  } catch (error) {
    console.error('❌ Update user skill progress failed:', error.message);
    res.status(500).json({ error: 'Failed to save skill progress', details: error.message });
  }
});

/**
 * DELETE /api/skills/profile/:skillName
 * Remove a skill from the user's profile
 */
router.delete('/profile/:skillName', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const skillName = decodeURIComponent(req.params.skillName);
    const result = await deleteUserSkill(userId, skillName);
    res.json(result);
  } catch (error) {
    console.error('❌ Delete user skill failed:', error.message);
    res.status(500).json({ error: 'Failed to delete skill', details: error.message });
  }
});

/**
 * GET /api/skills/gap/:careerId
 * Compare user profile skills against career-required skills
 */
router.get('/gap/:careerId', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { careerId } = req.params;

    const gapDetails = await getSkillGapAnalysis(userId, careerId);
    res.json(gapDetails);
  } catch (error) {
    console.error('❌ Get skill gap analysis failed:', error.message);
    res.status(500).json({ error: 'Failed to calculate skill gaps', details: error.message });
  }
});

/**
 * POST /api/skills/analyze
 * Run dynamic AI skills parsing using stored resume text from database.
 * Falls back to current_skills array if resume_raw_text is not available.
 */
router.post('/analyze', protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let profile = null;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('resume_raw_text, current_skills, target_career')
        .eq('user_id', mongoIdToUuid(userId))
        .maybeSingle();
      if (error) throw error;
      profile = data;
    } catch (dbErr) {
      console.warn('⚠️ Supabase user_profiles query failed during skills analyze:', dbErr.message);
      return res.status(400).json({ 
        error: 'Database query failed. Please ensure the database schema migrations have been run.' 
      });
    }

    const resumeText = profile?.resume_raw_text || '';
    const existingSkills = profile?.current_skills || [];

    if (resumeText.trim()) {
      const { getHFOpenAIClient } = await import('../services/huggingfaceService.js');
      const client = getHFOpenAIClient();

      const systemPrompt = `Analyze the resume text and extract all professional, engineering, or design skills.
      For each extracted skill, estimate:
      - proficiency: 'Beginner', 'Intermediate', or 'Expert' based on context (Expert = multiple projects/years, Beginner = basic mention).
      - progressPercentage: integer between 10 and 95.
      
      You MUST output valid JSON only conforming to the schema below. Do not output markdown or explanations:
      {
        "skills": [
          { "name": "Python", "proficiency": "Expert", "progressPercentage": 90 },
          { "name": "React", "proficiency": "Intermediate", "progressPercentage": 60 }
        ]
      }`;

      const completion = await client.chat.completions.create({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct:together',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Resume text:\n"""\n${resumeText.substring(0, 3000)}\n"""` }
        ],
        temperature: 0.2
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');
      let jsonString = '{}';
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = responseText.substring(firstBrace, lastBrace + 1);
      } else {
        jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      let parsed = { skills: [] };
      try {
        parsed = JSON.parse(jsonString);
      } catch (pErr) {
        console.warn('⚠️ Standard JSON parse failed:', pErr.message);
        return res.status(422).json({ error: 'AI could not parse skills from your resume. Try again or add skills manually.' });
      }

      const extracted = parsed.skills || [];
      if (extracted.length === 0) {
        return res.status(422).json({ error: 'No skills could be extracted from your resume text.' });
      }

      const inserted = [];
      for (const skill of extracted) {
        const result = await updateUserSkillProgress(userId, skill.name, skill.proficiency, skill.progressPercentage, 'resume');
        inserted.push(result);
      }

      await updateUserProfile(userId, { skills_last_analyzed_at: new Date().toISOString() }).catch(() => {});

      return res.json({ message: 'Skills profile analyzed and updated from resume!', skills: inserted, source: 'resume' });
    }

    if (existingSkills && existingSkills.length > 0) {
      const inserted = [];
      for (const skillName of existingSkills) {
        if (!skillName || typeof skillName !== 'string') continue;
        try {
          const result = await updateUserSkillProgress(userId, skillName, 'Intermediate', 60, 'profile');
          inserted.push(result);
        } catch (skillErr) {
          console.warn(`⚠️ Could not upsert skill "${skillName}":`, skillErr.message);
        }
      }

      await updateUserProfile(userId, { skills_last_analyzed_at: new Date().toISOString() }).catch(() => {});

      return res.json({ 
        message: `Skills populated from your profile (${inserted.length} skills). Upload a resume during onboarding for deeper AI analysis.`,
        skills: inserted,
        source: 'profile'
      });
    }

    return res.status(400).json({ 
      error: 'No resume text or existing skills found in your profile. Please complete the onboarding process to upload your resume.' 
    });

  } catch (error) {
    console.error('❌ Dynamic skills AI analysis failed:', error.message);
    res.status(500).json({ error: 'Failed to run AI skills parsing', details: error.message });
  }
});

/**
 * GET /api/skills
 * Retrieve all skills or filter by career ID (With on-demand O*NET sync)
 */
router.get('/', async (req, res) => {
  try {
    const { careerId } = req.query;
    
    if (careerId) {
      let skills = await getSkillsByCareer(careerId);
      
      if (!skills || skills.length === 0) {
        const career = await getCategoryById(careerId);
        if (career) {
          console.log(`⚠️ No skills cached for career: "${career.name}". Syncing skills now...`);
          const syncResult = await syncCareerCache(career.name);
          skills = syncResult.skills;
        }
      }
      
      return res.json(skills || []);
    }
    
    const skills = await getAllSkills();
    res.json(skills || []);
  } catch (error) {
    console.error('❌ Skills retrieval failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch skills from database', details: error.message });
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
    
    res.json({
      overlap: matrix.commonSkills,
      uniqueTo1: matrix.uniqueToCareer1,
      uniqueTo2: matrix.uniqueToCareer2,
      overlapPercentage: matrix.overlapPercentage
    });
  } catch (error) {
    console.error('Error calculating skill matrix:', error.message);
    res.status(500).json({ error: 'Failed to calculate skill matrix', details: error.message });
  }
});

/**
 * GET /api/skills/recommendation
 * Workflow C: Generate ordered skill learning roadmap for a student+career
 * Deterministic gap analysis in backend, AI for ranking/explanation only
 */
// Dynamic prerequisites helper mapping based on standard engineering stack dependencies
function getPrerequisitesForSkill(skillName, careerSkills) {
  const preReqMap = {
    'react': ['javascript'],
    'react.js': ['javascript'],
    'node.js': ['javascript'],
    'node': ['javascript'],
    'machine learning': ['python'],
    'deep learning': ['machine learning', 'python'],
    'tensorflow': ['python', 'machine learning'],
    'pytorch': ['python', 'machine learning'],
    'kubernetes': ['docker'],
    'docker': ['git'],
    'express.js': ['javascript', 'node.js'],
    'express': ['javascript', 'node.js'],
    'typescript': ['javascript'],
    'redux': ['react', 'javascript'],
    'next.js': ['react', 'javascript'],
    'pandas': ['python'],
    'numpy': ['python'],
    'scikit-learn': ['python', 'machine learning']
  };
  const nameLower = (skillName || '').toLowerCase().trim();
  const possible = preReqMap[nameLower] || [];
  const careerSkillNames = new Set((careerSkills || []).map(s => s.name?.toLowerCase().trim()));
  return possible.filter(p => careerSkillNames.has(p));
}

router.get('/recommendation', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { careerId } = req.query;

    if (!careerId) {
      return res.status(400).json({ error: 'careerId query parameter is required' });
    }

    const cleanCareerId = mongoIdToUuid(careerId);

    // 1. Fetch student profile
    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Student profile not found. Complete onboarding first.' });
    }

    // 2. Use shared deterministic skill gap computation
    const gapResult = await computeSkillGap(userId, cleanCareerId);
    if (!gapResult.career) {
      return res.status(404).json({ error: 'Career not found' });
    }

    const { career, careerSkills, userSkills, missingSkills, weakSkills, skillsToLearn } = gapResult;

    if (skillsToLearn.length === 0) {
      const completedSkills = userSkills.filter(us => us.source === 'course_completion' || us.proficiency === 'Expert');
      return res.json({
        career: career.name,
        careerId: cleanCareerId,
        message: 'You already have all the skills for this career!',
        recommendations: [],
        gapSummary: { missing: 0, weak: 0, total: careerSkills.length },
        currentSkills: userSkills,
        recentlyCompleted: completedSkills,
        nextRecommended: null,
        cached: true
      });
    }

    // 3. Check if we have cached recommendations (unless force=true)
    const forceRefresh = req.query.force === 'true';
    if (!forceRefresh) {
      const cached = await getSkillRecommendations(userId, cleanCareerId);
      if (cached && cached.length > 0) {
        const enrichedCached = cached.map(r => ({
          ...r,
          prerequisites: getPrerequisitesForSkill(r.skill_name || '', careerSkills)
        }));
        
        const completedSkills = userSkills.filter(us => us.source === 'course_completion' || us.proficiency === 'Expert');
        const nextRec = enrichedCached.find(r => r.status === 'pending' || r.status === 'in_progress');

        return res.json({
          career: career.name,
          careerId: cleanCareerId,
          recommendations: enrichedCached,
          gapSummary: { missing: missingSkills.length, weak: weakSkills.length, total: careerSkills.length },
          currentSkills: userSkills,
          recentlyCompleted: completedSkills,
          nextRecommended: nextRec || null,
          cached: true
        });
      }
    }

    // 4. Call AI to rank/order skills by learning sequence
    console.log(`🤖 Generating skill recommendation order for ${career.name}...`);
    const orderedRecommendations = await generateSkillRecommendationOrder(
      profile,
      career.name,
      skillsToLearn,
      userSkills || []
    );

    // 5. Save to skill_recommendations table and return saved data
    let savedRecs;
    try {
      await saveSkillRecommendations(userId, cleanCareerId, orderedRecommendations);
      savedRecs = await getSkillRecommendations(userId, cleanCareerId);
    } catch (saveErr) {
      console.warn('⚠️ Failed to save skill recommendations:', saveErr.message);
      savedRecs = orderedRecommendations.map(r => ({ ...r, status: 'pending' }));
    }

    const enrichedRecs = (savedRecs || []).map(r => ({
      ...r,
      prerequisites: getPrerequisitesForSkill(r.skill_name || '', careerSkills)
    }));

    const completedSkills = userSkills.filter(us => us.source === 'course_completion' || us.proficiency === 'Expert');
    const nextRec = enrichedRecs.find(r => r.status === 'pending' || r.status === 'in_progress');

    // 6. Return ordered skill roadmap enriched with metadata
    res.json({
      career: career.name,
      careerId: cleanCareerId,
      recommendations: enrichedRecs,
      gapSummary: { missing: missingSkills.length, weak: weakSkills.length, total: careerSkills.length },
      currentSkills: userSkills,
      recentlyCompleted: completedSkills,
      nextRecommended: nextRec || null,
      cached: false
    });
  } catch (error) {
    console.error('❌ Skill recommendation failed:', error.message);
    res.status(500).json({ error: 'Failed to generate skill recommendations', details: error.message });
  }
});

/**
 * PUT /api/skills/recommendation/:id/status
 * Update skill recommendation status (mark as in_progress or completed)
 */
router.put('/recommendation/:id/status', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be pending, in_progress, or completed' });
    }

    const updated = await updateSkillRecommendationStatus(id, status);
        
    // If completed, also update user_skills with the skill name from enriched data
    if (status === 'completed' && updated) {
      try {
        await updateUserSkillProgress(
          req.user.userId,
          updated.skill_name || 'Unknown Skill',
          'Intermediate',
          80,
          'course_completion'
        );
      } catch (skillErr) {
        console.warn(`⚠️ Could not update user skill on completion:`, skillErr.message);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('❌ Update skill recommendation status failed:', error.message);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
});

/**
 * GET /api/skills/recommendation/list
 * Get saved skill recommendations for the current user
 */
router.get('/recommendation/list', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { careerId } = req.query;
    
    const recommendations = await getSkillRecommendations(userId, careerId || null);
    res.json({ recommendations });
  } catch (error) {
    console.error('❌ Get skill recommendations failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch skill recommendations', details: error.message });
  }
});

export default router;
