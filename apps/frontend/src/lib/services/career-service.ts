import { getToken } from './auth-service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getCategories() {
  try {
    const response = await fetch(`${API_URL}/api/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return await response.json();
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
    if (!response.ok) throw new Error('Failed to fetch personalized categories');
    return await response.json();
  } catch (error) {
    console.error('Personalized Career Service error:', error);
    throw error;
  }
}

export async function getCategoryById(id: string) {
  try {
    const response = await fetch(`${API_URL}/api/categories/${id}`);
    if (!response.ok) throw new Error('Failed to fetch category');
    return await response.json();
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
    if (!response.ok) throw new Error('Failed to create category');
    return await response.json();
  } catch (error) {
    console.error('Career Service error:', error);
    throw error;
  }
}
