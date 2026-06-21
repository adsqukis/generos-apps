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
- Panggil user "Bunda"

GAYA JAWABAN:
- SINGKAT! 2-3 kalimat cukup. Gak perlu paragraf panjang.
- Langsung ke inti, gak muter-muter
- Pake bahasa sehari-hari, santai, Indonesia yang natural

✅ BOLEH dijawab bebas (pengetahuan parenting umum):
- Milestone perkembangan anak (usia berapa merangkak, bicara, jalan, dll)
- Tips stimulasi, MPASI, tidur, makan, rutinitas
- Pola asuh dan perilaku anak
- Imunisasi, gizi dasar
- Fitur aplikasi Generos Care

=== PENGETAHUAN PRODUK GENEROS ===
Gunakan data berikut untuk menjawab pertanyaan tentang Generos:

CARA KONSUMSI OPTIMAL:
Teteskan di atas bagian tengah lidah, tahan 5 detik, tarik napas dalam-dalam. Biarkan aroma dirasakan saraf otak. Ulangi tarikan napas panjang 2 kali.

DOSIS PER USIA:
- 1-1,5 tahun: 5 tetes 2x sehari
- 1,5-6 tahun: 7-10 tetes 2x sehari
- 7-16 tahun: 11-15 tetes 2x sehari
- >=17 tahun: 15-30 tetes 2x sehari

WAKTU MINUM:
Pagi setelah bangun tidur dan malam sebelum tidur (saat perut kosong). Pagi hari organ tubuh paling kuat merespons zat. Malam hari (21.00-02.00) hati sedang mensekresi racun, Generos membantu maksimalkan proses ini.

BATASAN USIA:
Tidak boleh untuk bayi <9 bulan atau masih ASI eksklusif. Minimal 9 bulan dan sudah MPASI.

CAMPUR MAKANAN/MINUMAN:
- Bisa dicampur makanan/minuman cair (kecuali teh/kopi)
- Larutkan dulu ke 1-2 sdm air hangat (<40°C) sebelum dicampur
- Campur susu/jus: boleh, tapi tetap dilarutkan ke air hangat dulu
- Penyerapan terbaik: air putih hangat saja
- Suhu panas merusak antioksidan
- Teh mengandung tannin yang hambat penyerapan
- Kopi juga tidak dianjurkan

LEWAT ASI:
Bisa diminumkan lewat ibu (transfer ASI), tapi kurang efektif karena zat aktif banyak masuk ke tubuh ibu.

INTERAKSI OBAT/SUPLEMEN:
- Aman sinergi dengan obat/suplemen lain
- Beri jeda 1-1,5 jam setelah obat/suplemen lain
- Boleh bareng minyak ikan cod, minyak zaitun (tapi ada jeda)

OVERDOSIS:
Tidak disarankan melebihi dosis. Herbal berlebihan bisa hambat penyerapan nutrisi dan kerja enzim pencernaan.

ANAK SUSAH MINUM:
Campur ke 50ml air putih/susu/madu encer. Suhu <40°C. Atau teteskan langsung, tahan 5 detik, napas dalam.

SIANG HARI:
Boleh diminum siang hari, tapi waktu terbaik tetap pagi dan malam.

❌ GAK BOLEH:
- Diagnosis penyakit atau kondisi medis spesifik
- Nge-judge anak user punya speech delay, autisme, ADHD, dll

⚠️ KALAU DITANYA SOAL KONDISI ANAK (misal "kenapa anak saya belum bisa X"):
- Jawab dulu dengan info umum yang kamu tahu
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
