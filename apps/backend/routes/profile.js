import express from 'express';
import { protect } from '../middleware/auth.js';
import { getUserProfile, createUserProfile, updateUserProfile } from '../services/supabaseService.js';

const router = express.Router();

/**
 * GET /api/profile
 * Get the profile of the current authenticated user.
 * If no profile exists, create a default one.
 */
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    let profile;
    try {
      profile = await getUserProfile(userId);
      
      if (!profile) {
        // Create a default profile with empty settings
        const defaultProfile = {
          user_id: userId,
          current_skills: [],
          experience_level: 'Beginner',
          target_career: 'Software Engineer',
          salary_goal: '₹15L+',
          email_updates: true,
          market_alerts: false,
          weekly_digest: true,
          compact_mode: false
        };
        profile = await createUserProfile(defaultProfile);
      }
    } catch (dbError) {
      console.error('⚠️ Supabase database profile query failed. Using offline/development mock profile.', dbError.message);
      // Fallback in-memory profile so the frontend never crashes due to database setup issues
      profile = {
        user_id: userId,
        current_skills: ['JavaScript', 'React', 'Python'],
        experience_level: 'Junior (1–3y)',
        target_career: 'Software Engineer',
        salary_goal: '₹15L+',
        email_updates: true,
        market_alerts: false,
        weekly_digest: true,
        compact_mode: false,
        is_mock: true
      };
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching/creating profile:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve profile',
      details: error.message || error,
      code: error.code
    });
  }
});

/**
 * PUT /api/profile
 * Update user profile & settings
 */
router.put('/', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      current_skills, 
      experience_level, 
      target_career, 
      salary_goal,
      email_updates,
      market_alerts,
      weekly_digest,
      compact_mode
    } = req.body;
    
    let updatedProfile;
    try {
      updatedProfile = await updateUserProfile(userId, {
        current_skills,
        experience_level,
        target_career,
        salary_goal,
        email_updates,
        market_alerts,
        weekly_digest,
        compact_mode
      });
    } catch (dbError) {
      console.error('⚠️ Supabase database profile update failed. Returning in-memory update.', dbError.message);
      updatedProfile = {
        user_id: userId,
        current_skills: current_skills || [],
        experience_level: experience_level || 'Beginner',
        target_career: target_career || 'Software Engineer',
        salary_goal: salary_goal || '₹15L+',
        email_updates: email_updates !== false,
        market_alerts: market_alerts === true,
        weekly_digest: weekly_digest !== false,
        compact_mode: compact_mode === true,
        is_mock: true
      };
    }
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
