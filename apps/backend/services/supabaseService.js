import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Service
 * Dedicated abstract database queries handler
 * Handles all PostgreSQL database operations
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ===== CATEGORIES =====

export async function getAllCategories() {
  const { data, error } = await supabase.from('careers').select('*');
  if (error) throw error;
  return data;
}

export async function getCategoryById(id) {
  const { data, error } = await supabase.from('careers').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createCategory(category) {
  const { data, error } = await supabase
    .from('careers')
    .insert([category])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===== SKILLS =====

export async function getAllSkills() {
  const { data, error } = await supabase.from('skills').select('*');
  if (error) throw error;
  return data;
}

export async function getSkillsByCareer(careerId) {
  // Assuming a many-to-many relationship or direct reference
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('career_id', careerId);
  if (error) throw error;
  return data;
}

export async function createSkill(skill) {
  const { data, error } = await supabase
    .from('skills')
    .insert([skill])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function calculateSkillMatrix(careerID1, careerID2) {
  const skills1 = await getSkillsByCareer(careerID1);
  const skills2 = await getSkillsByCareer(careerID2);
  
  const skillNames1 = skills1.map(s => s.name);
  const skillNames2 = skills2.map(s => s.name);
  
  const commonSkills = skillNames1.filter(skill => skillNames2.includes(skill));
  const uniqueToCareer1 = skillNames1.filter(skill => !skillNames2.includes(skill));
  const uniqueToCareer2 = skillNames2.filter(skill => !skillNames1.includes(skill));
  
  return {
    commonSkills,
    uniqueToCareer1,
    uniqueToCareer2,
    overlapPercentage: (commonSkills.length / Math.max(skillNames1.length, skillNames2.length)) * 100,
  };
}

// ===== COURSES =====

export async function getAllCourses() {
  const { data, error } = await supabase.from('courses').select('*');
  if (error) throw error;
  return data;
}

export async function getCoursesBySkill(skillId) {
  const { data, error } = await supabase.from('courses').select('*').eq('skill_id', skillId);
  if (error) throw error;
  return data;
}

export async function createCourse(course) {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getRecommendedCourses(skillIds) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .in('skill_id', skillIds);
  if (error) throw error;
  return data;
}

// ===== COMPARISONS =====

export async function getComparison(id) {
  const { data, error } = await supabase
    .from('comparisons')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createComparison(comparison) {
  const { data, error } = await supabase
    .from('comparisons')
    .insert([comparison])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function calculateComparisonMetrics(careerID1, careerID2) {
  const career1 = await getCategoryById(careerID1);
  const career2 = await getCategoryById(careerID2);
  
  if (!career1 || !career2) throw new Error('Career not found');
  
  const skillMatrix = await calculateSkillMatrix(careerID1, careerID2);
  
  return {
    career1: career1.name,
    career2: career2.name,
    salaryComparison: {
      career1: career1.salary_range,
      career2: career2.salary_range,
    },
    skillOverlap: skillMatrix.overlapPercentage,
    commonSkills: skillMatrix.commonSkills,
    uniqueSkillsCareer1: skillMatrix.uniqueToCareer1,
    uniqueSkillsCareer2: skillMatrix.uniqueToCareer2,
  };
}

// ===== USER PROFILES =====

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') {
      // Return null when no rows are found, so route can create a default profile
      return null;
    }
    throw error;
  }
  return data;
}

export async function createUserProfile(profile) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([profile])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId, profile) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(profile)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
