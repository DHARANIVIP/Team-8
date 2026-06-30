/**
 * Service: Career Comparison
 * Client utility connecting with backend/routes/compare
 */

import { parseResponse } from '@/lib/services/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

export async function getComparison(id: string) {
  try {
    const response = await fetch(`${API_URL}/api/compare/${id}`);
    return await parseResponse(response);
  } catch (error) {
    console.error('Compare Service error:', error);
    throw error;
  }
}

export async function createComparison(userId: string, career_id_1: string, career_id_2: string) {
  try {
    const response = await fetch(`${API_URL}/api/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, career_id_1, career_id_2 }),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error('Compare Service error:', error);
    throw error;
  }
}

export async function calculateComparisonMetrics(career_id_1: string, career_id_2: string) {
  try {
    const response = await fetch(`${API_URL}/api/compare/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ career_id_1, career_id_2 }),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error('Compare Service error:', error);
    throw error;
  }
}
