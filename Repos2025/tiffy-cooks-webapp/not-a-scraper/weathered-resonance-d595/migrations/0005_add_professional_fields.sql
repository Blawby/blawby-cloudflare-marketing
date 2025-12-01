-- Migration: Add professional and business information fields to lawyers table
-- Professional information
ALTER TABLE lawyers ADD COLUMN years_experience INTEGER;
ALTER TABLE lawyers ADD COLUMN bar_admissions TEXT;
ALTER TABLE lawyers ADD COLUMN languages_spoken TEXT;
ALTER TABLE lawyers ADD COLUMN education TEXT;

-- Business details
ALTER TABLE lawyers ADD COLUMN office_hours TEXT;
ALTER TABLE lawyers ADD COLUMN service_areas TEXT;
ALTER TABLE lawyers ADD COLUMN firm_size TEXT;
ALTER TABLE lawyers ADD COLUMN founded_year INTEGER;
ALTER TABLE lawyers ADD COLUMN website_domain TEXT;

-- Credibility
ALTER TABLE lawyers ADD COLUMN awards_recognition TEXT;

-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_lawyers_years_experience ON lawyers(years_experience);
CREATE INDEX IF NOT EXISTS idx_lawyers_firm_size ON lawyers(firm_size);
CREATE INDEX IF NOT EXISTS idx_lawyers_website_domain ON lawyers(website_domain);
CREATE INDEX IF NOT EXISTS idx_lawyers_founded_year ON lawyers(founded_year);
