import express from 'express';
import { chat } from '../services/openapiService.js';

const router = express.Router();

/**
 * [Teammate 1] Supplemental Student Coaching Handler
 * AI-powered career advising chatbot endpoint
 */

/**
 * POST /api/ai/chat
 * Send a message to the AI career advisor
 * Expects: { message: string, context?: object }
 * Returns: { response: string, suggestions?: array }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = await chat(message, context);
    res.json(response);
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

/**
 * POST /api/ai/advise
 * Get personalized career advice based on user profile
 */
router.post('/advise', async (req, res) => {
  try {
    const { userProfile, careerHistory } = req.body;
    
    const advice = await chat(
      `Provide career advice based on this profile: ${JSON.stringify(userProfile)}`,
      { careerHistory }
    );
    
    res.json(advice);
  } catch (error) {
    console.error('Error generating advice:', error);
    res.status(500).json({ error: 'Failed to generate advice' });
  }
});

export default router;
