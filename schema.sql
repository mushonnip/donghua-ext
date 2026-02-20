CREATE TABLE IF NOT EXISTS series_state (
  auth_token TEXT NOT NULL,
  series_url TEXT NOT NULL,
  title TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  completed_episodes TEXT NOT NULL DEFAULT '[]',
  total_episodes INTEGER,
  last_updated INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (auth_token, series_url)
);
