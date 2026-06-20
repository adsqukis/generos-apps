const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// ============================
// GET profile
// ============================
router.get('/profile', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, phone, full_name, child_name, child_dob, child_gender, role, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// UPDATE profile
// ============================
router.put('/profile', async (req, res) => {
  const { full_name, child_name, child_dob, child_gender } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        child_name = COALESCE($2, child_name),
        child_dob = COALESCE($3, child_dob),
        child_gender = COALESCE($4, child_gender),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, phone, full_name, child_name, child_dob, child_gender, role`,
      [full_name, child_name, child_dob, child_gender, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
