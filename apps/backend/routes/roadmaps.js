import express from 'express';
import { getOrGenerateRoadmap } from '../services/roadmapSyncService.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Setup Supabase Client for local routes lookup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STANDARD_PATHS = [
  { id: 'frontend', name: 'Frontend Developer', category: 'Frontend', description: 'Master HTML, CSS, JavaScript, React, and modern frontend tools.', difficulty_level: 'Beginner', estimated_duration: '6 Months', source: 'roadmap.sh', source_slug: 'frontend' },
  { id: 'backend', name: 'Backend Developer', category: 'Backend', description: 'Design databases, microservices, REST APIs, and server architectures.', difficulty_level: 'Intermediate', estimated_duration: '8 Months', source: 'roadmap.sh', source_slug: 'backend' },
  { id: 'devops', name: 'DevOps Engineer', category: 'DevOps', description: 'Automate CI/CD pipelines, containerization, and cloud infrastructure.', difficulty_level: 'Advanced', estimated_duration: '9 Months', source: 'gemini' },
  { id: 'ai-ml', name: 'AI/ML Specialist', category: 'AI/ML', description: 'Study machine learning, neural networks, PyTorch, and generative AI models.', difficulty_level: 'Advanced', estimated_duration: '12 Months', source: 'gemini' },
  { id: 'data-science', name: 'Data Scientist', category: 'Data Science', description: 'Analyze big data, statistics, SQL, data pipelines, and python scripting.', difficulty_level: 'Intermediate', estimated_duration: '7 Months', source: 'gemini' },
  { id: 'cybersecurity', name: 'Cybersecurity Analyst', category: 'Cybersecurity', description: 'Secure networks, ethical hacking, defense frameworks, and pentesting.', difficulty_level: 'Intermediate', estimated_duration: '8 Months', source: 'gemini' },
  { id: 'cloud', name: 'Cloud Architect', category: 'Cloud Computing', description: 'Design secure, fault-tolerant distributed systems in AWS, GCP, or Azure.', difficulty_level: 'Advanced', estimated_duration: '9 Months', source: 'gemini' },
  { id: 'claude-code', name: 'Claude Code Developer', category: 'AI Tools', description: 'Master AI-assisted terminal-based coding, agentic workflows, and Claude Code tools.', difficulty_level: 'Intermediate', estimated_duration: '3 Months', source: 'gemini' },
  { id: 'vibe-coding', name: 'Vibe Coding Specialist', category: 'AI Tools', description: 'Leverage LLMs, prompt engineering, agent orchestration, and vibe-coding paradigms.', difficulty_level: 'Beginner', estimated_duration: '2 Months', source: 'gemini' }
];

const nameMapping = {
  'frontend': { name: 'Frontend Developer', category: 'Frontend' },
  'backend': { name: 'Backend Developer', category: 'Backend' },
  'devops': { name: 'DevOps Engineer', category: 'DevOps' },
  'ai-ml': { name: 'AI/ML Specialist', category: 'AI/ML' },
  'data-science': { name: 'Data Scientist', category: 'Data Science' },
  'cybersecurity': { name: 'Cybersecurity Analyst', category: 'Cybersecurity' },
  'cloud': { name: 'Cloud Architect', category: 'Cloud Computing' },
  'claude-code': { name: 'Claude Code Developer', category: 'AI Tools' },
  'vibe-coding': { name: 'Vibe Coding Specialist', category: 'AI Tools' }
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

/**
 * GET /api/roadmaps/source/roadmap.sh
 * Returns only the roadmaps sourced from roadmap.sh
 */
router.get('/source/roadmap.sh', async (req, res) => {
  try {
    const { data: dbRoadmaps, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('source', 'roadmap.sh');

    if (error || !dbRoadmaps || dbRoadmaps.length === 0) {
      // Fallback: return standard frontend/backend paths
      const fallback = STANDARD_PATHS.filter(p => p.source === 'roadmap.sh');
      return res.json(fallback);
    }
    
    // Merge standard path descriptions
    const blended = dbRoadmaps.map(db => {
      const match = STANDARD_PATHS.find(p => p.name.toLowerCase() === db.name.toLowerCase());
      return match ? { ...match, ...db } : db;
    });
    
    res.json(blended);
  } catch (err) {
    console.error('Error fetching roadmap.sh sources:', err.message);
    const fallback = STANDARD_PATHS.filter(p => p.source === 'roadmap.sh');
    res.json(fallback);
  }
});

export default router;
