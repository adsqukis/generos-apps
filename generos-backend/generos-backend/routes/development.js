const express = require('express');
const router = express.Router();
const moment = require('moment');
const { Pool } = require('pg');
const { getMilestones, getDevTip, getRecommendations, getTimeline } = require('../config/milestones');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

// Middleware auth
function auth(req, res, next) {
  // Simplified - assumes auth middleware already applied at parent router level
  next();
}

// GET /api/development — main page data
router.get('/', async (req, res) => {
  try {
    const ageQuery = req.query.age ? parseInt(req.query.age) : null;
    // Get child age from user data
    const user = await pool.query('SELECT child_dob, child_name FROM users WHERE id = $1', [req.user.id]);
    if (!user.rows[0] || !user.rows[0].child_dob) {
      return res.status(400).json({ error: 'Data anak belum lengkap' });
    }
    const dob = new Date(user.rows[0].child_dob);
    const ageMonths = ageQuery || Math.floor((new Date() - dob) / (1000 * 60 * 60 * 24 * 30));
    const childName = user.rows[0].child_name || 'Anak';

    // Count completed milestones from screening
    const screenResult = await pool.query(
      `SELECT sa.answer, sq.question_text, sq.domain
       FROM screening_answers sa
       JOIN screening_questions sq ON sa.question_id = sq.id
       JOIN screening_sessions ss ON sa.session_id = ss.id
       WHERE ss.user_id = $1 AND sa.answer = 'yes'`,
      [req.user.id]
    );
    const completedMilestones = screenResult.rows.map(r => ({
      title: r.question_text,
      category: r.domain,
    }));

    const milestones = getMilestones(ageMonths);
    const totalMilestones = milestones.length;
    const completed = completedMilestones.length;
    const progress = totalMilestones > 0 ? Math.round((completed / totalMilestones) * 100) : 0;

    // Score based on screening results
    const scoreResult = await pool.query(
      `SELECT AVG(ss.score_percentage) as avg_score FROM screening_sessions ss WHERE ss.user_id = $1 AND ss.completed_at IS NOT NULL`,
      [req.user.id]
    );
    const avgScore = scoreResult.rows[0] && scoreResult.rows[0].avg_score !== null
      ? Math.round(parseFloat(scoreResult.rows[0].avg_score)) : null;

    let scoreCategory = 'Belum ada data';
    if (avgScore !== null) {
      if (avgScore >= 90) scoreCategory = 'Sangat Baik';
      else if (avgScore >= 75) scoreCategory = 'Sesuai Usia';
      else if (avgScore >= 60) scoreCategory = 'Perlu Stimulasi Tambahan';
      else scoreCategory = 'Perlu Konsultasi';
    }

    // By category
    const byCategory = {};
    milestones.forEach(m => {
      if (!byCategory[m.category]) byCategory[m.category] = { total: 0, completed: 0, items: [] };
      byCategory[m.category].total++;
      const isDone = completedMilestones.some(c => c.title === m.title);
      if (isDone) byCategory[m.category].completed++;
      byCategory[m.category].items.push({ ...m, done: isDone });
    });

    // Dev tip
    const tip = getDevTip(ageMonths);
    const recs = getRecommendations(ageMonths);
    const timeline = getTimeline(ageMonths);

    res.json({
      child_name: childName,
      age_months: ageMonths,
      age_label: `${ageMonths} bulan ${Math.floor((new Date() - dob) % (30*24*60*60*1000) / (24*60*60*1000))} hari`,
      tip,
      recommended: recs.do || [],
      not_recommended: recs.dont || [],
      milestones: milestones,
      by_category: byCategory,
      progress: { completed, total: totalMilestones, percentage: progress },
      score: { value: avgScore, label: scoreCategory },
      timeline: timeline,
      insight: `Hari ini ${childName} berusia ${ageMonths} bulan. ${tip}`,
    });
  } catch (err) {
    console.error('Development error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/development/milestones
router.get('/milestones', async (req, res) => {
  try {
    const age = parseInt(req.query.age) || 0;
    const milestones = getMilestones(age);
    res.json({ milestones, total: milestones.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/development/timeline
router.get('/timeline', async (req, res) => {
  try {
    const age = parseInt(req.query.age) || 0;
    const timeline = getTimeline(age);
    res.json({ timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/development/screening — quick early warning check
router.post('/screening', async (req, res) => {
  try {
    const { answers } = req.body; // { question: yes/no }
    const age = parseInt(req.query.age) || 0;
    const milestones = getMilestones(age);
    let noCount = 0;
    Object.values(answers || {}).forEach(a => { if (a === 'no') noCount++; });
    const total = Object.keys(answers || {}).length;
    let warning = null;
    let recommendation = 'Perkembangan anak sesuai usia. Terus lakukan stimulasi rutin!';
    if (noCount > total / 2) {
      warning = 'Beberapa indikator perkembangan belum tercapai.';
      recommendation = 'Disarankan berkonsultasi dengan dokter anak untuk evaluasi lebih lanjut.';
    } else if (noCount > 0) {
      warning = 'Ada beberapa indikator yang masih perlu distimulasi.';
      recommendation = 'Fokus pada stimulasi area yang masih belum tercapai.';
    }
    res.json({
      warning,
      recommendation,
      no_count: noCount,
      total,
      passed: total - noCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
