-- OptiNerds D1 — migración inicial
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS cuts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  board_width INTEGER NOT NULL,
  board_height INTEGER NOT NULL,
  board_thick INTEGER NOT NULL DEFAULT 18,
  board_qty INTEGER NOT NULL DEFAULT 1,
  kerf INTEGER NOT NULL DEFAULT 3,
  pieces TEXT NOT NULL,
  result TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cuts_user_id ON cuts(user_id);
CREATE INDEX IF NOT EXISTS idx_cuts_user_created ON cuts(user_id, created_at);
