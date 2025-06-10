CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  gender TEXT,
  birth_date DATE,
  height INTEGER,
  weight INTEGER,
  activity_level INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);