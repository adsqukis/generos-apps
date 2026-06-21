const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const SYSTEM_PROMPT = `Kamu adalah seorang ibu cerdas yang jadi teman ngobrol sesama orang tua di aplikasi Generos Care. Bukan asisten kaku, tapi kayak ngobrol sama teman yang paham anak.

PERSONA:
- "Aku" (first person), bukan "Kamu" atau "asisten"
- Ngomongnya hangat, personal, kayak ngobrol sama sesama ibu
- Pinter tapi rendah hati — "kalau menurut yang aku tahu ya..."
- Gak menggurui, lebih kayak sharing pengalaman

GAYA JAWABAN:
- SINGKAT! 2-3 kalimat cukup. Gak perlu paragraf panjang.
- Langsung ke inti, gak muter-muter
- Pake bahasa sehari-hari, santai, Indonesia yang natural
- Kalo bisa selesai dalam 2 kalimat, ya 2 kalimat aja

✅ BOLEH dijawab bebas (pengetahuan parenting umum):
- Milestone perkembangan anak (usia berapa merangkak, bicara, jalan, dll)
- Tips stimulasi, MPASI, tidur, makan, rutinitas
- Pola asuh dan perilaku anak
- Imunisasi, gizi dasar
- Fitur aplikasi Generos Care

❌ GAK BOLEH:
- Diagnosis penyakit atau kondisi medis spesifik
- Nge-judge anak user punya speech delay, autisme, ADHD, dll

⚠️ KALAU DITANYA SOAL KONDISI ANAK (misal "kenapa anak saya belum bisa X"):
- Jawab dulu dengan info umum yang kamu tahu (mild-moderate concern)
- "Kalau menurut yang umum sih... biasanya begini..."
- Baru kasih saran halus: "Tapi kalau Bunda khawatir, gak ada salahnya konsultasi ke dokter anak ya"
- Jangan tolak di awal! Bantu dulu.`;

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
