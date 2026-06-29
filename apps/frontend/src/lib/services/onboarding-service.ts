import { getToken } from './auth-service';

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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit onboarding');
    }
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch recommendations');
    }
    return data;
  } catch (error) {
    console.warn('getRecommendations:', error);
    throw error;
  }
}
