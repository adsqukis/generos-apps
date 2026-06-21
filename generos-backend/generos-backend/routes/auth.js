const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

function generateTokens(user) {
  const payload = { id: user.id, role: user.role, identifier: user.email || user.phone };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });

  return { accessToken, refreshToken };
}

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function isPhone(str) {
  return /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(str.replace(/[\s-]/g, ''));
}

// ============================
// REGISTER
// ============================
router.post(
  '/register',
  [
    body('identifier').notEmpty().withMessage('Email atau nomor telepon wajib diisi'),
    body('password')
      .isLength({ min: 8, max: 100 })
      .withMessage('Password minimal 8 karakter')
      .matches(/\d/)
      .withMessage('Password harus mengandung minimal 1 angka'),
    body('full_name').trim().notEmpty().isLength({ max: 255 }).withMessage('Nama wajib diisi'),
    body('child_name').trim().notEmpty().isLength({ max: 255 }).withMessage('Nama anak wajib diisi'),
    body('child_dob').isDate().withMessage('Tanggal lahir anak tidak valid'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password, full_name, child_name, child_dob, child_gender } = req.body;

    try {
      const isEmailInput = isEmail(identifier);
      const isPhoneInput = isPhone(identifier);

      if (!isEmailInput && !isPhoneInput) {
        return res.status(400).json({ error: 'Format email atau nomor telepon tidak valid' });
      }

      // Check if already exists
      const checkField = isEmailInput ? 'email' : 'phone';
      const existing = await pool.query(`SELECT id FROM users WHERE ${checkField} = $1`, [identifier]);

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email atau nomor telepon sudah terdaftar' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const result = await pool.query(
        `INSERT INTO users (${checkField}, password_hash, full_name, child_name, child_dob, child_gender, role)
         VALUES ($1, $2, $3, $4, $5, $6, 'user')
         RETURNING id, email, phone, full_name, child_name, child_dob, child_gender, role`,
        [identifier, passwordHash, full_name, child_name, child_dob, child_gender || null]
      );

      const user = result.rows[0];
      const { accessToken, refreshToken } = generateTokens(user);

      // Store refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, refreshToken, expiresAt]
      );

      res.status(201).json({
        message: 'Registrasi berhasil',
        user,
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// ============================
// REGISTER ADMIN (admin only)
// ============================
router.post(
  '/register-admin',
  authenticateToken,
  requireAdmin,
  [
    body('identifier').notEmpty().withMessage('Email atau nomor telepon wajib diisi'),
    body('password')
      .isLength({ min: 8, max: 100 })
      .withMessage('Password minimal 8 karakter')
      .matches(/\d/)
      .withMessage('Password harus mengandung minimal 1 angka'),
    body('full_name').trim().notEmpty().isLength({ max: 255 }).withMessage('Nama wajib diisi'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password, full_name } = req.body;

    try {
      const isEmailInput = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isPhoneInput = /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(identifier.replace(/[\s-]/g, ''));

      if (!isEmailInput && !isPhoneInput) {
        return res.status(400).json({ error: 'Format email atau nomor telepon tidak valid' });
      }

      const checkField = isEmailInput ? 'email' : 'phone';
      const existing = await pool.query(`SELECT id FROM users WHERE ${checkField} = $1`, [identifier]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email atau nomor telepon sudah terdaftar' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        `INSERT INTO users (${checkField}, password_hash, full_name, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id, email, phone, full_name, role, created_at`,
        [identifier, passwordHash, full_name]
      );

      res.status(201).json({
        message: 'Admin baru berhasil dibuat',
        admin: result.rows[0],
      });
    } catch (err) {
      console.error('Register admin error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// ============================
// LOGIN (phone or email)
// ============================
router.post(
  '/login',
  [
    body('identifier').notEmpty().withMessage('Email atau nomor telepon wajib diisi'),
    body('password').notEmpty().withMessage('Password wajib diisi'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE email = $1 OR phone = $1`,
        [identifier]
      );

      // Generic error message - jangan bocorkan apakah akun ada atau tidak
      const genericError = { error: 'Email/nomor telepon atau password salah' };

      if (result.rows.length === 0) {
        return res.status(401).json(genericError);
      }

      const user = result.rows[0];

      // Cek apakah akun sedang dikunci
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
        return res.status(423).json({
          error: `Akun sementara dikunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${minutesLeft} menit.`,
        });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        const attempts = (user.failed_login_attempts || 0) + 1;
        const MAX_ATTEMPTS = 5;

        if (attempts >= MAX_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 menit
          await pool.query(
            `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
            [attempts, lockUntil, user.id]
          );
          return res.status(423).json({
            error: 'Terlalu banyak percobaan gagal. Akun dikunci selama 15 menit.',
          });
        }

        await pool.query(`UPDATE users SET failed_login_attempts = $1 WHERE id = $2`, [attempts, user.id]);
        return res.status(401).json(genericError);
      }

      // Login berhasil - reset failed attempts
      await pool.query(
        `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
        [user.id]
      );

      const { accessToken, refreshToken } = generateTokens(user);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, refreshToken, expiresAt]
      );

      // Hanya return field yang aman — jangan bocorkan password_hash, failed_login_attempts, locked_until
      const safeUser = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        child_name: user.child_name,
        child_dob: user.child_dob,
        child_gender: user.child_gender,
        role: user.role,
      };

      res.json({
        message: 'Login berhasil',
        user: safeUser,
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// ============================
// REFRESH TOKEN
// ============================
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token tidak ditemukan' });
  }

  try {
    const tokenCheck = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`,
      [refreshToken]
    );

    if (tokenCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Refresh token tidak valid atau sudah expired' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (verifyErr) {
      return res.status(403).json({ error: 'Refresh token tidak valid' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const user = userResult.rows[0];
    const { accessToken } = generateTokens(user);

    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// LOGOUT
// ============================
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
    res.json({ message: 'Logout berhasil' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
