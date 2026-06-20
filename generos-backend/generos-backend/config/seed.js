require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Seeding database...');

    // 1. Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@generos.co.id';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || adminPassword.length < 8) {
      console.error('❌ ADMIN_PASSWORD belum di-set atau kurang dari 8 karakter. Set environment variable ADMIN_PASSWORD lalu jalankan ulang seed.');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    let adminId;

    if (adminCheck.rows.length === 0) {
      const adminResult = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role) 
         VALUES ($1, $2, $3, 'admin') RETURNING id`,
        [adminEmail, passwordHash, 'Admin Generos']
      );
      adminId = adminResult.rows[0].id;
      console.log(`✓ Admin user created: ${adminEmail}`);
    } else {
      adminId = adminCheck.rows[0].id;
      console.log('✓ Admin user already exists');
    }

    // 2. Seed Articles (WHO/IDAI based)
    const articles = [
      {
        title: 'Perkembangan Bicara Anak 18-24 Bulan',
        slug: 'perkembangan-bicara-18-24-bulan',
        category: 'speech',
        summary: 'Panduan lengkap tahapan perkembangan bicara anak usia 18-24 bulan berdasarkan standar WHO dan IDAI.',
        content: `Pada usia 18-24 bulan, anak mengalami perkembangan bahasa yang signifikan. Mereka mulai memahami perintah sederhana dan dapat menggabungkan dua kata menjadi kalimat pendek seperti "mau minum" atau "mama pergi".

Stimulasi yang konsisten sangat penting di fase ini. Membacakan buku, bernyanyi, dan mengajak anak berbicara dalam aktivitas sehari-hari membantu memperkaya kosakata mereka.

Nutrisi yang tepat juga mendukung perkembangan otak yang optimal, termasuk perkembangan area bahasa di otak anak.`,
        red_flags: 'Tidak mengerti perintah sederhana, tidak ada kata-kata sama sekali, tidak ada eye contact saat berbicara, tidak merespons saat dipanggil nama',
        when_to_see_doctor: 'Jika anak tidak menunjukkan perkembangan bicara sesuai usia, tidak ada kata-kata sama sekali pada usia 2 tahun, atau ada kesulitan dalam memahami perintah sederhana, segera konsultasi dengan dokter anak.',
      },
      {
        title: 'Imunitas Anak: Faktor Genetik vs Nutrisi',
        slug: 'imunitas-anak-genetik-nutrisi',
        category: 'immunity',
        summary: 'Memahami peran nutrisi dalam membangun sistem imun yang kuat pada anak usia 0-5 tahun.',
        content: `Sistem imun anak berkembang secara bertahap sejak lahir hingga usia 5 tahun. Meskipun faktor genetik memainkan peran, nutrisi yang tepat memiliki pengaruh besar terhadap kekuatan sistem imun anak.

Nutrisi penting untuk imunitas termasuk protein, zinc, vitamin A, vitamin C, dan vitamin D. Bahan-bahan herbal alami juga telah lama digunakan dalam tradisi pengobatan untuk mendukung daya tahan tubuh.

Pola tidur yang cukup dan aktivitas fisik yang sesuai usia juga berkontribusi pada sistem imun yang sehat.`,
        red_flags: 'Sering sakit lebih dari 8 kali per tahun, infeksi berulang, penyembuhan luka yang lambat, demam berkepanjangan',
        when_to_see_doctor: 'Jika anak sering sakit berulang, infeksi tidak kunjung sembuh, atau menunjukkan tanda-tanda sistem imun yang lemah, konsultasikan dengan dokter anak.',
      },
      {
        title: 'Tanda-Tanda Awal Autism Spectrum Disorder (ASD)',
        slug: 'tanda-awal-autism-spectrum-disorder',
        category: 'autism',
        summary: 'Mengenali tanda-tanda awal ASD pada anak usia 0-3 tahun berdasarkan standar IDAI untuk deteksi dini.',
        content: `Autism Spectrum Disorder (ASD) adalah kondisi perkembangan yang mempengaruhi cara anak berkomunikasi dan berinteraksi sosial. Deteksi dini sangat penting untuk memberikan intervensi yang tepat waktu.

Beberapa tanda yang perlu diperhatikan termasuk kurangnya kontak mata, keterlambatan dalam perkembangan bahasa, perilaku repetitif (seperti mengepakkan tangan atau berputar), dan kesulitan dalam interaksi sosial dengan anak seusianya.

Penting diingat bahwa setiap anak berkembang dengan kecepatan berbeda. Tanda-tanda ini bukan diagnosis pasti, melainkan indikator untuk evaluasi lebih lanjut oleh profesional.`,
        red_flags: 'Tidak ada kontak mata sama sekali, tidak merespons saat dipanggil nama berulang kali, perilaku repetitif yang intens, tidak tertarik pada mainan atau interaksi dengan orang lain, tidak menunjukkan ekspresi emosi',
        when_to_see_doctor: 'Jika Anda melihat beberapa tanda di atas secara konsisten, segera konsultasikan dengan dokter anak atau spesialis perkembangan anak untuk screening dan evaluasi lebih lanjut. Deteksi dini sangat membantu dalam penanganan yang efektif.',
      },
      {
        title: 'ADHD pada Anak: Gejala dan Kapan Harus Evaluasi',
        slug: 'adhd-anak-gejala-evaluasi',
        category: 'adhd',
        summary: 'Memahami gejala ADHD pada anak dan pentingnya evaluasi oleh profesional kesehatan.',
        content: `ADHD (Attention Deficit Hyperactivity Disorder) dapat mulai menunjukkan gejala sejak usia dini, meskipun diagnosis formal biasanya dilakukan setelah usia 4 tahun.

Gejala umum termasuk kesulitan berkonsentrasi pada satu aktivitas, mudah terdistraksi, impulsivitas dalam bertindak, dan tingkat aktivitas fisik yang tinggi dibandingkan anak seusianya.

Penting untuk diingat bahwa tingkat energi yang tinggi adalah hal normal pada anak-anak. Diagnosis ADHD harus dilakukan melalui evaluasi menyeluruh oleh profesional kesehatan yang terlatih, bukan berdasarkan observasi sesaat.`,
        red_flags: 'Sulit sekali berkonsentrasi dalam aktivitas apapun, impulsivitas ekstrem yang membahayakan diri, tidak bisa diam dalam situasi yang membutuhkan ketenangan, kesulitan belajar yang signifikan dibanding teman seusia',
        when_to_see_doctor: 'Jika anak menunjukkan kesulitan perhatian yang persisten dan mengganggu aktivitas sehari-hari atau pembelajaran, konsultasikan dengan dokter anak untuk evaluasi lebih lanjut.',
      },
      {
        title: 'Cara Mengatasi Tantrum pada Anak dengan Tenang',
        slug: 'cara-mengatasi-tantrum-anak',
        category: 'tantrum',
        summary: 'Teknik praktis dan terbukti untuk mengelola tantrum anak dengan lebih efektif dan tenang.',
        content: `Tantrum adalah bagian normal dari perkembangan emosional anak, terutama di usia 1-4 tahun ketika mereka belum memiliki kemampuan regulasi emosi yang matang.

Beberapa strategi efektif termasuk: tetap tenang dan tidak bereaksi berlebihan, memberikan ruang aman bagi anak untuk mengekspresikan emosi, validasi perasaan anak tanpa membenarkan perilaku yang tidak diinginkan, dan konsistensi dalam memberikan batasan.

Nutrisi yang seimbang juga berperan dalam stabilitas mood anak. Pola makan yang teratur dengan nutrisi yang cukup dapat membantu mengurangi frekuensi tantrum yang dipicu oleh rasa lapar atau kelelahan.`,
        red_flags: 'Tantrum yang sangat intens dan berlangsung lebih dari 25 menit, perilaku menyakiti diri sendiri atau orang lain saat tantrum, frekuensi tantrum yang meningkat drastis',
        when_to_see_doctor: 'Jika tantrum semakin sering, semakin ekstrem, atau melibatkan perilaku yang membahayakan, konsultasikan dengan dokter anak untuk evaluasi lebih lanjut.',
      },
      {
        title: 'Perkembangan Motorik Kasar Anak 6-24 Bulan',
        slug: 'perkembangan-motorik-kasar-6-24-bulan',
        category: 'brain',
        summary: 'Panduan perkembangan motorik kasar anak dari usia 6 hingga 24 bulan berdasarkan milestone WHO.',
        content: `Perkembangan motorik kasar mencakup kemampuan besar seperti duduk, merangkak, berdiri, dan berjalan. WHO menetapkan rentang usia normal untuk setiap milestone, meskipun setiap anak berkembang dengan kecepatannya sendiri.

Milestone umum: duduk dengan bantuan (6 bulan), merangkak (8-10 bulan), berdiri dengan bantuan (9-12 bulan), berjalan tanpa bantuan (12-18 bulan).

Stimulasi bermain aktif seperti tummy time, bermain di lantai, dan memberikan ruang gerak yang aman sangat membantu perkembangan motorik. Nutrisi yang mendukung perkembangan otot dan tulang, seperti protein dan kalsium, juga penting.`,
        red_flags: 'Tidak dapat duduk dengan bantuan di usia 9 bulan, tidak dapat merangkak di usia 12 bulan, tidak dapat berdiri dengan bantuan di usia 15 bulan, tidak dapat berjalan di usia 20 bulan',
        when_to_see_doctor: 'Jika anak tertinggal signifikan dalam pencapaian motorik dibanding rentang usia normal, konsultasikan dengan dokter anak untuk evaluasi perkembangan.',
      },
    ];

    for (const article of articles) {
      const exists = await pool.query('SELECT id FROM articles WHERE slug = $1', [article.slug]);
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO articles (title, slug, category, summary, content, red_flags, when_to_see_doctor, verified_by, verified_date, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, true)`,
          [article.title, article.slug, article.category, article.summary, article.content, article.red_flags, article.when_to_see_doctor, adminId]
        );
      }
    }
    console.log(`✓ Seeded ${articles.length} articles`);

    // 3. Seed Food Menu
    const foods = [
      {
        name: 'Bubur Ayam + Telur',
        age_range: '8-12 bulan',
        benefits: 'Protein tinggi, vitamin A, zat besi untuk perkembangan otak dan imunitas',
        recipe: 'Rebus ayam hingga lunak, suwir halus. Cuci beras, masak dengan kaldu ayam hingga menjadi bubur lembut. Tambahkan telur kocok, masak hingga matang. Saring jika perlu untuk tekstur yang lebih halus.',
        category: 'lunch',
      },
      {
        name: 'Tahu Goreng + Wortel Kukus',
        age_range: '12-18 bulan',
        benefits: 'Protein nabati, vitamin C, fiber untuk pencernaan sehat',
        recipe: 'Potong tahu kecil-kecil, goreng dengan minyak sedikit hingga kuning keemasan. Kukus wortel yang sudah dipotong dadu kecil hingga lunak. Sajikan bersama nasi atau bubur.',
        category: 'lunch',
      },
      {
        name: 'Ikan Salmon + Brokoli',
        age_range: '18-24 bulan',
        benefits: 'Omega-3 untuk perkembangan otak, vitamin D, mineral penting',
        recipe: 'Kukus salmon selama 15 menit hingga matang. Kukus brokoli yang sudah dipotong kecil. Haluskan atau potong kecil sesuai kemampuan mengunyah anak. Campur dengan sedikit minyak zaitun.',
        category: 'dinner',
      },
      {
        name: 'Pisang + Alpukat Lumat',
        age_range: '6-9 bulan',
        benefits: 'Lemak sehat untuk otak, potassium, mudah dicerna',
        recipe: 'Haluskan pisang matang dan alpukat matang dengan garpu hingga lembut. Campurkan keduanya. Bisa ditambah ASI/sufor sedikit untuk tekstur lebih cair jika diperlukan.',
        category: 'snack',
      },
      {
        name: 'Telur Dadar + Bayam',
        age_range: '12-24 bulan',
        benefits: 'Protein lengkap, zat besi, folat untuk perkembangan kognitif',
        recipe: 'Cincang halus bayam yang sudah dicuci bersih. Kocok telur, campurkan bayam cincang. Dadar dengan minyak sedikit hingga matang. Potong kecil-kecil sesuai usia anak.',
        category: 'breakfast',
      },
    ];

    for (const food of foods) {
      const exists = await pool.query('SELECT id FROM food_menu WHERE name = $1', [food.name]);
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO food_menu (name, age_range, benefits, recipe, category, created_by, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          [food.name, food.age_range, food.benefits, food.recipe, food.category, adminId]
        );
      }
    }
    console.log(`✓ Seeded ${foods.length} food menu items`);

    // 4. Seed Products
    const products = [
      {
        name: 'Generos Gold (6 bulan - 1 tahun)',
        description: 'Nutrisi herbal untuk mendukung perkembangan otak dan imunitas bayi',
        price: 89000,
        shopee_link: 'https://shopee.co.id/generos-gold-placeholder',
        category: 'vitamin',
      },
      {
        name: 'Generos Plus (1-3 tahun)',
        description: 'Nutrisi herbal lengkap untuk tumbuh kembang optimal balita',
        price: 95000,
        shopee_link: 'https://shopee.co.id/generos-plus-placeholder',
        category: 'vitamin',
      },
    ];

    for (const product of products) {
      const exists = await pool.query('SELECT id FROM products WHERE name = $1', [product.name]);
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO products (name, description, price, shopee_link, category, created_by, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          [product.name, product.description, product.price, product.shopee_link, product.category, adminId]
        );
      }
    }
    console.log(`✓ Seeded ${products.length} products`);

    console.log('\n✓ Seeding completed successfully!');
    console.log(`\nAdmin login: ${adminEmail} / ${adminPassword}`);
    console.log('⚠️  IMPORTANT: Change admin password after first login!\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
