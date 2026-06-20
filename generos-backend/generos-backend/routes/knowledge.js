const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ============================
// PUBLIC: List articles
// ============================
router.get('/', async (req, res) => {
  const { category } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  try {
    let query = `SELECT id, title, slug, category, summary, published_at FROM articles WHERE is_active = true`;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ` ORDER BY published_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ articles: result.rows });
  } catch (err) {
    console.error('List articles error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// PUBLIC: Search articles
// ============================
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Query pencarian wajib diisi' });
  }

  if (q.length > 200) {
    return res.status(400).json({ error: 'Query pencarian terlalu panjang' });
  }

  // Escape karakter wildcard LIKE (% dan _) supaya user tidak bisa membuat query mahal/ambigu
  const safeQuery = q.replace(/[%_]/g, '\\$&');

  try {
    const result = await pool.query(
      `SELECT id, title, slug, category, summary FROM articles 
       WHERE is_active = true AND (title ILIKE $1 OR summary ILIKE $1 OR content ILIKE $1)
       ORDER BY published_at DESC LIMIT 20`,
      [`%${safeQuery}%`]
    );
    res.json({ articles: result.rows });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// PUBLIC: Get single article
// ============================
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM articles WHERE (id::text = $1 OR slug = $1) AND is_active = true`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan' });
    }

    res.json({ article: result.rows[0] });
  } catch (err) {
    console.error('Get article error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// ADMIN: Create article
// ============================
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  [
    body('title').trim().notEmpty().isLength({ max: 500 }).withMessage('Judul wajib diisi, maksimal 500 karakter'),
    body('category').isIn(['immunity', 'brain', 'speech', 'tantrum', 'adhd', 'autism', 'other']).withMessage('Kategori tidak valid'),
    body('content').trim().notEmpty().isLength({ max: 20000 }).withMessage('Konten wajib diisi, maksimal 20000 karakter'),
    body('summary').trim().notEmpty().isLength({ max: 1000 }).withMessage('Summary wajib diisi, maksimal 1000 karakter'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, category, content, summary, red_flags, when_to_see_doctor, sources } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      const result = await pool.query(
        `INSERT INTO articles (title, slug, category, content, summary, red_flags, when_to_see_doctor, sources, verified_by, verified_date, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, true)
         RETURNING *`,
        [title, slug, category, content, summary, red_flags || null, when_to_see_doctor || null, JSON.stringify(sources || []), req.user.id]
      );

      res.status(201).json({ article: result.rows[0] });
    } catch (err) {
      console.error('Create article error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// ============================
// ADMIN: Update article
// ============================
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { title, category, content, summary, red_flags, when_to_see_doctor, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE articles SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        content = COALESCE($3, content),
        summary = COALESCE($4, summary),
        red_flags = COALESCE($5, red_flags),
        when_to_see_doctor = COALESCE($6, when_to_see_doctor),
        is_active = COALESCE($7, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [title, category, content, summary, red_flags, when_to_see_doctor, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan' });
    }

    res.json({ article: result.rows[0] });
  } catch (err) {
    console.error('Update article error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// ADMIN: Delete article (soft delete)
// ============================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE articles SET is_active = false WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan' });
    }

    res.json({ message: 'Artikel berhasil dihapus' });
  } catch (err) {
    console.error('Delete article error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
