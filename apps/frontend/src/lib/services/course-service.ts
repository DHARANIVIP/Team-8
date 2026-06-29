/**
 * Service: Courses
 * Client utility connecting with backend/routes/courses
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

export async function getCourses() {
  try {
    const response = await fetch(`${API_URL}/api/courses`);
    if (!response.ok) throw new Error('Failed to fetch courses');
    return await response.json();
  } catch (error) {
    console.error('Course Service error:', error);
    throw error;
  }
}

export async function getCoursesBySkill(skillId: string) {
  try {
    const response = await fetch(`${API_URL}/api/courses/by-skill/${skillId}`);
    if (!response.ok) throw new Error('Failed to fetch courses');
    return await response.json();
  } catch (error) {
    console.error('Course Service error:', error);
    throw error;
  }
}

export async function getRecommendedCourses(skillIds: string[]) {
  try {
    const response = await fetch(`${API_URL}/api/courses/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillIds }),
    });
    if (!response.ok) throw new Error('Failed to fetch recommendations');
    return await response.json();
  } catch (error) {
    console.error('Course Service error:', error);
    throw error;
  }
}

export async function createCourse(course: any) {
  try {
    const response = await fetch(`${API_URL}/api/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    if (!response.ok) throw new Error('Failed to create course');
    return await response.json();
  } catch (error) {
    console.error('Course Service error:', error);
    throw error;
  }
}
