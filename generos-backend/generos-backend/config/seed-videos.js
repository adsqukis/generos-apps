require('dotenv').config();
const pool = require('./db');

// ============================================================================
// SEED VIDEOS — Parenting & Baby Development (Bahasa Indonesia)
// YouTube embed URLs from reputable sources
// ============================================================================

const videos = [
  {
    title: 'Tips Stimulasi Bicara Bayi 0-12 Bulan',
    description: 'Cara mudah menstimulasi perkembangan bicara dan bahasa bayi sejak lahir. Ikuti tips dari ahli tumbuh kembang anak untuk membantu si kecil mulai bicara.',
    duration_minutes: 8,
    video_url: 'https://www.youtube.com/embed/OB0AVY77J7I',
    thumbnail_url: 'https://img.youtube.com/vi/OB0AVY77J7I/maxresdefault.jpg',
    category: 'speech',
    age_range: '0-12 bulan',
    source: 'youtube',
    is_active: true
  },
  {
    title: 'Latihan Motorik Kasar Bayi — Tummy Time & Merangkak',
    description: 'Latihan motorik kasar untuk bayi: tummy time, merangkak, dan gerakan dasar lainnya. Dibimbing oleh terapis perkembangan anak.',
    duration_minutes: 10,
    video_url: 'https://www.youtube.com/embed/XH2jMYTqmng',
    thumbnail_url: 'https://img.youtube.com/vi/XH2jMYTqmng/maxresdefault.jpg',
    category: 'motor',
    age_range: '0-12 bulan',
    source: 'youtube',
    is_active: true
  },
  {
    title: 'Pijat Bayi untuk Tumbuh Kembang Optimal',
    description: 'Pijat bayi adalah stimulasi sentuhan yang luar biasa untuk perkembangan sensorik dan motorik. Pelajari teknik pijat bayi yang benar dan aman.',
    duration_minutes: 12,
    video_url: 'https://www.youtube.com/embed/_wFP0RfYKnY',
    thumbnail_url: 'https://img.youtube.com/vi/_wFP0RfYKnY/maxresdefault.jpg',
    category: 'motor',
    age_range: '0-6 bulan',
    source: 'youtube',
    is_active: true
  },
  {
    title: 'Jadwal Imunisasi Anak Lengkap — IDAI 2024',
    description: 'Panduan jadwal imunisasi anak dari IDAI (Ikatan Dokter Anak Indonesia). Ketahui vaksin apa saja yang wajib dan kapan waktu pemberiannya.',
    duration_minutes: 7,
    video_url: 'https://www.youtube.com/embed/i8kC7lJZFEw',
    thumbnail_url: 'https://img.youtube.com/vi/i8kC7lJZFEw/maxresdefault.jpg',
    category: 'immunity',
    age_range: '0-18 tahun',
    source: 'youtube',
    is_active: true
  },
  {
    title: 'MPASI Pertama Bayi 6 Bulan — Menu & Cara Membuat',
    description: 'Panduan lengkap MPASI pertama untuk bayi 6 bulan. Mulai dari tekstur, bahan makanan, hingga resep sederhana yang bergizi untuk si kecil.',
    duration_minutes: 9,
    video_url: 'https://www.youtube.com/embed/aYL9M2cxL4A',
    thumbnail_url: 'https://img.youtube.com/vi/aYL9M2cxL4A/maxresdefault.jpg',
    category: 'immunity',
    age_range: '6-12 bulan',
    source: 'youtube',
    is_active: true
  },
  {
    title: 'Tips Tidur Nyenyak untuk Bayi — Sleep Training',
    description: 'Solusi untuk bayi yang sulit tidur atau sering terbangun di malam hari. Tips sleep training yang aman dan efektif untuk bayi usia 0-12 bulan.',
    duration_minutes: 11,
    video_url: 'https://www.youtube.com/embed/g3Q0VXzX-zY',
    thumbnail_url: 'https://img.youtube.com/vi/g3Q0VXzX-zY/maxresdefault.jpg',
    category: 'cognitive',
    age_range: '0-12 bulan',
    source: 'youtube',
    is_active: true
  },
  {
    title: 'Tummy Time Exercise untuk Bayi 0-6 Bulan',
    description: 'Latihan tengkurap (tummy time) yang benar untuk memperkuat otot leher, punggung, dan bahu bayi. Dilakukan step by step dengan aman.',
    duration_minutes: 6,
    video_url: 'https://www.youtube.com/embed/m7tBo27iGOM',
    thumbnail_url: 'https://img.youtube.com/vi/m7tBo27iGOM/maxresdefault.jpg',
    category: 'motor',
    age_range: '0-6 bulan',
    source: 'youtube',
    is_active: true
  },
  {
    title: 'Stimulasi Bicara Bayi 6-12 Bulan — Baby Talk',
    description: 'Teknik baby talk untuk menstimulasi perkembangan bahasa bayi usia 6-12 bulan. Bantu si kecil mengoceh dan mengucapkan kata pertamanya.',
    duration_minutes: 8,
    video_url: 'https://www.youtube.com/embed/Pq3MWtg7Fng',
    thumbnail_url: 'https://img.youtube.com/vi/Pq3MWtg7Fng/maxresdefault.jpg',
    category: 'speech',
    age_range: '6-12 bulan',
    source: 'youtube',
    is_active: true
  },
  {
    title: 'Perkembangan Kognitif Bayi — Mainan Edukatif 0-12 Bulan',
    description: 'Rekomendasi mainan edukatif sesuai usia bayi untuk merangsang perkembangan kognitif, konsentrasi, dan kemampuan problem solving si kecil.',
    duration_minutes: 10,
    video_url: 'https://www.youtube.com/embed/aJIBrDVrWJU',
    thumbnail_url: 'https://img.youtube.com/vi/aJIBrDVrWJU/maxresdefault.jpg',
    category: 'cognitive',
    age_range: '0-12 bulan',
    source: 'youtube',
    is_active: true
  },
  {
    title: 'Pola Asuh Responsif untuk Bayi & Balita — Parenting Tips',
    description: 'Pola asuh responsif adalah kunci tumbuh kembang optimal. Pelajari cara menjadi orang tua yang peka dan responsif terhadap kebutuhan si kecil.',
    duration_minutes: 14,
    video_url: 'https://www.youtube.com/embed/YTJNsDMEQbE',
    thumbnail_url: 'https://img.youtube.com/vi/YTJNsDMEQbE/maxresdefault.jpg',
    category: 'parenting',
    age_range: '0-5 tahun',
    source: 'youtube',
    is_active: true
  }
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seedVideos() {
  try {
    console.log('🎬 Seeding video education data...');

    // Check if data already exists
    const checkData = await pool.query('SELECT COUNT(*) as cnt FROM video_education');
    if (parseInt(checkData.rows[0].cnt) > 0) {
      console.log(`  ✓ Video education data already exists (${checkData.rows[0].cnt} videos)`);
      return;
    }

    let inserted = 0;
    let skipped = 0;

    for (const v of videos) {
      // Check by unique video_url
      const check = await pool.query(
        'SELECT id FROM video_education WHERE video_url = $1',
        [v.video_url]
      );

      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO video_education (title, description, duration_minutes, video_url, thumbnail_url, category, age_range, source, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [v.title, v.description, v.duration_minutes, v.video_url, v.thumbnail_url, v.category, v.age_range, v.source, v.is_active]
        );
        inserted++;
      } else {
        skipped++;
      }
    }

    console.log(`  ✓ Videos: ${inserted} inserted, ${skipped} skipped, ${videos.length} total`);

    // Count per category
    const categories = [...new Set(videos.map(v => v.category))];
    console.log('\n  Per kategori:');
    for (const cat of categories) {
      const count = videos.filter(v => v.category === cat).length;
      console.log(`    ${cat.padEnd(12)}: ${count} video`);
    }

    console.log('\n✅ Seeding video education completed successfully!');
  } catch (err) {
    console.error('❌ Seeding video education failed:', err);
    throw err;
  } finally {
    if (require.main === module) await pool.end();
  }
}

// ── Run ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  seedVideos()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedVideos;
