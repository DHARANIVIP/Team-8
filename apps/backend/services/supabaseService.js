import { createClient } from '@supabase/supabase-js';
import { getCareerDetails, getCareerSkills, discoverCoursesForSkill } from './onetGeminiService.js';


/**
 * Supabase Service
 * Dedicated abstract database queries handler
 * Handles all PostgreSQL database operations
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export function mongoIdToUuid(mongoId) {
  if (!mongoId) return mongoId;
  const strId = typeof mongoId === 'string' ? mongoId : mongoId.toString();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(strId)) return strId;
  
  if (strId.length === 24) {
    const part1 = strId.substring(0, 8);
    const part2 = strId.substring(8, 12);
    const part3 = strId.substring(12, 16);
    const part4 = strId.substring(16, 20);
    const part5 = strId.substring(20, 24) + '00000000';
    return `${part1}-${part2}-${part3}-${part4}-${part5}`;
  }
  return strId;
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
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(cleanProfile)
      .eq('user_id', cleanUserId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('⚠️ Error updating user profile, trying compatibility mode...', error.message);
    const compatProfile = {};
    if (cleanProfile.current_skills !== undefined) compatProfile.current_skills = cleanProfile.current_skills;
    if (cleanProfile.experience_level !== undefined) compatProfile.experience_level = cleanProfile.experience_level;
    
    const { data, error: compatError } = await supabase
      .from('user_profiles')
      .update(compatProfile)
      .eq('user_id', cleanUserId)
      .select()
      .single();
    if (compatError) throw compatError;
    return { ...compatProfile, ...cleanProfile, user_id: cleanUserId };
  }
}

export async function upsertUserRecommendations(userId, payload) {
  const cleanUserId = mongoIdToUuid(userId);
  
  // Format UUID arrays safely
  const careerPaths = (payload.suggested_career_paths || []).map(id => mongoIdToUuid(id));
  const recommendedSkills = (payload.recommended_skills || []).map(id => mongoIdToUuid(id));
  const recommendedCourses = (payload.recommended_courses || []).map(id => mongoIdToUuid(id));

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
  const { data } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', cleanUserId)
    .maybeSingle();
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
      .select('current_skills')
      .eq('user_id', cleanUserId)
      .maybeSingle();

    const userSkills = profile?.current_skills || [];

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

      return {
        ...c,
        matchScore,
        skills: careerSkills,
        matchedSkills: matched,
        gapSkills: gaps,
        suggestedCourses
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
    // Fallback: return mock career data so app doesn't break
    return {
      career: {
        name: careerName,
        description: 'Occupational path overview.',
        icon: '💼',
        salary_range: '₹8L – ₹22L',
        average_salary: 1200000,
        growth_rate: '20%',
        demand_level: 'High'
      },
      skills: [
        { name: 'Technical Skills', category: 'Technical', difficulty_level: 'Medium' },
        { name: 'Core Knowledge', category: 'Domain', difficulty_level: 'Medium' }
      ]
    };
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
