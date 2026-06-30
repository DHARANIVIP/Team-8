import { getApiUrl } from '@/lib/api-url';
import { getToken } from './auth-service';
import { parseResponse, parseJsonOrText } from '@/lib/services/fetch-utils';
import type {
  CareerReadiness,
  GapAnalysisResponse,
  GapSkill,
  SkillSuggestion,
  SkillsAdvisorResponse,
  SkillsOverview,
  UserSkill,
  SkillRecommendationResponse,
  SkillRecommendation,
  SkillRecStatus,
} from '@/lib/types/skills';

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

function apiPath(path: string): string {
  return `${getApiUrl()}${path}`;
}

function computeDomainScores(userSkills: UserSkill[]) {
  const domainMap = new Map<string, { total: number; count: number }>();
  for (const skill of userSkills) {
    const cat = skill.category || 'General';
    const score = skill.progress_percentage || 0;
    if (!domainMap.has(cat)) domainMap.set(cat, { total: 0, count: 0 });
    const entry = domainMap.get(cat)!;
    entry.total += score;
    entry.count += 1;
  }
  return Array.from(domainMap.entries()).map(([name, { total, count }]) => ({
    name,
    score: Math.round(total / count),
  }));
}

async function buildOverviewFallback(careerId?: string): Promise<SkillsOverview> {
  const userSkills = await getUserSkills();
  let gap: GapAnalysisResponse | null = null;

  if (careerId) {
    try {
      gap = await getSkillGapAnalysis(careerId);
    } catch {
      gap = null;
    }
  }

  const lastAnalyzed = userSkills.reduce((latest, s) => {
    if (!s.updated_at) return latest;
    const ts = new Date(s.updated_at).getTime();
    return ts > latest ? ts : latest;
  }, 0);

  return {
    totalSkills: userSkills.length,
    expertCount: userSkills.filter(s => s.proficiency === 'Expert').length,
    intermediateCount: userSkills.filter(s => s.proficiency === 'Intermediate').length,
    beginnerCount: userSkills.filter(s => s.proficiency === 'Beginner').length,
    targetReadiness: gap?.readiness ?? 0,
    priorityGapCount: (gap?.skills || []).filter(s => !s.acquired).length,
    targetCareerName: gap?.careerName ?? null,
    domainScores: computeDomainScores(userSkills),
    lastAnalyzedAt: lastAnalyzed ? new Date(lastAnalyzed).toISOString() : null,
  };
}

function computeAdvisorFallback(
  userSkills: UserSkill[],
  gap: GapAnalysisResponse | null
): SkillsAdvisorResponse {
  const strengths = userSkills
    .filter(s => s.proficiency === 'Expert' || (s.progress_percentage || 0) >= 75)
    .map(s => s.skill_name)
    .slice(0, 5);

  const gapSkills: GapSkill[] = gap?.skills || [];
  const criticalGaps = gapSkills.filter(s => !s.acquired).slice(0, 5).map(s => s.name);
  const readiness = gap?.readiness ?? 0;
  const careerName = gap?.careerName || 'your target career';

  const nextActions = gapSkills
    .filter(s => !s.acquired)
    .slice(0, 3)
    .map(s => {
      const topCourse = s.recommendedCourses?.[0];
      return {
        action: topCourse
          ? `Take "${topCourse.title}" on ${topCourse.provider || 'online platform'}`
          : `Build proficiency in ${s.name}`,
        skill: s.name,
        urgency: (s.priorityScore >= 80 ? 'high' : s.priorityScore >= 60 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        courseId: topCourse?.id || null,
        courseUrl: topCourse?.url || null,
      };
    });

  return {
    summary:
      userSkills.length === 0
        ? 'Complete onboarding or run AI resume analysis to populate your skills profile.'
        : `You are ${readiness}% ready for ${careerName}. You have ${userSkills.length} tracked skills with ${strengths.length} core strengths and ${criticalGaps.length} priority gaps to address.`,
    strengths,
    criticalGaps,
    nextActions,
    weeklyFocus:
      criticalGaps.length >= 2
        ? `Focus on closing ${criticalGaps.slice(0, 2).join(' and ')} before exploring secondary skills.`
        : criticalGaps.length === 1
          ? `Your top priority is building ${criticalGaps[0]}.`
          : readiness >= 80
            ? 'Strong alignment — consider advancing expert-level skills or exploring adjacent careers.'
            : 'Keep updating your skill progress as you complete courses and projects.',
    readiness,
    careerName,
    cached: false,
  };
}

async function buildAdvisorFallback(careerId?: string): Promise<SkillsAdvisorResponse> {
  const userSkills = await getUserSkills();
  let gap: GapAnalysisResponse | null = null;
  if (careerId) {
    try {
      gap = await getSkillGapAnalysis(careerId);
    } catch {
      gap = null;
    }
  }
  return computeAdvisorFallback(userSkills, gap);
}

export async function getSkills() {
  const response = await fetch(apiPath('/api/skills'));
  return await parseResponse(response);
}

export async function getSkillsByCareer(careerId: string) {
  const response = await fetch(apiPath(`/api/skills?careerId=${careerId}`));
  return await parseResponse(response);
}

export async function getUserSkills(): Promise<UserSkill[]> {
  const response = await fetch(apiPath('/api/skills/profile'), {
    headers: authHeaders(),
  });
  return await parseResponse(response);
}

export async function updateUserSkillProgress(
  skillName: string,
  proficiency: string,
  progressPercentage: number
) {
  const response = await fetch(apiPath('/api/skills/profile'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ skillName, proficiency, progressPercentage }),
  });
  return await parseResponse(response);
}

export async function deleteUserSkill(skillName: string) {
  const response = await fetch(
    apiPath(`/api/skills/profile/${encodeURIComponent(skillName)}`),
    { method: 'DELETE', headers: authHeaders() }
  );
  return await parseResponse(response);
}

export async function getSkillGapAnalysis(careerId: string): Promise<GapAnalysisResponse> {
  const response = await fetch(apiPath(`/api/skills/gap/${careerId}`), {
    headers: authHeaders(),
  });
  return await parseResponse(response);
}

export async function getSkillsOverview(careerId?: string): Promise<SkillsOverview> {
  const qs = careerId ? `?careerId=${careerId}` : '';
  try {
    const response = await fetch(apiPath(`/api/skills/overview${qs}`), {
      headers: authHeaders(),
    });
    if (response.ok) return await parseResponse(response);
    if (response.status === 404) {
      return buildOverviewFallback(careerId);
    }
    const data = await parseJsonOrText(response);
    throw new Error(typeof data === 'string' ? data : data?.details || data?.error || `Failed to fetch skills overview (${response.status})`);
  } catch (err) {
    if (err instanceof Error && !err.message.includes('Not authenticated')) {
      console.warn('Skills overview fallback:', err.message);
      return buildOverviewFallback(careerId);
    }
    throw err;
  }
}

export async function getSkillsAdvisor(careerId?: string): Promise<SkillsAdvisorResponse> {
  const qs = careerId ? `?careerId=${careerId}` : '';
  try {
    const response = await fetch(apiPath(`/api/skills/advisor${qs}`), {
      headers: authHeaders(),
    });
    if (response.ok) return await parseResponse(response);
    if (response.status === 404) {
      return buildAdvisorFallback(careerId);
    }
    const data = await parseJsonOrText(response);
    throw new Error(typeof data === 'string' ? data : data?.details || data?.error || `Failed to fetch skills advisor (${response.status})`);
  } catch (err) {
    if (err instanceof Error && !err.message.includes('Not authenticated')) {
      console.warn('Skills advisor fallback:', err.message);
      return buildAdvisorFallback(careerId);
    }
    throw err;
  }
}

export async function getCareerReadiness(): Promise<CareerReadiness[]> {
  try {
    const response = await fetch(apiPath('/api/skills/readiness'), {
      headers: authHeaders(),
    });
    if (response.status === 404) {
      return [];
    }
    const data = await parseResponse(response);
    return data.careers || [];
  } catch (err) {
    if (err instanceof Error && !err.message.includes('Not authenticated')) {
      console.warn('Career readiness unavailable:', err.message);
      return [];
    }
    throw err;
  }
}

export async function suggestSkills(query: string): Promise<SkillSuggestion[]> {
  try {
    const response = await fetch(
      apiPath(`/api/skills/suggest?q=${encodeURIComponent(query)}`),
      { headers: authHeaders() }
    );
    if (response.ok) {
      const data = await parseResponse(response);
      return data.suggestions || [];
    }
    if (response.status === 404) {
      const all = await getSkills();
      const q = query.trim().toLowerCase();
      return (all as SkillSuggestion[])
        .filter(s => !q || s.name.toLowerCase().includes(q))
        .slice(0, 15)
        .map(s => ({ id: s.id, name: s.name, category: s.category || 'General' }));
    }
    throw new Error('Failed to search skills');
  } catch (err) {
    if (err instanceof Error && !err.message.includes('Not authenticated')) {
      const all = await getSkills().catch(() => []);
      const q = query.trim().toLowerCase();
      return (all as SkillSuggestion[])
        .filter(s => !q || s.name.toLowerCase().includes(q))
        .slice(0, 15)
        .map(s => ({ id: s.id, name: s.name, category: s.category || 'General' }));
    }
    throw err;
  }
}

export async function triggerAISkillsAnalysis() {
  const response = await fetch(apiPath('/api/skills/analyze'), {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const data = await parseJsonOrText(response);
    throw new Error(typeof data === 'string' ? data : data?.error || 'Failed to start AI skills analysis');
  }
  return await parseResponse(response);
}

export async function createSkill(skill: Record<string, unknown>) {
  const response = await fetch(apiPath('/api/skills'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(skill),
  });
  return await parseResponse(response);
}

export async function calculateSkillMatrix(career_id_1: string, career_id_2: string) {
  const response = await fetch(apiPath('/api/skills/matrix'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ career_id_1, career_id_2 }),
  });
  return await parseResponse(response);
}

// Skill Recommendation API calls

export async function getSkillRecommendations(careerId: string, force = false): Promise<SkillRecommendationResponse> {
  const qs = `?careerId=${careerId}${force ? '&force=true' : ''}`;
  const response = await fetch(apiPath(`/api/skills/recommendation${qs}`), {
    headers: authHeaders(),
  });
  return await parseResponse(response);
}

export async function getSavedSkillRecommendations(careerId?: string): Promise<SkillRecommendation[]> {
  const qs = careerId ? `?careerId=${careerId}` : '';
  const response = await fetch(apiPath(`/api/skills/recommendation/list${qs}`), {
    headers: authHeaders(),
  });
  const data = await parseResponse(response);
  return data.recommendations || [];
}

export async function updateSkillRecommendationStatus(
  recId: string,
  status: SkillRecStatus
): Promise<SkillRecommendation> {
  const response = await fetch(apiPath(`/api/skills/recommendation/${recId}/status`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  return await parseResponse(response);
}
