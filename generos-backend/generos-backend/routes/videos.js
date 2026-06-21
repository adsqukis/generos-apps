const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ============================
// GET /api/videos — List all videos
// ============================
router.get('/', async (req, res) => {
  const { category, age_range, source } = req.query;

  try {
    let query = 'SELECT * FROM video_education WHERE is_active = true';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (age_range) {
      params.push(age_range);
      query += ` AND age_range = $${params.length}`;
    }

    if (source) {
      params.push(source);
      query += ` AND source = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ videos: result.rows });
  } catch (err) {
    console.error('List videos error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// GET /api/videos/:id — Get single video detail
// ============================
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM video_education WHERE id = $1 AND is_active = true',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video tidak ditemukan' });
    }

    res.json({ video: result.rows[0] });
  } catch (err) {
    console.error('Get video error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// POST /api/videos — Admin create video
// ============================
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  [
    body('title').notEmpty().withMessage('Judul video wajib diisi'),
    body('video_url').notEmpty().withMessage('URL video wajib diisi'),
    body('category').isIn(['speech', 'motor', 'immunity', 'cognitive', 'parenting'])
      .withMessage('Kategori harus salah satu: speech, motor, immunity, cognitive, parenting'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      duration_minutes,
      video_url,
      thumbnail_url,
      category,
      age_range,
      source,
      is_active
    } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO video_education (title, description, duration_minutes, video_url, thumbnail_url, category, age_range, source, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          title,
          description || null,
          duration_minutes || null,
          video_url,
          thumbnail_url || null,
          category,
          age_range || null,
          source || 'youtube',
          is_active !== undefined ? is_active : true,
          req.user.id
        ]
      );

      res.status(201).json({ video: result.rows[0] });
    } catch (err) {
      console.error('Create video error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// ============================
// PUT /api/videos/:id — Admin update video
// ============================
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  [
    body('title').optional().notEmpty().withMessage('Judul video tidak boleh kosong'),
    body('category').optional().isIn(['speech', 'motor', 'immunity', 'cognitive', 'parenting'])
      .withMessage('Kategori harus salah satu: speech, motor, immunity, cognitive, parenting'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, duration_minutes, video_url,
      thumbnail_url, category, age_range, source, is_active
    } = req.body;

    try {
      const result = await pool.query(
        `UPDATE video_education SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          duration_minutes = COALESCE($3, duration_minutes),
          video_url = COALESCE($4, video_url),
          thumbnail_url = COALESCE($5, thumbnail_url),
          category = COALESCE($6, category),
          age_range = COALESCE($7, age_range),
          source = COALESCE($8, source),
          is_active = COALESCE($9, is_active),
          updated_at = NOW()
         WHERE id = $10 AND is_active = true
         RETURNING *`,
        [
          title || null,
          description !== undefined ? description : null,
          duration_minutes !== undefined ? duration_minutes : null,
          video_url || null,
          thumbnail_url !== undefined ? thumbnail_url : null,
          category || null,
          age_range !== undefined ? age_range : null,
          source || null,
          is_active !== undefined ? is_active : null,
          req.params.id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Video tidak ditemukan' });
      }

      res.json({ video: result.rows[0] });
    } catch (err) {
      console.error('Update video error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// ============================
// DELETE /api/videos/:id — Admin soft delete video
// ============================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE video_education SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video tidak ditemukan' });
    }

    res.json({ message: 'Video berhasil dihapus' });
  } catch (err) {
    console.error('Delete video error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
