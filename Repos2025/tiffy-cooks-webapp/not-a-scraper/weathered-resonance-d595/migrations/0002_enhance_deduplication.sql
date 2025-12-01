-- Migration: Enhance deduplication and add practice area tracking
-- This migration adds better deduplication and practice area information

-- Add practice_area column to track what type of lawyer search found this result
ALTER TABLE lawyers ADD COLUMN practice_area TEXT;

-- Create a unique constraint on firm + city for better deduplication
-- This prevents the same firm from being added multiple times for the same city
CREATE UNIQUE INDEX IF NOT EXISTS idx_lawyers_firm_city_unique ON lawyers(firm, city) WHERE firm IS NOT NULL;

-- Create index on practice_area for filtering
CREATE INDEX IF NOT EXISTS idx_lawyers_practice_area ON lawyers(practice_area);

-- Create composite index for practice area + city queries
CREATE INDEX IF NOT EXISTS idx_lawyers_practice_area_city ON lawyers(practice_area, city);

-- Create index for today's lawyers query optimization
CREATE INDEX IF NOT EXISTS idx_lawyers_created_at_date ON lawyers(DATE(created_at));
