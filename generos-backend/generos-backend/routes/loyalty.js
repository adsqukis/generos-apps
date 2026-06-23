const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// ============================
// HELPER — hitung saldo poin user (ledger: kode masuk - hadiah keluar)
// Sumber kebenaran = penjumlahan, bukan kolom counter, biar auditable.
// ============================
async function getBalance(userId) {
  const earned = await pool.query(
    `SELECT COALESCE(SUM(points_value), 0) AS total
       FROM loyalty_codes
      WHERE redeemed_by = $1`,
    [userId]
  );
  const spent = await pool.query(
    `SELECT COALESCE(SUM(points_spent), 0) AS total
       FROM loyalty_redemptions
      WHERE user_id = $1 AND status <> 'cancelled'`,
    [userId]
  );
  return parseInt(earned.rows[0].total, 10) - parseInt(spent.rows[0].total, 10);
}

// ============================
// GET /api/loyalty/summary
// Saldo + riwayat kode + riwayat tukar hadiah
// ============================
router.get('/summary', async (req, res) => {
  try {
    const totalPoints = await getBalance(req.user.id);

    const codes = await pool.query(
      `SELECT code, points_value, redeemed_at
         FROM loyalty_codes
        WHERE redeemed_by = $1
        ORDER BY redeemed_at DESC
        LIMIT 50`,
      [req.user.id]
    );

    const redemptions = await pool.query(
      `SELECT r.id, r.points_spent, r.status, r.redeemed_at,
              g.name AS gift_name, g.image_url AS gift_image
         FROM loyalty_redemptions r
         LEFT JOIN loyalty_gifts g ON g.id = r.gift_id
        WHERE r.user_id = $1
        ORDER BY r.redeemed_at DESC
        LIMIT 50`,
      [req.user.id]
    );

    res.json({
      totalPoints,
      redeemedCodes: codes.rows,
      redemptions: redemptions.rows,
    });
  } catch (err) {
    console.error('Loyalty summary error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// POST /api/loyalty/redeem-code
// Validasi kode unik dari pembelian. Atomic claim cegah double-redeem.
// ============================
router.post('/redeem-code', async (req, res) => {
  const raw = (req.body.code || '').trim().toUpperCase();
  if (!raw) {
    return res.status(400).json({ success: false, error: 'Kode tidak boleh kosong' });
  }

  try {
    // Cek dulu apakah kode ada & aktif
    const found = await pool.query(
      `SELECT id, points_value, redeemed_by, is_active
         FROM loyalty_codes
        WHERE code = $1`,
      [raw]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Kode tidak valid' });
    }
    const row = found.rows[0];
    if (!row.is_active) {
      return res.status(400).json({ success: false, error: 'Kode tidak aktif atau sudah kedaluwarsa' });
    }
    if (row.redeemed_by) {
      // Bedakan: dipakai sendiri vs orang lain
      if (row.redeemed_by === req.user.id) {
        return res.status(409).json({ success: false, error: 'Kode ini sudah kamu pakai sebelumnya' });
      }
      return res.status(409).json({ success: false, error: 'Kode sudah digunakan sebelumnya' });
    }

    // Atomic claim: hanya berhasil kalau masih NULL saat UPDATE dijalankan.
    // Ini titik anti-race: dua request bersamaan, cuma satu yang dapat row.
    const claim = await pool.query(
      `UPDATE loyalty_codes
          SET redeemed_by = $1, redeemed_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND redeemed_by IS NULL AND is_active = true
        RETURNING points_value`,
      [req.user.id, row.id]
    );

    if (claim.rows.length === 0) {
      // Keburu diklaim request lain di antara SELECT dan UPDATE
      return res.status(409).json({ success: false, error: 'Kode sudah digunakan sebelumnya' });
    }

    const pointsAdded = parseInt(claim.rows[0].points_value, 10);
    const totalPoints = await getBalance(req.user.id);

    res.json({
      success: true,
      message: `Kode valid! Kamu dapat ${pointsAdded} poin`,
      pointsAdded,
      totalPoints,
      codeAlreadyUsed: false,
    });
  } catch (err) {
    console.error('Redeem code error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server' });
  }
});

// ============================
// GET /api/loyalty/gifts
// Katalog hadiah + saldo user (biar frontend bisa render tombol enable/disable)
// ============================
router.get('/gifts', async (req, res) => {
  try {
    const gifts = await pool.query(
      `SELECT id, name, description, image_url, points_required, stock
         FROM loyalty_gifts
        WHERE is_active = true
        ORDER BY points_required ASC`
    );
    const totalPoints = await getBalance(req.user.id);
    res.json({ totalPoints, gifts: gifts.rows });
  } catch (err) {
    console.error('Loyalty gifts error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// POST /api/loyalty/redeem-gift
// Tukar poin -> hadiah. Transaksi + lock stok biar konsisten.
// ============================
router.post('/redeem-gift', async (req, res) => {
  const giftId = req.body.giftId;
  if (!giftId) {
    return res.status(400).json({ success: false, error: 'Hadiah tidak dipilih' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock baris gift biar stok gak balapan
    const giftRes = await client.query(
      `SELECT id, name, points_required, stock, is_active
         FROM loyalty_gifts
        WHERE id = $1
        FOR UPDATE`,
      [giftId]
    );

    if (giftRes.rows.length === 0 || !giftRes.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Hadiah tidak tersedia' });
    }
    const gift = giftRes.rows[0];

    if (gift.stock !== null && gift.stock <= 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'Stok hadiah habis' });
    }

    // Hitung saldo di dalam transaksi (pakai koneksi yg sama)
    const earned = await client.query(
      `SELECT COALESCE(SUM(points_value),0) AS t FROM loyalty_codes WHERE redeemed_by = $1`,
      [req.user.id]
    );
    const spent = await client.query(
      `SELECT COALESCE(SUM(points_spent),0) AS t FROM loyalty_redemptions WHERE user_id = $1 AND status <> 'cancelled'`,
      [req.user.id]
    );
    const balance = parseInt(earned.rows[0].t, 10) - parseInt(spent.rows[0].t, 10);

    if (balance < gift.points_required) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Poin kamu belum cukup' });
    }

    // Kurangi stok (kalau di-track) + catat redemption
    if (gift.stock !== null) {
      await client.query(`UPDATE loyalty_gifts SET stock = stock - 1 WHERE id = $1`, [gift.id]);
    }
    await client.query(
      `INSERT INTO loyalty_redemptions (user_id, gift_id, points_spent, status)
       VALUES ($1, $2, $3, 'pending')`,
      [req.user.id, gift.id, gift.points_required]
    );

    await client.query('COMMIT');

    const totalPoints = balance - gift.points_required;
    res.json({
      success: true,
      message: `Selamat! Kamu dapat ${gift.name}`,
      giftName: gift.name,
      pointsSpent: gift.points_required,
      totalPoints,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Redeem gift error:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
});

// ============================
// ADMIN — generate batch kode unik
// POST /api/loyalty/admin/generate-codes { count, pointsValue }
// ============================
router.post('/admin/generate-codes', requireAdmin, async (req, res) => {
  const count = Math.min(parseInt(req.body.count, 10) || 1, 500);
  const pointsValue = parseInt(req.body.pointsValue, 10) || 50;

  function segment() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0/O/1/I biar gak ketuker
    let s = '';
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  function makeCode() {
    return `GENEROS-${segment()}-${segment()}-${segment()}`;
  }

  try {
    const created = [];
    for (let i = 0; i < count; i++) {
      const code = makeCode();
      try {
        await pool.query(
          `INSERT INTO loyalty_codes (code, points_value, is_active) VALUES ($1, $2, true)`,
          [code, pointsValue]
        );
        created.push(code);
      } catch (e) {
        if (e.message.includes('duplicate')) { i--; continue; } // tabrakan, ulang
        throw e;
      }
    }
    res.json({ success: true, count: created.length, pointsValue, codes: created });
  } catch (err) {
    console.error('Generate codes error:', err);
    res.status(500).json({ success: false, error: 'Gagal generate kode' });
  }
});

// ============================
// ADMIN — tambah/update hadiah
// POST /api/loyalty/admin/gifts { name, description, imageUrl, pointsRequired, stock }
// ============================
router.post('/admin/gifts', requireAdmin, async (req, res) => {
  const { name, description, imageUrl, pointsRequired, stock } = req.body;
  if (!name || !pointsRequired) {
    return res.status(400).json({ success: false, error: 'Nama & poin wajib diisi' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO loyalty_gifts (name, description, image_url, points_required, stock, is_active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [name, description || null, imageUrl || null, parseInt(pointsRequired, 10), stock != null ? parseInt(stock, 10) : null]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Add gift error:', err);
    res.status(500).json({ success: false, error: 'Gagal menambah hadiah' });
  }
});

module.exports = router;
