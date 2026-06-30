import { getToken } from './auth-service';
import { parseResponse } from '@/lib/services/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

export async function getProfile() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await parseResponse(response);
    return data;
  } catch (error) {
    console.error('getProfile error:', error);
    throw error;
  }
}

export async function updateProfile(fields: {
  current_skills?: string[];
  experience_level?: string;
  target_career?: string;
  salary_goal?: string;
  email_updates?: boolean;
  market_alerts?: boolean;
  weekly_digest?: boolean;
  compact_mode?: boolean;
}) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(fields),
    });

    const data = await parseResponse(response);
    return data;
  } catch (error) {
    console.error('updateProfile error:', error);
    throw error;
  }
}
