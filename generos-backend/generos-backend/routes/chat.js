const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const SYSTEM_PROMPT = `Kamu adalah asisten parenting untuk aplikasi Generos Care. Tugasmu membantu orang tua dengan informasi pengasuhan anak yang umum diketahui secara luas.

✅ BOLEH dijawab — pengetahuan parenting umum:
- Tips tidur, makan, MPASI, rutinitas harian
- Stimulasi dan aktivitas bermain sesuai usia
- Milestone perkembangan umum (biasanya usia berapa anak mulai merangkak, bicara, dll)
- Pola asuh, perilaku anak, disiplin positif
- Gizi dan kebutuhan nutrisi dasar anak
- Imunisasi jadwal umum
- Cara menggunakan fitur-fitur di aplikasi Generos Care

❌ TIDAK BOLEH — hal yang butuh diagnosa medis:
- Diagnosis penyakit atau kondisi kesehatan spesifik
- Menilai apakah anak mengalami speech delay, autisme, ADHD, atau kondisi medis lainnya
- Memberikan resep atau rekomendasi pengobatan
- Menafsirkan hasil tes/lab

⚠️ Kalau user bertanya tentang gejala yang mengarah ke kondisi medis serius:
- Jawab dengan empati
- Beri info umum yang diketahui secara luas
- SARANKAN konsultasi ke dokter anak untuk evaluasi lebih lanjut
- Jangan langsung tolak dengan "konsultasi ke dokter" di awal — coba bantu dulu dengan info umum

Gaya bicara: ramah, hangat, dan dalam Bahasa Indonesia. Jawaban singkat dan jelas.`;

// ============================
// SEND MESSAGE
// ============================
router.post(
  '/message',
  [body('message').trim().notEmpty().isLength({ max: 1000 }).withMessage('Pesan tidak boleh kosong, maksimal 1000 karakter')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(503).json({ error: 'Chat assistant belum dikonfigurasi' });
    }

    try {
      // Save user message
      await pool.query(
        `INSERT INTO chat_history (user_id, message_type, message_content) VALUES ($1, 'user', $2)`,
        [req.user.id, message]
      );

      // Get recent history for context (last 5 messages)
      const historyResult = await pool.query(
        `SELECT message_type, message_content FROM chat_history 
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 6`,
        [req.user.id]
      );

      const recentHistory = historyResult.rows.reverse().map((msg) => ({
        role: msg.message_type === 'user' ? 'user' : 'assistant',
        content: msg.message_content,
      }));

      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...recentHistory,
      ];

      const aiResponse = await axios.post(
        process.env.DEEPSEEK_API_URL,
        {
          model: 'deepseek-chat',
          messages,
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

      // Save assistant reply
      await pool.query(
        `INSERT INTO chat_history (user_id, message_type, message_content) VALUES ($1, 'assistant', $2)`,
        [req.user.id, reply]
      );

      res.json({ reply });
    } catch (err) {
      console.error('Chat error:', err.response?.data || err.message);
      res.status(500).json({ error: 'Gagal mendapatkan respons. Silakan coba lagi.' });
    }
  }
);

// ============================
// GET HISTORY
// ============================
router.get('/history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT message_type, message_content, created_at FROM chat_history 
       WHERE user_id = $1 ORDER BY created_at ASC LIMIT 50`,
      [req.user.id]
    );
    res.json({ history: result.rows });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ============================
// CLEAR HISTORY
// ============================
router.delete('/history', async (req, res) => {
  try {
    await pool.query(`DELETE FROM chat_history WHERE user_id = $1`, [req.user.id]);
    res.json({ message: 'Riwayat chat berhasil dihapus' });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
