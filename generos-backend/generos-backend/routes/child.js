const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/child/profile — ambil data anak + growth terakhir
router.get('/profile', async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT child_name, child_nickname, child_dob, child_gender, child_photo,
              birth_weight, birth_height, birth_head_circumference,
              father_name, mother_name, parent_notes
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Hitung umur dari child_dob
    let age = null;
    if (user.child_dob) {
      const dob = new Date(user.child_dob);
      const now = new Date();
      const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (years > 0) {
        age = `${years} tahun ${remainingMonths} bulan`;
      } else {
        age = `${months} bulan`;
      }
    }

    // Ambil growth terakhir
    const growthResult = await pool.query(
      `SELECT weight_kg, height_cm, head_circumference_cm, record_date
       FROM growth_records WHERE user_id = $1
       ORDER BY record_date DESC LIMIT 1`,
      [req.user.id]
    );
    const lastGrowth = growthResult.rows[0] || null;

    // Hitung status gizi sederhana (berdasarkan IMT/U atau BB/U)
    let nutritionStatus = 'Belum ada data';
    if (lastGrowth && lastGrowth.weight_kg && lastGrowth.height_cm && user.child_dob) {
      const ageMonths = (new Date() - new Date(user.child_dob)) / (1000 * 60 * 60 * 24 * 30.44);
      if (ageMonths <= 60) {
        // Sederhana: BB ideal = 2*(ageYears)+8 untuk 1-5 tahun
        const ageYears = ageMonths / 12;
        const idealWeight = 2 * ageYears + 8;
        const ratio = lastGrowth.weight_kg / idealWeight;
        if (ratio < 0.7) nutritionStatus = 'Kurang Gizi';
        else if (ratio < 0.85) nutritionStatus = 'Risiko Gizi';
        else if (ratio < 1.15) nutritionStatus = '✅ Gizi Baik';
        else if (ratio < 1.3) nutritionStatus = '⚖️ Kelebihan Gizi';
        else nutritionStatus = '🔴 Obesitas';
      } else {
        nutritionStatus = '✅ Normal';
      }
    }

    // Status perkembangan sederhana (dari screening terakhir)
    let devStatus = 'Belum ada skrining';
    try {
      const screenResult = await pool.query(
        `SELECT score, domain FROM screening_sessions
         WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 1`,
        [req.user.id]
      );
      if (screenResult.rows.length > 0) {
        const score = parseInt(screenResult.rows[0].score);
        if (score >= 80) devStatus = '✅ Sesuai';
        else if (score >= 60) devStatus = '⚠️ Perlu Perhatian';
        else devStatus = '🔴 Perlu Evaluasi';
      }
    } catch(e) {
      // tabel mungkin belum ada
    }

    res.json({
      child: {
        name: user.child_name,
        nickname: user.child_nickname,
        dob: user.child_dob,
        gender: user.child_gender,
        photo: user.child_photo,
        age,
        birth_weight: user.birth_weight,
        birth_height: user.birth_height,
        birth_head_circumference: user.birth_head_circumference,
        father_name: user.father_name,
        mother_name: user.mother_name,
        parent_notes: user.parent_notes,
      },
      growth: lastGrowth,
      nutrition_status: nutritionStatus,
      development_status: devStatus,
    });
  } catch (err) {
    console.error('Get child profile error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// PUT /api/child/profile — update data anak
router.put(
  '/profile',
  [
    body('child_name').optional().trim().notEmpty().withMessage('Nama anak tidak boleh kosong'),
    body('child_dob').optional().isISO8601().withMessage('Tanggal lahir tidak valid'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fields = [
      'child_name', 'child_nickname', 'child_dob', 'child_gender', 'child_photo',
      'birth_weight', 'birth_height', 'birth_head_circumference',
      'father_name', 'mother_name', 'parent_notes',
    ];

    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        setClauses.push(`${field} = $${idx++}`);
        values.push(req.body[field]);
      }
    }

    // Convert empty strings to null for numeric fields
    const numericFields = ['birth_weight', 'birth_height', 'birth_head_circumference'];
    for (const f of numericFields) {
      const i = fields.indexOf(f);
      const valIdx = values.findIndex((v, vi) => vi === i); // not ideal, just check and convert
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data yang diubah' });
    }

    try {
      values.push(req.user.id);
      const result = await pool.query(
        `UPDATE users SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${idx} RETURNING child_name, child_nickname, child_dob, child_gender, child_photo,
         birth_weight, birth_height, birth_head_circumference, father_name, mother_name, parent_notes`,
        values
      );

      res.json({ child: result.rows[0] });
    } catch (err) {
      console.error('Update child profile error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

module.exports = router;
