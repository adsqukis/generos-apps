require('dotenv').config();
const validateEnv = require('./config/validateEnv');
validateEnv(); // Refuse to start jika konfigurasi tidak aman

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');
const fs = require('fs');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const trackingRoutes = require('./routes/tracking');
const knowledgeRoutes = require('./routes/knowledge');
const foodRoutes = require('./routes/food');
const chatRoutes = require('./routes/chat');
const shopRoutes = require('./routes/shop');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway (dan platform PaaS lain) jalan di belakang reverse proxy.
// Tanpa ini, express-rate-limit & req.ip akan salah membaca semua traffic sebagai 1 IP yang sama.
app.set('trust proxy', 1);

// ============================
// MIDDLEWARE
// ============================
app.use(
  helmet({
    // CSP tidak relevan di sini karena backend hanya return JSON, tidak render HTML.
    // Proteksi penting (X-Frame-Options, X-Content-Type-Options, dll) tetap aktif lewat default helmet.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // frontend di domain Railway berbeda perlu akses API ini
  })
);
app.use(hpp()); // Cegah HTTP Parameter Pollution (?role=user&role=admin)
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' })); // diturunkan dari 2mb - cukup untuk payload normal, kurangi risiko DoS

// CORS — Di production, wajib set FRONTEND_URL ke domain frontend spesifik.
// Kalau belum di-set (deploy pertama kali), sementara izinkan semua origin + log warning.
let corsOrigin;
if (process.env.FRONTEND_URL && process.env.FRONTEND_URL !== '*') {
  corsOrigin = process.env.FRONTEND_URL;
} else if (process.env.NODE_ENV === 'production') {
  console.warn('⚠️  CORS: FRONTEND_URL belum di-set. Sementara mengizinkan semua origin. Set FRONTEND_URL segera setelah frontend live.');
  corsOrigin = true; // izinkan sementara
} else {
  corsOrigin = '*';
}
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Terlalu banyak request. Silakan coba lagi nanti.' },
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Chat & AI insight memanggil DeepSeek (berbayar per-request) - batasi lebih ketat
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak permintaan ke AI. Tunggu sebentar sebelum mencoba lagi.' },
});
app.use('/api/chat/message', aiLimiter);
app.use('/api/daily/ai', aiLimiter);
app.use('/api/tracking', (req, res, next) => {
  if (req.method === 'POST' && req.path.endsWith('/ai-insight')) {
    return aiLimiter(req, res, next);
  }
  next();
});

// ============================
// AUTO MIGRATE (for Railway first-deploy)
// ============================
const { Pool } = require('pg');

(async () => {
  try {
    const migratePool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false, max: 1 });
    const schemaPath = path.join(__dirname, 'config', 'migrate.js');
    // Just extract and run the SQL
    const sql = fs.readFileSync(path.join(__dirname, 'config', 'migrate.js'), 'utf8');
    const sqlMatch = sql.match(/const migrations = `([\s\S]*?)`;/);
    if (sqlMatch) {
      try {
        await migratePool.query(sqlMatch[1]);
        console.log('✓ Auto migrate: tables created');
      } catch(e) {
        if (e.message.includes('already exists')) {
          console.log('✓ Auto migrate: tables already exist');
        } else {
          console.warn('[migrate]', e.message.slice(0,200));
        }
      }
    }
    await migratePool.end();
  } catch(e) { console.warn('[migrate] Skipped:', e.message.slice(0,100)); }

  // Auto create daily tracker tables
  try {
    const dPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false, max: 1 });
    const dailySql = fs.readFileSync(path.join(__dirname, 'config', 'daily-migrate.js'), 'utf8');
    const dailyMatch = dailySql.match(/const migrations = `([\s\S]*?)`;/);
    if (dailyMatch) {
      await dPool.query(dailyMatch[1]);
      console.log('✓ Daily tracker tables ready');
    }
    await dPool.end();
  } catch(e) {
    console.warn('[daily-migrate]', e.message.slice(0,200));
  }

  // Auto create growth & immunization tables (terpisah dari migrate.js biar aman)
  try {
    const gPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false, max: 1 });
    await gPool.query(`
      CREATE TABLE IF NOT EXISTS growth_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        weight_kg DECIMAL(5,2),
        height_cm DECIMAL(5,2),
        head_circumference_cm DECIMAL(5,2),
        record_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_growth_user_date ON growth_records(user_id, record_date DESC);
      CREATE TABLE IF NOT EXISTS immunization_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vaccine_name VARCHAR(255) NOT NULL,
        immunization_date DATE NOT NULL,
        age_in_months INTEGER,
        given_by VARCHAR(255),
        location VARCHAR(255),
        notes TEXT,
        next_schedule DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_immunization_user ON immunization_records(user_id, immunization_date DESC);
    `);
    await gPool.end();
    console.log('✓ Growth & immunization tables ready');
  } catch(e) {
    console.warn('[growth-migrate]', e.message.slice(0,200));
  }

  // Auto seed screening data if empty (background — jangan delay server start)
  setTimeout(async () => {
    try {
      const checkData = await pool.query('SELECT COUNT(*) as cnt FROM screening_questions');
      if (parseInt(checkData.rows[0].cnt) === 0) {
        console.log('🌱 Seeding screening data...');
        const seedFn = require('./config/seed-screening');
        await seedFn();
        console.log('✓ Seeding completed');
      } else {
        console.log(`✓ Screening data exists (${checkData.rows[0].cnt} questions)`);
      }
    } catch(e) {
      console.warn('[seed] Skipped:', e.message.slice(0,100));
    }
  }, 100);
})();

// ============================
// HEALTH CHECK (for Railway)
// ============================
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Generos Care API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================
// ROUTES
// ============================
app.use('/api/auth', authRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/user', userRoutes);
app.use('/api/screening', require('./routes/screening'));
app.use('/api/stimulation', require('./routes/stimulation'));
app.use('/api/daily', require('./routes/daily'));

// ============================
// 404 HANDLER
// ============================
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// ============================
// ERROR HANDLER
// ============================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan server internal' });
});

// ============================
// START SERVER
// ============================
app.listen(PORT, () => {
  console.log(`✓ Generos Care API running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
