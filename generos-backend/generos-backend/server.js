require('dotenv').config();
const validateEnv = require('./config/validateEnv');
validateEnv(); // Refuse to start jika konfigurasi tidak aman

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

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
app.use('/api/tracking', (req, res, next) => {
  if (req.method === 'POST' && req.path.endsWith('/ai-insight')) {
    return aiLimiter(req, res, next);
  }
  next();
});

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
