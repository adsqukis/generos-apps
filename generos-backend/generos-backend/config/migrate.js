require('dotenv').config();
const pool = require('./db');

const migrations = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user', -- 'user' or 'admin'
  child_name VARCHAR(255),
  child_dob DATE,
  child_gender VARCHAR(10),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Safe upgrade path jika tabel users sudah ada dari migration sebelumnya
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS child_nickname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS child_photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_weight DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_height DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_head_circumference DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_notes TEXT;

-- Tracking Entries Table
CREATE TABLE IF NOT EXISTS tracking_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'normal',
  date DATE NOT NULL,
  notes TEXT,
  ai_insight TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_user_date ON tracking_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_type ON tracking_entries(entry_type);

-- Articles Table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  red_flags TEXT,
  when_to_see_doctor TEXT,
  sources JSONB DEFAULT '[]',
  verified_by UUID REFERENCES users(id),
  verified_date TIMESTAMP,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_active ON articles(is_active);

-- Food Menu Table
CREATE TABLE IF NOT EXISTS food_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  age_range VARCHAR(50) NOT NULL,
  benefits TEXT NOT NULL,
  recipe TEXT NOT NULL,
  ingredients JSONB DEFAULT '[]',
  image_url VARCHAR(500),
  category VARCHAR(50), -- breakfast, lunch, dinner, snack
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_food_age ON food_menu(age_range);

-- Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id, created_at DESC);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  shopee_link VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Click Tracking (for analytics)
CREATE TABLE IF NOT EXISTS product_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clicks_product ON product_clicks(product_id);

-- ============================
-- SCREENING & STIMULASI v2
-- ============================

-- User domain preferences (domain mana yg dipilih user untuk anaknya)
CREATE TABLE IF NOT EXISTS user_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(50) NOT NULL, -- cognitive, speech, immunity, motor
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, domain)
);

-- Master screening questions per domain per age
CREATE TABLE IF NOT EXISTS screening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(50) NOT NULL, -- cognitive, speech, immunity, motor
  age_min INTEGER NOT NULL, -- usia minimal dalam bulan
  age_max INTEGER NOT NULL, -- usia maksimal dalam bulan
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'yesno', -- yesno, multiple
  options JSONB DEFAULT '[]', -- untuk multiple choice
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_screening_q_domain_age ON screening_questions(domain, age_min, age_max);
CREATE INDEX IF NOT EXISTS idx_screening_q_active ON screening_questions(is_active);

-- Screening sessions (1 session = 1 domain, 1 waktu)
CREATE TABLE IF NOT EXISTS screening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(50) NOT NULL,
  child_age_months INTEGER NOT NULL,
  total_questions INTEGER DEFAULT 0,
  answered_yes INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2),
  result VARCHAR(20), -- sesuai, meragukan, menyimpang
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_screening_session_user ON screening_sessions(user_id, domain);

-- Individual answers per screening question
CREATE TABLE IF NOT EXISTS screening_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES screening_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES screening_questions(id),
  answer VARCHAR(50), -- 'yes', 'no', atau nilai untuk multiple choice
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_screening_answer_session ON screening_answers(session_id);
-- Unique constraint untuk upsert answer (gunakan DO block biar aman)
DO $$ BEGIN
  ALTER TABLE screening_answers ADD CONSTRAINT unique_session_question UNIQUE (session_id, question_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Master stimulation activities
CREATE TABLE IF NOT EXISTS stimulation_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(50) NOT NULL, -- cognitive, speech, immunity, motor, general
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  age_min INTEGER NOT NULL,
  age_max INTEGER NOT NULL,
  duration VARCHAR(50), -- "5-10 menit"
  difficulty VARCHAR(20) DEFAULT 'mudah', -- mudah, sedang, sulit
  materials TEXT, -- bahan-bahan yang diperlukan
  image_url VARCHAR(500),
  category VARCHAR(50), -- general, screening_result, tracking_kendala
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stim_activity_domain_age ON stimulation_activities(domain, age_min, age_max);
CREATE INDEX IF NOT EXISTS idx_stim_activity_active ON stimulation_activities(is_active);

-- Stimulation recommendations (given to users)
CREATE TABLE IF NOT EXISTS stimulation_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES stimulation_activities(id),
  source VARCHAR(50) NOT NULL, -- 'general', 'screening', 'tracking'
  session_id UUID REFERENCES screening_sessions(id) ON DELETE SET NULL,
  reason TEXT, -- kenapa direkomendasikan
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, dismissed
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stim_rec_user ON stimulation_recommendations(user_id, status);

-- Tambah domain column ke tracking_entries biar bisa filter per domain
ALTER TABLE tracking_entries ADD COLUMN IF NOT EXISTS domain VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_tracking_domain ON tracking_entries(domain);

-- Add sort_order column ke stimulation_activities (kalau belum ada)
ALTER TABLE stimulation_activities ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ============================
-- TUMBUH KEMBANG (Growth & Development Tracker)
-- ============================

-- Growth records (BB/TB/LK)
CREATE TABLE IF NOT EXISTS growth_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2),       -- Berat Badan (kg)
  height_cm DECIMAL(5,2),       -- Tinggi Badan (cm)
  head_circumference_cm DECIMAL(5,2), -- Lingkar Kepala (cm)
  record_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_growth_user_date ON growth_records(user_id, record_date DESC);

-- Immunization records
CREATE TABLE IF NOT EXISTS immunization_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vaccine_name VARCHAR(255) NOT NULL,
  immunization_date DATE NOT NULL,
  age_in_months INTEGER,        -- usia anak saat imunisasi
  given_by VARCHAR(255),        -- nama dokter/nakes
  location VARCHAR(255),        -- tempat imunisasi
  notes TEXT,
  next_schedule DATE,           -- jadwal imunisasi berikutnya
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_immunization_user ON immunization_records(user_id, immunization_date DESC);

-- Add image_url to articles (if not exists)
DO $$ BEGIN
  ALTER TABLE articles ADD COLUMN image_url VARCHAR(500);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add images JSONB to products (multiple images)
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
`;

async function runMigrations() {
  try {
    console.log('Running migrations...');
    await pool.query(migrations);
    console.log('✓ Migrations completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigrations();
