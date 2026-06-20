const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// ============================
// STIMULATION ACTIVITIES
// ============================

// GET general stimulation by age
router.get('/general', async (req, res) => {
  const { age, domain } = req.query;
  if (!age) return res.status(400).json({ error: 'Parameter age (bulan) wajib diisi' });

  try {
    const childAge = parseInt(age);
    let query = `SELECT id, domain, title, description, age_min, age_max, duration, difficulty, materials, category
                 FROM stimulation_activities 
                 WHERE age_min <= $1 AND age_max >= $1 AND is_active = true AND category = 'general'`;
    const params = [childAge];

    if (domain) {
      params.push(domain);
      query += ` AND domain = $${params.length}`;
    }

    query += ` ORDER BY domain, sort_order`;
    const result = await pool.query(query, params);
    res.json({ activities: result.rows, child_age_months: childAge });
  } catch (err) {
    console.error('Get general stimulation error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// RECOMMENDATIONS
// ============================

// GET user's pending recommendations
router.get('/recommendations', async (req, res) => {
  const { status } = req.query; // pending, completed, dismissed, or all
  try {
    let query = `SELECT sr.id, sr.source, sr.reason, sr.status, sr.created_at,
                        sa.id as activity_id, sa.title, sa.description, sa.domain,
                        sa.duration, sa.difficulty, sa.materials, sa.category
                 FROM stimulation_recommendations sr
                 JOIN stimulation_activities sa ON sa.id = sr.activity_id
                 WHERE sr.user_id = $1`;
    const params = [req.user.id];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND sr.status = $${params.length}`;
    }

    query += ` ORDER BY sr.created_at DESC LIMIT 20`;
    const result = await pool.query(query, params);
    res.json({ recommendations: result.rows });
  } catch (err) {
    console.error('Get recommendations error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// PATCH update recommendation status
router.patch('/recommendations/:id', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'completed', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid' });
  }

  try {
    const result = await pool.query(
      `UPDATE stimulation_recommendations 
       SET status = $1, completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = $2 AND user_id = $3
       RETURNING id, status`,
      [status, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rekomendasi tidak ditemukan' });
    }

    res.json({ recommendation: result.rows[0] });
  } catch (err) {
    console.error('Update recommendation error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// POST generate recommendation from tracking/kendala
router.post('/from-tracking', async (req, res) => {
  const { domain, kendala, child_age_months } = req.body;
  if (!domain || !kendala || !child_age_months) {
    return res.status(400).json({ error: 'Domain, kendala, dan usia anak wajib diisi' });
  }

  try {
    // Cari aktivitas yang relevan berdasarkan domain + usia + keyword
    const keywords = kendala.toLowerCase().split(' ').filter(w => w.length > 3);
    
    let query = `SELECT id, title, description, duration, difficulty, materials
                 FROM stimulation_activities 
                 WHERE domain = $1 AND age_min <= $2 AND age_max >= $2 
                 AND is_active = true AND category IN ('tracking_kendala', 'general')
                 ORDER BY category`;
    const params = [domain, parseInt(child_age_months)];

    const result = await pool.query(query, params);
    const activities = result.rows;

    if (activities.length === 0) {
      return res.json({ recommendations: [], message: 'Belum ada aktivitas stimulasi untuk usia ini' });
    }

    // Simple keyword matching to rank
    const ranked = activities.map(act => {
      const text = (act.title + ' ' + act.description).toLowerCase();
      const matchScore = keywords.filter(k => text.includes(k)).length;
      return { ...act, match_score: matchScore };
    }).sort((a, b) => b.match_score - a.match_score);

    const top = ranked.slice(0, 3);

    // Save as recommendations
    const inserted = [];
    for (const act of top) {
      const rec = await pool.query(
        `INSERT INTO stimulation_recommendations (user_id, activity_id, source, reason)
         VALUES ($1, $2, 'tracking', $3)
         RETURNING id`,
        [req.user.id, act.id, `Dari kendala: ${kendala}`]
      );
      inserted.push({ id: rec.rows[0].id, ...act });
    }

    res.json({ recommendations: inserted, source: 'tracking' });
  } catch (err) {
    console.error('From tracking error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
