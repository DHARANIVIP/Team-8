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
    let profile = await getUserProfile(userId);
    
    if (!profile) {
      // Create a default profile
      const defaultProfile = {
        user_id: userId,
        current_skills: [],
        experience_level: 'Beginner'
      };
      profile = await createUserProfile(defaultProfile);
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching/creating profile:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

/**
 * PUT /api/profile
 * Update user profile
 */
router.put('/', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { current_skills, experience_level } = req.body;
    
    const updatedProfile = await updateUserProfile(userId, {
      current_skills,
      experience_level
    });
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
