-- Migration: Add enhanced fields to lawyers table
-- This adds image_url, phone, email, address, description, website_title, and practice_area fields

-- Add new columns to lawyers table
ALTER TABLE lawyers ADD COLUMN practice_area TEXT;
ALTER TABLE lawyers ADD COLUMN image_url TEXT;
ALTER TABLE lawyers ADD COLUMN phone TEXT;
ALTER TABLE lawyers ADD COLUMN email TEXT;
ALTER TABLE lawyers ADD COLUMN address TEXT;
ALTER TABLE lawyers ADD COLUMN description TEXT;
ALTER TABLE lawyers ADD COLUMN website_title TEXT;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_lawyers_practice_area ON lawyers(practice_area);
CREATE INDEX IF NOT EXISTS idx_lawyers_phone ON lawyers(phone);
CREATE INDEX IF NOT EXISTS idx_lawyers_email ON lawyers(email);

-- Composite indexes for enhanced search
CREATE INDEX IF NOT EXISTS idx_lawyers_city_practice_area ON lawyers(city, practice_area);
CREATE INDEX IF NOT EXISTS idx_lawyers_state_practice_area ON lawyers(state, practice_area);
CREATE INDEX IF NOT EXISTS idx_lawyers_city_state_practice_area ON lawyers(city, state, practice_area);
