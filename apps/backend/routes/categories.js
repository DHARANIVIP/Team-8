import express from 'express';
import { getAllCategories, getCategoryById, createCategory } from '../services/supabaseService.js';

const router = express.Router();

/**
 * [Teammate 2] Feature 1: Career Categories Endpoints
 * Handles category endpoint operations
 */

/**
 * GET /api/categories
 * Retrieve all career categories
 */
router.get('/', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/categories/:id
 * Retrieve a specific category by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
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
    const { name, description, industry, salary_range } = req.body;
    const category = await createCategory({
      name,
      description,
      industry,
      salary_range,
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;
