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
