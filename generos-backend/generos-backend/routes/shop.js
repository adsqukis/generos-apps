const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ============================
// PUBLIC: List products
// ============================
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC`
    );
    res.json({ products: result.rows });
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// PUBLIC: Get single product
// ============================
router.get('/products/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM products WHERE id = $1 AND is_active = true`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    res.json({ product: result.rows[0] });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// Track click + get redirect URL (optional auth - works for guest too)
// ============================
router.post('/products/:id/click', async (req, res) => {
  try {
    const productResult = await pool.query(
      `SELECT shopee_link FROM products WHERE id = $1 AND is_active = true`,
      [req.params.id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    // Try to get user_id if authenticated (optional)
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Ignore - guest click
      }
    }

    await pool.query(
      `INSERT INTO product_clicks (user_id, product_id) VALUES ($1, $2)`,
      [userId, req.params.id]
    );

    const shopeeLink = productResult.rows[0].shopee_link;
    const trackedLink = `${shopeeLink}${shopeeLink.includes('?') ? '&' : '?'}utm_source=generos_app&utm_medium=app`;

    res.json({ redirect_url: trackedLink });
  } catch (err) {
    console.error('Track click error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// ADMIN: Create product
// ============================
router.post(
  '/products',
  authenticateToken,
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Nama produk wajib diisi'),
    body('price').isNumeric().withMessage('Harga harus berupa angka'),
    body('shopee_link').isURL().withMessage('Link Shopee tidak valid'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, image_url, shopee_link, category, images } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO products (name, description, price, image_url, images, shopee_link, category, created_by, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING *`,
        [name, description || null, price, image_url || null, JSON.stringify(images || []), shopee_link, category || null, req.user.id]
      );

      res.status(201).json({ product: result.rows[0] });
    } catch (err) {
      console.error('Create product error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// ============================
// ADMIN: Update product
// ============================
router.put('/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, price, image_url, images, shopee_link, category, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        image_url = COALESCE($4, image_url),
        images = COALESCE($5, images),
        shopee_link = COALESCE($6, shopee_link),
        category = COALESCE($7, category),
        is_active = COALESCE($8, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, description, price, image_url, images ? JSON.stringify(images) : null, shopee_link, category, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    res.json({ product: result.rows[0] });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// ADMIN: Delete product
// ============================
router.delete('/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE products SET is_active = false WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// ADMIN: Analytics - click stats
// ============================
router.get('/analytics/clicks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.name, p.id, COUNT(pc.id) as click_count
       FROM products p
       LEFT JOIN product_clicks pc ON pc.product_id = p.id
       GROUP BY p.id, p.name
       ORDER BY click_count DESC`
    );
    res.json({ analytics: result.rows });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
