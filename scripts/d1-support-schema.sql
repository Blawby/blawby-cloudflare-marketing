CREATE TABLE IF NOT EXISTS support_cases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chat_history TEXT NOT NULL,
  other_context TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comments TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (case_id) REFERENCES support_cases(id)
); 