-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_hash TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quota_per_day INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user quota tracking table
CREATE TABLE IF NOT EXISTS user_quota (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  used INTEGER DEFAULT 0,
  quota_limit INTEGER DEFAULT 100,
  PRIMARY KEY (user_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_user_quota_date ON user_quota(date);
