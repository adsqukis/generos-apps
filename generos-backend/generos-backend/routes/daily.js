const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, query, param, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Helper: ambil tanggal dari query, default hari ini (YYYY-MM-DD)
function getDate(req) {
  const d = req.query.date;
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return new Date().toISOString().split('T')[0];
}

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

// ============================
// SLEEP (Tidur)
// ============================
router.get('/sleep', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sleep_records WHERE user_id = $1 AND record_date = $2
       ORDER BY sleep_start ASC, created_at ASC`,
      [req.user.id, getDate(req)]
    );
    res.json({ records: result.rows });
  } catch (err) {
    console.error('Get sleep error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post(
  '/sleep',
  [
    body('record_date').isDate().withMessage('Tanggal tidak valid'),
    body('duration_minutes').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0, max: 1440 }).withMessage('Durasi tidak valid'),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    const { record_date, sleep_start, sleep_end, duration_minutes, notes } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO sleep_records (user_id, record_date, sleep_start, sleep_end, duration_minutes, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.user.id, record_date, sleep_start || null, sleep_end || null, duration_minutes || null, notes || null]
      );
      res.status(201).json({ record: result.rows[0] });
    } catch (err) {
      console.error('Create sleep error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

router.delete('/sleep/:id', [param('id').isUUID().withMessage('ID tidak valid')], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const result = await pool.query(
      `DELETE FROM sleep_records WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error('Delete sleep error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// FEEDING (Menyusui)
// ============================
router.get('/feeding', async (req, res) => {
  try {
    let query = `SELECT * FROM feeding_records WHERE user_id = $1 AND record_date = $2`;
    const params = [req.user.id, getDate(req)];
    // Optional filter by feeding_type (e.g., ?type=MPASI)
    if (req.query.type) {
      query += ` AND feeding_type = $3`;
      params.push(req.query.type);
    }
    query += ` ORDER BY created_at ASC`;
    const result = await pool.query(query, params);
    res.json({ records: result.rows });
  } catch (err) {
    console.error('Get feeding error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post(
  '/feeding',
  [
    body('record_date').isDate().withMessage('Tanggal tidak valid'),
    body('feeding_type').trim().notEmpty().isLength({ max: 50 }).withMessage('Jenis pemberian wajib diisi'),
    body('amount_ml').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0, max: 5000 }).withMessage('Jumlah tidak valid'),
    body('duration_minutes').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0, max: 1440 }).withMessage('Durasi tidak valid'),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    const { record_date, feeding_type, amount_ml, duration_minutes, notes } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO feeding_records (user_id, record_date, feeding_type, amount_ml, duration_minutes, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.user.id, record_date, feeding_type, amount_ml || null, duration_minutes || null, notes || null]
      );
      res.status(201).json({ record: result.rows[0] });
    } catch (err) {
      console.error('Create feeding error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

router.delete('/feeding/:id', [param('id').isUUID().withMessage('ID tidak valid')], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const result = await pool.query(
      `DELETE FROM feeding_records WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error('Delete feeding error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// DRINK (Minum)
// ============================
router.get('/drink', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM drink_records WHERE user_id = $1 AND record_date = $2
       ORDER BY created_at ASC`,
      [req.user.id, getDate(req)]
    );
    res.json({ records: result.rows });
  } catch (err) {
    console.error('Get drink error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post(
  '/drink',
  [
    body('record_date').isDate().withMessage('Tanggal tidak valid'),
    body('amount_ml').isFloat({ min: 0, max: 5000 }).withMessage('Jumlah tidak valid'),
    body('drink_type').optional({ nullable: true, checkFalsy: true }).isLength({ max: 50 }).withMessage('Jenis minuman tidak valid'),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    const { record_date, drink_type, amount_ml, notes } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO drink_records (user_id, record_date, drink_type, amount_ml, notes)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.user.id, record_date, drink_type || 'air', amount_ml, notes || null]
      );
      res.status(201).json({ record: result.rows[0] });
    } catch (err) {
      console.error('Create drink error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

router.delete('/drink/:id', [param('id').isUUID().withMessage('ID tidak valid')], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const result = await pool.query(
      `DELETE FROM drink_records WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error('Delete drink error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// PEE (BAK)
// ============================
router.get('/pee', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM pee_records WHERE user_id = $1 AND record_date = $2
       ORDER BY created_at ASC`,
      [req.user.id, getDate(req)]
    );
    res.json({ records: result.rows });
  } catch (err) {
    console.error('Get pee error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post(
  '/pee',
  [
    body('record_date').isDate().withMessage('Tanggal tidak valid'),
    body('count').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('Jumlah tidak valid'),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    const { record_date, count, notes } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO pee_records (user_id, record_date, count, notes)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.id, record_date, count || 1, notes || null]
      );
      res.status(201).json({ record: result.rows[0] });
    } catch (err) {
      console.error('Create pee error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

router.delete('/pee/:id', [param('id').isUUID().withMessage('ID tidak valid')], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const result = await pool.query(
      `DELETE FROM pee_records WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error('Delete pee error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// POOP (BAB)
// ============================
router.get('/poop', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM poop_records WHERE user_id = $1 AND record_date = $2
       ORDER BY created_at ASC`,
      [req.user.id, getDate(req)]
    );
    res.json({ records: result.rows });
  } catch (err) {
    console.error('Get poop error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post(
  '/poop',
  [
    body('record_date').isDate().withMessage('Tanggal tidak valid'),
    body('count').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('Jumlah tidak valid'),
    body('consistency').optional({ nullable: true, checkFalsy: true }).isLength({ max: 50 }).withMessage('Konsistensi tidak valid'),
    body('color').optional({ nullable: true, checkFalsy: true }).isLength({ max: 50 }).withMessage('Warna tidak valid'),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    const { record_date, count, consistency, color, notes } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO poop_records (user_id, record_date, count, consistency, color, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.user.id, record_date, count || 1, consistency || null, color || null, notes || null]
      );
      res.status(201).json({ record: result.rows[0] });
    } catch (err) {
      console.error('Create poop error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

router.delete('/poop/:id', [param('id').isUUID().withMessage('ID tidak valid')], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const result = await pool.query(
      `DELETE FROM poop_records WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error('Delete poop error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// DASHBOARD SUMMARY
// ============================
router.get('/summary', async (req, res) => {
  const date = getDate(req);
  try {
    const [sleep, feeding, eating, drink, pee, poop, growth] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes, COUNT(*) AS count,
                MAX(sleep_end) AS last_time
         FROM sleep_records WHERE user_id = $1 AND record_date = $2`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(amount_ml), 0) AS total_ml,
                MAX(created_at) AS last_time
         FROM feeding_records WHERE user_id = $1 AND record_date = $2 AND feeding_type != 'MPASI'`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(amount_ml), 0) AS total_ml,
                MAX(created_at) AS last_time
         FROM feeding_records WHERE user_id = $1 AND record_date = $2 AND feeding_type = 'MPASI'`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(amount_ml), 0) AS total_ml,
                MAX(created_at) AS last_time
         FROM drink_records WHERE user_id = $1 AND record_date = $2`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT COALESCE(SUM(count), 0) AS total, MAX(created_at) AS last_time
         FROM pee_records WHERE user_id = $1 AND record_date = $2`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT COALESCE(SUM(count), 0) AS total, MAX(created_at) AS last_time
         FROM poop_records WHERE user_id = $1 AND record_date = $2`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT weight_kg, height_cm, head_circumference_cm, record_date
         FROM growth_records WHERE user_id = $1
         ORDER BY record_date DESC, created_at DESC LIMIT 1`,
        [req.user.id]
      ),
    ]);

    res.json({
      date,
      sleep: {
        total_minutes: parseInt(sleep.rows[0].total_minutes) || 0,
        count: parseInt(sleep.rows[0].count) || 0,
        last_time: sleep.rows[0].last_time,
      },
      feeding: {
        count: parseInt(feeding.rows[0].count) || 0,
        total_ml: parseFloat(feeding.rows[0].total_ml) || 0,
        last_time: feeding.rows[0].last_time,
      },
      eating: {
        count: parseInt(eating.rows[0].count) || 0,
        total_ml: parseFloat(eating.rows[0].total_ml) || 0,
        last_time: eating.rows[0].last_time,
      },
      drink: {
        count: parseInt(drink.rows[0].count) || 0,
        total_ml: parseFloat(drink.rows[0].total_ml) || 0,
        last_time: drink.rows[0].last_time,
      },
      pee: {
        total: parseInt(pee.rows[0].total) || 0,
        last_time: pee.rows[0].last_time,
      },
      poop: {
        total: parseInt(poop.rows[0].total) || 0,
        last_time: poop.rows[0].last_time,
      },
      growth: growth.rows[0] || null,
    });
  } catch (err) {
    console.error('Daily summary error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// DEVELOPMENT TODAY (milestone/tip by age in months)
// ============================
const DEVELOPMENT_TIPS = [
  { max: 3, label: '0-3 bulan', tip: 'Sering ajak bicara dan responsif terhadap tangisan. Lakukan kontak mata saat menyusui.' },
  { max: 6, label: '4-6 bulan', tip: "Vokal 'a' mulai sering diucapkan, perkenalkan makanan padat (MPASI) secara bertahap." },
  { max: 9, label: '7-9 bulan', tip: 'Mulai merangkak dan duduk sendiri. Beri mainan aman dan ajak bermain ciluk-ba.' },
  { max: 12, label: '10-12 bulan', tip: 'Mulai berdiri berpegangan dan mengucap kata pertama. Dorong untuk berjalan dengan dituntun.' },
  { max: 18, label: '13-18 bulan', tip: 'Berjalan mandiri dan menumpuk balok. Perbanyak kosakata dengan menyebut nama benda.' },
  { max: 24, label: '19-24 bulan', tip: 'Mulai merangkai 2 kata dan berlari. Ajak bermain peran sederhana dan membaca buku bergambar.' },
  { max: 36, label: '2-3 tahun', tip: 'Bicara dalam kalimat pendek dan mulai latihan toilet. Kenalkan warna, bentuk, dan angka.' },
  { max: 48, label: '3-4 tahun', tip: 'Bisa melompat dan menggambar lingkaran. Dorong interaksi sosial dengan teman sebaya.' },
  { max: 60, label: '4-5 tahun', tip: 'Berhitung sederhana dan bercerita. Latih kemandirian seperti berpakaian sendiri.' },
  { max: 72, label: '5-6 tahun', tip: 'Siap masuk sekolah, mengenal huruf dan menulis nama. Dukung rasa ingin tahu dan kreativitas.' },
  { max: 96, label: '6-8 tahun', tip: 'Kembangkan kemampuan membaca dan berhitung. Beri tanggung jawab kecil di rumah dan dukung hobi anak.' },
  { max: 120, label: '8-10 tahun', tip: 'Anak semakin mandiri dalam belajar. Dorong pemikiran kritis, diskusikan hal-hal sehari-hari, dan jaga komunikasi terbuka.' },
  { max: 144, label: '10-12 tahun', tip: 'Memasuki masa pra-remaja. Perhatikan perubahan fisik dan emosional. Beri pemahaman tentang pubertas secara positif.' },
];

router.get('/development', async (req, res) => {
  try {
    let ageMonths = parseInt(req.query.age, 10);

    // Kalau age tidak dikirim, hitung dari child_dob user
    if (Number.isNaN(ageMonths)) {
      const u = await pool.query(`SELECT child_dob FROM users WHERE id = $1`, [req.user.id]);
      const dob = u.rows[0]?.child_dob;
      if (dob) {
        ageMonths = Math.floor((new Date() - new Date(dob)) / (1000 * 60 * 60 * 24 * 30.4375));
      } else {
        ageMonths = 0;
      }
    }
    if (ageMonths < 0) ageMonths = 0;

    const match = DEVELOPMENT_TIPS.find((t) => ageMonths <= t.max) || DEVELOPMENT_TIPS[DEVELOPMENT_TIPS.length - 1];
    res.json({ age_months: ageMonths, age_label: match.label, milestone: match.tip });
  } catch (err) {
    console.error('Development error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// REMINDERS (upcoming immunizations + doctor visits)
// ============================
router.get('/reminders', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const [immun, visits] = await Promise.all([
      pool.query(
        `SELECT vaccine_name, next_schedule AS due_date
         FROM immunization_records
         WHERE user_id = $1 AND next_schedule IS NOT NULL AND next_schedule >= $2
         ORDER BY next_schedule ASC LIMIT 5`,
        [req.user.id, today]
      ),
      pool.query(
        `SELECT doctor_name, reason, next_visit AS due_date
         FROM doctor_visits
         WHERE user_id = $1 AND next_visit IS NOT NULL AND next_visit >= $2
         ORDER BY next_visit ASC LIMIT 5`,
        [req.user.id, today]
      ),
    ]);

    const daysUntil = (d) => Math.ceil((new Date(d) - new Date(today)) / (1000 * 60 * 60 * 24));

    const reminders = [
      ...immun.rows.map((r) => ({
        type: 'immunization',
        icon: '💉',
        title: `Imunisasi ${r.vaccine_name}`,
        due_date: r.due_date,
        days_left: daysUntil(r.due_date),
      })),
      ...visits.rows.map((r) => ({
        type: 'doctor_visit',
        icon: '🏥',
        title: r.doctor_name ? `Kontrol Dokter (${r.doctor_name})` : 'Kontrol Dokter',
        due_date: r.due_date,
        days_left: daysUntil(r.due_date),
      })),
    ].sort((a, b) => a.days_left - b.days_left);

    res.json({ reminders });
  } catch (err) {
    console.error('Reminders error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// AI CHAT (DeepSeek) — POST /daily/ai
// ============================
const AI_SYSTEM_PROMPT = `Kamu adalah asisten parenting untuk aplikasi Generos Care.
ATURAN:
1. Bantu pertanyaan seputar pengasuhan anak: pola makan, tidur, rutinitas harian, stimulasi, dan tips umum.
2. JANGAN memberikan diagnosis medis atau menilai kondisi kesehatan spesifik (autisme, ADHD, speech delay, dll). Arahkan ke dokter anak bila ada kekhawatiran.
3. Jawaban singkat, jelas, ramah, dalam Bahasa Indonesia.
4. Jangan mengklaim sebagai pengganti saran medis profesional.`;

router.post(
  '/ai',
  [body('message').trim().notEmpty().isLength({ max: 1000 }).withMessage('Pesan tidak boleh kosong, maksimal 1000 karakter')],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    const { message } = req.body;

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(503).json({ error: 'AI assistant belum dikonfigurasi' });
    }

    try {
      // Simpan pesan user
      await pool.query(
        `INSERT INTO ai_conversations (user_id, role, message) VALUES ($1, 'user', $2)`,
        [req.user.id, message]
      );

      // Ambil konteks 6 pesan terakhir
      const historyResult = await pool.query(
        `SELECT role, message FROM ai_conversations
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 6`,
        [req.user.id]
      );
      const recentHistory = historyResult.rows.reverse().map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.message,
      }));

      const aiResponse = await axios.post(
        process.env.DEEPSEEK_API_URL,
        {
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: AI_SYSTEM_PROMPT }, ...recentHistory],
          max_tokens: 300,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );

      const reply = aiResponse.data?.choices?.[0]?.message?.content;
      if (!reply) {
        return res.status(502).json({ error: 'AI tidak memberikan respons. Silakan coba lagi.' });
      }

      // Simpan balasan AI
      await pool.query(
        `INSERT INTO ai_conversations (user_id, role, message) VALUES ($1, 'assistant', $2)`,
        [req.user.id, reply]
      );

      res.json({ reply });
    } catch (err) {
      console.error('Daily AI error:', err.response?.data || err.message);
      res.status(500).json({ error: 'Gagal mendapatkan respons. Silakan coba lagi.' });
    }
  }
);

module.exports = router;
