import { getToken } from './auth-service';
import { parseResponse } from '@/lib/services/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

export async function submitOnboarding(formData: FormData) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/api/onboarding/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await parseResponse(response);
    return data;
  } catch (error) {
    console.error('submitOnboarding error:', error);
    throw error;
  }
}

export async function getRecommendations() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/api/onboarding/recommendations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await parseResponse(response);
    return data;
  } catch (error) {
    console.warn('getRecommendations:', error);
    throw error;
  }
}
