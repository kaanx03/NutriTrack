-- NutriTrack Database Schema
-- Run this file to initialise all tables: psql -U postgres -d nutritrack -f schema.sql

-- ──────────────────────────────────────────────
-- Users
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                 SERIAL PRIMARY KEY,
  email              TEXT UNIQUE NOT NULL,
  password_hash      TEXT NOT NULL,
  first_name         TEXT,
  last_name          TEXT,
  phone_number       TEXT,
  gender             TEXT,
  birth_date         DATE,
  height             NUMERIC(5,2),
  weight             NUMERIC(5,2),
  activity_level     INTEGER DEFAULT 3,
  profile_image_url  TEXT,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- User nutrition targets (one row per user)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_daily_targets (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_calories  INTEGER DEFAULT 2000,
  daily_protein   NUMERIC(6,2) DEFAULT 150,
  daily_carbs     NUMERIC(6,2) DEFAULT 250,
  daily_fat       NUMERIC(6,2) DEFAULT 65,
  water_target    INTEGER DEFAULT 2500,
  goal_weight     NUMERIC(5,2),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ──────────────────────────────────────────────
-- Daily snapshot (one row per user per day)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_daily_data (
  id                        SERIAL PRIMARY KEY,
  user_id                   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                      DATE NOT NULL,
  total_calories_consumed   NUMERIC(8,2) DEFAULT 0,
  total_protein_consumed    NUMERIC(7,2) DEFAULT 0,
  total_carbs_consumed      NUMERIC(7,2) DEFAULT 0,
  total_fat_consumed        NUMERIC(7,2) DEFAULT 0,
  total_calories_burned     NUMERIC(8,2) DEFAULT 0,
  water_consumed            INTEGER DEFAULT 0,
  daily_calorie_goal        INTEGER DEFAULT 2000,
  daily_protein_goal        NUMERIC(6,2) DEFAULT 150,
  daily_carbs_goal          NUMERIC(6,2) DEFAULT 250,
  daily_fat_goal            NUMERIC(6,2) DEFAULT 65,
  daily_water_goal          INTEGER DEFAULT 2500,
  created_at                TIMESTAMP DEFAULT NOW(),
  updated_at                TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- ──────────────────────────────────────────────
-- Food log entries
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_entries (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date        DATE NOT NULL,
  meal_type         TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  food_name         TEXT NOT NULL,
  food_id           TEXT,
  calories_per_100g NUMERIC(7,2) DEFAULT 0,
  protein_per_100g  NUMERIC(6,2) DEFAULT 0,
  carbs_per_100g    NUMERIC(6,2) DEFAULT 0,
  fat_per_100g      NUMERIC(6,2) DEFAULT 0,
  serving_size      NUMERIC(7,2) DEFAULT 100,
  total_calories    NUMERIC(8,2) DEFAULT 0,
  total_protein     NUMERIC(7,2) DEFAULT 0,
  total_carbs       NUMERIC(7,2) DEFAULT 0,
  total_fat         NUMERIC(7,2) DEFAULT 0,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Activity log entries
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date          DATE NOT NULL,
  activity_name       TEXT NOT NULL,
  activity_id         TEXT,
  duration_minutes    INTEGER DEFAULT 30,
  calories_burned     NUMERIC(7,2) DEFAULT 0,
  intensity           TEXT DEFAULT 'moderate' CHECK (intensity IN ('low','moderate','high')),
  is_custom_activity  BOOLEAN DEFAULT FALSE,
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Water intake logs
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date  DATE NOT NULL,
  amount_ml   INTEGER NOT NULL CHECK (amount_ml > 0),
  logged_at   TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Weight logs
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weight_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg   NUMERIC(5,2) NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Recently used foods (per user)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recent_foods (
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_id           TEXT NOT NULL,
  food_name         TEXT NOT NULL,
  calories_per_100g NUMERIC(7,2) DEFAULT 0,
  protein_per_100g  NUMERIC(6,2) DEFAULT 0,
  carbs_per_100g    NUMERIC(6,2) DEFAULT 0,
  fat_per_100g      NUMERIC(6,2) DEFAULT 0,
  is_custom_food    BOOLEAN DEFAULT FALSE,
  last_accessed     TIMESTAMP DEFAULT NOW(),
  created_at        TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, food_id)
);

-- ──────────────────────────────────────────────
-- Favourite foods
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorite_foods (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_id           TEXT NOT NULL,
  food_name         TEXT NOT NULL,
  calories_per_100g NUMERIC(7,2) DEFAULT 0,
  protein_per_100g  NUMERIC(6,2) DEFAULT 0,
  carbs_per_100g    NUMERIC(6,2) DEFAULT 0,
  fat_per_100g      NUMERIC(6,2) DEFAULT 0,
  is_custom_food    BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, food_id)
);

-- ──────────────────────────────────────────────
-- User-created custom foods
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_foods (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name         TEXT NOT NULL,
  calories_per_100g NUMERIC(7,2) DEFAULT 0,
  protein_per_100g  NUMERIC(6,2) DEFAULT 0,
  carbs_per_100g    NUMERIC(6,2) DEFAULT 0,
  fat_per_100g      NUMERIC(6,2) DEFAULT 0,
  serving_size      NUMERIC(7,2) DEFAULT 100,
  description       TEXT,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Favourite activities
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorite_activities (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id         TEXT NOT NULL,
  activity_name       TEXT NOT NULL,
  calories_per_minute NUMERIC(6,3) DEFAULT 0,
  is_custom_activity  BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, activity_id)
);

-- ──────────────────────────────────────────────
-- User-created custom activities
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_activities (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_name       TEXT NOT NULL,
  calories_per_minute NUMERIC(6,3) DEFAULT 0,
  category            TEXT DEFAULT 'Custom',
  description         TEXT,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- User app settings
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id                          SERIAL PRIMARY KEY,
  user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Calorie settings
  calorie_intake_goal         INTEGER DEFAULT 2000,
  calorie_units               TEXT DEFAULT 'kcal',
  meal_logging_reminder       BOOLEAN DEFAULT TRUE,
  meal_reminder_repeat        TEXT DEFAULT 'Everyday',
  meal_reminder_time          TEXT DEFAULT '08:00 AM',
  meal_ringtone               TEXT DEFAULT 'Lollipop',
  meal_volume                 NUMERIC(3,2) DEFAULT 0.7,
  meal_vibration              BOOLEAN DEFAULT FALSE,
  meal_stop_when_complete     BOOLEAN DEFAULT FALSE,
  -- Water settings
  water_intake_goal           INTEGER DEFAULT 2500,
  water_units                 TEXT DEFAULT 'mL',
  drink_reminder              BOOLEAN DEFAULT TRUE,
  drink_reminder_repeat       TEXT DEFAULT 'Everyday',
  drink_reminder_mode         TEXT DEFAULT 'Static',
  drink_ringtone              TEXT DEFAULT 'Harmony',
  drink_volume                NUMERIC(3,2) DEFAULT 0.6,
  drink_vibration             BOOLEAN DEFAULT FALSE,
  drink_stop_when_complete    BOOLEAN DEFAULT FALSE,
  -- Weight settings
  weight_units                TEXT DEFAULT 'kg',
  height_units                TEXT DEFAULT 'cm',
  bmi_enabled                 BOOLEAN DEFAULT TRUE,
  weight_logging_reminder     BOOLEAN DEFAULT TRUE,
  weight_reminder_repeat      TEXT DEFAULT 'Everyday',
  weight_reminder_time        TEXT DEFAULT '10:00',
  weight_ringtone             TEXT DEFAULT 'Jingle Jam',
  weight_volume               NUMERIC(3,2) DEFAULT 0.8,
  weight_vibration            BOOLEAN DEFAULT FALSE,
  weight_stop_when_goal_achieved BOOLEAN DEFAULT FALSE,
  created_at                  TIMESTAMP DEFAULT NOW(),
  updated_at                  TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ──────────────────────────────────────────────
-- Indexes for common query patterns
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date    ON food_entries    (user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date  ON activity_logs   (user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date     ON water_logs      (user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date    ON weight_logs     (user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_data_user_date ON user_daily_data (user_id, date);
