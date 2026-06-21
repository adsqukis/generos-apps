// Milestone data per usia (bulan) — 4 kategori
const milestonesByAge = {
  // 0-3 bulan
  1: [
    { category: 'motor', title: 'Mengangkat kepala saat tengkurap', description: 'Bayi mulai bisa mengangkat kepala beberapa detik saat posisi tengkurap' },
    { category: 'motor', title: 'Menggenggam jari', description: 'Bayi menggenggam jari orang tua secara refleks' },
    { category: 'speech', title: 'Mengeluarkan suara "a" atau "o"', description: 'Bayi mulai mengeluarkan suara vokal' },
    { category: 'speech', title: 'Menangis dengan nada berbeda', description: 'Tangisan bayi berbeda untuk lapar, lelah, atau tidak nyaman' },
    { category: 'social', title: 'Tersenyum refleks', description: 'Senyum muncul secara refleks, biasanya saat tidur' },
    { category: 'social', title: 'Mengenali wajah ibu', description: 'Bayi mulai mengenali wajah orang yang merawatnya' },
    { category: 'cognitive', title: 'Mengikuti objek bergerak', description: 'Mata bayi mulai mengikuti gerakan benda di depannya' },
    { category: 'cognitive', title: 'Merespon suara', description: 'Bayi terkejut atau diam saat mendengar suara keras' },
  ],
  2: [
    { category: 'motor', title: 'Mengangkat kepala 45 derajat', description: 'Saat tengkurap, kepala terangkat lebih tinggi dan lebih lama' },
    { category: 'motor', title: 'Gerakan tangan dan kaki lebih aktif', description: 'Tangan dan kaki bergerak lebih terkoordinasi' },
    { category: 'speech', title: 'Mengoceh "aah" dan "ooh"', description: 'Bayi mulai mengoceh dengan berbagai bunyi vokal' },
    { category: 'social', title: 'Tersenyum sosial', description: 'Senyum sebagai respons terhadap interaksi orang lain' },
    { category: 'social', title: 'Mulai mengenali orang asing', description: 'Bayi bisa membedakan orang dikenal dan tidak dikenal' },
    { category: 'cognitive', title: 'Melihat tangan sendiri', description: 'Bayi tertarik melihat gerakan tangannya sendiri' },
  ],
  // 3-6 bulan
  3: [
    { category: 'motor', title: 'Mengangkat kepala 90 derajat', description: 'Kepala terangkat tegak saat tengkurap dengan siku sebagai penyangga' },
    { category: 'motor', title: 'Berguling dari telentang ke miring', description: 'Bayi mulai bisa berguling, meski masih setengah' },
    { category: 'speech', title: 'Mengoceh dengan konsonan', description: 'Ocehan mulai mengandung bunyi konsonan seperti "ma", "ba"' },
    { category: 'social', title: 'Tertawa', description: 'Bayi mulai tertawa saat diajak bermain atau digelitik' },
    { category: 'cognitive', title: 'Meraih benda yang terlihat', description: 'Bayi mulai mencoba meraih mainan atau benda di depannya' },
    { category: 'cognitive', title: 'Memasukkan benda ke mulut', description: 'Bayi mengeksplorasi benda dengan memasukkannya ke mulut' },
  ],
  4: [
    { category: 'motor', title: 'Berguling telentang ke tengkurap', description: 'Bayi bisa berguling sempurna dari telentang ke tengkurap' },
    { category: 'motor', title: 'Menahan beban dengan kaki', description: 'Saat dipegang berdiri, kaki menahan sebagian beban' },
    { category: 'speech', title: 'Meniru suara yang didengar', description: 'Bayi mencoba meniru suara atau intonasi orang dewasa' },
    { category: 'speech', title: 'Tertarik pada suara musik', description: 'Bayi merespon musik dengan gerakan atau ocehan' },
    { category: 'social', title: 'Bermain "cilukba"', description: 'Bayi merespon permainan muncul-sembunyi dengan antusias' },
    { category: 'cognitive', title: 'Membedakan warna', description: 'Bayi mulai tertarik pada warna cerah dan kontras' },
  ],
  5: [
    { category: 'motor', title: 'Duduk dengan bantuan', description: 'Bayi bisa duduk sebentar jika ditopang bantal' },
    { category: 'motor', title: 'Menggenggam benda dengan 2 tangan', description: 'Bayi menggunakan kedua tangan untuk meraih dan memegang' },
    { category: 'speech', title: 'Mengoceh panjang', description: 'Rangkaian ocehan lebih panjang dan bervariasi' },
    { category: 'social', title: 'Mulai cemas dengan orang asing', description: 'Rewel atau menangis saat didekati orang yang tidak dikenal' },
    { category: 'cognitive', title: 'Mencari benda jatuh', description: 'Bayi melihat ke arah benda yang jatuh' },
  ],
  6: [
    { category: 'motor', title: 'Duduk sebentar tanpa bantuan', description: 'Bayi bisa duduk sendiri beberapa detik' },
    { category: 'motor', title: 'Berguling ke dua arah', description: 'Berguling dari telentang ke tengkurap dan sebaliknya' },
    { category: 'speech', title: 'Mengoceh "mama", "baba"', description: 'Suku kata berulang mulai terdengar jelas' },
    { category: 'speech', title: 'Menoleh saat dipanggil namanya', description: 'Bayi merespon saat namanya dipanggil' },
    { category: 'social', title: 'Mulai takut orang asing', description: 'Kecemasan terhadap orang asing semakin jelas' },
    { category: 'social', title: 'Tersenyum pada bayangannya', description: 'Bayi tersenyum saat melihat dirinya di cermin' },
    { category: 'cognitive', title: 'Memindahkan benda antar tangan', description: 'Bayi bisa memindahkan mainan dari satu tangan ke tangan lain' },
  ],
  // 7-12 bulan
  9: [
    { category: 'motor', title: 'Duduk kokoh tanpa bantuan', description: 'Bayi duduk tegak tanpa perlu topangan' },
    { category: 'motor', title: 'Merangkak', description: 'Bayi mulai merangkak maju atau mundur' },
    { category: 'motor', title: 'Berdiri dengan pegangan', description: 'Bayi menarik diri untuk berdiri sambil berpegangan' },
    { category: 'speech', title: 'Mengucapkan "mama" atau "baba" spesifik', description: 'Mama untuk ibu, baba/bapa untuk ayah' },
    { category: 'speech', title: 'Memahami kata "tidak"', description: 'Bayi berhenti atau merespon saat mendengar kata "tidak"' },
    { category: 'social', title: 'Memainkan "pat-cake" atau "dadah"', description: 'Bayi bisa bertepuk tangan atau melambai' },
    { category: 'social', title: 'Meniru gerakan sederhana', description: 'Meniru tepuk tangan atau gerakan orang dewasa' },
    { category: 'cognitive', title: 'Mencari benda yang disembunyikan', description: 'Memahami bahwa benda tetap ada walau tidak terlihat' },
    { category: 'cognitive', title: 'Menunjuk dengan jari telunjuk', description: 'Bayi menunjuk benda yang diinginkan' },
  ],
  12: [
    { category: 'motor', title: 'Berdiri sendiri beberapa detik', description: 'Bayi bisa berdiri tanpa pegangan beberapa detik' },
    { category: 'motor', title: 'Berjalan dengan pegangan', description: 'Berjalan sambil berpegangan pada furnitur' },
    { category: 'motor', title: 'Memegang sendok', description: 'Bayi mulai mencoba memegang sendok saat makan' },
    { category: 'speech', title: 'Mengucapkan 1-2 kata bermakna', description: 'Selain mama/baba, bayi punya 1-2 kata lain' },
    { category: 'speech', title: 'Memahami perintah sederhana', description: 'Mengerti "ambil", "beri", "sini"' },
    { category: 'social', title: 'Memberi pelukan dan ciuman', description: 'Bayi mulai mengekspresikan kasih sayang fisik' },
    { category: 'social', title: 'Meniru aktivitas sehari-hari', description: 'Meniru menyapu, bicara di telepon, dll' },
    { category: 'cognitive', title: 'Memasukkan benda ke wadah', description: 'Memasukkan dan mengeluarkan benda dari wadah' },
    { category: 'cognitive', title: 'Mencocokkan bentuk sederhana', description: 'Mulai bisa mencocokkan bentuk ke lubang yang sesuai' },
  ],
  // 12-24 bulan
  18: [
    { category: 'motor', title: 'Berjalan sendiri', description: 'Bayi berjalan tanpa bantuan dengan langkah lebih mantap' },
    { category: 'motor', title: 'Naik tangga dengan bantuan', description: 'Naik tangga dengan merangkak atau bantuan orang dewasa' },
    { category: 'motor', title: 'Membuat coretan', description: 'Bayi bisa membuat coretan dengan krayon' },
    { category: 'speech', title: 'Mengucapkan 5-10 kata', description: 'Kosakata bertambah jadi 5-10 kata bermakna' },
    { category: 'speech', title: 'Menunjuk bagian tubuh', description: 'Bisa menunjuk mata, hidung, mulut saat diminta' },
    { category: 'social', title: 'Bermain di dekat anak lain', description: 'Bermain paralel — bermain di samping anak lain' },
    { category: 'social', title: 'Meniru pekerjaan rumah', description: 'Meniru menyapu, membersihkan meja' },
    { category: 'cognitive', title: 'Menyusun 2-4 balok', description: 'Membangun menara sederhana dari 2-4 balok' },
  ],
  24: [
    { category: 'motor', title: 'Berlari', description: 'Anak mulai bisa berlari meski kadang masih jatuh' },
    { category: 'motor', title: 'Menendang bola', description: 'Bisa menendang bola ke arah tertentu' },
    { category: 'motor', title: 'Membuka pintu', description: 'Bisa memutar gagang pintu dan membukanya' },
    { category: 'speech', title: 'Mengucapkan 50+ kata', description: 'Kosakata berkembang pesat, lebih dari 50 kata' },
    { category: 'speech', title: 'Menggabungkan 2 kata', description: 'Mulai bicara 2 kata seperti "mau susu"' },
    { category: 'social', title: 'Menunjukkan kemandirian', description: 'Sering bilang "aku" atau "saya"' },
    { category: 'social', title: 'Bermain pura-pura', description: 'Mulai bermain pura-pura seperti memberi makan boneka' },
    { category: 'cognitive', title: 'Menyusun 4-6 balok', description: 'Menara balok lebih tinggi dan stabil' },
    { category: 'cognitive', title: 'Mengenal warna dasar', description: 'Mulai bisa menyebutkan 1-2 warna' },
  ],
  // 2-3 tahun
  30: [
    { category: 'motor', title: 'Berdiri satu kaki sebentar', description: 'Bisa berdiri satu kaki 1-2 detik' },
    { category: 'motor', title: 'Memanjat', description: 'Bisa naik turun furnitur sendiri' },
    { category: 'speech', title: 'Bicara dengan kalimat pendek', description: 'Kalimat 3-4 kata, bisa dimengerti orang lain' },
    { category: 'speech', title: 'Menyebutkan nama sendiri', description: 'Bisa menyebut nama lengkapnya' },
    { category: 'social', title: 'Mulai berbagi mainan', description: 'Meski kadang masih sulit, mulai belajar berbagi' },
    { category: 'social', title: 'Menunjukkan berbagai emosi', description: 'Ekspresi marah, senang, sedih makin jelas' },
    { category: 'cognitive', title: 'Mengelompokkan benda', description: 'Mengelompokkan benda berdasarkan warna atau bentuk' },
    { category: 'cognitive', title: 'Berhitung 1-5', description: 'Mulai bisa menghitung 1 sampai 5' },
  ],
  36: [
    { category: 'motor', title: 'Naik sepeda roda tiga', description: 'Bisa mengayuh sepeda roda tiga' },
    { category: 'motor', title: 'Menggambar lingkaran', description: 'Bisa menggambar lingkaran meski tidak sempurna' },
    { category: 'speech', title: 'Bicara lancar', description: 'Kalimat panjang 5-6 kata, bisa bercerita sederhana' },
    { category: 'speech', title: 'Bertanya "apa" dan "kenapa"', description: 'Sering bertanya tentang hal-hal di sekitarnya' },
    { category: 'social', title: 'Bermain dengan anak lain', description: 'Mulai bermain interaktif, bukan hanya paralel' },
    { category: 'social', title: 'Mengikuti aturan sederhana', description: 'Bisa mengikuti instruksi 2 langkah' },
    { category: 'cognitive', title: 'Mengenal 3-4 warna', description: 'Bisa menyebutkan 3-4 warna dengan benar' },
    { category: 'cognitive', title: 'Berhitung 1-10', description: 'Mulai hafal angka 1-10 walau urutan kadang loncat' },
  ],
  // 3-4 tahun
  48: [
    { category: 'motor', title: 'Berdiri satu kaki 5 detik', description: 'Keseimbangan lebih baik' },
    { category: 'motor', title: 'Menggunting kertas', description: 'Bisa menggunting mengikuti garis lurus' },
    { category: 'speech', title: 'Bercerita panjang', description: 'Bercerita tentang kejadian yang dialami' },
    { category: 'speech', title: 'Menggunakan kata depan', description: '"di atas", "di bawah", "di dalam"' },
    { category: 'social', title: 'Bergantian dalam permainan', description: 'Memahami konsep giliran dalam bermain' },
    { category: 'social', title: 'Peduli pada perasaan orang lain', description: 'Mulai menunjukkan empati' },
    { category: 'cognitive', title: 'Mengenal angka 1-20', description: 'Bisa menghitung dan mengenali angka' },
    { category: 'cognitive', title: 'Mengenal huruf', description: 'Mulai tertarik pada huruf dan tulisan' },
  ],
  // 5-6 tahun
  60: [
    { category: 'motor', title: 'Berdiri satu kaki 10 detik', description: 'Keseimbangan semakin baik' },
    { category: 'motor', title: 'Menulis nama sendiri', description: 'Bisa menulis nama sendiri' },
    { category: 'speech', title: 'Bicara sangat lancar', description: 'Bisa bercerita detail dengan struktur kalimat yang baik' },
    { category: 'speech', title: 'Baca beberapa kata', description: 'Mulai mengenali dan membaca kata sederhana' },
    { category: 'social', title: 'Berteman akrab', description: 'Punya teman bermain favorit' },
    { category: 'social', title: 'Memahami aturan sosial', description: 'Mulai paham sopan santun dasar' },
    { category: 'cognitive', title: 'Berhitung 1-50', description: 'Bisa berhitung sampai 50' },
    { category: 'cognitive', title: 'Mengenal abjad', description: 'Mengenal hampir semua huruf' },
  ],
  72: [
    { category: 'motor', title: 'Melompat dengan satu kaki', description: 'Bisa melompat-lompat dengan satu kaki' },
    { category: 'motor', title: 'Mengikat tali sepatu', description: 'Mulai belajar mengikat tali sepatu' },
    { category: 'speech', title: 'Membaca kalimat sederhana', description: 'Bisa membaca buku cerita sederhana' },
    { category: 'speech', title: 'Menulis kalimat pendek', description: 'Menulis 2-3 kata' },
    { category: 'social', title: 'Bermain tim', description: 'Memahami permainan tim dan kerja sama' },
    { category: 'social', title: 'Mengelola emosi lebih baik', description: 'Mulai bisa mengungkapkan perasaan dengan kata-kata' },
    { category: 'cognitive', title: 'Berhitung 1-100', description: 'Bisa berhitung dan konsep jumlah' },
    { category: 'cognitive', title: 'Membaca dan menulis', description: 'Kemampuan baca tulis dasar mulai terbentuk' },
  ],
};

// Development tips per usia
const devTips = {
  1: 'Bayi baru lahir belajar mengenali suara, bau, dan sentuhan orang tuanya. Setiap pelukan dan suara lembut membantu perkembangan otaknya.',
  2: 'Bayi mulai tersenyum sosial — ini adalah respon yang menunjukkan pengenalan. Ajak bayi bicara dan tersenyum balik setiap saat.',
  3: 'Di usia ini bayi mulai suka "berbicara" dengan ocehan. Tanggapi ocehannya dengan tersenyum dan meniru suaranya.',
  4: 'Warna cerah dan mainan dengan tekstur beragam sangat baik untuk stimulasi. Bayi juga mulai suka "cilukba"!',
  5: 'Bayi mulai paham konsep sebab-akibat. Mainan yang mengeluarkan suara saat ditekan sangat bagus untuk stimulasi kognitif.',
  6: 'Ini usia kritis untuk MPASI dan perkembangan motorik. Beri waktu tengkurap dan mainan aman yang bisa diraih.',
  9: 'Bayi mulai paham "object permanence" — benda tetap ada walau tidak terlihat. Mainan sembunyi-muncul sangat seru!',
  12: 'Selamat! Bayi sudah 1 tahun. Mulai bicara dengan kata-kata sederhana dan beri kesempatan berjalan dengan pegangan.',
  18: 'Toddler mulai menunjukkan kemandirian. Beri pilihan sederhana untuk membantunya belajar membuat keputusan.',
  24: 'Perkembangan bahasa meledak! Bacakan buku setiap hari dan ajak bicara sesering mungkin.',
  30: 'Anak mulai bermain pura-pura — ini penting untuk perkembangan sosial dan kreativitas. Sediakan alat bermain peran sederhana.',
  36: 'Memasuki usia prasekolah! Interaksi dengan teman sebaya sangat penting untuk perkembangan sosial dan bahasa.',
  48: 'Anak semakin mandiri dan punya rasa ingin tahu tinggi. Jawab pertanyaan dengan sabar dan ajak eksplorasi.',
  60: 'Persiapan sekolah dasar! Latih kemandirian dan kemampuan sosial. Baca buku bersama setiap hari.',
  72: 'Anak siap sekolah! Fokus pada kemampuan sosial, baca tulis dasar, dan kemandirian penuh.',
};

// Hal yang disarankan dan dihindari per rentang usia
const recommendations = {
  3: {
    do: ['Menyusui sesuai kebutuhan bayi', 'Ajak bayi berbicara dengan lembut', 'Berikan tummy time setiap hari', 'Bernyanyi dan memutar musik lembut'],
    dont: ['Memberikan susu sapi', 'Memberikan air putih berlebihan', 'Menggunakan gadget terlalu lama', 'Mengguncang bayi saat menangis'],
  },
  6: {
    do: ['Memberikan MPASI bergizi', 'Ajak bayi meraih mainan', 'Bacakan buku bergambar', 'Ajak bermain cilukba'],
    dont: ['Memberikan madu sebelum 1 tahun', 'Membiarkan bayi tidur tengkurap', 'Memaksa bayi duduk terlalu awal', 'Paparan gadget berlebihan'],
  },
  12: {
    do: ['Memberi makanan keluarga yang dilunakkan', 'Ajak bayi berjalan dengan pegangan', 'Bacakan buku setiap hari', 'Ajak bicara dengan kalimat pendek'],
    dont: ['Memberikan gula berlebihan', 'Membiarkan bayi menggunakan sendok sendiri tanpa pengawasan', 'Memaksa berjalan jika belum siap', 'Terlalu sering menggunakan baby walker'],
  },
  24: {
    do: ['Ajak bicara dengan kalimat lengkap', 'Bacakan buku cerita bergambar', 'Ajak bermain di luar rumah', 'Beri mainan edukatif sesuai usia'],
    dont: ['Memberikan screen time berlebihan', 'Memarahi saat anak tantrum berlebihan', 'Membandingkan dengan anak lain', 'Terlalu sering melarang tanpa penjelasan'],
  },
  36: {
    do: ['Ajak bermain peran (masak-masakan, dokter-dokteran)', 'Bacakan buku cerita lebih panjang', 'Kenalkan huruf dan angka lewat permainan', 'Ajak interaksi dengan teman sebaya'],
    dont: ['Membentak saat anak bertanya terus', 'Membiarkan screen time tanpa batas', 'Menekan anak untuk bisa baca tulis terlalu awal', 'Membandingkan kemampuan dengan anak lain'],
  },
  60: {
    do: ['Aktifitas fisik teratur', 'Bacakan buku cerita panjang', 'Latih menulis nama sendiri', 'Latih kemandirian (pakai baju, sikat gigi)'],
    dont: ['Membandingkan prestasi dengan anak lain', 'Memberikan tugas akademik berlebihan', 'Mengabaikan tanda stres pada anak', 'Screen time tanpa batas'],
  },
};

function getMilestones(age) {
  const keys = Object.keys(milestonesByAge).map(Number).sort((a, b) => a - b);
  let best = keys[0];
  for (const k of keys) { if (k <= age) best = k; }
  return milestonesByAge[best] || milestonesByAge[keys[0]];
}

function getDevTip(age) {
  const keys = Object.keys(devTips).map(Number).sort((a, b) => a - b);
  let best = keys[0];
  for (const k of keys) { if (k <= age) best = k; }
  return devTips[best] || devTips[keys[0]];
}

function getRecommendations(age) {
  const keys = Object.keys(recommendations).map(Number).sort((a, b) => a - b);
  let best = keys[0];
  for (const k of keys) { if (k <= age) best = k; }
  return recommendations[best] || recommendations[keys[0]];
}

function getTimeline(age) {
  const keys = Object.keys(milestonesByAge).map(Number).sort((a, b) => a - b);
  return keys.map(k => ({
    age: k,
    label: k <= 12 ? `${k} bulan` : k <= 24 ? `${k} bulan (${k/12} tahun)` : `${Math.floor(k/12)} tahun`,
    milestones: milestonesByAge[k].map(m => m.title),
    is_current: k === keys.find(x => x >= age) || (keys.filter(x => x >= age)[0] === k),
    is_past: k < keys.filter(x => x >= age)[0],
  }));
}

module.exports = { getMilestones, getDevTip, getRecommendations, getTimeline, milestonesByAge };
