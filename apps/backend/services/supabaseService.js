import { createClient } from '@supabase/supabase-js';
import { getCareerDetails, getCareerSkills, discoverCoursesForSkill } from './onetGeminiService.js';


/**
 * Supabase Service
 * Dedicated abstract database queries handler
 * Handles all PostgreSQL database operations
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export function mongoIdToUuid(mongoId) {
  if (!mongoId) return mongoId;
  const strId = typeof mongoId === 'string' ? mongoId : mongoId.toString();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(strId)) return strId;
  
  // Convert 24-char MongoDB ObjectId to UUID format
  if (strId.length === 24 && /^[0-9a-f]+$/i.test(strId)) {
    return `${strId.substring(0, 8)}-${strId.substring(8, 12)}-${strId.substring(12, 16)}-${strId.substring(16, 20)}-${strId.substring(20, 24).padEnd(12, '0')}`;
  }
  
  // Generate deterministic UUID from string hash for other formats
  let hash = 0;
  for (let i = 0; i < strId.length; i++) {
    hash = ((hash << 5) - hash) + strId.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex}-0000-0000-0000-000000000000`;
}

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

export async function getCareerByName(name) {
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .ilike('name', name)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findOrCreateCareerByName(name) {
  const existing = await getCareerByName(name);
  if (existing) return existing;
  const { career } = await syncCareerCache(name);
  return career;
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

export async function getSkillById(id) {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('id', id)
    .single();
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
  let skills1 = await getSkillsByCareer(careerID1);
  let skills2 = await getSkillsByCareer(careerID2);
  
  if (!skills1 || skills1.length === 0) {
    const career = await getCategoryById(careerID1);
    if (career) {
      console.log(`⚠️ Syncing skills for comparison career A: "${career.name}"`);
      const syncResult = await syncCareerCache(career.name);
      skills1 = syncResult.skills;
    }
  }

  if (!skills2 || skills2.length === 0) {
    const career = await getCategoryById(careerID2);
    if (career) {
      console.log(`⚠️ Syncing skills for comparison career B: "${career.name}"`);
      const syncResult = await syncCareerCache(career.name);
      skills2 = syncResult.skills;
    }
  }
  
  const skillNames1 = skills1.map(s => s.name);
  const skillNames2 = skills2.map(s => s.name);
  
  const commonSkills = skillNames1.filter(skill => skillNames2.includes(skill));
  const uniqueToCareer1 = skillNames1.filter(skill => !skillNames2.includes(skill));
  const uniqueToCareer2 = skillNames2.filter(skill => !skillNames1.includes(skill));
  
  const maxLength = Math.max(skillNames1.length, skillNames2.length);
  const overlapPercentage = maxLength > 0 ? (commonSkills.length / maxLength) * 100 : 0;
  
  return {
    commonSkills,
    uniqueToCareer1,
    uniqueToCareer2,
    overlapPercentage: Math.round(overlapPercentage),
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
  const cleanComparison = {
    ...comparison,
    user_id: mongoIdToUuid(comparison.user_id)
  };
  const { data, error } = await supabase
    .from('comparisons')
    .insert([cleanComparison])
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
  const cleanUserId = mongoIdToUuid(userId);
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', cleanUserId)
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
  const cleanProfile = {
    ...profile,
    user_id: mongoIdToUuid(profile.user_id)
  };
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([cleanProfile])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('⚠️ Error inserting user profile, trying compatibility mode...', error.message);
    const compatProfile = {
      user_id: cleanProfile.user_id,
      current_skills: cleanProfile.current_skills,
      experience_level: cleanProfile.experience_level
    };
    const { data, error: compatError } = await supabase
      .from('user_profiles')
      .insert([compatProfile])
      .select()
      .single();
    if (compatError) throw compatError;
    return { ...compatProfile, ...cleanProfile };
  }
}

export async function updateUserProfile(userId, profile) {
  const cleanUserId = mongoIdToUuid(userId);
  const cleanProfile = { ...profile };
  if (profile.user_id) cleanProfile.user_id = mongoIdToUuid(profile.user_id);
  cleanProfile.user_id = cleanUserId;

  // Whitelist of columns that actually exist in user_profiles
  const KNOWN_COLUMNS = [
    'user_id', 'current_skills', 'experience_level',
    'target_career', 'salary_goal', 'email_updates', 'market_alerts',
    'weekly_digest', 'compact_mode',
    'year', 'interests', 'strengths', 'weaknesses',
    'study_hours_per_week', 'preferred_learning',
    'education_background', 'major_stream', 'learning_style',
    'resume_url', 'resume_raw_text', 'resume_embeddings', 'onboarding_completed',
    'career_goal', 'years_experience', 'availability',
    'resume_filename', 'target_role', 'salary_expectation',
    // Columns added by migration 004 (may not exist yet)
    'institution_name', 'graduation_year', 'wants_certifications',
  ];

  // Filter profile to only include known columns
  const safeProfile = { user_id: cleanUserId };
  for (const [key, val] of Object.entries(cleanProfile)) {
    if (KNOWN_COLUMNS.includes(key) && key !== 'user_id') {
      safeProfile[key] = val;
    }
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(safeProfile, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('⚠️ Error upserting user profile, trying minimal save...', error.message);

    // Last resort: save only onboarding_completed flag
    if (cleanProfile.onboarding_completed === true) {
      try {
        const { data: minData, error: minError } = await supabase
          .from('user_profiles')
          .upsert({ user_id: cleanUserId, onboarding_completed: true }, { onConflict: 'user_id' })
          .select()
          .single();
        if (minError) {
          console.error('❌ Minimal onboarding upsert failed:', minError.message);
          throw minError;
        }
        return minData;
      } catch (minErr) {
        console.error('❌ Even minimal upsert failed:', minErr.message);
        throw minErr;
      }
    }
    throw error;
  }
}

export async function upsertUserRecommendations(userId, payload) {
  const cleanUserId = mongoIdToUuid(userId);
  
  // Format UUID arrays safely
  const careerPaths = (payload.suggested_career_paths || []).map(id => mongoIdToUuid(id));
  const recommendedSkills = (payload.recommended_skills || []).map(id => mongoIdToUuid(id));
  const recommendedCourses = (payload.recommended_courses || []).map(id => mongoIdToUuid(id));

  try {
    const { data, error } = await supabase
      .from('user_recommendations')
      .upsert({
        user_id: cleanUserId,
        matched_domains: payload.matched_domains || [],
        suggested_career_paths: careerPaths,
        recommended_skills: recommendedSkills,
        recommended_courses: recommendedCourses,
        certifications: payload.certifications || [],
        growth_suggestions: payload.growth_suggestions || ''
      }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('⚠️ upsertUserRecommendations failed:', error.message);
    // Retry without certifications column (may not exist in older schemas)
    try {
      const { data, error: retryErr } = await supabase
        .from('user_recommendations')
        .upsert({
          user_id: cleanUserId,
          matched_domains: payload.matched_domains || [],
          suggested_career_paths: careerPaths,
          recommended_skills: recommendedSkills,
          recommended_courses: recommendedCourses,
          growth_suggestions: payload.growth_suggestions || ''
        }, { onConflict: 'user_id' })
        .select()
        .single();
      if (retryErr) throw retryErr;
      return data;
    } catch (retryError) {
      console.error('⚠️ upsertUserRecommendations retry also failed:', retryError.message);
      throw retryError;
    }
  }
}

export async function getUserRecommendations(userId) {
  const cleanUserId = mongoIdToUuid(userId);
  const { data, error } = await supabase
    .from('user_recommendations')
    .select('*')
    .eq('user_id', cleanUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOnboardingStatus(userId) {
  const cleanUserId = mongoIdToUuid(userId);
  const { data, error } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', cleanUserId)
    .maybeSingle();
  if (error) {
    console.error('Error checking onboarding status:', error.message);
    throw error;
  }
  return !!(data?.onboarding_completed);
}

const getIndustryForCareerName = (careerName) => {
  const name = (careerName || '').toLowerCase();
  if (name.includes('software') || name.includes('cloud') || name.includes('architect') || name.includes('engineer')) {
    if (name.includes('data')) return 'Data & AI';
    return 'Technology';
  }
  if (name.includes('data') || name.includes('scientist') || name.includes('ai') || name.includes('analyst')) {
    if (name.includes('cyber') || name.includes('security')) return 'Security';
    return 'Data & AI';
  }
  if (name.includes('design') || name.includes('ux') || name.includes('ui') || name.includes('designer')) return 'Design';
  if (name.includes('product') || name.includes('manager') || name.includes('business')) return 'Business';
  return 'Technology';
};

export async function getPersonalizedCareerData(userId) {
  try {
    const cleanUserId = mongoIdToUuid(userId);
    
    // 1. Fetch all careers
    const { data: allCareers, error: careersError } = await supabase
      .from('careers')
      .select('*');
    if (careersError) throw careersError;

    // 2. Fetch user recommendations
    const { data: recommendations } = await supabase
      .from('user_recommendations')
      .select('*')
      .eq('user_id', cleanUserId)
      .maybeSingle();

    // 3. Fetch user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_skills, saved_careers')
      .eq('user_id', cleanUserId)
      .maybeSingle();

    const userSkills = profile?.current_skills || [];
    const savedCareers = profile?.saved_careers || [];

    // 4. Fetch skills and courses
    const { data: allSkills } = await supabase.from('skills').select('*');
    const { data: allCourses } = await supabase.from('courses').select('*');

    // Helper maps
    const skillsByCareer = {};
    if (allSkills) {
      allSkills.forEach(s => {
        if (!skillsByCareer[s.career_id]) {
          skillsByCareer[s.career_id] = [];
        }
        skillsByCareer[s.career_id].push(s);
      });
    }

    // 5. Enrich careers list
    const enrichedCareers = (allCareers || []).map(c => {
      const careerSkills = skillsByCareer[c.id] || [];
      const matched = [];
      const gaps = [];

      careerSkills.forEach(s => {
        const hasSkill = userSkills.some(us => us.toLowerCase() === s.name.toLowerCase());
        if (hasSkill) {
          matched.push(s.name);
        } else {
          gaps.push(s.name);
        }
      });

      const gapSkillIds = careerSkills
        .filter(s => gaps.includes(s.name))
        .map(s => s.id);

      const suggestedCourses = allCourses
        ? allCourses.filter(course => gapSkillIds.includes(course.skill_id)).slice(0, 3)
        : [];

      // Determine match score
      let matchScore = null;
      if (recommendations) {
        if (recommendations.career_match_scores && recommendations.career_match_scores[c.id] !== undefined) {
          matchScore = recommendations.career_match_scores[c.id];
        } else if (recommendations.matched_domains) {
          const industry = getIndustryForCareerName(c.name);
          const domainMatch = recommendations.matched_domains.find(d => d && d.name === industry);
          if (domainMatch) {
            matchScore = domainMatch.score;
          }
        }
        if (matchScore === null && recommendations.suggested_career_paths) {
          const isSuggested = recommendations.suggested_career_paths.includes(c.id);
          if (isSuggested) matchScore = 85;
        }
      }

      const isSaved = savedCareers.includes(c.id);
      const cachedInsights = recommendations?.personalized_insights?.[c.id] || null;

      return {
        ...c,
        matchScore,
        skills: careerSkills,
        matchedSkills: matched,
        gapSkills: gaps,
        suggestedCourses,
        isSaved,
        cachedInsights
      };
    });

    // Sort by match score descending, placing careers without match scores at the end
    return enrichedCareers.sort((a, b) => {
      const scoreA = a.matchScore !== null ? a.matchScore : -1;
      const scoreB = b.matchScore !== null ? b.matchScore : -1;
      return scoreB - scoreA;
    });
  } catch (error) {
    console.error('❌ Failed in getPersonalizedCareerData:', error.message);
    throw error;
  }
}

// ===== CACHING & DYNAMIC SYNC RESOLVERS =====

/**
 * Synchronize career details and skills dynamically from O*NET/Gemini into Postgres cache.
 */
export async function syncCareerCache(careerName) {
  try {
    // Check local database first
    const { data: cachedCareer, error: fetchError } = await supabase
      .from('careers')
      .select('*')
      .eq('name', careerName)
      .maybeSingle();

    const isStale = cachedCareer && (
      !cachedCareer.last_sync || 
      (new Date() - new Date(cachedCareer.last_sync)) > 24 * 60 * 60 * 1000
    );

    if (cachedCareer && !isStale) {
      // Get associated skills
      const { data: cachedSkills } = await supabase
        .from('skills')
        .select('*')
        .eq('career_id', cachedCareer.id);
      
      return { career: cachedCareer, skills: cachedSkills || [] };
    }

    console.log(`🔄 Cache miss or stale data for: "${careerName}". Syncing from O*NET/Gemini broker...`);
    const details = await getCareerDetails(careerName);
    const skillsList = await getCareerSkills(careerName);

    let careerRecord;

    if (!cachedCareer) {
      // Create new career
      const careerData = {
        name: careerName,
        description: details.description,
        icon: details.icon,
        salary_range: details.salary_range,
        average_salary: details.average_salary,
        growth_rate: details.growth_rate,
        demand_level: details.demand_level,
        top_companies: Array.isArray(details.top_companies) ? details.top_companies.join(', ') : details.top_companies,
        onet_code: details.onet_code,
        education_requirement: details.education_requirement,
        work_environment: details.work_environment,
        future_outlook: details.future_outlook,
        last_sync: new Date().toISOString()
      };

      const { data: newCareer, error: insertError } = await supabase
        .from('careers')
        .insert([careerData])
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting career, trying compatibility mode...', insertError.message);
        // Compatibility mode (strip columns that might not exist in database yet)
        const compatData = {
          name: careerName,
          description: details.description,
          icon: details.icon,
          salary_range: details.salary_range,
          average_salary: details.average_salary,
          growth_rate: details.growth_rate,
          demand_level: details.demand_level
        };
        const { data: compatCareer } = await supabase.from('careers').insert([compatData]).select().single();
        careerRecord = compatCareer;
      } else {
        careerRecord = newCareer;
      }
    } else {
      // Update stale career
      const updateData = {
        description: details.description,
        icon: details.icon,
        salary_range: details.salary_range,
        average_salary: details.average_salary,
        growth_rate: details.growth_rate,
        demand_level: details.demand_level,
        top_companies: Array.isArray(details.top_companies) ? details.top_companies.join(', ') : details.top_companies,
        onet_code: details.onet_code,
        education_requirement: details.education_requirement,
        work_environment: details.work_environment,
        future_outlook: details.future_outlook,
        last_sync: new Date().toISOString()
      };

      const { data: updatedCareer, error: updateError } = await supabase
        .from('careers')
        .update(updateData)
        .eq('id', cachedCareer.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating career, trying compatibility update...', updateError.message);
        const compatUpdate = {
          description: details.description,
          icon: details.icon,
          salary_range: details.salary_range,
          average_salary: details.average_salary,
          growth_rate: details.growth_rate,
          demand_level: details.demand_level
        };
        const { data: compatCareer } = await supabase.from('careers').update(compatUpdate).eq('id', cachedCareer.id).select().single();
        careerRecord = compatCareer;
      } else {
        careerRecord = updatedCareer;
      }
    }

    if (!careerRecord) {
      throw new Error(`Failed to establish career record for "${careerName}"`);
    }

    // Delete old skills and re-populate
    await supabase.from('skills').delete().eq('career_id', careerRecord.id);

    const insertedSkills = [];
    for (const skill of skillsList) {
      const { data: newSkill } = await supabase
        .from('skills')
        .insert([{
          career_id: careerRecord.id,
          name: skill.name,
          category: skill.category,
          difficulty_level: skill.level >= 75 ? 'Hard' : skill.level >= 50 ? 'Medium' : 'Easy',
          description: `${skill.category} requirement for ${careerRecord.name}`
        }])
        .select()
        .single();
      
      if (newSkill) insertedSkills.push(newSkill);
    }

    return { career: careerRecord, skills: insertedSkills };
  } catch (error) {
    console.error('Error in syncCareerCache:', error.message);
    return { career: null, skills: [] };
  }
}

/**
 * Dynamically discover and cache courses for a specific skill if none exist.
 */
export async function syncCoursesCache(skillId, skillName) {
  try {
    const { data: cachedCourses } = await supabase
      .from('courses')
      .select('*')
      .eq('skill_id', skillId);

    if (cachedCourses && cachedCourses.length > 0) {
      return cachedCourses;
    }

    console.log(`🔍 Course cache miss for skill "${skillName}". Searching real courses...`);
    const coursesList = await discoverCoursesForSkill(skillName);

    const insertedCourses = [];
    for (const course of coursesList) {
      const courseData = {
        skill_id: skillId,
        title: course.title,
        provider: course.provider,
        url: course.url,
        difficulty: course.difficulty,
        price: course.price,
        rating: course.rating,
        duration_weeks: course.duration_weeks,
        certificate_included: course.certificate_included !== false
      };

      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting course, trying compatibility insert...', insertError.message);
        // Compatibility mode (strip columns that might not exist in database yet)
        const compatData = {
          skill_id: skillId,
          title: course.title,
          provider: course.provider,
          url: course.url,
          difficulty: course.difficulty,
          price: course.price
        };
        const { data: compatCourse } = await supabase.from('courses').insert([compatData]).select().single();
        if (compatCourse) insertedCourses.push(compatCourse);
      } else {
        if (newCourse) insertedCourses.push(newCourse);
      }
    }

    return insertedCourses;
  } catch (error) {
    console.error('Error in syncCoursesCache:', error.message);
    return [];
  }
}

// ===== BOOKMARKS & PERSISTENT PERSONALIZED AI DEEP-DIVES =====

/**
 * Toggle saving/bookmarking a career path
 */
export async function toggleSavedCareer(userId, careerId) {
  const cleanUserId = mongoIdToUuid(userId);
  const cleanCareerId = mongoIdToUuid(careerId);

  const { data: profile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('saved_careers')
    .eq('user_id', cleanUserId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  let savedList = profile?.saved_careers || [];
  const index = savedList.indexOf(cleanCareerId);
  let saved = false;

  if (index === -1) {
    savedList = [...savedList, cleanCareerId];
    saved = true;
  } else {
    savedList = savedList.filter(id => id !== cleanCareerId);
    saved = false;
  }

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ saved_careers: savedList })
    .eq('user_id', cleanUserId);

  if (updateError) throw updateError;
  return { saved, saved_careers: savedList };
}

/**
 * Fetch all saved career UUIDs for a user
 */
export async function getSavedCareers(userId) {
  const cleanUserId = mongoIdToUuid(userId);
  const { data, error } = await supabase
    .from('user_profiles')
    .select('saved_careers')
    .eq('user_id', cleanUserId)
    .maybeSingle();

  if (error) throw error;
  return data?.saved_careers || [];
}

export async function saveCareerRecommendation(userId, careerId, matchPercentage, reason) {
  const cleanUserId = mongoIdToUuid(userId);
  const cleanCareerId = mongoIdToUuid(careerId);

  const { data, error } = await supabase
    .from('career_recommendations')
    .upsert({
      student_id: cleanUserId,
      career_id: cleanCareerId,
      match_percentage: matchPercentage,
      reason
    }, { onConflict: ['student_id', 'career_id'] })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCareerRecommendations(userId) {
  const cleanUserId = mongoIdToUuid(userId);
  const { error } = await supabase
    .from('career_recommendations')
    .delete()
    .eq('student_id', cleanUserId);

  if (error) throw error;
  return true;
}

export async function getCareerRecommendations(userId) {
  const cleanUserId = mongoIdToUuid(userId);
  const { data, error } = await supabase
    .from('career_recommendations')
    .select('*')
    .eq('student_id', cleanUserId)
    .order('match_percentage', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get cached dynamic career deep-dive insights for a user
 */
export async function getCachedInsights(userId) {
  const cleanUserId = mongoIdToUuid(userId);
  const { data, error } = await supabase
    .from('user_recommendations')
    .select('personalized_insights')
    .eq('user_id', cleanUserId)
    .maybeSingle();

  if (error) throw error;
  return data?.personalized_insights || {};
}

/**
 * Save deep-dive AI insights for a specific career in the user recommendations table JSONB
 */
export async function saveInsightsCache(userId, careerId, insights) {
  const cleanUserId = mongoIdToUuid(userId);
  const cleanCareerId = mongoIdToUuid(careerId);

  const { data: rec, error: fetchError } = await supabase
    .from('user_recommendations')
    .select('personalized_insights')
    .eq('user_id', cleanUserId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const insightsObj = rec?.personalized_insights || {};
  insightsObj[cleanCareerId] = insights;

  const { error: updateError } = await supabase
    .from('user_recommendations')
    .update({ personalized_insights: insightsObj })
    .eq('user_id', cleanUserId);

  if (updateError) throw updateError;
  return insightsObj;
}

/**
 * Main Orchestrator for Career Deep-Dive: retrieves cached details or queries Llama 3
 */
export async function getCareerDeepDiveInsights(userId, careerId, careerName) {
  const cleanUserId = mongoIdToUuid(userId);
  const cleanCareerId = mongoIdToUuid(careerId);

  // 1. Check cache first
  const cachedMap = await getCachedInsights(userId);
  if (cachedMap && cachedMap[cleanCareerId]) {
    return { insights: cachedMap[cleanCareerId], cached: true };
  }

  // 2. Query raw resume text from profile
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('resume_raw_text')
    .eq('user_id', cleanUserId)
    .maybeSingle();

  if (error) throw error;

  const resumeText = profile?.resume_raw_text || '';
  if (!resumeText.trim()) {
    throw new Error('Resume raw text not found. Please complete the onboarding resume upload first.');
  }

  // 3. Generate dynamic insights on-the-fly using Llama-3-8B
  const { generateCareerDeepDiveInsights } = await import('./huggingfaceService.js');
  const insights = await generateCareerDeepDiveInsights(resumeText, careerName);

  // 4. Save to cache
  await saveInsightsCache(userId, cleanCareerId, insights);

  return { insights, cached: false };
}

// ===== GRANULAR USER SKILLS PROGRESSION =====

/**
 * Fetch granular skills profile for a user, enriched with catalog categories
 */
export async function getUserSkills(userId) {
  const cleanUserId = mongoIdToUuid(userId);
  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', cleanUserId);

  let skills = [];
  if (error) {
    if (!error.message?.includes('schema cache')) {
      console.warn('⚠️ Error fetching user_skills, returning fallback from user_profiles:', error.message);
    }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_skills')
      .eq('user_id', cleanUserId)
      .maybeSingle();

    const currentSkills = profile?.current_skills || [];
    skills = currentSkills.map((name, idx) => ({
      id: idx.toString(),
      user_id: cleanUserId,
      skill_name: name,
      proficiency: 'Intermediate',
      progress_percentage: 60,
      source: 'profile'
    }));
  } else {
    skills = data || [];
  }

  return enrichUserSkillsWithCatalog(skills);
}

/**
 * Match user skill rows to catalog entries for category metadata
 */
async function enrichUserSkillsWithCatalog(userSkills) {
  if (!userSkills || userSkills.length === 0) return [];

  const { data: catalog } = await supabase.from('skills').select('name, category');
  const categoryByName = new Map(
    (catalog || []).map(s => [s.name.toLowerCase(), s.category || 'General'])
  );

  return userSkills.map(skill => ({
    ...skill,
    category: skill.category || categoryByName.get(skill.skill_name?.toLowerCase()) || 'General'
  }));
}

/**
 * Delete a user skill entry
 */
export async function deleteUserSkill(userId, skillName) {
  const cleanUserId = mongoIdToUuid(userId);
  const { error } = await supabase
    .from('user_skills')
    .delete()
    .eq('user_id', cleanUserId)
    .ilike('skill_name', skillName);

  if (error) throw error;

  // Keep user_profiles.current_skills in sync
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('current_skills')
    .eq('user_id', cleanUserId)
    .maybeSingle();

  if (profile?.current_skills?.length) {
    const updated = profile.current_skills.filter(
      s => s.toLowerCase() !== skillName.toLowerCase()
    );
    await supabase
      .from('user_profiles')
      .update({ current_skills: updated })
      .eq('user_id', cleanUserId);
  }

  return { deleted: true, skillName };
}

function computeImportance(difficultyLevel) {
  if (difficultyLevel === 'Hard') return 90;
  if (difficultyLevel === 'Easy') return 50;
  return 70;
}

function computeReadiness(processedSkills) {
  if (!processedSkills.length) return 0;
  const totalWeight = processedSkills.reduce((sum, s) => sum + s.importance, 0);
  const acquiredWeight = processedSkills.reduce((sum, s) => {
    if (!s.acquired) return sum;
    return sum + s.importance * (Math.min(100, s.progress_percentage || 0) / 100);
  }, 0);
  return totalWeight > 0 ? Math.round((acquiredWeight / totalWeight) * 100) : 0;
}

async function resolveCareerSkills(career, careerId) {
  let { data: careerSkills } = await supabase
    .from('skills')
    .select('*')
    .eq('career_id', mongoIdToUuid(careerId));

  if ((!careerSkills || careerSkills.length === 0) && career?.name) {
    const syncResult = await syncCareerCache(career.name);
    careerSkills = syncResult.skills || [];
    if (careerSkills.length === 0 && syncResult.career?.id) {
      careerSkills = await getSkillsByCareer(syncResult.career.id);
    }
  }

  return careerSkills || [];
}

async function processGapSkills(careerSkills, userSkills) {
  const processed = await Promise.all(
    careerSkills.map(async (s) => {
      const matchedSkill = userSkills.find(
        us => us.skill_name.toLowerCase() === s.name.toLowerCase()
      );
      const hasSkill = !!matchedSkill;
      const importance = computeImportance(s.difficulty_level);
      const progress = hasSkill ? (matchedSkill.progress_percentage || 0) : 0;
      const priorityScore = hasSkill
        ? 0
        : Math.round(importance * (1 - progress / 100));

      let recommendedCourses = [];
      if (!hasSkill && s.id) {
        try {
          recommendedCourses = await getCoursesBySkill(s.id);
        } catch (courseErr) {
          console.warn(`⚠️ Could not fetch courses for skill "${s.name}":`, courseErr.message);
        }
      }

      return {
        id: s.id,
        name: s.name,
        category: s.category || 'General',
        description: s.description || '',
        difficulty_level: s.difficulty_level || 'Medium',
        importance,
        priorityScore,
        acquired: hasSkill,
        proficiency: hasSkill ? matchedSkill.proficiency : 'None',
        progress_percentage: progress,
        recommendedCourses: (recommendedCourses || []).slice(0, 3).map(c => ({
          id: c.id,
          title: c.title,
          provider: c.provider,
          url: c.url,
          difficulty: c.difficulty,
          price: c.price
        }))
      };
    })
  );

  processed.sort((a, b) => b.priorityScore - a.priorityScore);
  return processed;
}

/**
 * Insert or update a granular user skill proficiency level
 */
export async function updateUserSkillProgress(userId, skillName, proficiency, progressPercentage, source = 'user') {
  const cleanUserId = mongoIdToUuid(userId);
  const { data, error } = await supabase
    .from('user_skills')
    .upsert({
      user_id: cleanUserId,
      skill_name: skillName,
      proficiency: proficiency || 'Intermediate',
      progress_percentage: progressPercentage !== undefined ? parseInt(progressPercentage) : 50,
      source: source,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,skill_name' })
    .select()
    .single();

  if (error) {
    if (!error.message?.includes('schema cache')) {
      console.error('❌ Error updating user skill progress:', error.message);
    }
    // Fallback: Add to user_profiles current_skills if upsert fails (table not active yet)
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_skills')
        .eq('user_id', cleanUserId)
        .maybeSingle();

      let skills = profile?.current_skills || [];
      if (!skills.some(s => s.toLowerCase() === skillName.toLowerCase())) {
        skills = [...skills, skillName];
        await supabase.from('user_profiles').update({ current_skills: skills }).eq('user_id', cleanUserId);
      }
    } catch (e) {
      console.warn('Failed to update current_skills fallback:', e.message);
    }
    return {
      user_id: cleanUserId,
      skill_name: skillName,
      proficiency: proficiency || 'Intermediate',
      progress_percentage: progressPercentage || 50,
      source
    };
  }
  return data;
}

/**
 * Compare user profile skills against career-required skills to map gaps and importance levels
 */
export async function getSkillGapAnalysis(userId, careerId) {
  const cleanUserId = mongoIdToUuid(userId);
  const cleanCareerId = mongoIdToUuid(careerId);

  const { data: career } = await supabase
    .from('careers')
    .select('*')
    .eq('id', cleanCareerId)
    .maybeSingle();

  if (!career) {
    return {
      careerId: cleanCareerId,
      careerName: 'Unknown Career',
      readiness: 0,
      skills: [],
      message: 'Career not found.'
    };
  }

  const careerSkills = await resolveCareerSkills(career, cleanCareerId);
  const userSkills = await getUserSkills(userId);

  if (careerSkills.length === 0) {
    return {
      careerId: cleanCareerId,
      careerName: career.name,
      readiness: 0,
      skills: [],
      message: 'No skills are registered for this career path yet.'
    };
  }

  const processed = await processGapSkills(careerSkills, userSkills);
  const readiness = computeReadiness(processed);

  return {
    careerId: cleanCareerId,
    careerName: career.name,
    readiness,
    skills: processed
  };
}

/**
 * Aggregated skills overview for dashboard KPIs
 */
export async function getSkillsOverview(userId, targetCareerId = null) {
  const cleanUserId = mongoIdToUuid(userId);
  const userSkills = await getUserSkills(userId);

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('target_career')
    .eq('user_id', cleanUserId)
    .maybeSingle();

  if (profileError && !profileError.message?.includes('schema cache')) {
    console.warn('⚠️ Profile fetch in getSkillsOverview:', profileError.message);
  }

  let targetReadiness = 0;
  let priorityGapCount = 0;
  let targetCareerName = profile?.target_career || null;

  try {
    if (targetCareerId) {
      const gap = await getSkillGapAnalysis(userId, targetCareerId);
      targetReadiness = gap.readiness ?? 0;
      priorityGapCount = (gap.skills || []).filter(s => !s.acquired).length;
      targetCareerName = gap.careerName || targetCareerName;
    } else if (profile?.target_career) {
      const { data: targetCareer } = await supabase
        .from('careers')
        .select('id, name')
        .ilike('name', profile.target_career)
        .maybeSingle();

      if (targetCareer) {
        const gap = await getSkillGapAnalysis(userId, targetCareer.id);
        targetReadiness = gap.readiness ?? 0;
        priorityGapCount = (gap.skills || []).filter(s => !s.acquired).length;
        targetCareerName = gap.careerName || targetCareerName;
      }
    }
  } catch (gapErr) {
    console.warn('⚠️ Gap analysis in getSkillsOverview failed:', gapErr.message);
  }

  const expertCount = userSkills.filter(s => s.proficiency === 'Expert').length;
  const intermediateCount = userSkills.filter(s => s.proficiency === 'Intermediate').length;
  const beginnerCount = userSkills.filter(s => s.proficiency === 'Beginner').length;

  const domainMap = new Map();
  for (const skill of userSkills) {
    const cat = skill.category || 'General';
    const score = skill.progress_percentage || 0;
    if (!domainMap.has(cat)) {
      domainMap.set(cat, { total: 0, count: 0 });
    }
    const entry = domainMap.get(cat);
    entry.total += score;
    entry.count += 1;
  }

  const domainScores = Array.from(domainMap.entries()).map(([name, { total, count }]) => ({
    name,
    score: Math.round(total / count)
  }));

  const lastAnalyzed = userSkills.reduce((latest, s) => {
    if (!s.updated_at) return latest;
    const ts = new Date(s.updated_at).getTime();
    return ts > latest ? ts : latest;
  }, 0);

  return {
    totalSkills: userSkills.length,
    expertCount,
    intermediateCount,
    beginnerCount,
    targetReadiness,
    priorityGapCount,
    targetCareerName,
    domainScores,
    lastAnalyzedAt: lastAnalyzed ? new Date(lastAnalyzed).toISOString() : null
  };
}

/**
 * Readiness scores across all careers in the catalog
 */
export async function getCareerReadinessScores(userId) {
  const careers = await getAllCategories();
  const results = [];

  for (const career of careers) {
    const gap = await getSkillGapAnalysis(userId, career.id);
    results.push({
      careerId: career.id,
      careerName: career.name,
      readiness: gap.readiness,
      totalRequired: gap.skills.length,
      acquiredCount: gap.skills.filter(s => s.acquired).length,
      topGaps: gap.skills.filter(s => !s.acquired).slice(0, 3).map(s => s.name)
    });
  }

  results.sort((a, b) => b.readiness - a.readiness);
  return results;
}

/**
 * Data-driven skills advisor from profile, gaps, and onboarding recommendations
 */
export async function getSkillsAdvisor(userId, targetCareerId = null) {
  const cleanUserId = mongoIdToUuid(userId);
  const userSkills = await getUserSkills(userId);
  const profile = await getUserProfile(userId);
  const recommendations = await getUserRecommendations(userId);

  let gap = { skills: [], readiness: 0, careerName: profile?.target_career || 'your target career' };
  if (targetCareerId) {
    gap = await getSkillGapAnalysis(userId, targetCareerId);
  } else if (profile?.target_career) {
    const { data: targetCareer } = await supabase
      .from('careers')
      .select('id')
      .ilike('name', profile.target_career)
      .maybeSingle();
    if (targetCareer) {
      gap = await getSkillGapAnalysis(userId, targetCareer.id);
    }
  }

  const strengths = userSkills
    .filter(s => s.proficiency === 'Expert' || (s.progress_percentage || 0) >= 75)
    .sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0))
    .slice(0, 5)
    .map(s => s.skill_name);

  const criticalGaps = gap.skills
    .filter(s => !s.acquired)
    .slice(0, 5)
    .map(s => s.name);

  const nextActions = gap.skills
    .filter(s => !s.acquired)
    .slice(0, 3)
    .map(s => {
      const topCourse = s.recommendedCourses?.[0];
      return {
        action: topCourse
          ? `Take "${topCourse.title}" on ${topCourse.provider || 'online platform'}`
          : `Build proficiency in ${s.name}`,
        skill: s.name,
        urgency: s.priorityScore >= 80 ? 'high' : s.priorityScore >= 60 ? 'medium' : 'low',
        courseId: topCourse?.id || null,
        courseUrl: topCourse?.url || null
      };
    });

  const growthText = recommendations?.growth_suggestions?.trim() || '';
  const summary = growthText
    ? growthText
    : userSkills.length === 0
      ? 'Complete onboarding or run AI resume analysis to populate your skills profile.'
      : `You are ${gap.readiness}% ready for ${gap.careerName}. You have ${userSkills.length} tracked skills with ${strengths.length} core strengths and ${criticalGaps.length} priority gaps to address.`;

  const weeklyFocus = criticalGaps.length >= 2
    ? `Focus on closing ${criticalGaps.slice(0, 2).join(' and ')} before exploring secondary skills.`
    : criticalGaps.length === 1
      ? `Your top priority is building ${criticalGaps[0]}.`
      : gap.readiness >= 80
        ? 'Strong alignment — consider advancing expert-level skills or exploring adjacent careers.'
        : 'Keep updating your skill progress as you complete courses and projects.';

  return {
    summary,
    strengths,
    criticalGaps,
    nextActions,
    weeklyFocus,
    readiness: gap.readiness,
    careerName: gap.careerName,
    cached: !!growthText
  };
}

/**
 * Search skills catalog for autocomplete
 */
export async function suggestSkills(query) {
  const allSkills = await getAllSkills();
  const q = (query || '').trim().toLowerCase();
  if (!q) return allSkills.slice(0, 20);

  const seen = new Set();
  const matches = [];
  for (const skill of allSkills) {
    const key = skill.name.toLowerCase();
    if (seen.has(key)) continue;
    if (key.includes(q)) {
      seen.add(key);
      matches.push({ id: skill.id, name: skill.name, category: skill.category || 'General' });
    }
    if (matches.length >= 15) break;
  }
  return matches;
}

// =========================================================================
// SKILL RECOMMENDATIONS (Workflow C)
// =========================================================================

/**
 * Save ordered skill recommendations for a student+career
 * @param {string} studentId - UUID from user_profiles
 * @param {string} careerId - UUID from careers
 * @param {Array} recommendations - [{skill_id, recommended_level, reason, priority_order}]
 */
export async function saveSkillRecommendations(studentId, careerId, recommendations) {
  if (!studentId || !careerId || !Array.isArray(recommendations)) {
    throw new Error('studentId, careerId, and recommendations array are required');
  }

  const cleanStudentId = mongoIdToUuid(studentId);
  const cleanCareerId = mongoIdToUuid(careerId);

  // Delete existing recommendations for this student+career pair
  await supabase.from('skill_recommendations')
    .delete()
    .eq('student_id', cleanStudentId)
    .eq('career_id', cleanCareerId);

  // Insert new recommendations
  const rows = recommendations.map(r => ({
    student_id: cleanStudentId,
    career_id: cleanCareerId,
    skill_id: r.skill_id,
    recommended_level: r.recommended_level || 'Beginner',
    reason: r.reason || '',
    priority_order: r.priority_order || 1,
    status: 'pending'
  }));

  const { data, error } = await supabase.from('skill_recommendations')
    .insert(rows)
    .select();

  if (error) {
    console.error('Error saving skill recommendations:', error.message);
    throw error;
  }
  return data;
}

/**
 * Get skill recommendations for a student+career, ordered by priority
 * Returns enriched data with skill name/category from the skills table
 */
export async function getSkillRecommendations(studentId, careerId) {
  let query = supabase.from('skill_recommendations')
    .select('*')
    .order('priority_order', { ascending: true });

  if (studentId) query = query.eq('student_id', mongoIdToUuid(studentId));
  if (careerId) query = query.eq('career_id', mongoIdToUuid(careerId));

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching skill recommendations:', error.message);
    return [];
  }

  const rows = data || [];
  if (rows.length === 0) return [];

  // Enrich each row with skill details from the skills table
  const skillIds = rows.map(r => r.skill_id).filter(Boolean);
  let skillsMap = {};
  if (skillIds.length > 0) {
    const { data: skillsData } = await supabase
      .from('skills')
      .select('id, name, category, difficulty_level')
      .in('id', skillIds);
    if (skillsData) {
      skillsMap = Object.fromEntries(skillsData.map(s => [s.id, s]));
    }
  }

  return rows.map(r => {
    const skill = skillsMap[r.skill_id] || {};
    return {
      ...r,
      skill_name: skill.name || 'Unknown Skill',
      skill_category: skill.category || 'General',
      skill_difficulty: skill.difficulty_level || 'Medium',
    };
  });
}

/**
 * Update skill recommendation status (pending, in_progress, completed)
 * Returns enriched row with skill details
 */
export async function updateSkillRecommendationStatus(recId, status) {
  const { data, error } = await supabase.from('skill_recommendations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', recId)
    .select()
    .single();

  if (error) {
    console.error('Error updating skill recommendation status:', error.message);
    throw error;
  }
  if (!data) return null;

  // Enrich with skill name
  if (data.skill_id) {
    const { data: skill } = await supabase
      .from('skills')
      .select('name, category')
      .eq('id', data.skill_id)
      .maybeSingle();
    if (skill) {
      data.skill_name = skill.name;
      data.skill_category = skill.category;
    }
  }
  return data;
}

// =========================================================================
// RESUME ANALYSIS
// =========================================================================

/**
 * Save structured resume analysis from Gemini AI
 */
export async function saveResumeAnalysis(studentId, analysis) {
  const cleanStudentId = mongoIdToUuid(studentId);
  try {
    const { data, error } = await supabase
      .from('resume_analysis')
      .upsert({
        student_id: cleanStudentId,
        extracted_skills: analysis.skills || [],
        extracted_certifications: analysis.certifications || [],
        extracted_education: analysis.education || '',
        extracted_experience: analysis.experience || '',
        career_scores: analysis.careerScores || {},
        growth_suggestions: analysis.growth_suggestions || '',
        raw_resume_text: analysis.raw_resume_text || ''
      }, { onConflict: 'student_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    // Table may not exist yet — log but don't crash onboarding
    console.warn('⚠️ saveResumeAnalysis skipped (table may not exist):', error.message);
    return null;
  }
}

/**
 * Get saved resume analysis for a student
 */
export async function getResumeAnalysis(studentId) {
  const cleanStudentId = mongoIdToUuid(studentId);
  const { data, error } = await supabase
    .from('resume_analysis')
    .select('*')
    .eq('student_id', cleanStudentId)
    .maybeSingle();
  if (error) {
    console.error('Error fetching resume analysis:', error.message);
    return null;
  }
  return data;
}

// =========================================================================
// SHARED SKILL GAP COMPUTATION (used by both Courses + Skills modules)
// =========================================================================

/**
 * Deterministic skill gap analysis: compares user skills vs career-required skills.
 * Single source of truth — called by both Courses and Skills routes.
 * Returns { career, careerSkills, userSkills, missingSkills, weakSkills, skillsToLearn }
 */
export async function computeSkillGap(userId, careerId) {
  const cleanUserId = mongoIdToUuid(userId);
  const cleanCareerId = mongoIdToUuid(careerId);

  // 1. Fetch career
  const { data: career } = await supabase
    .from('careers')
    .select('*')
    .eq('id', cleanCareerId)
    .maybeSingle();

  if (!career) {
    return { career: null, careerSkills: [], userSkills: [], missingSkills: [], weakSkills: [], skillsToLearn: [] };
  }

  // 2. Fetch career-required skills
  let careerSkills = [];
  const { data: rawCareerSkills } = await supabase
    .from('skills')
    .select('*')
    .eq('career_id', cleanCareerId);
  careerSkills = rawCareerSkills || [];

  // If no skills found, try syncing from O*NET
  if (careerSkills.length === 0 && career.name) {
    const syncResult = await syncCareerCache(career.name);
    careerSkills = syncResult.skills || [];
    if (careerSkills.length === 0) {
      const { data: retrySkills } = await supabase
        .from('skills')
        .select('*')
        .eq('career_id', career.id);
      careerSkills = retrySkills || [];
    }
  }

  // 3. Fetch user skills
  const userSkills = await getUserSkills(userId);
  const knownSkillNames = new Set((userSkills || []).map(s => s.skill_name?.toLowerCase()));

  // 4. Deterministic gap: missing + weak
  const missingSkills = careerSkills.filter(s =>
    !knownSkillNames.has(s.name?.toLowerCase())
  );
  const weakSkills = careerSkills.filter(s => {
    const userSkill = (userSkills || []).find(us => us.skill_name?.toLowerCase() === s.name?.toLowerCase());
    return userSkill && userSkill.proficiency === 'Beginner';
  });
  const skillsToLearn = [...missingSkills, ...weakSkills];

  return {
    career,
    careerSkills,
    userSkills,
    missingSkills,
    weakSkills,
    skillsToLearn
  };
}

// =========================================================================
// RECOMMENDED COURSES (Workflow B)
// =========================================================================

/**
 * Save recommended courses for a student
 * @param {string} studentId - UUID from user_profiles
 * @param {Array} courses - [{course_id, skill_id, reason, skill_gap, priority_order}]
 */
export async function saveRecommendedCourses(studentId, courses) {
  if (!studentId || !Array.isArray(courses)) {
    throw new Error('studentId and courses array are required');
  }

  const cleanStudentId = mongoIdToUuid(studentId);

  // Delete existing recommended courses for this student
  await supabase.from('recommended_courses')
    .delete()
    .eq('student_id', cleanStudentId);

  // Insert new recommendations
  const rows = courses.map(c => ({
    student_id: cleanStudentId,
    course_id: c.course_id,
    skill_id: c.skill_id || null,
    reason: c.reason || '',
    skill_gap: c.skill_gap || '',
    priority_order: c.priority_order || 1
  }));

  const { data, error } = await supabase.from('recommended_courses')
    .insert(rows)
    .select();

  if (error) {
    console.error('Error saving recommended courses:', error.message);
    throw error;
  }
  return data;
}

/**
 * Get recommended courses for a student, enriched with course details
 */
export async function getRecommendedCoursesForStudent(studentId) {
  const cleanStudentId = mongoIdToUuid(studentId);
  const { data, error } = await supabase.from('recommended_courses')
    .select(`
      *,
      courses:course_id (id, title, description, provider, platform, url, difficulty, price, rating, duration_weeks, category, language, instructor, thumbnail_url, tags, prerequisites, learning_outcomes),
      skills:skill_id (id, name, category)
    `)
    .eq('student_id', cleanStudentId)
    .order('priority_order', { ascending: true });

  if (error) {
    console.error('Error fetching recommended courses:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Fetch summary of a learning roadmap for a specific career path from the DB
 */
export async function getRoadmapSummaryForCareer(careerName) {
  try {
    const { data: roadmap, error: rErr } = await supabase
      .from('roadmaps')
      .select('*')
      .ilike('name', careerName)
      .maybeSingle();

    if (rErr || !roadmap) return null;

    const { count, error: cErr } = await supabase
      .from('roadmap_nodes')
      .select('id', { count: 'exact', head: true })
      .eq('roadmap_id', roadmap.id);

    return {
      duration: roadmap.estimated_duration || '6 Months',
      level: roadmap.difficulty_level || 'Intermediate',
      milestonesCount: count || 0
    };
  } catch (error) {
    console.warn(`⚠️ Failed to retrieve roadmap summary for ${careerName}:`, error.message);
    return null;
  }
}

