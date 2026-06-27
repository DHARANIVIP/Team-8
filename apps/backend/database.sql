-- =========================================================================
-- MASTERMIND CAREER GUIDANCE SYSTEM - POSTGRESQL DATABASE SCHEMA
-- Compatible with PostgreSQL 12+ and pgAdmin 4/5
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist to allow clean re-runs
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS comparisons CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS careers CASCADE;

-- 1. Careers Table (Core Career Paths / Categories)
CREATE TABLE careers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    salary_range VARCHAR(100),
    average_salary INT DEFAULT 0,
    growth_rate VARCHAR(50),
    demand_level VARCHAR(50),
    top_companies TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Skills Table (Associated with Careers)
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    career_id UUID REFERENCES careers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    difficulty_level VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Courses Table (Associated with Skills)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    provider VARCHAR(255),
    url TEXT,
    difficulty VARCHAR(50),
    price VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Comparisons Table (Saves User Side-by-Side Comparisons)
CREATE TABLE comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    career_id_1 UUID REFERENCES careers(id) ON DELETE CASCADE,
    career_id_2 UUID REFERENCES careers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. User Profiles Table (User Custom Profile & Interests)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    current_skills TEXT[] DEFAULT '{}',
    experience_level VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SEED DATA SETUP
-- =========================================================================

-- Insert Careers
INSERT INTO careers (id, name, description, icon, salary_range, average_salary, growth_rate, demand_level, top_companies) VALUES
('b3a985d8-c923-42bf-be0d-6e828d11634b', 'Software Engineer', 'Develop and maintain software applications and websites.', '💻', '₹8L – ₹25L', 1600000, '28%', 'High', 'Google, Microsoft, TCS, Infosys'),
('d5084920-5c69-42b7-bdc1-4874e0d9b4bf', 'Data Scientist', 'Analyze complex data and build Machine Learning models.', '📊', '₹10L – ₹30L', 2000000, '36%', 'High', 'Meta, Amazon, IBM, Accenture'),
('a1288c80-60b6-4b8c-85a2-3f8c8d8b1bfb', 'UX Designer', 'Create intuitive and user-friendly digital designs.', '🎨', '₹6L – ₹18L', 1200000, '22%', 'Medium', 'Adobe, Flipkart, Zomato, Figma');

-- Insert Skills (Linked to Careers)
-- Software Engineering Skills
INSERT INTO skills (id, career_id, name, category, description, difficulty_level) VALUES
('c7078e8e-d9c1-4b13-911e-0899f8d1634b', 'b3a985d8-c923-42bf-be0d-6e828d11634b', 'JavaScript', 'Languages', 'Core scripting language for web browsers and Node.js.', 'Medium'),
('a9386d4d-cc8b-4a5f-be03-7cf8e02ab3bf', 'b3a985d8-c923-42bf-be0d-6e828d11634b', 'React', 'Frontend Frameworks', 'Declarative UI library developed by Meta.', 'Medium'),
('b0849d92-23c7-493d-bd88-6927e0293dbf', 'b3a985d8-c923-42bf-be0d-6e828d11634b', 'Node.js', 'Backend Runtimes', 'Server-side JavaScript environment.', 'Medium');

-- Data Science Skills
INSERT INTO skills (id, career_id, name, category, description, difficulty_level) VALUES
('d1193d20-80c1-4f80-bdc2-7cb8e293dbef', 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf', 'Python', 'Languages', 'General-purpose scientific programming language.', 'Easy'),
('e3984d93-3d02-402f-bc22-8dcb9283dbdf', 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf', 'Machine Learning', 'AI & Core Data', 'Algorithms for predicting trends and patterns.', 'Hard');

-- Insert Courses (Linked to Skills)
-- Courses for JavaScript
INSERT INTO courses (title, provider, url, difficulty, price, skill_id) VALUES
('JavaScript: The Advanced Concepts', 'Udemy', 'https://www.udemy.com/course/advanced-javascript-concepts/', 'Advanced', '₹455', 'c7078e8e-d9c1-4b13-911e-0899f8d1634b'),
('Introduction to Javascript', 'Coursera', 'https://www.coursera.org/learn/javascript', 'Beginner', 'Free', 'c7078e8e-d9c1-4b13-911e-0899f8d1634b');

-- Courses for Python
INSERT INTO courses (title, provider, url, difficulty, price, skill_id) VALUES
('Python for Everybody Specialization', 'Coursera', 'https://www.coursera.org/specializations/python-for-everybody', 'Beginner', 'Free', 'd1193d20-80c1-4f80-bdc2-7cb8e293dbef');


-- =========================================================================
-- DATABASE UPGRADE / MIGRATIONS (Run on existing instances)
-- =========================================================================

-- Upgrade careers table
ALTER TABLE careers ADD COLUMN IF NOT EXISTS onet_code VARCHAR(50) UNIQUE;
ALTER TABLE careers ADD COLUMN IF NOT EXISTS education_requirement TEXT;
ALTER TABLE careers ADD COLUMN IF NOT EXISTS work_environment TEXT;
ALTER TABLE careers ADD COLUMN IF NOT EXISTS future_outlook VARCHAR(100);
ALTER TABLE careers ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Upgrade courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_weeks INT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_included BOOLEAN DEFAULT TRUE;

-- Upgrade user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_career VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS salary_goal VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_updates BOOLEAN DEFAULT TRUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS market_alerts BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weekly_digest BOOLEAN DEFAULT TRUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS compact_mode BOOLEAN DEFAULT FALSE;


-- =========================================================================
-- ROADMAPS SCHEMA (ROADMAP.SH INTEGRATION)
-- =========================================================================

-- 1. Main Roadmaps Table
CREATE TABLE IF NOT EXISTS roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(50) DEFAULT 'Intermediate',
    estimated_duration VARCHAR(100) DEFAULT '6 Months',
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roadmap Nodes Table
CREATE TABLE IF NOT EXISTS roadmap_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_order INT NOT NULL,
    parent_node_id UUID REFERENCES roadmap_nodes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Roadmap Resources Table
CREATE TABLE IF NOT EXISTS roadmap_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id UUID REFERENCES roadmap_nodes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    resource_type VARCHAR(50) DEFAULT 'Link',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================================
-- MIGRATION: ADD COLUMNS FOR ROADMAP.SH INTEGRATION
-- =========================================================================

-- Track the external source for each roadmap
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'gemini';
-- Values: 'roadmap.sh' | 'gemini' | 'manual'

ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS source_slug VARCHAR(50);
-- Values: 'frontend' | 'backend' (matches roadmap.sh slug)

ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS etag VARCHAR(255);
-- GitHub ETag for efficient change detection

-- Track node type for proper hierarchy display
ALTER TABLE roadmap_nodes ADD COLUMN IF NOT EXISTS node_type VARCHAR(20) DEFAULT 'topic';
-- Values: 'topic' | 'subtopic' | 'milestone'

ALTER TABLE roadmap_nodes ADD COLUMN IF NOT EXISTS source_node_id VARCHAR(255);
-- Original node ID from roadmap.sh JSON


-- =========================================================================
-- MIGRATION: ONBOARDING & AI PERSONALIZED RECOMMENDATIONS
-- =========================================================================

-- 1. Extend user_profiles table with onboarding details
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS education_background VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS major_stream VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS learning_style TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS resume_raw_text TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS resume_embeddings REAL[]; -- 768 dimensions vector
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Create user_recommendations table to store custom AI insights
CREATE TABLE IF NOT EXISTS user_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    matched_domains JSONB DEFAULT '[]', -- List of career domains with matching percentages
    suggested_career_paths UUID[] DEFAULT '{}', -- References to careers.id
    recommended_skills UUID[] DEFAULT '{}', -- Skills they need to acquire
    recommended_courses UUID[] DEFAULT '{}', -- Course suggestions
    certifications TEXT[] DEFAULT '{}', -- Dynamically generated certifications suggestions
    growth_suggestions TEXT DEFAULT '', -- Custom textual growth advice from LLM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_rec UNIQUE (user_id)
);


-- =========================================================================
-- MIGRATION: ONBOARDING ENRICHED FIELDS (v2)
-- =========================================================================

-- Additional onboarding detail columns for user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS career_goal TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS years_experience VARCHAR(50) DEFAULT 'Beginner';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS availability VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS resume_filename VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_role VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS salary_expectation VARCHAR(100);

-- Career enrichment columns
ALTER TABLE careers ADD COLUMN IF NOT EXISTS job_roles TEXT[] DEFAULT '{}';
ALTER TABLE careers ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';
ALTER TABLE careers ADD COLUMN IF NOT EXISTS industry_tags TEXT[] DEFAULT '{}';

-- Per-career match score index in recommendations
ALTER TABLE user_recommendations ADD COLUMN IF NOT EXISTS career_match_scores JSONB DEFAULT '{}';
-- Structure: { "<career_id>": 85, "<career_id_2>": 72, ... }

-- =========================================================================
-- MIGRATION: BOOKMARKS, DETAILED AI INSIGHTS & SKILLS PROGRESSION
-- =========================================================================

-- 1. Track saved/bookmarked careers on user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS saved_careers UUID[] DEFAULT '{}';

-- 2. Store detailed career-specific personalized insights
ALTER TABLE user_recommendations ADD COLUMN IF NOT EXISTS personalized_insights JSONB DEFAULT '{}';

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS skills_last_analyzed_at TIMESTAMPTZ;

-- 3. Dedicated user_skills table for granular progress tracking
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency VARCHAR(50) DEFAULT 'Beginner', -- 'Beginner' | 'Intermediate' | 'Expert'
    progress_percentage INT DEFAULT 20, -- 0 to 100
    source VARCHAR(50) DEFAULT 'user', -- 'resume' | 'user' | 'course_completion'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_skill UNIQUE (user_id, skill_name)
);
