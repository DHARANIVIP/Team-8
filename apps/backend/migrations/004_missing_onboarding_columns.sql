-- =========================================================================
-- MIGRATION 004: ADD MISSING ONBOARDING COLUMNS
-- Adds institution_name, graduation_year, wants_certifications to user_profiles
-- Run in Supabase SQL Editor
-- =========================================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS graduation_year VARCHAR(10);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wants_certifications BOOLEAN DEFAULT FALSE;
