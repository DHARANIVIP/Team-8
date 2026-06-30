-- =========================================================================
-- MIGRATION: COURSES TABLE EXPANSION
-- Adds rich metadata columns and broadens course coverage for all fields
-- Run in Supabase SQL Editor or pgAdmin 4
-- =========================================================================

-- 1. Add new columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS platform VARCHAR(100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites TEXT[] DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[] DEFAULT '{}';

-- 2. Ensure skill_id is nullable (it already is by default, but be explicit)
-- No action needed — skill_id was created without NOT NULL constraint

-- 3. Backfill platform = provider for existing rows
UPDATE courses SET platform = provider WHERE platform IS NULL AND provider IS NOT NULL;

-- 4. Backfill category based on skill linkage for existing rows
UPDATE courses SET category = 'Software Development' WHERE category IS NULL AND skill_id IN (
  SELECT id FROM skills WHERE career_id = 'b3a985d8-c923-42bf-be0d-6e828d11634b'
);
UPDATE courses SET category = 'Data Science' WHERE category IS NULL AND skill_id IN (
  SELECT id FROM skills WHERE career_id = 'd5084920-5c69-42b7-bdc1-4874e0d9b4bf'
);
UPDATE courses SET category = 'Design' WHERE category IS NULL AND skill_id IN (
  SELECT id FROM skills WHERE career_id = 'a1288c80-60b6-4b8c-85a2-3f8c8d8b1bfb'
);
UPDATE courses SET category = 'General' WHERE category IS NULL;
