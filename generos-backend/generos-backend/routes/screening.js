const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// ============================
// USER DOMAINS
// ============================

// GET user's active domains
router.get('/domains', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT domain FROM user_domains WHERE user_id = $1 AND is_active = true ORDER BY domain`,
      [req.user.id]
    );
    res.json({ domains: result.rows.map(r => r.domain) });
  } catch (err) {
    console.error('Get domains error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// POST set user domains
router.post('/domains', async (req, res) => {
  const { domains } = req.body;
  if (!Array.isArray(domains) || domains.length === 0) {
    return res.status(400).json({ error: 'Pilih minimal 1 domain' });
  }

  const validDomains = ['cognitive', 'speech', 'immunity', 'motor'];
  const invalid = domains.filter(d => !validDomains.includes(d));
  if (invalid.length > 0) {
    return res.status(400).json({ error: 'Domain tidak valid: ' + invalid.join(', ') });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Deactivate all, then insert active ones
    await client.query(`UPDATE user_domains SET is_active = false WHERE user_id = $1`, [req.user.id]);
    for (const domain of domains) {
      await client.query(
        `INSERT INTO user_domains (user_id, domain) VALUES ($1, $2)
         ON CONFLICT (user_id, domain) DO UPDATE SET is_active = true`,
        [req.user.id, domain]
      );
    }
    await client.query('COMMIT');
    res.json({ domains });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Set domains error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
});

// ============================
// SCREENING QUESTIONS
// ============================

// GET screening questions by domain + age
router.get('/questions', async (req, res) => {
  const { domain, age } = req.query;
  if (!domain || !age) {
    return res.status(400).json({ error: 'Parameter domain dan age (dalam bulan) wajib diisi' });
  }

  const childAge = parseInt(age);
  if (isNaN(childAge) || childAge < 0 || childAge > 72) {
    return res.status(400).json({ error: 'Usia tidak valid (0-72 bulan)' });
  }

  try {
    const result = await pool.query(
      `SELECT id, domain, age_min, age_max, question_text, question_type, options, sort_order
       FROM screening_questions
       WHERE domain = $1 AND age_min <= $2 AND age_max >= $2 AND is_active = true
       ORDER BY sort_order`,
      [domain, childAge]
    );
    res.json({ questions: result.rows, child_age_months: childAge, domain });
  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// SCREENING SESSIONS
// ============================

// POST start a new screening session
router.post('/sessions', async (req, res) => {
  const { domain, child_age_months } = req.body;
  if (!domain || !child_age_months) {
    return res.status(400).json({ error: 'Domain dan usia anak wajib diisi' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO screening_sessions (user_id, domain, child_age_months, status)
       VALUES ($1, $2, $3, 'in_progress')
       RETURNING id, domain, child_age_months, status, started_at`,
      [req.user.id, domain, child_age_months]
    );
    res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// POST submit answer for current session
router.post('/sessions/:id/answer', async (req, res) => {
  const { question_id, answer } = req.body;
  if (!question_id || !answer) {
    return res.status(400).json({ error: 'Question ID dan answer wajib diisi' });
  }

  try {
    // Verify session belongs to user
    const sessionCheck = await pool.query(
      `SELECT id, status FROM screening_sessions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    }
    if (sessionCheck.rows[0].status === 'completed') {
      return res.status(400).json({ error: 'Sesi sudah selesai' });
    }

    // Save answer (upsert)
    const result = await pool.query(
      `INSERT INTO screening_answers (session_id, question_id, answer)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, question_id) DO UPDATE SET answer = $3, answered_at = CURRENT_TIMESTAMP
       RETURNING id, question_id, answer`,
      [req.params.id, question_id, answer]
    );

    res.json({ answer: result.rows[0] });
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// POST complete screening session + calculate result
router.post('/sessions/:id/complete', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify session
    const sessionCheck = await client.query(
      `SELECT id, domain, child_age_months, status FROM screening_sessions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (sessionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    }
    if (sessionCheck.rows[0].status === 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Sesi sudah selesai' });
    }

    const session = sessionCheck.rows[0];

    // Count answers
    const answerCount = await client.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE answer = 'yes') as yes_count
       FROM screening_answers WHERE session_id = $1`,
      [req.params.id]
    );

    const { total, yes_count } = answerCount.rows[0];
    const totalInt = parseInt(total);
    const yesInt = parseInt(yes_count);
    const score = totalInt > 0 ? Math.round((yesInt / totalInt) * 100) : 0;

    // KPSP Scoring:
    // - 9-10 pertanyaan
    // - Sesuai: jawab "Ya" ≥ 90% (atau minimal sesuai threshold)
    // - Meragukan: 70-89%
    // - Menyimpang: < 70%
    let result;
    if (score >= 90) result = 'sesuai';
    else if (score >= 70) result = 'meragukan';
    else result = 'menyimpang';

    // Update session
    await client.query(
      `UPDATE screening_sessions 
       SET total_questions = $1, answered_yes = $2, score_percentage = $3, result = $4, status = 'completed', completed_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [totalInt, yesInt, score, result, req.params.id]
    );

    await client.query('COMMIT');

    // Generate stimulation recommendations if needed
    if (result !== 'sesuai') {
      generateRecommendations(req.user.id, req.params.id, session.domain, result);
    }

    res.json({
      session_id: req.params.id,
      domain: session.domain,
      child_age_months: session.child_age_months,
      total_questions: totalInt,
      answered_yes: yesInt,
      score_percentage: score,
      result
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Complete session error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
});

// GET screening history
router.get('/sessions', async (req, res) => {
  const { domain, limit } = req.query;
  try {
    let query = `SELECT id, domain, child_age_months, total_questions, answered_yes, 
                        score_percentage, result, status, started_at, completed_at
                 FROM screening_sessions WHERE user_id = $1`;
    const params = [req.user.id];

    if (domain) {
      params.push(domain);
      query += ` AND domain = $${params.length}`;
    }

    query += ` ORDER BY started_at DESC`;
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    const result = await pool.query(query, params);
    res.json({ sessions: result.rows });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET session detail with answers
router.get('/sessions/:id', async (req, res) => {
  try {
    const sessionResult = await pool.query(
      `SELECT * FROM screening_sessions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    }

    const answersResult = await pool.query(
      `SELECT sa.id, sa.question_id, sa.answer, sq.question_text, sq.sort_order
       FROM screening_answers sa
       JOIN screening_questions sq ON sq.id = sa.question_id
       WHERE sa.session_id = $1
       ORDER BY sq.sort_order`,
      [req.params.id]
    );

    res.json({
      session: sessionResult.rows[0],
      answers: answersResult.rows
    });
  } catch (err) {
    console.error('Get session detail error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// HELPER: Generate recommendations
// ============================
async function generateRecommendations(userId, sessionId, domain, result) {
  try {
    // Get the session's age
    const session = await pool.query(
      `SELECT child_age_months FROM screening_sessions WHERE id = $1`,
      [sessionId]
    );
    const age = session.rows[0]?.child_age_months || 12;

    // Find relevant activities for this domain + age + result
    const activities = await pool.query(
      `SELECT id FROM stimulation_activities 
       WHERE domain = $1 AND age_min <= $2 AND age_max >= $2 
       AND category IN ('screening_result', 'general') AND is_active = true
       ORDER BY category
       LIMIT 5`,
      [domain, age]
    );

    for (const act of activities.rows) {
      await pool.query(
        `INSERT INTO stimulation_recommendations (user_id, activity_id, source, session_id, reason)
         VALUES ($1, $2, 'screening', $3, $4)
         ON CONFLICT DO NOTHING`,
        [userId, act.id, sessionId, `Hasil screening ${domain}: ${result}`]
      );
    }
  } catch (err) {
    console.error('Generate recommendations error:', err);
  }
}

module.exports = router;
