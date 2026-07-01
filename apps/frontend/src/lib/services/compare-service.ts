/**
 * Service: Career Comparison
 * Client utility connecting with backend/routes/compare
 */

import { parseResponse } from '@/lib/services/fetch-utils';
import { getToken } from './auth-service';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

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

/**
 * Fetch AI recommended careers for the current user
 */
export async function getRecommendedCareers() {
  try {
    const response = await fetch(`${API_URL}/api/career/recommended`, {
      headers: getAuthHeaders()
    });
    return await parseResponse(response);
  } catch (error) {
    console.error('Failed to fetch recommended careers:', error);
    throw error;
  }
}

/**
 * Perform side-by-side comparison on selected careers
 */
export async function compareCareers(careerIds: string[]) {
  try {
    const response = await fetch(`${API_URL}/api/career/compare`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ careerIds })
    });
    return await parseResponse(response);
  } catch (error) {
    console.error('Failed to compare careers:', error);
    throw error;
  }
}

