import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import passport from 'passport';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import '../config/passport.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mastermind_super_secret_jwt_key';

// ── Google OAuth Routes ──
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      const userObj = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name
      };
      
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(userObj))}`);
    } catch (err) {
      console.error('Google OAuth callback signing error:', err);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }
);

// ── GitHub OAuth Routes ──
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      const userObj = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name
      };
      
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(userObj))}`);
    } catch (err) {
      console.error('GitHub OAuth callback signing error:', err);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }
);

/**
 * POST /api/auth/signup
 * Register a new student
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    // Create and save new user
    const user = new User({ email, name });
    user.setPassword(password);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/signin
 * Login an existing student
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.validPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/forget-password
 * Request a password reset token
 */
router.post('/forget-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    res.json({
      message: 'Password reset token generated successfully',
      resetToken,
      resetUrl: `http://localhost:3001/api/auth/reset-password?token=${resetToken}`
    });
  } catch (error) {
    console.error('Forget password error:', error);
    res.status(500).json({ error: 'Failed to process forget password request' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using the reset token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Find valid token that has not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
    }

    // Reset password
    user.setPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * PUT /api/auth/update-account
 * Update current authenticated user's account settings (name, email, password) in MongoDB
 */
router.put('/update-account', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    if (name) user.name = name;
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(409).json({ error: 'This email is already registered with another account' });
      }
      user.email = email;
    }
    if (password) {
      user.setPassword(password);
    }

    await user.save();
    res.json({
      message: 'Account details updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Failed to update account details' });
  }
});

export default router;
