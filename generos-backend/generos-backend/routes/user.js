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

// ============================
// GET settings (WA, email CS)
// ============================
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wa_number, email_support FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    res.json({ settings: result.rows[0] });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// UPDATE settings (WA, email CS)
// ============================
router.put('/settings', async (req, res) => {
  const { wa_number, email_support } = req.body;
  try {
    // Only admin can update CS settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang dapat mengubah pengaturan CS' });
    }
    const result = await pool.query(
      `UPDATE users SET
        wa_number = COALESCE($1, wa_number),
        email_support = COALESCE($2, email_support),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING wa_number, email_support`,
      [wa_number || null, email_support || null, req.user.id]
    );
    res.json({ settings: result.rows[0] });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// ADMIN: Update user
// ============================
router.put('/:id', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin yang dapat mengedit pengguna' });
  }
  const { id } = req.params;
  const { full_name, child_name, role, email, phone } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        child_name = COALESCE($2, child_name),
        role = COALESCE($3, role),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, phone, full_name, child_name, role, created_at`,
      [full_name, child_name, role, email, phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// ADMIN: Delete user
// ============================
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin yang dapat menghapus pengguna' });
  }
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id, full_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ message: `User ${result.rows[0].full_name} berhasil dihapus` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;

// ============================
// ADMIN: List all users
// ============================
router.get('/list', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin yang dapat mengakses data pengguna' });
  }
  try {
    const result = await pool.query(
      `SELECT id, email, phone, full_name, child_name, role, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// ADMIN: Count users
// ============================
router.get('/count', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin yang dapat mengakses data pengguna' });
  }
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM users');
    const adminResult = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'admin'");
    res.json({
      total_users: parseInt(result.rows[0].total),
      total_admins: parseInt(adminResult.rows[0].total),
    });
  } catch (err) {
    console.error('Count users error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});
