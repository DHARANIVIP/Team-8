/**
 * Service: Courses
 * Client utility connecting with backend/routes/courses
 */

import { getApiUrl } from '@/lib/api-url';
import { getToken } from './auth-service';
import { parseResponse } from '@/lib/services/fetch-utils';

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

function apiPath(path: string): string {
  return `${getApiUrl()}${path}`;
}

// ── Types ──

export interface CourseRecommendation {
  id: string;
  student_id: string;
  course_id: string;
  skill_id: string | null;
  reason: string;
  skill_gap: string;
  priority_order: number;
  created_at: string;
  courses?: {
    id: string;
    title: string;
    description: string | null;
    provider: string;
    platform: string | null;
    url: string;
    difficulty: string;
    price: string | null;
    rating: number | null;
    duration_weeks: number | null;
    category: string | null;
    language: string | null;
    instructor: string | null;
    thumbnail_url: string | null;
    tags: string[];
    prerequisites: string[];
    learning_outcomes: string[];
  };
  skills?: { id: string; name: string; category: string } | null;
}

export interface CourseRecommendationResponse {
  recommendations: CourseRecommendation[];
  skillGap: string[];
  cached: boolean;
  totalCourses: number;
  career?: { id: string; name: string } | null;
}

// ── API Functions ──

export async function getCourses() {
  try {
    const response = await fetch(apiPath('/api/courses'));
    return await parseResponse(response);
  } catch (error) {
    console.error('Course Service error:', error);
    throw error;
  }
}

export async function getCoursesBySkill(skillId: string) {
  try {
    const response = await fetch(apiPath(`/api/courses/by-skill/${skillId}`));
    return await parseResponse(response);
  } catch (error) {
    console.error('Course Service error:', error);
    throw error;
  }
}

export async function getRecommendedCourses(skillIds: string[]) {
  try {
    const response = await fetch(apiPath('/api/courses/recommendations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillIds }),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error('Course Service error:', error);
    throw error;
  }
}

/**
 * Get AI-generated course recommendations (chains from Career + Skills).
 * Returns cached recommendations if available, or generates new ones.
 */
export async function getCourseRecommendations(force = false): Promise<CourseRecommendationResponse> {
  const qs = force ? '?force=true' : '';
  const response = await fetch(apiPath(`/api/courses/recommendation${qs}`), {
    headers: authHeaders(),
  });
  return await parseResponse(response);
}

/**
 * Get previously saved course recommendations for the current user.
 */
export async function getSavedCourseRecommendations(): Promise<CourseRecommendation[]> {
  const response = await fetch(apiPath('/api/courses/recommendation/saved'), {
    headers: authHeaders(),
  });
  const data = await parseResponse(response);
  return data.recommendations || [];
}

export async function createCourse(course: any) {
  try {
    const response = await fetch(apiPath('/api/courses'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error('Course Service error:', error);
    throw error;
  }
}
