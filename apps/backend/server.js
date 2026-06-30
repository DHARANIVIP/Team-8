import 'dotenv/config'; // trigger reload
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import connectDB from './config/db.js';

// Import routes
import categoriesRouter from './routes/categories.js';
import skillsRouter from './routes/skills.js';
import coursesRouter from './routes/courses.js';
import compareRouter from './routes/compare.js';
import aiRouter from './routes/ai.js';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import roadmapsRouter from './routes/roadmaps.js';
import onboardingRouter from './routes/onboarding.js';
import careerRouter from './routes/career.js';
import { seedRoadmaps } from './seedRoadmaps.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// Routes
/**
 * [Teammate 1] Entry point for server execution
 * Routes organized by feature domain
 */

app.use('/api/auth', authRouter);

/**
 * [Teammate 2] Feature 1: Category endpoints
 */
app.use('/api/categories', categoriesRouter);

/**
 * [Teammate 3] Feature 2: Skills & Matrix calculation endpoints
 */
app.use('/api/skills', skillsRouter);

/**
 * [Teammate 4] Feature 3: Courses & Academic curriculum lookups
 */
app.use('/api/courses', coursesRouter);

/**
 * [Teammate 5] Feature 4: Career Comparison & Structural comparison rules
 */
app.use('/api/compare', compareRouter);

/**
 * [Teammate 1] Supplemental student coaching handler
 */
app.use('/api/ai', aiRouter);

/**
 * User Profile endpoints
 */
app.use('/api/profile', profileRouter);

/**
 * Learning Roadmaps endpoints (roadmap.sh)
 */
app.use('/api/roadmaps', roadmapsRouter);

/**
 * Onboarding endpoints
 */
app.use('/api/onboarding', onboardingRouter);

/**
 * Career Guidance endpoints (AI-powered)
 */
app.use('/api/career', careerRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  
  // Seed PostgreSQL roadmaps data
  try {
    await seedRoadmaps();
  } catch (seedErr) {
    console.error('❌ Error seeding roadmaps on startup:', seedErr.message);
  }
  
  // Auto-create new tables if missing (skill_recommendations, recommended_courses)
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Check and create skill_recommendations table
    const { error: srErr } = await supabase.from('skill_recommendations').select('id').limit(1);
    if (srErr && srErr.message && srErr.message.includes('does not exist')) {
      console.log('⚠️ skill_recommendations table missing — run database_update.sql in Supabase SQL Editor');
    } else {
      console.log('✅ Supabase skill_recommendations table verified!');
    }
    
    // Check and create recommended_courses table
    const { error: rcErr } = await supabase.from('recommended_courses').select('id').limit(1);
    if (rcErr && rcErr.message && rcErr.message.includes('does not exist')) {
      console.log('⚠️ recommended_courses table missing — run database_update.sql in Supabase SQL Editor');
    } else {
      console.log('✅ Supabase recommended_courses table verified!');
    }
  } catch (err) {
    console.error('❌ Error checking new tables on startup:', err.message);
  }

  // Verify Supabase columns presence on start
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error: rErr } = await supabase.from('roadmaps').select('source, source_slug, etag').limit(1);
    if (rErr) {
      console.warn('⚠️ Supabase roadmaps columns (source, source_slug, etag) might be missing:', rErr.message);
    } else {
      console.log('✅ Supabase roadmaps table columns verified successfully!');
    }
    const { error: nErr } = await supabase.from('roadmap_nodes').select('node_type, source_node_id').limit(1);
    if (nErr) {
      console.warn('⚠️ Supabase roadmap_nodes columns (node_type, source_node_id) might be missing:', nErr.message);
    } else {
      console.log('✅ Supabase roadmap_nodes table columns verified successfully!');
    }
  } catch (err) {
    console.error('❌ Error checking Supabase columns on startup:', err.message);
  }
});
