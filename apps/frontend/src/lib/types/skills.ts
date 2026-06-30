export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Expert';
export type SkillSource = 'resume' | 'user' | 'profile' | 'course_completion';

export interface UserSkill {
  id: string;
  skill_name: string;
  category: string;
  proficiency: ProficiencyLevel;
  progress_percentage: number;
  source: SkillSource;
  updated_at?: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  provider?: string;
  url?: string;
  difficulty?: string;
  price?: string;
}

export interface GapSkill {
  id?: string;
  name: string;
  category: string;
  description?: string;
  difficulty_level?: string;
  importance: number;
  priorityScore: number;
  acquired: boolean;
  proficiency: ProficiencyLevel | 'None';
  progress_percentage: number;
  recommendedCourses?: CourseSummary[];
}

export interface GapAnalysisResponse {
  careerId: string;
  careerName: string;
  readiness: number;
  skills: GapSkill[];
  message?: string;
}

export interface SkillsOverview {
  totalSkills: number;
  expertCount: number;
  intermediateCount: number;
  beginnerCount: number;
  targetReadiness: number;
  priorityGapCount: number;
  targetCareerName: string | null;
  domainScores: { name: string; score: number }[];
  lastAnalyzedAt: string | null;
}

export interface NextAction {
  action: string;
  skill: string;
  urgency: 'high' | 'medium' | 'low';
  courseId?: string | null;
  courseUrl?: string | null;
}

export interface SkillsAdvisorResponse {
  summary: string;
  strengths: string[];
  criticalGaps: string[];
  nextActions: NextAction[];
  weeklyFocus: string;
  readiness: number;
  careerName: string;
  cached: boolean;
}

export interface CareerReadiness {
  careerId: string;
  careerName: string;
  readiness: number;
  totalRequired: number;
  acquiredCount: number;
  topGaps: string[];
}

export interface SkillSuggestion {
  id: string;
  name: string;
  category: string;
}

export type SkillsTab = 'overview' | 'profile' | 'gap' | 'matrix' | 'fit';

export interface CareerOption {
  id: string;
  name: string;
}

// Skill Recommendation types
export type SkillRecStatus = 'pending' | 'in_progress' | 'completed';

export interface SkillRecommendation {
  id: string;
  student_id: string;
  career_id: string;
  skill_id: string;
  skill_name: string;
  skill_category: string;
  skill_difficulty: string;
  recommended_level: string;
  reason: string;
  priority_order: number;
  status: SkillRecStatus;
  created_at: string;
  updated_at: string;
}

export interface SkillRecommendationResponse {
  career: string;
  recommendations: SkillRecommendation[];
  gapSummary: {
    missing: number;
    weak: number;
    total: number;
  };
  cached: boolean;
  message?: string;
}
