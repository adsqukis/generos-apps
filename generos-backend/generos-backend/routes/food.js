const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ============================
// PUBLIC: List food menu
// ============================
router.get('/', async (req, res) => {
  const { age_range, category } = req.query;

  try {
    let query = `SELECT * FROM food_menu WHERE is_active = true`;
    const params = [];

    if (age_range) {
      params.push(age_range);
      query += ` AND age_range = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ foods: result.rows });
  } catch (err) {
    console.error('List food error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// PUBLIC: Get single food item
// ============================
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM food_menu WHERE id = $1 AND is_active = true`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu makanan tidak ditemukan' });
    }

    res.json({ food: result.rows[0] });
  } catch (err) {
    console.error('Get food error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// ADMIN: Create food menu
// ============================
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Nama makanan wajib diisi'),
    body('age_range').notEmpty().withMessage('Rentang usia wajib diisi'),
    body('benefits').notEmpty().withMessage('Manfaat wajib diisi'),
    body('recipe').notEmpty().withMessage('Resep wajib diisi'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, age_range, benefits, recipe, ingredients, image_url, category } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO food_menu (name, age_range, benefits, recipe, ingredients, image_url, category, created_by, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING *`,
        [name, age_range, benefits, recipe, JSON.stringify(ingredients || []), image_url || null, category || null, req.user.id]
      );

      res.status(201).json({ food: result.rows[0] });
    } catch (err) {
      console.error('Create food error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// ============================
// ADMIN: Update food menu
// ============================
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, age_range, benefits, recipe, image_url, category, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE food_menu SET
        name = COALESCE($1, name),
        age_range = COALESCE($2, age_range),
        benefits = COALESCE($3, benefits),
        recipe = COALESCE($4, recipe),
        image_url = COALESCE($5, image_url),
        category = COALESCE($6, category),
        is_active = COALESCE($7, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, age_range, benefits, recipe, image_url, category, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu makanan tidak ditemukan' });
    }

    res.json({ food: result.rows[0] });
  } catch (err) {
    console.error('Update food error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// ADMIN: Delete food menu
// ============================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE food_menu SET is_active = false WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu makanan tidak ditemukan' });
    }

    res.json({ message: 'Menu makanan berhasil dihapus' });
  } catch (err) {
    console.error('Delete food error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
