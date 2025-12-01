-- Migration: Create lawyers table
-- This table stores lawyer/firm information collected from Google Custom Search

CREATE TABLE IF NOT EXISTS lawyers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    firm TEXT,
    url TEXT UNIQUE NOT NULL,
    snippet TEXT,
    city TEXT,
    state TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lawyers_city ON lawyers(city);
CREATE INDEX IF NOT EXISTS idx_lawyers_state ON lawyers(state);
CREATE INDEX IF NOT EXISTS idx_lawyers_url ON lawyers(url);
CREATE INDEX IF NOT EXISTS idx_lawyers_created_at ON lawyers(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_lawyers_city_state ON lawyers(city, state);
CREATE INDEX IF NOT EXISTS idx_lawyers_state_city ON lawyers(state, city);
CREATE INDEX IF NOT EXISTS idx_lawyers_created_at_desc ON lawyers(created_at DESC);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_lawyers_updated_at
    AFTER UPDATE ON lawyers
    FOR EACH ROW
    BEGIN
        UPDATE lawyers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
