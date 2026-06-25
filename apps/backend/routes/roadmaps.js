import express from 'express';
import { getOrGenerateRoadmap } from '../services/roadmapSyncService.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Setup Supabase Client for local routes lookup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STANDARD_PATHS = [
  { id: 'frontend', name: 'Frontend Developer', category: 'Frontend', description: 'Master HTML, CSS, JavaScript, React, and modern frontend tools.', difficulty_level: 'Beginner', estimated_duration: '6 Months' },
  { id: 'backend', name: 'Backend Developer', category: 'Backend', description: 'Design databases, microservices, REST APIs, and server architectures.', difficulty_level: 'Intermediate', estimated_duration: '8 Months' },
  { id: 'devops', name: 'DevOps Engineer', category: 'DevOps', description: 'Automate CI/CD pipelines, containerization, and cloud infrastructure.', difficulty_level: 'Advanced', estimated_duration: '9 Months' },
  { id: 'ai-ml', name: 'AI/ML Specialist', category: 'AI/ML', description: 'Study machine learning, neural networks, PyTorch, and generative AI models.', difficulty_level: 'Advanced', estimated_duration: '12 Months' },
  { id: 'data-science', name: 'Data Scientist', category: 'Data Science', description: 'Analyze big data, statistics, SQL, data pipelines, and python scripting.', difficulty_level: 'Intermediate', estimated_duration: '7 Months' },
  { id: 'cybersecurity', name: 'Cybersecurity Analyst', category: 'Cybersecurity', description: 'Secure networks, ethical hacking, defense frameworks, and pentesting.', difficulty_level: 'Intermediate', estimated_duration: '8 Months' },
  { id: 'cloud', name: 'Cloud Architect', category: 'Cloud Computing', description: 'Design secure, fault-tolerant distributed systems in AWS, GCP, or Azure.', difficulty_level: 'Advanced', estimated_duration: '9 Months' }
];

const nameMapping = {
  'frontend': { name: 'Frontend Developer', category: 'Frontend' },
  'backend': { name: 'Backend Developer', category: 'Backend' },
  'devops': { name: 'DevOps Engineer', category: 'DevOps' },
  'ai-ml': { name: 'AI/ML Specialist', category: 'AI/ML' },
  'data-science': { name: 'Data Scientist', category: 'Data Science' },
  'cybersecurity': { name: 'Cybersecurity Analyst', category: 'Cybersecurity' },
  'cloud': { name: 'Cloud Architect', category: 'Cloud Computing' }
};

/**
 * GET /api/roadmaps
 * List all available roadmaps (serves standard index immediately)
 */
router.get('/', async (req, res) => {
  try {
    // Attempt database check
    const { data: dbRoadmaps, error } = await supabase
      .from('roadmaps')
      .select('*');

    if (error || !dbRoadmaps || dbRoadmaps.length === 0) {
      return res.json(STANDARD_PATHS);
    }

    // Blend standard paths descriptions if db names match
    const blended = STANDARD_PATHS.map(standard => {
      const dbMatch = dbRoadmaps.find(db => db.name.toLowerCase() === standard.name.toLowerCase());
      if (dbMatch) {
        return { ...standard, ...dbMatch };
      }
      return standard;
    });

    res.json(blended);
  } catch (err) {
    console.warn('⚠️ Supabase roadmaps fetch failed. Returning standard listing catalog.', err.message);
    res.json(STANDARD_PATHS);
  }
});

/**
 * GET /api/roadmaps/:idOrSlug
 * Retrieve detailed sequence nodes & resources for a specific roadmap
 */
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // 1. Resolve slug path to standard name
    let target = nameMapping[idOrSlug.toLowerCase()];
    
    if (!target) {
      // Check if matches standard path names directly
      const match = STANDARD_PATHS.find(p => p.name.toLowerCase() === idOrSlug.toLowerCase() || p.id === idOrSlug);
      if (match) {
        target = { name: match.name, category: match.category };
      }
    }

    // 2. If it's a UUID, check the database directly first
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUuid) {
      try {
        const { data: roadmap } = await supabase
          .from('roadmaps')
          .select('*')
          .eq('id', idOrSlug)
          .single();

        if (roadmap) {
          target = { name: roadmap.name, category: roadmap.category };
        }
      } catch (err) {
        console.warn('UUID direct lookup failed:', err.message);
      }
    }

    if (!target) {
      // Fallback default
      target = { name: 'Frontend Developer', category: 'Frontend' };
    }

    // 3. Trigger cache sync or generate dynamically
    const detailedRoadmap = await getOrGenerateRoadmap(target.name, target.category);
    res.json(detailedRoadmap);

  } catch (error) {
    console.error('Error fetching roadmap details:', error);
    res.status(500).json({ error: 'Failed to retrieve roadmap details', details: error.message });
  }
});

/**
 * POST /api/roadmaps/sync
 * Manually trigger synchronization for standard roadmaps cache
 */
router.post('/sync', async (req, res) => {
  try {
    const results = [];
    console.log('🔄 Sync requested for all standard developer roadmaps...');
    
    for (const path of STANDARD_PATHS) {
      try {
        const data = await getOrGenerateRoadmap(path.name, path.category);
        results.push({ name: path.name, status: 'Synced', id: data.id });
      } catch (err) {
        results.push({ name: path.name, status: 'Failed', error: err.message });
      }
    }
    
    res.json({ message: 'Sync process completed', results });
  } catch (error) {
    res.status(500).json({ error: 'Sync trigger failed', details: error.message });
  }
});

export default router;
