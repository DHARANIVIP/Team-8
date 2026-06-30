import type { GapSkill, UserSkill } from '@/lib/types/skills';

export function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase();
}

export function partitionSkills(
  userSkills: UserSkill[],
  requiredNames: string[]
): { matched: string[]; gaps: string[] } {
  const matched: string[] = [];
  const gaps: string[] = [];

  for (const req of requiredNames) {
    const has = userSkills.some(
      us => normalizeSkillName(us.skill_name) === normalizeSkillName(req)
    );
    if (has) matched.push(req);
    else gaps.push(req);
  }

  return { matched, gaps };
}

export function computeReadinessFromGaps(gapSkills: GapSkill[]): number {
  if (!gapSkills.length) return 0;
  const totalWeight = gapSkills.reduce((sum, s) => sum + s.importance, 0);
  const acquiredWeight = gapSkills.reduce((sum, s) => {
    if (!s.acquired) return sum;
    return sum + s.importance * (Math.min(100, s.progress_percentage || 0) / 100);
  }, 0);
  return totalWeight > 0 ? Math.round((acquiredWeight / totalWeight) * 100) : 0;
}

export function groupSkillsByCategory(skills: UserSkill[]): Map<string, UserSkill[]> {
  const map = new Map<string, UserSkill[]>();
  for (const skill of skills) {
    const cat = skill.category || 'General';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(skill);
  }
  return map;
}

export function proficiencyColor(proficiency: string): { bg: string; color: string; border: string } {
  if (proficiency === 'Expert') {
    return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
  }
  if (proficiency === 'Beginner') {
    return { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' };
  }
  return { bg: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)', border: '1px solid rgba(37, 99, 235, 0.3)' };
}

export function urgencyColor(urgency: string): string {
  if (urgency === 'high') return '#ef4444';
  if (urgency === 'medium') return 'var(--accent)';
  return '#94a3b8';
}
