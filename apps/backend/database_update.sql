-- Production-ready career matching schema upgrades

-- 1. Create career_recommendations table
CREATE TABLE IF NOT EXISTS career_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
    match_percentage INT NOT NULL CHECK (match_percentage BETWEEN 0 AND 100),
    reason TEXT NOT NULL,
    recommended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_career_recommendation UNIQUE (student_id, career_id)
);

-- 2. Extend user_profiles table with additional profile metrics
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS year INT DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS strengths TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weaknesses TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS study_hours_per_week INT DEFAULT 10;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_learning VARCHAR(100) DEFAULT 'Video';

-- =========================================================================
-- MIGRATION: SKILL RECOMMENDATIONS (Workflow C)
-- Stores AI-ordered skill learning sequences per student+career
-- =========================================================================
CREATE TABLE IF NOT EXISTS skill_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    recommended_level VARCHAR(50) DEFAULT 'Beginner',
    reason TEXT,
    priority_order INT NOT NULL DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_career_skill_rec UNIQUE (student_id, career_id, skill_id)
);

-- =========================================================================
-- MIGRATION: RECOMMENDED COURSES (Workflow B)
-- Stores AI-recommended courses per student with skill gap context
-- =========================================================================
CREATE TABLE IF NOT EXISTS recommended_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    reason TEXT,
    skill_gap TEXT,
    priority_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_course_rec UNIQUE (student_id, course_id)
);

-- Onboarding columns used by routes/onboarding.js
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS graduation_year VARCHAR(10);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wants_certifications BOOLEAN DEFAULT FALSE;

-- Recommendation metadata used by services/supabaseService.js
ALTER TABLE user_recommendations ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';
