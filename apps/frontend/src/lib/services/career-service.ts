import { getToken } from './auth-service';
import { parseResponse } from '@/lib/services/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

export async function getCategories() {
  try {
    const response = await fetch(`${API_URL}/api/categories`);
    return await parseResponse(response);
  } catch (error) {
    console.error('Career Service error:', error);
    throw error;
  }
}

export async function getPersonalizedCategories() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/api/categories/personalized`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await parseResponse(response);
  } catch (error) {
    console.error('Personalized Career Service error:', error);
    throw error;
  }
}

export async function getCategoryById(id: string) {
  try {
    const response = await fetch(`${API_URL}/api/categories/${id}`);
    return await parseResponse(response);
  } catch (error) {
    console.error('Career Service error:', error);
    throw error;
  }
}

export async function createCategory(category: any) {
  try {
    const response = await fetch(`${API_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error('Career Service error:', error);
    throw error;
  }
}

export async function toggleSavedCareer(id: string) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/api/categories/${id}/toggle-save`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await parseResponse(response);
  } catch (error) {
    console.error('Toggle saved career error:', error);
    throw error;
  }
}

export async function getCareerInsights(id: string) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/api/categories/${id}/insights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await parseResponse(response);
  } catch (error) {
    console.error('Get career insights error:', error);
    throw error;
  }
}

export async function generateLiveRecommendations() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/api/categories/recommendation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await parseResponse(response);
    return Array.isArray(data) ? { recommendations: data } : data;
  } catch (error) {
    console.error('Generate live recommendations error:', error);
    throw error;
  }
}
