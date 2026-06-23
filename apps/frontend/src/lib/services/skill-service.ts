/**
 * Service: Skills
 * Client utility connecting with backend/routes/skills
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getSkills() {
  try {
    const response = await fetch(`${API_URL}/api/skills`);
    if (!response.ok) throw new Error('Failed to fetch skills');
    return await response.json();
  } catch (error) {
    console.error('Skill Service error:', error);
    throw error;
  }
}

export async function getSkillsByCareer(careerId: string) {
  try {
    const response = await fetch(`${API_URL}/api/skills?careerId=${careerId}`);
    if (!response.ok) throw new Error('Failed to fetch skills');
    return await response.json();
  } catch (error) {
    console.error('Skill Service error:', error);
    throw error;
  }
}

export async function createSkill(skill: any) {
  try {
    const response = await fetch(`${API_URL}/api/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skill),
    });
    if (!response.ok) throw new Error('Failed to create skill');
    return await response.json();
  } catch (error) {
    console.error('Skill Service error:', error);
    throw error;
  }
}

export async function calculateSkillMatrix(career_id_1: string, career_id_2: string) {
  try {
    const response = await fetch(`${API_URL}/api/skills/matrix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ career_id_1, career_id_2 }),
    });
    if (!response.ok) throw new Error('Failed to calculate matrix');
    return await response.json();
  } catch (error) {
    console.error('Skill Service error:', error);
    throw error;
  }
}
