const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// ============================
// GET summary (dashboard stats) — HARUS sebelum /:id
// ============================
router.get('/dashboard/summary', async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyCount = await pool.query(
      `SELECT COUNT(*) as count FROM tracking_entries 
       WHERE user_id = $1 AND date >= $2`,
      [req.user.id, weekAgo.toISOString().split('T')[0]]
    );

    const totalCount = await pool.query(
      `SELECT COUNT(*) as count FROM tracking_entries WHERE user_id = $1`,
      [req.user.id]
    );

    const concernCount = await pool.query(
      `SELECT COUNT(*) as count FROM tracking_entries 
       WHERE user_id = $1 AND severity = 'concern' AND date >= $2`,
      [req.user.id, weekAgo.toISOString().split('T')[0]]
    );

    const consistency = Math.min(100, Math.round((parseInt(weeklyCount.rows[0].count) / 7) * 100));

    res.json({
      weekly_entries: parseInt(weeklyCount.rows[0].count),
      total_entries: parseInt(totalCount.rows[0].count),
      concern_entries: parseInt(concernCount.rows[0].count),
      consistency_percentage: consistency,
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// GET all tracking entries (paginated)
// ============================
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const { entry_type } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `SELECT * FROM tracking_entries WHERE user_id = $1`;
    const params = [req.user.id];

    if (entry_type) {
      query += ` AND entry_type = $2`;
      params.push(entry_type);
    }

    query += ` ORDER BY date DESC, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ entries: result.rows });
  } catch (err) {
    console.error('Get tracking error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// GET single entry
// ============================
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tracking_entries WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry tidak ditemukan' });
    }

    res.json({ entry: result.rows[0] });
  } catch (err) {
    console.error('Get entry error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// CREATE entry
// ============================
router.post(
  '/',
  [
    body('entry_type').isIn(['speech', 'behavior', 'illness', 'sleep', 'motor', 'other']).withMessage('Jenis tracking tidak valid'),
    body('description').trim().notEmpty().isLength({ max: 2000 }).withMessage('Deskripsi wajib diisi, maksimal 2000 karakter'),
    body('date').isDate().withMessage('Tanggal tidak valid'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { entry_type, description, severity, date, notes } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO tracking_entries (user_id, entry_type, description, severity, date, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.user.id, entry_type, description, severity || 'normal', date, notes || null]
      );

      res.status(201).json({ entry: result.rows[0] });
    } catch (err) {
      console.error('Create entry error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// ============================
// UPDATE entry
// ============================
router.put('/:id', async (req, res) => {
  const { description, severity, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tracking_entries 
       SET description = COALESCE($1, description),
           severity = COALESCE($2, severity),
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [description, severity, notes, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry tidak ditemukan' });
    }

    res.json({ entry: result.rows[0] });
  } catch (err) {
    console.error('Update entry error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// DELETE entry
// ============================
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM tracking_entries WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry tidak ditemukan' });
    }

    res.json({ message: 'Entry berhasil dihapus' });
  } catch (err) {
    console.error('Delete entry error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// AI INSIGHT (DeepSeek - opsional, hanya saat diminta)
// ============================
router.post('/:id/ai-insight', async (req, res) => {
  try {
    const entryResult = await pool.query(
      `SELECT te.*, u.child_dob FROM tracking_entries te
       JOIN users u ON u.id = te.user_id
       WHERE te.id = $1 AND te.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry tidak ditemukan' });
    }

    const entry = entryResult.rows[0];
    const childAgeMonths = Math.floor(
      (new Date() - new Date(entry.child_dob)) / (1000 * 60 * 60 * 24 * 30)
    );

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(503).json({ error: 'AI insight belum dikonfigurasi' });
    }

    const prompt = `Sebagai asisten parenting yang membantu menganalisis tracking perkembangan anak, berikan insight singkat (maksimal 2 kalimat) berdasarkan data ini:

Kategori: ${entry.entry_type}
Usia anak: ${childAgeMonths} bulan
Deskripsi: ${entry.description}
Tingkat perhatian: ${entry.severity}

Apakah ini normal untuk usianya? Berikan saran singkat dan actionable. JANGAN memberikan diagnosis medis. Jika ada kekhawatiran, sarankan konsultasi dokter anak.`;

    const aiResponse = await axios.post(
      process.env.DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const insight = aiResponse.data?.choices?.[0]?.message?.content;
    if (!insight) {
      return res.status(502).json({ error: 'AI tidak memberikan respons. Silakan coba lagi.' });
    }

    await pool.query(
      `UPDATE tracking_entries SET ai_insight = $1 WHERE id = $2`,
      [insight, req.params.id]
    );

    res.json({ insight });
  } catch (err) {
    console.error('AI insight error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Gagal mendapatkan AI insight. Silakan coba lagi.' });
  }
});

module.exports = router;
