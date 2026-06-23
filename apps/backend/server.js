import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

// Import routes
import categoriesRouter from './routes/categories.js';
import skillsRouter from './routes/skills.js';
import coursesRouter from './routes/courses.js';
import compareRouter from './routes/compare.js';
import aiRouter from './routes/ai.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
/**
 * [Teammate 1] Entry point for server execution
 * Routes organized by feature domain
 */

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
