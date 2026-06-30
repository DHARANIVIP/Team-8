-- =========================================================================
-- MIGRATION: Resume Analysis Table
-- Stores structured Gemini AI output from resume parsing
-- =========================================================================

CREATE TABLE IF NOT EXISTS resume_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    extracted_skills TEXT[] DEFAULT '{}',
    extracted_certifications TEXT[] DEFAULT '{}',
    extracted_education VARCHAR(255),
    extracted_experience TEXT,
    career_scores JSONB DEFAULT '{}',
    growth_suggestions TEXT,
    raw_resume_text TEXT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_resume_analysis UNIQUE (student_id)
);
