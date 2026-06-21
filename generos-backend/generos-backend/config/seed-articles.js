const pool = require('./db');

const articles = [
  // ============ TUMBUH KEMBANG ============
  {
    title: 'Tahapan Bicara Anak Usia 0–2 Tahun',
    slug: 'tahapan-bicara-anak',
    category: 'Tumbuh Kembang',
    summary: 'Usia berapa anak mulai bicara? Ini tahapan bicara normal anak 0–2 tahun.',
    content: `Setiap anak punya kecepatan bicara yang berbeda, tapi ada tahapan umum yang bisa Bunda perhatikan:\n\nUsia 0-6 bulan: bayi mulai cooing (suara "uuu", "aaa") dan merespon suara.\nUsia 6-12 bulan: babbling ("mamama", "papapa") dan meniru suara.\nUsia 12-18 bulan: 1-3 kata pertama muncul ("mama", "papa", "mau").\nUsia 18-24 bulan: mulai menggabung 2 kata ("mau susu").\n\nYang penting: setiap anak unik. Fokus stimulasi tiap hari lebih penting daripada angka pastinya.`,
    red_flags: 'Di usia 12 bulan belum ada satu kata pun. Di usia 2 tahun belum bisa merangkai 2 kata.',
    when_to_see_doctor: 'Kalau Bunda merasa ada yang berbeda dibanding anak seusianya, konsul ke dokter anak atau terapis wicara untuk evaluasi lebih lanjut.',
  },
  {
    title: 'Kapan Anak Mulai Merangkak?',
    slug: 'kapan-anak-merangkak',
    category: 'Tumbuh Kembang',
    summary: 'Merangkak adalah tonggak penting. Ini rentang usia normalnya.',
    content: `Rata-rata anak mulai merangkak di usia 7-10 bulan. Tapi ada juga yang loncat langsung ke berdiri tanpa merangkak — dan itu wajar kok!\n\nYang penting: anak bisa menggerakkan tubuhnya secara simetris (kiri dan kanan sama kuat). Kalau hanya merangkak dengan satu sisi, perlu diwaspadai.`,
    red_flags: 'Belum ada gerakan berpindah tempat sama sekali di usia 12 bulan.',
    when_to_see_doctor: 'Konsul ke dokter anak kalau di usia 12 bulan anak belum bisa bergeser, merangkak, atau merayap.',
  },
  {
    title: 'Memahami Temper Tantrum pada Balita',
    slug: 'temper-tantrum-balita',
    category: 'Tumbuh Kembang',
    summary: 'Kenapa anak tiba-tiba ngamuk? Ini penyebab dan cara menghadapinya.',
    content: `Tantrum adalah wajar di usia 1-3 tahun. Anak belum bisa mengungkapkan perasaannya dengan kata-kata, jadi meledaklah lewat tangisan atau drama.\n\nTips: tetap tenang, jangan memukul atau membentak. Alihkan perhatian, peluk kalau anak mau. Tantrum biasanya memendek sendiri seiring anak belajar bicara.\n\nKalau tantrum sampai sesak napas, melukai diri, atau masih sering terjadi di atas 4 tahun, perlu evaluasi lebih lanjut.`,
    red_flags: 'Tantrum disertai melukai diri sendiri atau orang lain, atau masih sering di atas usia 4 tahun.',
    when_to_see_doctor: 'Konsul ke psikolog anak jika tantrum sangat sering, agresif, atau sulit dikelola.',
  },

  // ============ NUTRISI & MPASI ============
  {
    title: 'Panduan MPASI Pertama Bayi 6 Bulan',
    slug: 'mpasi-pertama',
    category: 'Nutrisi & MPASI',
    summary: 'MPASI perdana? Ini bahan pertama yang aman dan cara memulainya.',
    content: `Di usia 6 bulan, ASI saja tidak cukup. Saatnya MPASI!\n\nMulai dengan tekstur yang sangat lembut (puree). Bahan pertama yang aman: pisang, alpukat, wortel kukus, labu kuning, kentang.\n\nAturan penting: perkenalkan satu bahan dalam 3-4 hari untuk deteksi alergi. Jangan pakai garam/gula di tahun pertama.\n\nTekstur naik bertahap: puree → mashed → cincang halus → finger food.`,
    red_flags: 'Muncul ruam, diare, atau muntah setelah makan makanan tertentu — bisa jadi alergi.',
    when_to_see_doctor: 'Jika ada reaksi alergi berat seperti bengkak di wajah, sulit bernapas, segera ke UGD.',
  },
  {
    title: 'Makanan Pencegah Sembelit pada Anak',
    slug: 'cegah-sembelit-anak',
    category: 'Nutrisi & MPASI',
    summary: 'Sembelit sering banget terjadi. Ini makanan yang membantu.',
    content: `Anak sembelit itu umum, apalagi saat transisi MPASI. Kuncinya: serat dan cairan.\n\nMakanan pelancar: pepaya, pir, plum, brokoli, ubi jalar, dan bubur kacang hijau. Pastikan anak minum cukup air putih.\n\nHindari dulu: pisang yang terlalu matang, nasi putih terus-menerus, dan makanan olahan yang minim serat.`,
    red_flags: 'Tidak BAB lebih dari 5 hari, disertai muntah, perut kembung keras, atau anak kesakitan.',
    when_to_see_doctor: 'Segera bawa ke dokter jika tidak BAB lebih dari 5 hari dengan gejala di atas.',
  },

  // ============ TIDUR BAYI ============
  {
    title: 'Kebutuhan Tidur Bayi Berdasarkan Usia',
    slug: 'kebutuhan-tidur-bayi',
    category: 'Tidur Bayi',
    summary: 'Berapa jam bayi perlu tidur? Ini panduan sesuai usianya.',
    content: `Tidur itu penting banget buat perkembangan otak anak. Berikut rata-rata kebutuhan tidur:\n\n0-3 bulan: 14-17 jam/hari. Bayi baru lahir tidur dalam siklus pendek 2-4 jam.\n4-11 bulan: 12-15 jam/hari. Mulai bisa tidur lebih panjang di malam hari.\n1-2 tahun: 11-14 jam/hari. Biasanya ditambah 1-2 kali tidur siang.\n3-5 tahun: 10-13 jam/hari. Tidur siang mulai berkurang.\n\nYang penting: rutinitas sebelum tidur (bath, cerita, nyanyi) bantu anak lebih cepat tidur.`,
    red_flags: 'Anak sulit sekali tidur, sering terbangun dengan teriakan, atau mendengkur keras.',
    when_to_see_doctor: 'Jika gangguan tidur mempengaruhi aktivitas siang hari, konsul ke dokter anak.',
  },

  // ============ STIMULASI & BERMAIN ============
  {
    title: 'Stimulasi Sederhana untuk Bayi 0-6 Bulan',
    slug: 'stimulasi-bayi-0-6',
    category: 'Stimulasi & Bermain',
    summary: 'Stimulasi tak perlu mahal. Ini aktivitas sederhana yang bisa Bunda lakukan.',
    content: `Stimulasi di 6 bulan pertama sangat penting untuk bonding dan perkembangan sensorik.\n\nIde stimulasi:\n- Ajak ngobrol dan tirukan suara bayi (cooing)\n- Tummy time 2-3 kali sehari, 3-5 menit\n- Kenalkan mainan dengan warna kontras tinggi\n- Nyanyikan lagu-lagu sederhana\n- Pijat bayi setelah mandi\n\nKuncinya: interaksi hangat lebih penting dari mainan mahal.`,
    red_flags: 'Tidak merespon suara keras, tidak tersenyum di usia 3 bulan, atau sangat kaku/lemas.',
    when_to_see_doctor: 'Kalau ada kekhawatiran soal respons bayi, segera konsul ke dokter anak.',
  },
  {
    title: 'Ide Mainan Edukatif Usia 1-3 Tahun',
    slug: 'mainan-edukatif-1-3',
    category: 'Stimulasi & Bermain',
    summary: 'Mainan yang merangsang kreativitas dan motorik anak.',
    content: `Anak 1-3 tahun sedang aktif-aktifnya! Mainan yang tepat bantu perkembangan motorik dan kognitif:\n\n- Balok susun: melatih koordinasi mata-tangan\n- Buku bergambar: merangsang bahasa dan imajinasi\n- Pasir/mainan sensorik: stimulasi taktil\n- Puzzle sederhana (2-4 potong): problem solving\n- Alat musik mainan: stimulasi auditori\n\nYang paling penting: waktu bermain bersama Bunda jauh lebih berharga dari mainan secanggih apapun.`,
    red_flags: 'Tidak tertarik mainan sama sekali atau hanya fokus pada satu mainan secara berlebihan.',
    when_to_see_doctor: 'Konsul ke dokter anak jika anak tidak menunjukkan minat bermain atau interaksi.',
  },

  // ============ KESEHATAN ANAK ============
  {
    title: 'Jadwal Imunisasi Dasar Lengkap',
    slug: 'jadwal-imunisasi-dasar',
    category: 'Kesehatan Anak',
    summary: 'Imunisasi itu wajib. Catat jadwalnya biar gak terlewat.',
    content: `Imunisasi dasar melindungi anak dari penyakit berbahaya. Jadwal dari IDAI:\n\n0-24 jam: Hepatitis B\n1 bulan: BCG, Polio 1\n2 bulan: DPT-HB-Hib 1, Polio 2\n3 bulan: DPT-HB-Hib 2, Polio 3\n4 bulan: DPT-HB-Hib 3, Polio 4, IPV\n9 bulan: Campak/Rubella\n18 bulan: DPT-HB-Hib lanjutan, Campak/Rubella lanjutan\n\nImunisasi lanjutan (booster) juga penting! Jangan sampai telat ya Bunda.`,
    red_flags: 'Reaksi alergi berat setelah imunisasi, atau anak sakit berat saat jadwal imunisasi (tunda dulu).',
    when_to_see_doctor: 'Konsul ke dokter sebelum imunisasi jika anak sedang sakit, atau jika ada efek samping yang mengkhawatirkan.',
  },
  {
    title: 'Pertolongan Pertama Demam pada Anak',
    slug: 'pertolongan-demam-anak',
    category: 'Kesehatan Anak',
    summary: 'Anak demam? Jangan panik. Ini langkah yang benar.',
    content: `Demam adalah mekanisme tubuh melawan infeksi. Yang penting bukan angka suhunya, tapi kondisi anak secara keseluruhan.\n\nLangkah awal:\n- Kompres air hangat (bukan air dingin/es)\n- Beri banyak ASI/air putih\n- Pakaian tipis, jangan dibedong\n- Ukur suhu tiap 4 jam\n- Kalau perlu, beri parasetamol sesuai dosis (10-15 mg/kg BB)\n\nJangan pakai alkohol atau air es untuk kompres — berbahaya!`,
    red_flags: 'Demam di atas 38°C pada bayi di bawah 3 bulan, atau demam lebih dari 3 hari.',
    when_to_see_doctor: 'Segera ke dokter jika demam tinggi pada bayi di bawah 3 bulan, kejang, atau anak lemas/tidak mau minum.',
  },
];

module.exports = async function seedArticles() {
  const client = await pool.connect();
  try {
    for (const article of articles) {
      await client.query(
        `INSERT INTO articles (title, slug, category, content, summary, red_flags, when_to_see_doctor, is_active, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [article.title, article.slug, article.category, article.content, article.summary,
         article.red_flags || null, article.when_to_see_doctor || null]
      );
    }
    console.log(`✓ Seeded ${articles.length} articles`);
  } finally {
    client.release();
  }
};
