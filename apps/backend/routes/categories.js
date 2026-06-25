import express from 'express';
import { getAllCategories, getCategoryById, createCategory, syncCareerCache } from '../services/supabaseService.js';
import { getIndustryNews } from '../services/industryService.js';

const router = express.Router();

// List of standard careers to ensure are cached in the system
const STANDARD_CAREERS = [
  'Software Engineer',
  'Data Scientist',
  'UX Designer',
  'Cybersecurity Analyst',
  'Product Manager',
  'Cloud Architect'
];

/**
 * GET /api/categories
 * Retrieve all career categories/paths (Enriched with Industry Health)
 */
router.get('/', async (req, res) => {
  try {
    let categories = await getAllCategories();
    
    // Check if we are missing any standard careers in the cache
    const cachedNames = categories.map(c => c.name);
    const missingCareers = STANDARD_CAREERS.filter(name => !cachedNames.includes(name));

    if (missingCareers.length > 0) {
      console.log(`⚠️ Missing standard careers in cache: ${missingCareers.join(', ')}. Syncing now...`);
      for (const name of missingCareers) {
        await syncCareerCache(name);
      }
      // Re-fetch populated list
      categories = await getAllCategories();
    }

    const news = await getIndustryNews('Technology Career Trends');
    res.json({ categories, latestNews: news });
  } catch (error) {
    console.error('⚠️ Category retrieval failed. Returning mock data.', error.message);
    
    // Mock Data Fallback
    const mockCategories = [
      { id: 'b3a985d8-c923-42bf-be0d-6e828d11634b', name: 'Software Engineer', description: 'Careers in web and app development', icon: '💻', salary_range: '₹8L – ₹25L', growth_rate: '28%', demand_level: 'High' },
      { id: 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf', name: 'Data Scientist', description: 'Data analysis and machine learning', icon: '📊', salary_range: '₹10L – ₹30L', growth_rate: '36%', demand_level: 'High' },
      { id: 'a1288c80-60b6-4b8c-85a2-3f8c8d8b1bfb', name: 'UX Designer', description: 'Create intuitive and user-friendly designs.', icon: '🎨', salary_range: '₹6L – ₹18L', growth_rate: '22%', demand_level: 'Medium' }
    ];
    
    res.json({ categories: mockCategories, latestNews: [] });
  }
});

/**
 * GET /api/categories/:id
 * Retrieve a specific category and its associated career paths
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Career path not found' });
    }
    
    // Since categories and career paths are combined in the 'careers' table,
    // we return the category itself, and an empty array of sub-careers.
    res.json({ category, careers: [] });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch career path' });
  }
});

/**
 * POST /api/categories
 * Create a new career category
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, salary_range, average_salary, growth_rate, demand_level, top_companies } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const categoryData = {
      name,
      description,
      icon,
      salary_range,
      average_salary: average_salary ? parseInt(average_salary) : 0,
      growth_rate,
      demand_level,
      top_companies
    };

    const newCategory = await createCategory(categoryData);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create career path' });
  }
});

export default router;
