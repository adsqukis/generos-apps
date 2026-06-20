// Dijalankan sebelum server start. Mencegah app jalan dengan konfigurasi tidak aman.

function validateEnv() {
  const errors = [];
  const isProd = process.env.NODE_ENV === 'production';

  const requiredAlways = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  for (const key of requiredAlways) {
    if (!process.env[key]) {
      errors.push(`Environment variable ${key} wajib di-set`);
    }
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET harus minimal 32 karakter. Generate dengan: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET harus minimal 32 karakter');
  }

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    errors.push('JWT_SECRET dan JWT_REFRESH_SECRET harus berbeda');
  }

  const placeholderPatterns = ['change_this', 'your_', 'placeholder', 'example'];
  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'ADMIN_PASSWORD']) {
    const val = (process.env[key] || '').toLowerCase();
    if (placeholderPatterns.some((p) => val.includes(p))) {
      errors.push(`${key} masih menggunakan nilai placeholder dari .env.example — wajib diganti`);
    }
  }

  if (isProd && (!process.env.FRONTEND_URL || process.env.FRONTEND_URL === '*')) {
    console.warn('⚠️  WARNING: FRONTEND_URL belum di-set ke domain spesifik di production. CORS akan menolak semua request dari frontend. Set FRONTEND_URL ke domain frontend Anda setelah deploy frontend.');
  }

  if (isProd && process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 8) {
    errors.push('ADMIN_PASSWORD harus minimal 8 karakter di production');
  }

  if (errors.length > 0) {
    console.error('\n❌ KONFIGURASI TIDAK AMAN — Server tidak dijalankan:\n');
    errors.forEach((e) => console.error(`  - ${e}`));
    console.error('\nPerbaiki environment variables lalu deploy ulang.\n');
    process.exit(1);
  }

  console.log('✓ Environment variables tervalidasi');
}

module.exports = validateEnv;
