import express from 'express';
import Category from '../models/Category.js';
import CareerPath from '../models/CareerPath.js';
import { getIndustryNews } from '../services/industryService.js';

const router = express.Router();

/**
 * GET /api/categories
 * Retrieve all career categories (Enriched with Industry Health later)
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    // Inject News API
    const news = await getIndustryNews('Technology Career Trends');
    res.json({ categories, latestNews: news });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/categories/:id
 * Retrieve a specific category and its associated career paths
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Fetch associated career paths
    const careers = await CareerPath.find({ categoryId: id });
    
    // TODO: Inject specific news for this category
    res.json({ category, careers });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

/**
 * POST /api/categories
 * Create a new career category
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const category = new Category({ name, description, icon });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;
