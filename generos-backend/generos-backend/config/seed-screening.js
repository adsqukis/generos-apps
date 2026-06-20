require('dotenv').config();
const pool = require('./db');

// ============================================================================
// DATA SCREENING QUESTIONS & STIMULATION ACTIVITIES
// Berdasarkan KPSP (Kuesioner Pra Skrining Perkembangan) standar Kemenkes RI
// 4 Domain: cognitive, speech, immunity, motor
// ============================================================================

// ── SCREENING QUESTIONS ─────────────────────────────────────────────────────
// Format: { domain, age_min, age_max, question_text, question_type, options, sort_order }

const screeningQuestions = [
  // =========================================================================
  // USIA 0-3 BULAN (1 bulan)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 0, age_max: 3, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi dapat menatap wajah Anda saat digendong?' },
  { domain: 'cognitive', age_min: 0, age_max: 3, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi dapat mengikuti gerakan benda/ mainan dengan matanya?' },
  { domain: 'cognitive', age_min: 0, age_max: 3, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi bereaksi terhadap suara bel atau bunyi-bunyian?' },
  { domain: 'cognitive', age_min: 0, age_max: 3, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi dapat membedakan wajah orang yang dikenal dan tidak dikenal?' },
  { domain: 'cognitive', age_min: 0, age_max: 3, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi mulai tersenyum saat diajak bicara atau bermain?' },
  { domain: 'cognitive', age_min: 0, age_max: 3, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi menoleh ke arah sumber suara?' },
  // SPEECH
  { domain: 'speech', age_min: 0, age_max: 3, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi mengeluarkan suara "aaa" atau "ooo"?' },
  { domain: 'speech', age_min: 0, age_max: 3, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi menangis dengan nada berbeda untuk lapar, sakit, atau lelah?' },
  { domain: 'speech', age_min: 0, age_max: 3, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi tersenyum sebagai respons terhadap senyuman Anda?' },
  { domain: 'speech', age_min: 0, age_max: 3, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi mengeluarkan suara decitan atau dengkuran?' },
  { domain: 'speech', age_min: 0, age_max: 3, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi tenang saat mendengar suara ibu/ ayah?' },
  { domain: 'speech', age_min: 0, age_max: 3, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi merespon suara dengan menggerakkan tangan atau kaki?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 0, age_max: 3, sort_order: 1, question_type: 'multiple',
    question_text: 'Seberapa sering bayi sakit dalam 1 bulan terakhir?',
    options: ['Tidak pernah sakit', '1 kali', '2 kali', 'Lebih dari 2 kali'] },
  { domain: 'immunity', age_min: 0, age_max: 3, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah ASI/ susu formula habis disusu oleh bayi?' },
  { domain: 'immunity', age_min: 0, age_max: 3, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi memiliki nafsu makan/ minum yang baik?' },
  { domain: 'immunity', age_min: 0, age_max: 3, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi tidur dengan nyenyak tanpa rewel berlebihan?' },
  { domain: 'immunity', age_min: 0, age_max: 3, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah kulit bayi bersih tanpa ruam atau iritasi?' },
  { domain: 'immunity', age_min: 0, age_max: 3, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah berat badan bayi naik sesuai grafik KMS (Kartu Menuju Sehat)?' },
  // MOTOR
  { domain: 'motor', age_min: 0, age_max: 3, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi dapat mengangkat kepala saat tengkurap?' },
  { domain: 'motor', age_min: 0, age_max: 3, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi menggerakkan kedua tangan dan kaki secara aktif?' },
  { domain: 'motor', age_min: 0, age_max: 3, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi dapat menggenggam jari Anda saat disentuh?' },
  { domain: 'motor', age_min: 0, age_max: 3, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi dapat menopang kepala sebentar saat digendong tegak?' },
  { domain: 'motor', age_min: 0, age_max: 3, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi dapat menendang-nendang kakinya?' },
  { domain: 'motor', age_min: 0, age_max: 3, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi dapat membuka dan menutup tangannya?' },

  // =========================================================================
  // USIA 3-6 BULAN (3 bulan)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 3, age_max: 6, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi dapat meraih mainan yang diletakkan di depannya?' },
  { domain: 'cognitive', age_min: 3, age_max: 6, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi memindahkan mainan dari satu tangan ke tangan lainnya?' },
  { domain: 'cognitive', age_min: 3, age_max: 6, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi melihat benda kecil dengan rasa ingin tahu?' },
  { domain: 'cognitive', age_min: 3, age_max: 6, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi mencari benda yang jatuh atau hilang dari pandangan?' },
  { domain: 'cognitive', age_min: 3, age_max: 6, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi dapat membedakan mainan/ benda yang dikenalnya?' },
  { domain: 'cognitive', age_min: 3, age_max: 6, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi bereaksi saat namanya dipanggil?' },
  // SPEECH
  { domain: 'speech', age_min: 3, age_max: 6, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi mengoceh seperti "ba-ba", "da-da"?' },
  { domain: 'speech', age_min: 3, age_max: 6, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi tertawa keras saat diajak bermain?' },
  { domain: 'speech', age_min: 3, age_max: 6, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi menoleh ke arah suara mainan atau bel?' },
  { domain: 'speech', age_min: 3, age_max: 6, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi membalas "ocehan" ketika diajak bicara?' },
  { domain: 'speech', age_min: 3, age_max: 6, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi mengeluarkan suara vokal panjang seperti "aaahhh"?' },
  { domain: 'speech', age_min: 3, age_max: 6, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi menggunakan suara untuk mengekspresikan senang atau tidak senang?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 3, age_max: 6, sort_order: 1, question_type: 'multiple',
    question_text: 'Seberapa sering bayi sakit dalam 3 bulan terakhir?',
    options: ['Tidak pernah sakit', '1-2 kali', '3-4 kali', 'Lebih dari 4 kali'] },
  { domain: 'immunity', age_min: 3, age_max: 6, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi minum ASI/ susu formula dengan porsi yang cukup?' },
  { domain: 'immunity', age_min: 3, age_max: 6, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi aktif dan bergerak lincah saat bangun tidur?' },
  { domain: 'immunity', age_min: 3, age_max: 6, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah berat badan bayi naik sesuai kurva pertumbuhan?' },
  { domain: 'immunity', age_min: 3, age_max: 6, sort_order: 5, question_type: 'multiple',
    question_text: 'Seperti apa kondisi BAB bayi?',
    options: ['Normal/ teratur', 'Kadang sembelit', 'Sering mencret', 'Tidak teratur'] },
  { domain: 'immunity', age_min: 3, age_max: 6, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi mendapatkan imunisasi tepat waktu?' },
  // MOTOR
  { domain: 'motor', age_min: 3, age_max: 6, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi dapat tengkurap sendiri?' },
  { domain: 'motor', age_min: 3, age_max: 6, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi dapat mengangkat kepala hingga 90° saat tengkurap?' },
  { domain: 'motor', age_min: 3, age_max: 6, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi dapat memegang dan menggoyangkan mainan?' },
  { domain: 'motor', age_min: 3, age_max: 6, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi dapat menahan beban pada kaki saat digendong berdiri?' },
  { domain: 'motor', age_min: 3, age_max: 6, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi dapat berguling dari telentang ke miring?' },
  { domain: 'motor', age_min: 3, age_max: 6, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi memasukkan benda/ mainan ke mulut?' },

  // =========================================================================
  // USIA 6-9 BULAN (6 bulan)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 6, age_max: 9, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi dapat meraih mainan yang diberikan?' },
  { domain: 'cognitive', age_min: 6, age_max: 9, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi mencari benda yang jatuh (seperti sendok) dari kursi?' },
  { domain: 'cognitive', age_min: 6, age_max: 9, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi dapat meniru gerakan sederhana seperti tepuk tangan?' },
  { domain: 'cognitive', age_min: 6, age_max: 9, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi menggunakan kedua tangan untuk menjelajahi mainan?' },
  { domain: 'cognitive', age_min: 6, age_max: 9, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi mengenali wajah anggota keluarga dekat (ibu, ayah)?' },
  { domain: 'cognitive', age_min: 6, age_max: 9, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi menunjuk benda yang diinginkan dengan isyarat?' },
  // SPEECH
  { domain: 'speech', age_min: 6, age_max: 9, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi mengucapkan suku kata berulang seperti "ma-ma-ma" atau "da-da-da"?' },
  { domain: 'speech', age_min: 6, age_max: 9, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi merespon ketika namanya dipanggil?' },
  { domain: 'speech', age_min: 6, age_max: 9, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi menggunakan suara untuk menolak atau menolak sesuatu?' },
  { domain: 'speech', age_min: 6, age_max: 9, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi mengerti kata "tidak" atau "dadah"?' },
  { domain: 'speech', age_min: 6, age_max: 9, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi menoleh ke arah orang yang berbicara?' },
  { domain: 'speech', age_min: 6, age_max: 9, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi mengoceh dengan intonasi seperti bertanya atau bercerita?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 6, age_max: 9, sort_order: 1, question_type: 'multiple',
    question_text: 'Seberapa sering bayi sakit dalam 3 bulan terakhir?',
    options: ['Tidak pernah', '1 kali', '2-3 kali', 'Lebih dari 3 kali'] },
  { domain: 'immunity', age_min: 6, age_max: 9, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi mau makan MPASI yang diberikan?' },
  { domain: 'immunity', age_min: 6, age_max: 9, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi terlihat ceria dan aktif saat bermain?' },
  { domain: 'immunity', age_min: 6, age_max: 9, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah pertambahan berat badan bayi sesuai usia?' },
  { domain: 'immunity', age_min: 6, age_max: 9, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi tidak mengalami alergi makanan tertentu?' },
  { domain: 'immunity', age_min: 6, age_max: 9, sort_order: 6, question_type: 'multiple',
    question_text: 'Bagaimana kondisi nafsu makan bayi saat diperkenalkan MPASI?',
    options: ['Lahap', 'Biasa saja', 'Pilih-pilih', 'Sulit makan'] },
  // MOTOR
  { domain: 'motor', age_min: 6, age_max: 9, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi dapat duduk tanpa bantuan?' },
  { domain: 'motor', age_min: 6, age_max: 9, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi dapat merangkak?' },
  { domain: 'motor', age_min: 6, age_max: 9, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi dapat memindahkan benda dari satu tangan ke tangan lain?' },
  { domain: 'motor', age_min: 6, age_max: 9, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi dapat mengambil benda kecil dengan ibu jari dan jari telunjuk (pincer grasp)?' },
  { domain: 'motor', age_min: 6, age_max: 9, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi dapat bangun ke posisi duduk sendiri?' },
  { domain: 'motor', age_min: 6, age_max: 9, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi dapat bertepuk tangan?' },

  // =========================================================================
  // USIA 9-12 BULAN (9 bulan)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 9, age_max: 12, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi dapat menemukan benda yang disembunyikan (object permanence)?' },
  { domain: 'cognitive', age_min: 9, age_max: 12, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi meniru aktivitas sederhana seperti menyisir rambut?' },
  { domain: 'cognitive', age_min: 9, age_max: 12, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi menunjuk dengan jari telunjuk ke benda atau gambar yang menarik?' },
  { domain: 'cognitive', age_min: 9, age_max: 12, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi dapat mengambil mainan di balik kain atau penghalang?' },
  { domain: 'cognitive', age_min: 9, age_max: 12, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi memahami fungsi benda sederhana (sisir untuk rambut, telepon ke telinga)?' },
  { domain: 'cognitive', age_min: 9, age_max: 12, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi dapat membedakan benda miliknya dan milik orang lain?' },
  // SPEECH
  { domain: 'speech', age_min: 9, age_max: 12, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi mengucapkan "mama" atau "papa" dengan arti yang jelas?' },
  { domain: 'speech', age_min: 9, age_max: 12, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi mengerti perintah sederhana seperti "ambil" atau "sini"?' },
  { domain: 'speech', age_min: 9, age_max: 12, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi melambaikan tangan "dadah" saat berpisah?' },
  { domain: 'speech', age_min: 9, age_max: 12, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi mengucapkan 1-2 kata bermakna selain mama/papa?' },
  { domain: 'speech', age_min: 9, age_max: 12, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi meniru suara hewan atau bunyi-bunyian?' },
  { domain: 'speech', age_min: 9, age_max: 12, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi memahami kata "tidak" dengan menghentikan aktivitas?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 9, age_max: 12, sort_order: 1, question_type: 'multiple',
    question_text: 'Berapa kali bayi sakit (demam/ batuk/ pilek) dalam 6 bulan terakhir?',
    options: ['0-2 kali', '3-4 kali', '5-6 kali', 'Lebih dari 6 kali'] },
  { domain: 'immunity', age_min: 9, age_max: 12, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi mau makan 3 kali sehari dengan lahap?' },
  { domain: 'immunity', age_min: 9, age_max: 12, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah berat badan bayi ideal sesuai usia?' },
  { domain: 'immunity', age_min: 9, age_max: 12, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi aktif merangkak dan menjelajah lingkungan?' },
  { domain: 'immunity', age_min: 9, age_max: 12, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi tumbuh gigi sesuai tahapan usianya?' },
  { domain: 'immunity', age_min: 9, age_max: 12, sort_order: 6, question_type: 'multiple',
    question_text: 'Bagaimana kualitas tidur bayi?',
    options: ['Nyenyak sepanjang malam', 'Terbangun 1-2 kali', 'Sering terbangun', 'Sulit tidur'] },
  // MOTOR
  { domain: 'motor', age_min: 9, age_max: 12, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah bayi dapat berdiri sendiri selama beberapa detik?' },
  { domain: 'motor', age_min: 9, age_max: 12, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah bayi dapat berjalan dengan berpegangan pada perabotan?' },
  { domain: 'motor', age_min: 9, age_max: 12, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah bayi dapat mengambil benda kecil dengan ibu jari dan telunjuk?' },
  { domain: 'motor', age_min: 9, age_max: 12, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah bayi dapat duduk ke posisi berdiri tanpa bantuan?' },
  { domain: 'motor', age_min: 9, age_max: 12, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah bayi dapat memegang sendok atau alat makan sendiri?' },
  { domain: 'motor', age_min: 9, age_max: 12, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah bayi dapat melempar benda atau mainan dengan sengaja?' },

  // =========================================================================
  // USIA 12-15 BULAN (12 bulan)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 12, age_max: 15, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat meniru aktivitas rumah tangga (menyapu, memasak pura-pura)?' },
  { domain: 'cognitive', age_min: 12, age_max: 15, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak menunjuk bagian tubuh saat diminta?' },
  { domain: 'cognitive', age_min: 12, age_max: 15, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat memasukkan benda ke dalam wadah dan mengeluarkannya kembali?' },
  { domain: 'cognitive', age_min: 12, age_max: 15, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyusun 2-3 balok atau benda?' },
  { domain: 'cognitive', age_min: 12, age_max: 15, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak menunjukkan rasa ingin tahu dengan membuka laci atau lemari?' },
  { domain: 'cognitive', age_min: 12, age_max: 15, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyelesaikan tugas sederhana seperti membuka tutup kotak?' },
  // SPEECH
  { domain: 'speech', age_min: 12, age_max: 15, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak mengucapkan 3-5 kata bermakna?' },
  { domain: 'speech', age_min: 12, age_max: 15, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menunjuk benda atau gambar yang disebutkan namanya?' },
  { domain: 'speech', age_min: 12, age_max: 15, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak memahami perintah dua langkah seperti "ambil bola dan beri Ibu"?' },
  { domain: 'speech', age_min: 12, age_max: 15, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak meniru kata-kata yang diucapkan orang dewasa?' },
  { domain: 'speech', age_min: 12, age_max: 15, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak menggunakan isyarat seperti menunjuk sambil mengoceh?' },
  { domain: 'speech', age_min: 12, age_max: 15, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak menyebut nama panggilan sendiri?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 12, age_max: 15, sort_order: 1, question_type: 'multiple',
    question_text: 'Seberapa sering anak sakit dalam 6 bulan terakhir?',
    options: ['0-2 kali', '3-4 kali', '5-6 kali', 'Lebih dari 6 kali'] },
  { domain: 'immunity', age_min: 12, age_max: 15, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak makan makanan bergizi lengkap (karbo, protein, sayur)?' },
  { domain: 'immunity', age_min: 12, age_max: 15, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah berat dan tinggi badan anak sesuai standar usianya?' },
  { domain: 'immunity', age_min: 12, age_max: 15, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak aktif berjalan dan bergerak sepanjang hari?' },
  { domain: 'immunity', age_min: 12, age_max: 15, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak tidak memiliki keluhan pencernaan (sembelit/ diare) berulang?' },
  { domain: 'immunity', age_min: 12, age_max: 15, sort_order: 6, question_type: 'multiple',
    question_text: 'Bagaimana nafsu makan anak dalam 2 minggu terakhir?',
    options: ['Baik / lahap', 'Biasa saja', 'Pilih-pilih', 'Sulit makan'] },
  // MOTOR
  { domain: 'motor', age_min: 12, age_max: 15, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat berjalan sendiri tanpa bantuan?' },
  { domain: 'motor', age_min: 12, age_max: 15, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat membangun menara dari 2-4 balok?' },
  { domain: 'motor', age_min: 12, age_max: 15, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat memegang krayon dan membuat coretan?' },
  { domain: 'motor', age_min: 12, age_max: 15, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat membalikkan isi wadah untuk mengeluarkan benda?' },
  { domain: 'motor', age_min: 12, age_max: 15, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat berjalan mundur beberapa langkah?' },
  { domain: 'motor', age_min: 12, age_max: 15, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat memegang sendok sendiri saat makan?' },

  // =========================================================================
  // USIA 15-18 BULAN (15 bulan)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 15, age_max: 18, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat menunjuk minimal 3 bagian tubuh saat diminta?' },
  { domain: 'cognitive', age_min: 15, age_max: 18, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak meniru aktivitas sehari-hari seperti menyikat gigi?' },
  { domain: 'cognitive', age_min: 15, age_max: 18, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat mencocokkan benda sederhana (cangkir dan piring)?' },
  { domain: 'cognitive', age_min: 15, age_max: 18, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat bermain pura-pura (give mom pretend food)?' },
  { domain: 'cognitive', age_min: 15, age_max: 18, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak mencari bantuan orang dewasa saat menghadapi masalah?' },
  { domain: 'cognitive', age_min: 15, age_max: 18, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengikuti instruksi sederhana saat bermain?' },
  // SPEECH
  { domain: 'speech', age_min: 15, age_max: 18, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak mengucapkan 5-10 kata bermakna?' },
  { domain: 'speech', age_min: 15, age_max: 18, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggabungkan 2 kata seperti "mau susu" atau "mama pergi"?' },
  { domain: 'speech', age_min: 15, age_max: 18, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak menjawab pertanyaan sederhana dengan kata atau isyarat?' },
  { domain: 'speech', age_min: 15, age_max: 18, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak suka membawa buku dan "membaca" dengan ocehan?' },
  { domain: 'speech', age_min: 15, age_max: 18, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak menirukan ucapan kata terakhir dari kalimat orang dewasa?' },
  { domain: 'speech', age_min: 15, age_max: 18, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak menyebut nama orang atau hewan peliharaan?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 15, age_max: 18, sort_order: 1, question_type: 'multiple',
    question_text: 'Berapa kali anak mengalami demam dalam 6 bulan terakhir?',
    options: ['Tidak pernah', '1-2 kali', '3-4 kali', 'Lebih dari 4 kali'] },
  { domain: 'immunity', age_min: 15, age_max: 18, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak mau makan sayur dan buah setiap hari?' },
  { domain: 'immunity', age_min: 15, age_max: 18, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah berat badan anak ideal sesuai usia?' },
  { domain: 'immunity', age_min: 15, age_max: 18, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak menunjukkan energi yang cukup untuk bermain sepanjang hari?' },
  { domain: 'immunity', age_min: 15, age_max: 18, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak tidak mudah sakit saat cuaca berubah?' },
  { domain: 'immunity', age_min: 15, age_max: 18, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak sudah mendapatkan imunisasi booster sesuai jadwal?' },
  // MOTOR
  { domain: 'motor', age_min: 15, age_max: 18, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat berlari dengan stabil?' },
  { domain: 'motor', age_min: 15, age_max: 18, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat memanjat naik ke kursi atau sofa?' },
  { domain: 'motor', age_min: 15, age_max: 18, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat mencoret-coret dengan krayon atau pensil?' },
  { domain: 'motor', age_min: 15, age_max: 18, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat membalik halaman buku (2-3 halaman sekaligus)?' },
  { domain: 'motor', age_min: 15, age_max: 18, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat memakai baju/ celana sederhana?' },
  { domain: 'motor', age_min: 15, age_max: 18, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menendang bola ke depan?' },

  // =========================================================================
  // USIA 18-24 BULAN (18 bulan)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 18, age_max: 24, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyusun 4-6 balok menjadi menara?' },
  { domain: 'cognitive', age_min: 18, age_max: 24, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat memasangkan benda dengan bentuk yang sesuai (shape sorter)?' },
  { domain: 'cognitive', age_min: 18, age_max: 24, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menunjuk minimal 5 bagian tubuh saat disebutkan?' },
  { domain: 'cognitive', age_min: 18, age_max: 24, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak melakukan permainan pura-pura yang lebih kompleks (memberi minum boneka)?' },
  { domain: 'cognitive', age_min: 18, age_max: 24, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengelompokkan benda berdasarkan warna atau ukuran?' },
  { domain: 'cognitive', age_min: 18, age_max: 24, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyelesaikan puzzle 2-3 keping?' },
  // SPEECH
  { domain: 'speech', age_min: 18, age_max: 24, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak memiliki minimal 20-50 kosakata yang diucapkan?' },
  { domain: 'speech', age_min: 18, age_max: 24, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggabungkan 2-3 kata menjadi kalimat pendek?' },
  { domain: 'speech', age_min: 18, age_max: 24, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan nama-nama benda yang dikenalnya?' },
  { domain: 'speech', age_min: 18, age_max: 24, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak mengerti pertanyaan dengan kata tanya "apa" atau "siapa"?' },
  { domain: 'speech', age_min: 18, age_max: 24, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak suka bernyanyi atau mengucapkan kata-kata dari lagu?' },
  { domain: 'speech', age_min: 18, age_max: 24, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan nama sendiri?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 18, age_max: 24, sort_order: 1, question_type: 'multiple',
    question_text: 'Berapa kali anak sakit (demam/ batuk/ diare) dalam 6 bulan terakhir?',
    options: ['0-3 kali', '4-5 kali', '6-7 kali', 'Lebih dari 7 kali'] },
  { domain: 'immunity', age_min: 18, age_max: 24, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak mau mengonsumsi sayuran dan lauk pauk setiap hari?' },
  { domain: 'immunity', age_min: 18, age_max: 24, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah berat dan tinggi badan anak sesuai dengan usianya?' },
  { domain: 'immunity', age_min: 18, age_max: 24, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak tidur cukup (11-14 jam per hari termasuk tidur siang)?' },
  { domain: 'immunity', age_min: 18, age_max: 24, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak jarang mengeluh sakit perut?' },
  { domain: 'immunity', age_min: 18, age_max: 24, sort_order: 6, question_type: 'multiple',
    question_text: 'Bagaimana kebiasaan minum air putih anak?',
    options: ['Cukup minum (>6 gelas)', 'Cukup (4-6 gelas)', 'Kurang (2-4 gelas)', 'Sangat kurang (<2 gelas)'] },
  // MOTOR
  { domain: 'motor', age_min: 18, age_max: 24, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat berlari tanpa sering jatuh?' },
  { domain: 'motor', age_min: 18, age_max: 24, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menaiki tangga dengan berpegangan?' },
  { domain: 'motor', age_min: 18, age_max: 24, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat membangun menara dari 6-7 balok?' },
  { domain: 'motor', age_min: 18, age_max: 24, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat makan menggunakan sendok sendiri dengan rapi?' },
  { domain: 'motor', age_min: 18, age_max: 24, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat melempar bola dengan kedua tangan?' },
  { domain: 'motor', age_min: 18, age_max: 24, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat mencoret-coret garis vertikal atau horizontal?' },

  // =========================================================================
  // USIA 24-30 BULAN (24 bulan / 2 tahun)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 24, age_max: 30, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyusun 7-8 balok menjadi menara?' },
  { domain: 'cognitive', age_min: 24, age_max: 30, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat membedakan benda besar dan kecil?' },
  { domain: 'cognitive', age_min: 24, age_max: 30, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat mencocokkan warna dasar (merah, kuning, biru)?' },
  { domain: 'cognitive', age_min: 24, age_max: 30, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat bermain peran sederhana seperti dokter-dokteran atau masak-masakan?' },
  { domain: 'cognitive', age_min: 24, age_max: 30, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak memahami konsep kepemilikan ("ini punya aku")?' },
  { domain: 'cognitive', age_min: 24, age_max: 30, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengikuti permainan dengan aturan sederhana?' },
  // SPEECH
  { domain: 'speech', age_min: 24, age_max: 30, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak memiliki sekitar 50-100 kosakata?' },
  { domain: 'speech', age_min: 24, age_max: 30, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggunakan kalimat 3-4 kata?' },
  { domain: 'speech', age_min: 24, age_max: 30, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan nama-nama benda di buku atau lingkungan?' },
  { domain: 'speech', age_min: 24, age_max: 30, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak mengerti perintah 2 langkah secara berurutan?' },
  { domain: 'speech', age_min: 24, age_max: 30, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak menyebutkan dirinya dengan nama panggilan?' },
  { domain: 'speech', age_min: 24, age_max: 30, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan kata ganti seperti "saya", "kamu"?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 24, age_max: 30, sort_order: 1, question_type: 'multiple',
    question_text: 'Berapa kali anak sakit dalam 6 bulan terakhir?',
    options: ['0-3 kali', '4-5 kali', '6-7 kali', 'Lebih dari 7 kali'] },
  { domain: 'immunity', age_min: 24, age_max: 30, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak mengonsumsi aneka ragam makanan setiap hari?' },
  { domain: 'immunity', age_min: 24, age_max: 30, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah pertumbuhan tinggi dan berat anak sesuai standar?' },
  { domain: 'immunity', age_min: 24, age_max: 30, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak memiliki aktivitas fisik yang cukup setiap hari?' },
  { domain: 'immunity', age_min: 24, age_max: 30, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak jarang mengalami keluhan kesehatan (sariawan, ruam, gatal)?' },
  { domain: 'immunity', age_min: 24, age_max: 30, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak rutin mengkonsumsi vitamin atau suplemen imunitas?' },
  // MOTOR
  { domain: 'motor', age_min: 24, age_max: 30, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat melompat dengan kedua kaki?' },
  { domain: 'motor', age_min: 24, age_max: 30, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat berdiri dengan satu kaki selama 1-2 detik?' },
  { domain: 'motor', age_min: 24, age_max: 30, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggambar lingkaran?' },
  { domain: 'motor', age_min: 24, age_max: 30, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat membuka kancing/paku baju besar?' },
  { domain: 'motor', age_min: 24, age_max: 30, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat menendang bola ke arah tertentu?' },
  { domain: 'motor', age_min: 24, age_max: 30, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat memegang pensil dengan ibu jari dan jari (bukan kepalan)?' },

  // =========================================================================
  // USIA 30-36 BULAN (30 bulan / 2.5 tahun)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 30, age_max: 36, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyusun 8-10 balok?' },
  { domain: 'cognitive', age_min: 30, age_max: 36, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan 4-5 warna dasar?' },
  { domain: 'cognitive', age_min: 30, age_max: 36, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak memahami konsep bilangan (1, 2, 3, banyak, sedikit)?' },
  { domain: 'cognitive', age_min: 30, age_max: 36, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengurutkan benda dari yang besar ke kecil?' },
  { domain: 'cognitive', age_min: 30, age_max: 36, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyelesaikan puzzle 4-6 keping?' },
  { domain: 'cognitive', age_min: 30, age_max: 36, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat bercerita tentang kejadian yang dialaminya?' },
  // SPEECH
  { domain: 'speech', age_min: 30, age_max: 36, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat menceritakan pengalaman sederhana?' },
  { domain: 'speech', age_min: 30, age_max: 36, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak menggunakan kalimat 4-5 kata dengan tata bahasa yang cukup baik?' },
  { domain: 'speech', age_min: 30, age_max: 36, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat diajak berdialog sederhana (tanya jawab)?' },
  { domain: 'speech', age_min: 30, age_max: 36, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan nama teman atau anggota keluarga?' },
  { domain: 'speech', age_min: 30, age_max: 36, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak mengerti kata depan (di atas, di bawah, di dalam)?' },
  { domain: 'speech', age_min: 30, age_max: 36, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak suka bertanya "apa ini?" atau "kenapa?"?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 30, age_max: 36, sort_order: 1, question_type: 'multiple',
    question_text: 'Frekuensi sakit dalam 6 bulan terakhir?',
    options: ['0-3 kali', '4-5 kali', '6-8 kali', 'Lebih dari 8 kali'] },
  { domain: 'immunity', age_min: 30, age_max: 36, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak memiliki pola makan seimbang setiap hari?' },
  { domain: 'immunity', age_min: 30, age_max: 36, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah tinggi dan berat badan anak sesuai kurva pertumbuhan?' },
  { domain: 'immunity', age_min: 30, age_max: 36, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak aktif secara fisik dan suka bermain di luar?' },
  { domain: 'immunity', age_min: 30, age_max: 36, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak memiliki kebiasaan cuci tangan sebelum makan?' },
  { domain: 'immunity', age_min: 30, age_max: 36, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak tidak mudah lelah atau lesu?' },
  // MOTOR
  { domain: 'motor', age_min: 30, age_max: 36, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat berjalan jinjit (berdiri di ujung jari)?' },
  { domain: 'motor', age_min: 30, age_max: 36, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat berdiri dengan 1 kaki selama 3-4 detik?' },
  { domain: 'motor', age_min: 30, age_max: 36, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggambar lingkaran dan garis lurus?' },
  { domain: 'motor', age_min: 30, age_max: 36, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggunting kertas?' },
  { domain: 'motor', age_min: 30, age_max: 36, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat memakai baju sendiri dengan sedikit bantuan?' },
  { domain: 'motor', age_min: 30, age_max: 36, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menangkap bola besar dengan dua tangan?' },

  // =========================================================================
  // USIA 36-48 BULAN (36 bulan / 3 tahun)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 36, age_max: 48, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan 5-8 warna berbeda?' },
  { domain: 'cognitive', age_min: 36, age_max: 48, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menghitung 1-10 secara berurutan?' },
  { domain: 'cognitive', age_min: 36, age_max: 48, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menceritakan kembali cerita yang pernah didengar?' },
  { domain: 'cognitive', age_min: 36, age_max: 48, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak memahami konsep waktu (pagi, siang, malam)?' },
  { domain: 'cognitive', age_min: 36, age_max: 48, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengelompokkan benda berdasarkan bentuk, warna, dan ukuran?' },
  { domain: 'cognitive', age_min: 36, age_max: 48, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat memecahkan masalah sederhana (membuka klip, menyambung mainan)?' },
  { domain: 'cognitive', age_min: 36, age_max: 48, sort_order: 7, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengikuti permainan dengan aturan 2-3 langkah?' },
  { domain: 'cognitive', age_min: 36, age_max: 48, sort_order: 8, question_type: 'yesno',
    question_text: 'Apakah anak dapat membedakan bentuk geometri dasar (lingkaran, segitiga, kotak)?' },
  // SPEECH
  { domain: 'speech', age_min: 36, age_max: 48, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggunakan kalimat 5-6 kata dengan baik?' },
  { domain: 'speech', age_min: 36, age_max: 48, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat memahami dan menjawab pertanyaan "kenapa" dan "bagaimana"?' },
  { domain: 'speech', age_min: 36, age_max: 48, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat bercerita tentang apa yang terjadi di sekolah atau bermain?' },
  { domain: 'speech', age_min: 36, age_max: 48, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan nama lengkap dan usia?' },
  { domain: 'speech', age_min: 36, age_max: 48, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyanyikan lagu sederhana sepenuhnya?' },
  { domain: 'speech', age_min: 36, age_max: 48, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan huruf atau angka yang dikenalnya?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 36, age_max: 48, sort_order: 1, question_type: 'multiple',
    question_text: 'Frekuensi anak sakit (izin tidak masuk sekolah/ PAUD) dalam 6 bulan terakhir?',
    options: ['0-3 hari', '4-7 hari', '8-14 hari', 'Lebih dari 14 hari'] },
  { domain: 'immunity', age_min: 36, age_max: 48, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak makan semua jenis makanan (sayur, buah, protein, karbo)?' },
  { domain: 'immunity', age_min: 36, age_max: 48, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah tinggi dan berat badan anak ideal?' },
  { domain: 'immunity', age_min: 36, age_max: 48, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak aktif berlari, melompat, dan bermain sepanjang hari?' },
  { domain: 'immunity', age_min: 36, age_max: 48, sort_order: 5, question_type: 'multiple',
    question_text: 'Bagaimana kualitas tidur anak di malam hari?',
    options: ['Nyenyak 10-12 jam', 'Terbangun 1 kali', 'Sering terbangun', 'Sulit tidur'] },
  { domain: 'immunity', age_min: 36, age_max: 48, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak rajin menggosok gigi dan mandi secara mandiri?' },
  // MOTOR
  { domain: 'motor', age_min: 36, age_max: 48, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat berjalan naik turun tangga dengan bergantian kaki?' },
  { domain: 'motor', age_min: 36, age_max: 48, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat berdiri dengan 1 kaki selama 5-6 detik?' },
  { domain: 'motor', age_min: 36, age_max: 48, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggambar lingkaran, segitiga, dan kotak?' },
  { domain: 'motor', age_min: 36, age_max: 48, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggunting mengikuti garis lurus?' },
  { domain: 'motor', age_min: 36, age_max: 48, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengancing dan membuka kancing baju sendiri?' },
  { domain: 'motor', age_min: 36, age_max: 48, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menangkap bola dengan kedua tangan dari jarak 1 meter?' },

  // =========================================================================
  // USIA 48-60 BULAN (48 bulan / 4 tahun)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 48, age_max: 60, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan angka 1-20 dan menghitung 10 benda?' },
  { domain: 'cognitive', age_min: 48, age_max: 60, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan huruf alfabet (minimal 15 huruf)?' },
  { domain: 'cognitive', age_min: 48, age_max: 60, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak menulis nama sendiri atau beberapa huruf?' },
  { domain: 'cognitive', age_min: 48, age_max: 60, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak memahami konsep lebih/ kurang, sama/ berbeda?' },
  { domain: 'cognitive', age_min: 48, age_max: 60, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat bercerita dengan urutan logis (awal, tengah, akhir)?' },
  { domain: 'cognitive', age_min: 48, age_max: 60, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyelesaikan puzzle 8-12 keping?' },
  { domain: 'cognitive', age_min: 48, age_max: 60, sort_order: 7, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengikuti petunjuk 3 langkah berurutan?' },
  { domain: 'cognitive', age_min: 48, age_max: 60, sort_order: 8, question_type: 'yesno',
    question_text: 'Apakah anak dapat membedakan waktu (hari ini, kemarin, besok)?' },
  // SPEECH
  { domain: 'speech', age_min: 48, age_max: 60, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat bercerita tentang kejadian dengan detail?' },
  { domain: 'speech', age_min: 48, age_max: 60, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggunakan kalimat kompleks (6-8 kata)?' },
  { domain: 'speech', age_min: 48, age_max: 60, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menjawab pertanyaan tentang "bagaimana" dan "mengapa"?' },
  { domain: 'speech', age_min: 48, age_max: 60, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan nama hari dan bulan?' },
  { domain: 'speech', age_min: 48, age_max: 60, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat berpartisipasi dalam percakapan 2 arah?' },
  { domain: 'speech', age_min: 48, age_max: 60, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan nama-nama huruf dan bunyinya?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 48, age_max: 60, sort_order: 1, question_type: 'multiple',
    question_text: 'Frekuensi anak sakit (izin sekolah/ PAUD) dalam 6 bulan terakhir?',
    options: ['0-3 hari', '4-7 hari', '8-14 hari', 'Lebih dari 14 hari'] },
  { domain: 'immunity', age_min: 48, age_max: 60, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak makan dengan pola gizi seimbang dan porsi cukup?' },
  { domain: 'immunity', age_min: 48, age_max: 60, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah tinggi dan berat badan anak ideal sesuai usia?' },
  { domain: 'immunity', age_min: 48, age_max: 60, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak memiliki kebiasaan hidup sehat (cuci tangan, mandi 2x/hari)?' },
  { domain: 'immunity', age_min: 48, age_max: 60, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak bisa diajak olahraga atau aktivitas fisik bersama?' },
  { domain: 'immunity', age_min: 48, age_max: 60, sort_order: 6, question_type: 'multiple',
    question_text: 'Seberapa sering anak mengonsumsi makanan manis/ jajanan?',
    options: ['Jarang (<2x/minggu)', 'Kadang (2-4x/minggu)', 'Sering (hampir tiap hari)', 'Setiap hari'] },
  // MOTOR
  { domain: 'motor', age_min: 48, age_max: 60, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat melompat dengan 1 kaki?' },
  { domain: 'motor', age_min: 48, age_max: 60, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat berjinjit dan berjalan di garis lurus?' },
  { domain: 'motor', age_min: 48, age_max: 60, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggambar orang dengan 3-4 bagian tubuh (kepala, badan, tangan)?' },
  { domain: 'motor', age_min: 48, age_max: 60, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat menulis beberapa huruf atau angka?' },
  { domain: 'motor', age_min: 48, age_max: 60, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat memotong makanan sendiri dengan garpu?' },
  { domain: 'motor', age_min: 48, age_max: 60, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengikat tali sepatu dengan bantuan?' },

  // =========================================================================
  // USIA 60+ BULAN (60 bulan / 5 tahun)
  // =========================================================================
  // COGNITIVE
  { domain: 'cognitive', age_min: 60, age_max: 72, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat menghitung 1-30 dan menyebutkan jumlah 10-15 benda?' },
  { domain: 'cognitive', age_min: 60, age_max: 72, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan seluruh huruf alfabet?' },
  { domain: 'cognitive', age_min: 60, age_max: 72, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak mulai membaca kata sederhana atau suku kata?' },
  { domain: 'cognitive', age_min: 60, age_max: 72, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat menulis nama lengkapnya sendiri?' },
  { domain: 'cognitive', age_min: 60, age_max: 72, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak memahami konsep waktu (hari, minggu, bulan)?' },
  { domain: 'cognitive', age_min: 60, age_max: 72, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat melakukan penjumlahan dan pengurangan sederhana (1-10)?' },
  { domain: 'cognitive', age_min: 60, age_max: 72, sort_order: 7, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyusun cerita dengan alur dan tokoh?' },
  { domain: 'cognitive', age_min: 60, age_max: 72, sort_order: 8, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengklasifikasikan benda berdasarkan 2 kriteria (warna+bentuk)?' },
  // SPEECH
  { domain: 'speech', age_min: 60, age_max: 72, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak berbicara dengan kalimat lengkap dan jelas dipahami orang lain?' },
  { domain: 'speech', age_min: 60, age_max: 72, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat menceritakan kembali cerita dengan detail dan urutan benar?' },
  { domain: 'speech', age_min: 60, age_max: 72, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan alamat rumah atau nama jalan?' },
  { domain: 'speech', age_min: 60, age_max: 72, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak berpartisipasi dalam diskusi kelompok (misal saat belajar)?' },
  { domain: 'speech', age_min: 60, age_max: 72, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggunakan kata kerja lampau, kini, dan akan datang?' },
  { domain: 'speech', age_min: 60, age_max: 72, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menyebutkan huruf dan bunyi fonetiknya?' },
  // IMMUNITY
  { domain: 'immunity', age_min: 60, age_max: 72, sort_order: 1, question_type: 'multiple',
    question_text: 'Frekuensi anak sakit (tidak masuk sekolah) dalam 6 bulan terakhir?',
    options: ['0-3 hari', '4-7 hari', '8-14 hari', 'Lebih dari 14 hari'] },
  { domain: 'immunity', age_min: 60, age_max: 72, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak mengonsumsi makanan bergizi seimbang tanpa pilih-pilih?' },
  { domain: 'immunity', age_min: 60, age_max: 72, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah berat dan tinggi badan anak ideal sesuai standar?' },
  { domain: 'immunity', age_min: 60, age_max: 72, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak aktif dalam kegiatan olahraga/ fisik minimal 3x seminggu?' },
  { domain: 'immunity', age_min: 60, age_max: 72, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak memiliki kebersihan diri yang baik (mandi, cuci tangan, gosok gigi)?' },
  { domain: 'immunity', age_min: 60, age_max: 72, sort_order: 6, question_type: 'multiple',
    question_text: 'Seberapa sering anak mengonsumsi sayuran hijau?',
    options: ['Setiap hari', 'Beberapa kali seminggu', 'Kadang-kadang', 'Tidak suka sayur'] },
  // MOTOR
  { domain: 'motor', age_min: 60, age_max: 72, sort_order: 1, question_type: 'yesno',
    question_text: 'Apakah anak dapat melompat tali atau lompat dengan satu kaki berulang?' },
  { domain: 'motor', age_min: 60, age_max: 72, sort_order: 2, question_type: 'yesno',
    question_text: 'Apakah anak dapat berdiri dengan 1 kaki selama 8-10 detik?' },
  { domain: 'motor', age_min: 60, age_max: 72, sort_order: 3, question_type: 'yesno',
    question_text: 'Apakah anak dapat menulis huruf dan angka dengan rapi?' },
  { domain: 'motor', age_min: 60, age_max: 72, sort_order: 4, question_type: 'yesno',
    question_text: 'Apakah anak dapat menggambar orang dengan 6+ bagian tubuh?' },
  { domain: 'motor', age_min: 60, age_max: 72, sort_order: 5, question_type: 'yesno',
    question_text: 'Apakah anak dapat mengikat tali sepatu sendiri?' },
  { domain: 'motor', age_min: 60, age_max: 72, sort_order: 6, question_type: 'yesno',
    question_text: 'Apakah anak dapat menangkap bola kecil dengan satu tangan?' },
];

// ── STIMULATION ACTIVITIES ──────────────────────────────────────────────────
// Format: { domain, title, description, age_min, age_max, duration, difficulty,
//           materials, category, sort_order }

const stimulationActivities = [
  // =========================================================================
  // COGNITIVE — STIMULASI KECERDASAN
  // =========================================================================

  // --- Usia 0-3 bulan ---
  { domain: 'cognitive', title: 'Menatap Wajah', description: 'Dekatkan wajah Anda ke bayi (20-30 cm). Tatap matanya, tersenyum, dan ajak bicara dengan suara lembut.', age_min: 0, age_max: 3, duration: '2-5 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Mainan Hitam Putih', description: 'Perlihatkan kartu bergambar hitam-putih atau pola geometris kontras tinggi secara perlahan di depan bayi untuk merangsang penglihatan.', age_min: 0, age_max: 3, duration: '2-3 menit', difficulty: 'mudah', materials: 'Kartu hitam-putih/kontras tinggi', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Mengikuti Benda Bergerak', description: 'Gerakkan mainan berwarna cerah perlahan dari kiri ke kanan di depan mata bayi. Dorong bayi untuk mengikuti dengan matanya.', age_min: 0, age_max: 3, duration: '3-5 menit', difficulty: 'mudah', materials: 'Mainan gantung/ rattle warna cerah', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Suara dan Respons', description: 'Bunyikan mainan kerincing di samping kiri dan kanan bayi secara bergantian. Amati apakah bayi menoleh ke sumber suara.', age_min: 0, age_max: 3, duration: '3-5 menit', difficulty: 'mudah', materials: 'Rattle/ mainan bunyi', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Bermain Cermin', description: 'Letakkan cermin bayi yang aman di depan bayi tengkurap. Biarkan bayi melihat bayangannya sendiri dan tersenyum.', age_min: 0, age_max: 3, duration: '3-5 menit', difficulty: 'mudah', materials: 'Cermin bayi (tidak mudah pecah)', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 3-6 bulan ---
  { domain: 'cognitive', title: 'Cilukba', description: 'Tutup wajah Anda dengan tangan atau kain, lalu buka sambil berkata "cilukba!" dengan ekspresi ceria. Variasi: sembunyikan mainan di bawah kain.', age_min: 3, age_max: 6, duration: '3-5 menit', difficulty: 'mudah', materials: 'Kain tipis atau selendang', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Meraih dan Memegang', description: 'Gantung mainan di atas bayi yang telentang, biarkan bayi meraih dan mencoba memegangnya. Beri pujian saat berhasil.', age_min: 3, age_max: 6, duration: '5-10 menit', difficulty: 'mudah', materials: 'Mainan gantung berwarna cerah', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Pindah Tangan', description: 'Berikan mainan di satu tangan bayi, lalu tawarkan mainan lain di sisi lainnya. Dorong bayi untuk memindahkan atau memegang dengan kedua tangan.', age_min: 3, age_max: 6, duration: '3-5 menit', difficulty: 'mudah', materials: '2 mainan kecil (rattle, teether)', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Suara Benda Jatuh', description: 'Jatuhkan benda lembut (boneka kecil) dari meja di depan bayi. Biarkan bayi mencari benda yang jatuh. Ambil dan ulangi.', age_min: 3, age_max: 6, duration: '3-5 menit', difficulty: 'mudah', materials: 'Boneka kecil/ kain lap', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Stimulasi Meraih', description: 'Pegang mainan sedikit di luar jangkauan bayi tengkurap untuk mendorongnya meraih. Beri pujian dan berikan mainan saat berhasil.', age_min: 3, age_max: 6, duration: '5-10 menit', difficulty: 'sedang', materials: 'Mainan kesukaan bayi', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 6-9 bulan ---
  { domain: 'cognitive', title: 'Bermain Tutup Buka', description: 'Tutup mainan dengan gelas atau mangkuk plastik, biarkan bayi membuka dan menemukannya. Variasi: sembunyikan di bawah wadah yang berbeda.', age_min: 6, age_max: 9, duration: '5-10 menit', difficulty: 'mudah', materials: 'Gelas plastik, mangkuk, mainan kecil', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Tepuk Tangan Bersama', description: 'Ajak bayi duduk di pangkuan Anda. Tepuk tangan sambil bernyanyi lagu ceria. Pegang tangan bayi dan bantu dia bertepuk.', age_min: 6, age_max: 9, duration: '3-5 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Kotak Kejutan', description: 'Siapkan kotak berisi benda-benda aman dengan tekstur berbeda (kain, spons, mainan karet). Keluarkan satu per satu dan tunjukkan pada bayi.', age_min: 6, age_max: 9, duration: '5-10 menit', difficulty: 'sedang', materials: 'Kotak dan benda dengan tekstur berbeda', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Object Permanence Box', description: 'Masukkan bola kecil ke lubang di kotak, tunjukkan bola muncul kembali. Biarkan bayi mencoba sendiri. Ini mengajarkan konsep benda tetap ada.', age_min: 6, age_max: 9, duration: '5-10 menit', difficulty: 'sedang', materials: 'Kotak berlubang + bola kayu/plastik', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Sembunyi dan Cari', description: 'Sembunyikan mainan favorit di bawah salah satu dari 2 gelas di depan bayi. Dorong bayi untuk mencari dan mengangkat gelas yang benar.', age_min: 6, age_max: 9, duration: '5-10 menit', difficulty: 'sedang', materials: '2 gelas plastik, mainan kecil', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 9-12 bulan ---
  { domain: 'cognitive', title: 'Mainan Fungsi Benda', description: 'Tunjukkan cara menggunakan benda sehari-hari: sisir untuk rambut, telepon mainan ke telinga, sendok untuk makan. Biarkan bayi meniru.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'mudah', materials: 'Benda sehari-hari (sisir, telepon mainan, sendok)', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Puzzle Satu Keping', description: 'Gunakan puzzle kayu dengan 1 keping bentuk sederhana (lingkaran). Tunjukkan cara memasukkan, lalu biarkan bayi mencoba.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'sedang', materials: 'Puzzle keping tunggal (shape sorter)', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Bermain Balok', description: 'Berikan 3-4 balok besar. Tunjukkan cara menyusunnya menjadi menara. Ajak bayi meniru dan beri pujian saat menara berdiri.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'mudah', materials: 'Balok kayu/plastik besar (4-6 buah)', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Menunjuk Buku Gambar', description: 'Buka buku bergambar. Tunjuk gambar sambil menyebut nama. Minta bayi menunjuk gambar yang Anda sebutkan.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'mudah', materials: 'Buku bergambar besar', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Pura-pura Sederhana', description: 'Ajak bayi minum boneka atau memberi makan boneka dengan sendok. Lakukan gerakan pura-pura dan biarkan bayi mengamati lalu meniru.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'sedang', materials: 'Boneka, cangkir mainan, sendok', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 12-15 bulan ---
  { domain: 'cognitive', title: 'Menunjuk Bagian Tubuh', description: 'Sambil bernyanyi lagu "Kepala Pundak Lutut Kaki", tunjuk bagian tubuh. Minta anak meniru. Tanyakan "mana mata?" dan tunggu respons.', age_min: 12, age_max: 15, duration: '5-10 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Memasukkan dan Mengeluarkan', description: 'Sediakan wadah dan benda kecil. Tunjukkan cara memasukkan benda ke wadah, lalu mengeluarkannya. Biarkan anak mengulangi berkali-kali.', age_min: 12, age_max: 15, duration: '5-10 menit', difficulty: 'mudah', materials: 'Wadah/ ember kecil + 5-6 benda kecil', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Menara Balok', description: 'Ajak anak menyusun balok setinggi mungkin. Hitung bersama setiap balok yang ditumpuk. Beri semangat saat menara roboh dan coba lagi.', age_min: 12, age_max: 15, duration: '5-10 menit', difficulty: 'mudah', materials: 'Balok kayu/plastik 6-10 buah', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Imitasi Rumah Tangga', description: 'Berikan kain lap bersih atau sapu mainan. Tunjukkan cara menyapu atau mengelap meja. Ajak anak membantu kegiatan rumah tangga sederhana.', age_min: 12, age_max: 15, duration: '5-10 menit', difficulty: 'sedang', materials: 'Kain lap, sapu mainan', category: 'general', sort_order: 4 },
  { domain: 'cognitive', title: 'Bermain Petak Umpet Sederhana', description: 'Sembunyikan diri di balik tirai atau pintu, panggil nama anak. Saat anak menemukan, peluk dan puji dengan antusias.', age_min: 12, age_max: 15, duration: '5-10 menit', difficulty: 'mudah', materials: 'Tirai atau sudut ruangan', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Latihan Menunjuk', description: 'Pegang tangan anak dan bantu menunjuk gambar di buku. Lakukan rutin setiap hari. Beri pujian saat anak menunjuk sendiri.', age_min: 12, age_max: 15, duration: '3-5 menit', difficulty: 'mudah', materials: 'Buku bergambar', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 15-18 bulan ---
  { domain: 'cognitive', title: 'Mencocokkan Benda', description: 'Sediakan 2 pasang benda (2 sendok, 2 cangkir). Campur acak, minta anak memasangkan benda yang sama.', age_min: 15, age_max: 18, duration: '5-10 menit', difficulty: 'sedang', materials: 'Pasangan benda rumah tangga', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Bermain Dokter-dokteran', description: 'Gunakan mainan dokter atau alat sederhana (tongkat sebagai stetoskop). Periksa boneka, ajak anak memeriksa Anda atau boneka.', age_min: 15, age_max: 18, duration: '10-15 menit', difficulty: 'sedang', materials: 'Mainan dokter, boneka', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Puzzle 2-3 Keping', description: 'Sediakan puzzle gambar hewan dengan 2-3 keping besar. Tunjukkan cara menyusunnya. Biarkan anak mencoba dengan bantuan seperlunya.', age_min: 15, age_max: 18, duration: '5-10 menit', difficulty: 'sedang', materials: 'Puzzle 2-3 keping gambar hewan', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Sortasi Warna Dasar', description: 'Sediakan benda merah dan biru. Minta anak mengelompokkan yang sama warna. Mulai dengan 2 warna, tingkatkan ke 3 warna.', age_min: 15, age_max: 18, duration: '5-10 menit', difficulty: 'sedang', materials: 'Benda warna merah, biru, kuning', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Latihan Pura-pura', description: 'Sediakan cangkir kosong dan teko mainan. Tuang "teh" pura-pura ke cangkir, beri ke boneka, lalu ajak anak melakukan hal sama.', age_min: 15, age_max: 18, duration: '5-10 menit', difficulty: 'sedang', materials: 'Set mainan minum-minuman', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 18-24 bulan ---
  { domain: 'cognitive', title: 'Puzzle 4-6 Keping', description: 'Berikan puzzle 4-6 keping bergambar kesukaan anak (hewan, kendaraan). Bimbing saat anak kesulitan, tapi biarkan anak yang mencoba.', age_min: 18, age_max: 24, duration: '10-15 menit', difficulty: 'sedang', materials: 'Puzzle 4-6 keping', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Menyortir Bentuk', description: 'Gunakan shape sorter atau buat sendiri dari kardus. Minta anak memasukkan balok sesuai lubang bentuknya. Sebut nama bentuk setiap kali.', age_min: 18, age_max: 24, duration: '10-15 menit', difficulty: 'sedang', materials: 'Shape sorter / balok bentuk geometri', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Bermain Pasir/ Adonan', description: 'Sediakan adonan mainan/ playdough. Ajak anak membuat bola, sosis, atau bentuk sederhana. Gerakan tangan merangsang saraf otak.', age_min: 18, age_max: 24, duration: '10-15 menit', difficulty: 'sedang', materials: 'Playdough/ adonan mainan, cetakan', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Mencocokkan Gambar', description: 'Gunting gambar dari majalah bekas (double). Tempel satu di karton, minta anak mencari pasangannya. Mulai dengan 2-3 pasang.', age_min: 18, age_max: 24, duration: '5-10 menit', difficulty: 'sedang', materials: 'Gambar majalah, gunting, karton', category: 'general', sort_order: 4 },
  { domain: 'cognitive', title: 'Menara Tinggi', description: 'Tantang anak menyusun balok settinggi mungkin. Hitung jumlah balok. Jika roboh, beri semangat untuk mencoba lagi. Target: 6-7 balok.', age_min: 18, age_max: 24, duration: '5-10 menit', difficulty: 'mudah', materials: 'Balok kayu 8-10 buah', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Stimulasi Klasifikasi', description: 'Sediakan 2 wadah. Minta anak memisahkan mainan berdasarkan warna. Lakukan sambil bernyanyi dan beri contoh terlebih dahulu.', age_min: 18, age_max: 24, duration: '10-15 menit', difficulty: 'sedang', materials: 'Mainan 2 warna, 2 wadah', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 24-30 bulan ---
  { domain: 'cognitive', title: 'Bermain Angka', description: 'Hitung benda bersama anak: jari tangan, tangga, mainan. Gunakan lagu hitung. Tunjukkan angka 1-5 di kartu atau buku.', age_min: 24, age_max: 30, duration: '5-10 menit', difficulty: 'mudah', materials: 'Buku angka, kartu angka, benda hitung', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Belajar Warna', description: 'Pilih satu warna fokus per hari ("hari merah"). Cari benda merah di sekitar rumah: baju, bola, buku. Sebut nama warna berulang.', age_min: 24, age_max: 30, duration: '10-15 menit', difficulty: 'mudah', materials: 'Benda berwarna di sekitar rumah', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Memasangkan Angka dan Benda', description: 'Tulis angka 1-5 di kertas. Sediakan 15 kancing. Minta anak meletakkan jumlah kancing yang sesuai di samping setiap angka.', age_min: 24, age_max: 30, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kertas, spidol, kancing/biji-bijian', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Bermain Peran Toko-tokoan', description: 'Siapkan barang-barang mainan dan uang-uangan. Bergiliran menjadi penjual dan pembeli. Ajak anak berhitung dan berdialog.', age_min: 24, age_max: 30, duration: '15-20 menit', difficulty: 'sedang', materials: 'Mainan toko-tokoan, uang mainan', category: 'general', sort_order: 4 },
  { domain: 'cognitive', title: 'Latihan Membedakan Besar-Kecil', description: 'Sediakan 3 pasang benda besar-kecil (bola, sendok, buku). Minta anak mengelompokkan yang besar dan yang kecil.', age_min: 24, age_max: 30, duration: '5-10 menit', difficulty: 'sedang', materials: 'Pasangan benda besar-kecil', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Puzzle Warna', description: 'Buat puzzle sendiri dari karton. Gambar lingkaran merah, biru, kuning. Potong masing-masing jadi 2. Minta anak mencocokkan.', age_min: 24, age_max: 30, duration: '10-15 menit', difficulty: 'sedang', materials: 'Karton, spidol warna, gunting', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 30-36 bulan ---
  { domain: 'cognitive', title: 'Mengurutkan Benda', description: 'Sediakan 5 botol/gelas ukuran berbeda. Minta anak mengurutkan dari yang terkecil ke terbesar.', age_min: 30, age_max: 36, duration: '5-10 menit', difficulty: 'sedang', materials: '5 botol plastik ukuran berbeda', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Bercerita dengan Gambar', description: 'Gunakan 3-4 kartu gambar yang membentuk cerita sederhana. Minta anak menyusun urutan dan menceritakan apa yang terjadi.', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kartu cerita bergambar', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Memancing Huruf', description: 'Buat kartu huruf dari karton. Sebut satu huruf, minta anak menunjuk huruf yang benar. Mainkan seperti permainan mencari harta karun.', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kartu huruf A-Z', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Klasifikasi 2 Kriteria', description: 'Minta anak mengelompokkan kancing berdasarkan warna DAN ukuran (kancing merah besar, kancing merah kecil, dll).', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'sulit', materials: 'Kancing berbagai warna dan ukuran', category: 'general', sort_order: 4 },
  { domain: 'cognitive', title: 'Puzzle Tantangan', description: 'Berikan puzzle 8-12 keping dengan gambar yang familiar. Beri waktu tapi jangan terlalu dibantu. Puji setiap kemajuan.', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'sulit', materials: 'Puzzle 8-12 keping', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Latihan Urutan Cerita', description: 'Ceritakan kisah pendek (3 langkah), lalu minta anak menceritakan kembali. Gunakan gambar bantu jika perlu. Beri pujian.', age_min: 30, age_max: 36, duration: '5-10 menit', difficulty: 'sedang', materials: 'Buku cerita bergambar', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 36-48 bulan ---
  { domain: 'cognitive', title: 'Bermain Kartu Angka', description: 'Buat kartu angka 1-10. Minta anak menyusun berurutan. Kemudian tunjuk acak dan minta anak menyebutkan angka dan jumlah jari yang sesuai.', age_min: 36, age_max: 48, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kartu angka 1-10', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Mengenal Waktu', description: 'Buat jadwal visual harian (pagi=mandi+sarapan, siang=bermain+ makan, malam=tidur). Bicarakan aktivitas yang dilakukan sesuai waktu.', age_min: 36, age_max: 48, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kertas, gambar aktivitas', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Tebak-tebakan', description: 'Berikan petunjuk tentang benda tanpa menyebut nama ("benda ini bulat, kita pakai untuk bermain di luar"). Ajak anak menebak.', age_min: 36, age_max: 48, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Maze/ Labirin Sederhana', description: 'Gambar labirin sederhana di kertas. Minta anak menarik garis dari titik A ke B tanpa menyentuh dinding.', age_min: 36, age_max: 48, duration: '5-10 menit', difficulty: 'sedang', materials: 'Kertas, pensil', category: 'general', sort_order: 4 },
  { domain: 'cognitive', title: 'Berhitung dengan Benda', description: 'Sediakan 10 kacang/biji. Minta anak menghitung dan memberikan jumlah yang diminta ("beri Ibu 7 kacang").', age_min: 36, age_max: 48, duration: '5-10 menit', difficulty: 'sedang', materials: 'Kacang/biji-bijian/ kancing 10 buah', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Memory Game', description: 'Letakkan 3-4 benda di atas meja, tutup dengan kain. Ambil satu diam-diam, tunjukkan lagi, tanya "benda apa yang hilang?".', age_min: 36, age_max: 48, duration: '5-10 menit', difficulty: 'sedang', materials: '3-4 benda kecil, kain', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 48-60 bulan ---
  { domain: 'cognitive', title: 'Belajar Menulis Nama', description: 'Tulis nama anak dengan huruf besar di kertas. Minta anak meniru huruf pertama, lalu seluruhnya. Jangan paksa, buat menyenangkan.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kertas, pensil, spidol', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Mengenal Alfabet', description: 'Mainkan lagu alfabet. Tunjuk huruf di kartu sambil menyanyi. Minta anak menyebutkan huruf yang ditunjuk.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kartu alfabet, lagu alfabet', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Penjumlahan Sederhana', description: 'Gunakan jari atau benda untuk mengajarkan penjumlahan 1-10. "Aku punya 3 kelereng, Ibu beri 2 lagi. Ada berapa?"', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kelereng/biji/ kancing 10-20 buah', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Sains Sederhana', description: 'Campur air dan minyak dalam botol, kocok dan amati. Jelaskan sederhana mengapa tidak menyatu. Ajak anak bereksperimen.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sedang', materials: 'Botol, air, minyak goreng, pewarna', category: 'general', sort_order: 4 },
  { domain: 'cognitive', title: 'Menyusun Cerita Bergambar', description: 'Gunting 4-5 gambar dari majalah/koran bekas. Minta anak menyusun urutan cerita dan menceritakan.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sedang', materials: 'Gunting, majalah bekas, karton', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Bingo Angka', description: 'Buat kartu bingo 3x3 dengan angka 1-9. Sebut angka acak, minta anak menutup angka yang disebut.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kertas, spidol, penutup (kancing/kertas)', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 60+ bulan ---
  { domain: 'cognitive', title: 'Membaca Suku Kata', description: 'Tulis suku kata sederhana (ba, bi, bu, ca, ci, cu). Tunjukkan cara membaca. Minta anak meniru. Bermain tebak suku kata.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sulit', materials: 'Kartu suku kata', category: 'general', sort_order: 1 },
  { domain: 'cognitive', title: 'Penjumlahan dan Pengurangan', description: 'Gunakan jari atau benda untuk mengajarkan penjumlahan dan pengurangan 1-20. Buat soal sederhana dan beri stiker untuk jawaban benar.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sulit', materials: 'Benda hitung 20 buah, stiker', category: 'general', sort_order: 2 },
  { domain: 'cognitive', title: 'Mengenal Jam', description: 'Buat jam dari piring kertas. Ajar anak membaca jam penuh (pukul 1, pukul 2). Hubungkan dengan aktivitas harian anak.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sulit', materials: 'Piring kertas, karton, jarum jam dari karton', category: 'general', sort_order: 3 },
  { domain: 'cognitive', title: 'Klasifikasi Kompleks', description: 'Sediakan campuran benda (kancing, tutup botol, kacang). Minta anak mengelompokkan berdasarkan 3 kriteria: warna, ukuran, dan jenis.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sulit', materials: 'Aneka benda kecil untuk klasifikasi', category: 'general', sort_order: 4 },
  { domain: 'cognitive', title: 'Eksperimen Sains', description: 'Tanam kacang hijau di kapas basah. Ajak anak mengamati pertumbuhan setiap hari. Gambar perubahan yang terjadi.', age_min: 60, age_max: 72, duration: '15-20 menit', difficulty: 'sulit', materials: 'Kacang hijau, kapas, gelas, air', category: 'screening_result', sort_order: 1 },
  { domain: 'cognitive', title: 'Membaca Kata Pendek', description: 'Tulis kata-kata pendek (ibu, apa, bola, mama). Ajak anak membaca dengan mengeja. Puji setiap usaha. Jangan paksa jika anak belum siap.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sulit', materials: 'Kartu kata pendek, buku bacaan', category: 'tracking_kendala', sort_order: 1 },

  // =========================================================================
  // SPEECH — STIMULASI BICARA
  // =========================================================================

  // --- Usia 0-3 bulan ---
  { domain: 'speech', title: 'Bicara pada Bayi', description: 'Bicaralah pada bayi dengan suara lembut setiap kali mengganti popok, memandikan, atau menyusui. Ceritakan apa yang Anda lakukan.', age_min: 0, age_max: 3, duration: 'Setiap hari', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Menirukan Suara Bayi', description: 'Tirukan suara "aaa", "ooo" dan decitan yang dikeluarkan bayi. Berhenti dan beri waktu bayi "menjawab". Ini mengajarkan giliran bicara.', age_min: 0, age_max: 3, duration: '3-5 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Bernyanyi dan Mendongeng', description: 'Nyanyikan lagu-lagu lembut dan bacakan cerita pendek walaupun bayi belum mengerti. Fokus pada irama dan intonasi suara.', age_min: 0, age_max: 3, duration: '5-10 menit', difficulty: 'mudah', materials: 'Buku cerita bayi', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Respons Suara Lebih Aktif', description: 'Saat bayi mengeluarkan suara, respons dengan antusias dan tersenyum. Buat kontak mata dan beri jeda agar bayi "merespon" kembali.', age_min: 0, age_max: 3, duration: '5 menit', difficulty: 'mudah', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Stimulasi Respons Suara', description: 'Dekatkan wajah ke bayi, buat ekspresi lucu dan suara berlebihan. Tunggu 10-15 detik untuk memberi bayi kesempatan merespons.', age_min: 0, age_max: 3, duration: '3-5 menit', difficulty: 'mudah', materials: '-', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 3-6 bulan ---
  { domain: 'speech', title: 'Ocehan Bersama', description: 'Saat bayi mengoceh "ba-ba" atau "da-da", ulangi dan tambah suku kata baru. "Ba-ba... ba-ba-ba... ba-bi-bu"', age_min: 3, age_max: 6, duration: '3-5 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Nama-nama Benda', description: 'Tunjuk benda di sekitar dan sebut namanya dengan jelas. "Ini BOLA. Bola warna MERAH." Ulangi beberapa kali.', age_min: 3, age_max: 6, duration: '5-10 menit', difficulty: 'mudah', materials: 'Benda di sekitar rumah', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Bermain Telepon', description: 'Gunakan telepon mainan atau tangan sebagai telepon. Letakkan di telinga dan bicara, lalu di telinga bayi. "Halo, halo..."', age_min: 3, age_max: 6, duration: '3-5 menit', difficulty: 'mudah', materials: 'Telepon mainan', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Bernyanyi dengan Gerakan', description: 'Nyanyikan lagu "Cilukba" atau "Kucingku". Lakukan gerakan tangan yang sesuai. Biarkan bayi mengamati dan meniru.', age_min: 3, age_max: 6, duration: '5-10 menit', difficulty: 'mudah', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Stimulasi Vokalisasi', description: 'Saat mandi atau ganti popok, buat suara-suara lucu (prutt, ksssh, brrr). Biarkan bayi mengamati dan mencoba meniru.', age_min: 3, age_max: 6, duration: '3-5 menit', difficulty: 'mudah', materials: '-', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 6-9 bulan ---
  { domain: 'speech', title: 'Mengulang Ocehan', description: 'Perhatikan ocehan bayi dan ulangi dengan jelas. Tambah dengan kata baru: bayi bilang "ma-ma", Anda jawab "ma-ma... mama pergi".', age_min: 6, age_max: 9, duration: '3-5 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Perintah Sederhana', description: 'Berikan instruksi sederhana sambil memberi contoh: "ambilkan bola" sambil menunjuk. Beri pujian saat anak melakukan.', age_min: 6, age_max: 9, duration: '5-10 menit', difficulty: 'mudah', materials: 'Bola atau mainan', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Buku Bergambar Bayi', description: 'Buka buku bergambar besar dengan gambar tunggal. Tunjuk gambar dan sebut nama. Minta bayi menunjuk gambar yang disebutkan.', age_min: 6, age_max: 9, duration: '5-10 menit', difficulty: 'mudah', materials: 'Buku bergambar besar', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Dadah dan Tidak-tidak', description: 'Ajari "dadah" sambil melambaikan tangan saat ada yang pergi. Ajari arti "tidak" dengan geleng kepala sambil tersenyum.', age_min: 6, age_max: 9, duration: '3-5 menit', difficulty: 'mudah', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Memperkaya Respons Nama', description: 'Panggil nama bayi dengan intonasi ceria berkali-kali sehari. Jika bayi menoleh, beri pujian dan pelukan.', age_min: 6, age_max: 9, duration: 'Setiap hari', difficulty: 'mudah', materials: '-', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 9-12 bulan ---
  { domain: 'speech', title: 'Mengajak Bayi "Mengobrol"', description: 'Saat bayi mengoceh, respons seolah Anda mengobrol. "Oh, kamu mau main bola? Ayo main bola!" dengan antusias.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Suara Binatang', description: 'Tunjukkan gambar binatang dan tirukan suaranya. "Kucing... meong! Anjing... guk guk!" Minta bayi menirukan.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'mudah', materials: 'Buku/binatang mainan', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Tanya Jawab Sederhana', description: 'Tunjuk gambar dan tanya "apa ini?" Beri waktu untuk menjawab. Jika belum, sebutkan namanya dan minta anak mengulang.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'mudah', materials: 'Buku bergambar', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Stimulasi 2 Kata Bermakna', description: 'Fokus pada 2 kata baru setiap minggu. Gunakan kata itu berulang dalam konteks. "Mama... papa... bola... kucing."', age_min: 9, age_max: 12, duration: 'Setiap hari', difficulty: 'mudah', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Permainan "Kasih Tahu Ibu"', description: 'Letakkan 3 benda di depan bayi. Minta bayi menunjukkan benda yang disebut. "Kasih tahu Ibu, mana bola?" Bantu jika perlu.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'sedang', materials: '3-4 benda berbeda', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 12-15 bulan ---
  { domain: 'speech', title: 'Memperkaya Kosakata', description: 'Sebutkan nama benda setiap kali berinteraksi: "Ini KUCING", "Ibu ambil SENDOK", "Ayo pakai BAJU". Tambah 1-2 kata baru per minggu.', age_min: 12, age_max: 15, duration: 'Setiap hari', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Bacakan Buku Cerita', description: 'Pilih buku dengan cerita sederhana dan gambar besar. Tunjuk gambar sambil membaca. Minta anak menunjuk gambar yang disebut.', age_min: 12, age_max: 15, duration: '10-15 menit', difficulty: 'mudah', materials: 'Buku cerita bergambar', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Instruksi 2 Langkah', description: 'Berikan instruksi dua langkah: "ambilkan bola, lalu beri Ayah." Bantu jika perlu, dan kurangi bantuan seiring waktu.', age_min: 12, age_max: 15, duration: '5-10 menit', difficulty: 'sedang', materials: 'Mainan', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Bernyanyi dan Gerak', description: 'Nyanyikan lagu dengan gerakan (Cilukba, Balonku). Biarkan anak meniru gerakan dan mengucapkan kata-kata dari lagu.', age_min: 12, age_max: 15, duration: '5-10 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 4 },
  { domain: 'speech', title: 'Latihan Menunjuk', description: 'Saat membaca buku, tanya "mana kupu-kupu?" Tunggu anak menunjuk. Jika tidak, bimbing tangan anak dan puji saat berhasil.', age_min: 12, age_max: 15, duration: '5-10 menit', difficulty: 'mudah', materials: 'Buku bergambar', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Stimulasi 3-5 Kata', description: 'Buat 5 kata target untuk minggu ini. Gunakan dalam kalimat berulang setiap hari dan minta anak mengucapkannya.', age_min: 12, age_max: 15, duration: 'Setiap hari', difficulty: 'sedang', materials: 'Flashcard/ gambar benda', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 15-18 bulan ---
  { domain: 'speech', title: 'Membaca Buku Interaktif', description: 'Pilih buku dengan tekstur atau flap (buka-tutup). Baca dan ajak anak berinteraksi: "kupu-kupu di balik pintu... buka!"', age_min: 15, age_max: 18, duration: '10-15 menit', difficulty: 'mudah', materials: 'Buku interaktif (texture/flap)', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Tanya Jawab Sederhana', description: 'Tunjukkan gambar dan tanya "apa ini?", "siapa ini?", "dimana bola?". Tunggu jawaban anak minimal 5 detik sebelum membantu.', age_min: 15, age_max: 18, duration: '5-10 menit', difficulty: 'mudah', materials: 'Buku/ kartu gambar', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Bermain Pura-pura', description: 'Sediakan mainan masak-masakan. Ajak anak "memasak" dan bicarakan apa yang dilakukan. "Ayo kita buat sup... masukkan wortel..."', age_min: 15, age_max: 18, duration: '10-15 menit', difficulty: 'sedang', materials: 'Mainan masak-masakan', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Kombinasi 2 Kata', description: 'Jika anak bilang "mau", tambah jadi "mau susu". Dorong anak menggabungkan 2 kata. Contoh: "mau apa?", "mau main", "mama pergi".', age_min: 15, age_max: 18, duration: 'Setiap hari', difficulty: 'sedang', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Latihan Kata Pertama', description: 'Buat daftar kata yang ingin diajarkan. Fokus pada kata benda konkret. Sebut berulang dalam aktivitas sehari-hari.', age_min: 15, age_max: 18, duration: 'Setiap hari', difficulty: 'sedang', materials: 'Kartu gambar, benda nyata', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 18-24 bulan ---
  { domain: 'speech', title: 'Membaca Aktif', description: 'Bacakan buku, lalu tanya tentang isinya. "Apa warna kelinci?" "Apa yang dilakukan kelinci?" Biarkan anak menjawab dengan kata atau kalimat.', age_min: 18, age_max: 24, duration: '10-15 menit', difficulty: 'sedang', materials: 'Buku cerita bergambar', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Bernyanyi Bersama', description: 'Nyanyikan lagu anak-anak favorit dan biarkan anak ikut bernyanyi meskipun hanya kata-kata tertentu. "Balonku ada 5... rupa-rupa warnanya..."', age_min: 18, age_max: 24, duration: '5-10 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Pertanyaan Terbuka', description: 'Tanyakan pertanyaan yang butuh lebih dari ya/tidak. "Ceritakan mainannya tadi?", "Kamu bermain apa di luar?"', age_min: 18, age_max: 24, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Permainan Menyebut Nama', description: 'Tunjuk anggota keluarga dan minta anak menyebut nama. Tunjuk diri anak dan tanya "siapa nama adik?"', age_min: 18, age_max: 24, duration: '3-5 menit', difficulty: 'mudah', materials: 'Foto keluarga', category: 'general', sort_order: 4 },
  { domain: 'speech', title: 'Perluas Kalimat Anak', description: 'Saat anak bilang "mau minum", perluas: "Oh, Adik mau minum susu? Ayo Ibu buatkan susu."', age_min: 18, age_max: 24, duration: 'Setiap hari', difficulty: 'sedang', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Flashcard Kosakata', description: 'Gunakan kartu bergambar. Tunjuk satu per satu. Minta anak menyebut nama. Tambah deskripsi: "kucing... warna putih... meong"', age_min: 18, age_max: 24, duration: '5-10 menit', difficulty: 'sedang', materials: 'Flashcard hewan, makanan, benda', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 24-30 bulan ---
  { domain: 'speech', title: 'Bercerita Bergantian', description: 'Mulai cerita: "Pagi-pagi, Tayo bangun tidur...", lalu minta anak melanjutkan. "Terus... dia...?" Biarkan anak mengisi.', age_min: 24, age_max: 30, duration: '10-15 menit', difficulty: 'sedang', materials: 'Buku cerita favorit', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Permainan Kata Sifat', description: 'Saat bermain, gunakan kata sifat: "bola BESAR", "boneka KECIL", "mobil MERAH", "kursi TINGGI". Minta anak mengulang.', age_min: 24, age_max: 30, duration: '5-10 menit', difficulty: 'sedang', materials: 'Mainan dengan berbagai ukuran dan warna', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Telepon Mainan', description: 'Berpura-pura menelepon kakek/nenek. Ajak anak bicara di telepon mainan. "Halo, halo... ini Adik... apa kabar?"', age_min: 24, age_max: 30, duration: '5-10 menit', difficulty: 'sedang', materials: 'Telepon mainan / handphone bekas', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Bernyanyi Lagu Panjang', description: 'Ajarkan lagu dengan banyak lirik (Naik-naik ke Puncak Gunung, Pelangi). Nyanyikan dan biarkan anak menyelesaikan baris terakhir.', age_min: 24, age_max: 30, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 4 },
  { domain: 'speech', title: 'Latihan Kalimat 3-4 Kata', description: 'Dorong anak membuat kalimat 3-4 kata. Jika anak bilang "mau main", tanya "mau main APA dengan SIAPA?"', age_min: 24, age_max: 30, duration: 'Setiap hari', difficulty: 'sedang', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Memperkaya Kosakata Harian', description: 'Setiap hari, ajarkan 1 kata baru. Tempel gambar di dinding. Sebut kata itu minimal 5 kali sehari dalam konteks berbeda.', age_min: 24, age_max: 30, duration: 'Setiap hari', difficulty: 'sedang', materials: 'Kartu kata baru', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 30-36 bulan ---
  { domain: 'speech', title: 'Cerita Berantai', description: 'Minta anak bercerita tentang kegiatan hari ini. Bantu dengan pertanyaan: "Pertama... kamu bangun... lalu...?"', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Bermain Peran', description: 'Bermain dokter-dokteran. Ajak anak berdialog: "Dokter, saya sakit perut." "Ayo buka mulut..." Biarkan anak memimpin.', age_min: 30, age_max: 36, duration: '15-20 menit', difficulty: 'sedang', materials: 'Set mainan dokter', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Kata Depan', description: 'Ajari kata depan: "di ATAS meja", "di BAWAH kursi", "di DALAM kotak". Minta anak menaruh benda sesuai instruksi.', age_min: 30, age_max: 36, duration: '5-10 menit', difficulty: 'sedang', materials: 'Benda kecil, meja, kursi, kotak', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Pertanyaan "Kenapa" dan "Apa"', description: 'Saat anak bertanya "kenapa?", jawab dengan antusias dan dorong dialog. Ajukan pertanyaan balik: "Kenapa ya?"', age_min: 30, age_max: 36, duration: 'Setiap hari', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 4 },
  { domain: 'speech', title: 'Latihan Bercerita', description: 'Minta anak menceritakan pengalaman bermain atau acara TV. Bantu dengan kartu bergambar sebagai panduan cerita.', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'sedang', materials: 'Gambar/ foto kegiatan', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Stimulasi Dialog 2 Arah', description: 'Ajak anak berdialog bergantian. Tanyakan pendapat: "Kamu suka es krim atau kue?" Tunggu jawaban dan diskusikan.', age_min: 30, age_max: 36, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 36-48 bulan ---
  { domain: 'speech', title: 'Pertanyaan Pengetahuan', description: 'Tanyakan pengetahuan umum: "Hewan apa yang berkaki empat?" "Apa warna langit?" "Dimana ikan hidup?"', age_min: 36, age_max: 48, duration: '5-10 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Bercerita Berurutan', description: 'Minta anak menceritakan kisah dengan urutan: awal - tengah - akhir. Gunakan 3 kartu gambar sebagai panduan.', age_min: 36, age_max: 48, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kartu cerita 3 gambar', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Menyanyi dan Menghafal', description: 'Ajarkan lagu dengan lirik lebih panjang. Minta anak menghafal dan menyanyikan sendiri. Beri tepuk tangan setelahnya.', age_min: 36, age_max: 48, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Menceritakan Kembali Cerita', description: 'Bacakan cerita pendek, lalu minta anak menceritakan kembali dengan kata-katanya sendiri.', age_min: 36, age_max: 48, duration: '10-15 menit', difficulty: 'sedang', materials: 'Buku cerita pendek', category: 'general', sort_order: 4 },
  { domain: 'speech', title: 'Kata Ganti dan Sapaan', description: 'Ajari penggunaan kata "saya", "kamu", "dia". Latihan memperkenalkan diri: "Nama saya [nama], umur saya [umur] tahun."', age_min: 36, age_max: 48, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Permainan Kuis Sederhana', description: 'Buat kuis: "Apa nama hewan ini?" "Berapa jumlah kakinya?" Beri hadiah stiker untuk jawaban benar.', age_min: 36, age_max: 48, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kartu gambar, stiker', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 48-60 bulan ---
  { domain: 'speech', title: 'Bercerita Bebas', description: 'Minta anak bercerita tentang liburan, pengalaman, atau cerita khayal. Biarkan tanpa interupsi, lalu beri tanggapan positif.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Belajar Kalimat Kompleks', description: 'Gunakan kalimat kompleks saat bicara. "Karena hujan, kita main di dalam rumah." Minta anak membuat kalimat serupa.', age_min: 48, age_max: 60, duration: '5-10 menit', difficulty: 'sulit', materials: '-', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Nama Hari dan Bulan', description: 'Ajarkan nama hari sambil menyanyi. Buat kalender sederhana dan tempelkan. Setiap pagi tunjuk tanggal dan hari.', age_min: 48, age_max: 60, duration: '5-10 menit', difficulty: 'sedang', materials: 'Kalender dinding', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Permainan Deskripsi', description: 'Minta anak mendeskripsikan benda tanpa menyebut nama. Anda tebak. Bergiliran.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sedang', materials: 'Berbagai benda di rumah', category: 'general', sort_order: 4 },
  { domain: 'speech', title: 'Latihan Menyebut Informasi Diri', description: 'Latih anak menyebut: nama lengkap, usia, alamat rumah, nama orangtua. Gunakan lagu agar mudah diingat.', age_min: 48, age_max: 60, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Bercerita Detail', description: 'Setelah liburan/ jalan-jalan, minta anak menceritakan detail: kemana, dengan siapa, apa yang dilakukan, bagaimana rasanya.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sedang', materials: 'Foto/ oleh-oleh', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 60+ bulan ---
  { domain: 'speech', title: 'Diskusi Topik', description: 'Pilih topik sederhana (hewan, cuaca). Diskusikan dengan anak. Beri kesempatan untuk menyampaikan pendapat sendiri.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'speech', title: 'Menceritakan Kembali Film/ Acara', description: 'Setelah menonton film pendek, minta anak menceritakan jalan cerita secara detail. Tanyakan: siapa tokohnya, apa masalahnya, bagaimana akhirnya.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sedang', materials: 'Film/ cerita pendek', category: 'general', sort_order: 2 },
  { domain: 'speech', title: 'Bermain Tebak Kata', description: 'Bisikkan kata di telinga anak, minta anak menyampaikan ke orang lain secara berbisik. Lihat apakah kata sampai dengan benar.', age_min: 60, age_max: 72, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 3 },
  { domain: 'speech', title: 'Membaca dan Menceritakan Kembali', description: 'Minta anak membaca 1 paragraf pendek dari buku, lalu menceritakan isinya dengan kalimat sendiri.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sulit', materials: 'Buku bacaan anak', category: 'general', sort_order: 4 },
  { domain: 'speech', title: 'Latihan Wawancara', description: 'Anak mewawancarai anggota keluarga: "Apa pekerjaan Ayah?" "Apa makanan favorit Ibu?" Latihan bertanya dan mencatat jawaban.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sulit', materials: 'Kertas, pensil (opsional)', category: 'screening_result', sort_order: 1 },
  { domain: 'speech', title: 'Bercerita Imajinasi', description: 'Minta anak membuat cerita sendiri tentang suatu topik. "Ceritakan tentang peri yang tinggal di awan." Catat dan bacakan kembali.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sulit', materials: 'Kertas (untuk mencatat cerita)', category: 'tracking_kendala', sort_order: 1 },

  // =========================================================================
  // IMMUNITY — STIMULASI IMUNITAS / KESEHATAN
  // =========================================================================

  // --- Usia 0-3 bulan ---
  { domain: 'immunity', title: 'Pijat Bayi', description: 'Pijat bayi lembut setiap hari setelah mandi. Beri minyak bayi. Pijat dapat meningkatkan sirkulasi darah dan memperkuat imun.', age_min: 0, age_max: 3, duration: '5-10 menit', difficulty: 'mudah', materials: 'Minyak pijat bayi', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Jemur Pagi', description: 'Jemur bayi di bawah sinar matahari pagi (sebelum jam 9) selama 5-10 menit. Buka pakaian bagian punggung, lindungi mata.', age_min: 0, age_max: 3, duration: '5-10 menit', difficulty: 'mudah', materials: 'Matras/ alas bayi', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Imunisasi Tepat Waktu', description: 'Pantau jadwal imunisasi bayi di buku KIA. Catat tanggal imunisasi berikutnya. Pastikan semua imunisasi dasar lengkap.', age_min: 0, age_max: 3, duration: '30 menit', difficulty: 'mudah', materials: 'Buku KIA, kartu imunisasi', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Pantau Berat Badan', description: 'Timbang berat badan bayi setiap minggu. Catat di grafik KMS. Pantau apakah kenaikan sesuai garis pertumbuhan normal.', age_min: 0, age_max: 3, duration: '5 menit', difficulty: 'mudah', materials: 'Timbangan bayi, buku KMS/KIA', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Perbaiki Pola Menyusu', description: 'Pastikan bayi menyusu efektif. Perhatikan posisi dan perlekatan. Konsultasi dengan konselor laktasi jika ada kesulitan.', age_min: 0, age_max: 3, duration: 'Setiap menyusu', difficulty: 'sedang', materials: 'Bantal menyusui (opsional)', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 3-6 bulan ---
  { domain: 'immunity', title: 'Tummy Time', description: 'Tengkurapkan bayi di alas yang empuk selama 5-10 menit. Ini memperkuat otot leher, punggung, dan meningkatkan koordinasi.', age_min: 3, age_max: 6, duration: '5-10 menit', difficulty: 'mudah', materials: 'Matras/ playmat', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Rutinitas Tidur', description: 'Buat rutinitas tidur yang konsisten: mandi air hangat, pijat, lagu pengantar tidur. Tidur cukup = imun kuat.', age_min: 3, age_max: 6, duration: '15-20 menit', difficulty: 'mudah', materials: 'Lotion bayi, baju tidur', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Kebersihan Bayi', description: 'Jaga kebersihan: mandi 2x sehari, ganti popok setiap 3-4 jam, cuci tangan sebelum memegang bayi.', age_min: 3, age_max: 6, duration: 'Setiap hari', difficulty: 'mudah', materials: 'Perlengkapan mandi, popok, lap', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Catat BAB Bayi', description: 'Pantau frekuensi dan konsistensi BAB. Tandai di buku catatan. Kenali tanda-tanda diare atau sembelit.', age_min: 3, age_max: 6, duration: 'Seluruh hari', difficulty: 'mudah', materials: 'Buku catatan', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Pijat Perut untuk Kembung', description: 'Pijat perut bayi searah jarum jam dengan minyak telon. Ini membantu mengatasi kembung dan melancarkan pencernaan.', age_min: 3, age_max: 6, duration: '5 menit', difficulty: 'mudah', materials: 'Minyak telon/ minyak bayi', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 6-9 bulan ---
  { domain: 'immunity', title: 'MPASI Bergizi', description: 'Perkenalkan MPASI dengan variasi: karbohidrat (nasi/ kentang), protein (ayam/ tahu), sayur (wortel/ brokoli), lemak sehat (minyak/ alpukat).', age_min: 6, age_max: 9, duration: '20-30 menit', difficulty: 'sedang', materials: 'Bahan MPASI, blender, saringan', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Jadwal Makan Teratur', description: 'Buat jadwal makan yang teratur 2-3 kali MPASI + ASI/susu. Konsisten pada jam yang sama setiap hari.', age_min: 6, age_max: 9, duration: 'Seluruh hari', difficulty: 'mudah', materials: 'Buku/ catatan jadwal makan', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Eksplorasi Aman', description: 'Biarkan bayi merangkak dan menjelajah. Awasi dan pastikan lingkungan aman. Bergerak aktif memperkuat fisik dan imunitas.', age_min: 6, age_max: 9, duration: '30-60 menit', difficulty: 'mudah', materials: 'Penghalang/ baby playpen', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Pantau Alergi Makanan', description: 'Saat memperkenalkan makanan baru, beri jeda 3-4 hari setiap makanan untuk memantau reaksi alergi. Catat di buku.', age_min: 6, age_max: 9, duration: 'Seluruh waktu', difficulty: 'sedang', materials: 'Buku catatan makanan', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Variasi MPASI', description: 'Jika bayi GTM (Gerakan Tutup Mulut), variasikan tekstur dan rasa. Coba puree manis (labu, ubi) atau gurih (kaldu ayam).', age_min: 6, age_max: 9, duration: '20-30 menit', difficulty: 'sedang', materials: 'Bahan MPASI variatif', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 9-12 bulan ---
  { domain: 'immunity', title: 'Makanan Padat Bertahap', description: 'Tingkatkan tekstur MPASI dari puree ke cincang halus lalu ke finger food. Biarkan bayi memegang dan menggigit makanan sendiri.', age_min: 9, age_max: 12, duration: '20-30 menit', difficulty: 'sedang', materials: 'Finger food: wortel kukus, pisang, roti', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Rutinitas Tidur Sehat', description: 'Pastikan bayi tidur 12-14 jam total per hari. Tidur siang 2x. Lingkungan tidur gelap dan tenang untuk kualitas tidur maksimal.', age_min: 9, age_max: 12, duration: 'Sepanjang hari', difficulty: 'sedang', materials: 'Gorden gelap, white noise (opsional)', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Perkenalkan Sayuran', description: 'Sajikan sayuran dalam bentuk menarik. Campur dengan makanan favorit. Contoh: bubur + wortel parut + hati ayam.', age_min: 9, age_max: 12, duration: '20-30 menit', difficulty: 'sedang', materials: 'Sayuran segar (wortel, bayam, brokoli)', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Pantau Tumbuh Kembang', description: 'Catat berat dan tinggi badan setiap bulan. Bandingkan dengan grafik KMS. Deteksi dini jika pertumbuhan tidak optimal.', age_min: 9, age_max: 12, duration: '10 menit', difficulty: 'mudah', materials: 'Timbangan, pengukur tinggi, buku KIA', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Atasi Pilih-pilih Makan', description: 'Sajikan makanan baru bersama makanan favorit. Beri contoh dengan ikut makan. Jangan memaksa. Konsistensi adalah kunci.', age_min: 9, age_max: 12, duration: 'Setiap waktu makan', difficulty: 'sedang', materials: 'Makanan favorit + makanan baru', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 12-15 bulan ---
  { domain: 'immunity', title: 'Makan Bergizi Seimbang', description: 'Pastikan setiap piring mengandung: karbohidrat, protein, sayur, buah. Porsi anak: 1/4 dari porsi dewasa.', age_min: 12, age_max: 15, duration: 'Setiap waktu makan', difficulty: 'sedang', materials: 'Bahan makanan segar', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Aktivitas Fisik Harian', description: 'Ajak anak berjalan-jalan di luar, merangkak/ berjalan di rumput. Beri kebebasan bergerak di tempat aman minimal 1 jam per hari.', age_min: 12, age_max: 15, duration: '60 menit', difficulty: 'mudah', materials: 'Sepatu, baju nyaman', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Cuci Tangan Rutin', description: 'Ajari cuci tangan dengan air mengalir dan sabun: sebelum makan, setelah BAB, setelah bermain. Jadikan kebiasaan.', age_min: 12, age_max: 15, duration: 'Setiap hari', difficulty: 'mudah', materials: 'Sabun cuci tangan, tisu/ handuk', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Deteksi Berat Badan Kurang', description: 'Timbang rutin. Jika berat tidak naik 2 bulan berturut-turut, periksa ke dokter. Tambah porsi dan frekuensi makan.', age_min: 12, age_max: 15, duration: '10 menit', difficulty: 'mudah', materials: 'Timbangan, grafik KMS', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Atasi Nafsu Makan Turun', description: 'Buat jadwal makan lebih sering dalam porsi kecil. Hindari camilan manis sebelum makan. Ciptakan suasana makan yang menyenangkan.', age_min: 12, age_max: 15, duration: 'Setiap waktu makan', difficulty: 'sedang', materials: 'Makanan variatif', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 15-18 bulan ---
  { domain: 'immunity', title: 'Superfood Imunitas', description: 'Sajikan makanan tinggi vitamin C (jeruk, jambu, brokoli), zinc (daging, telur), dan probiotik (yogurt) secara rutin.', age_min: 15, age_max: 18, duration: '20-30 menit', difficulty: 'sedang', materials: 'Buah, sayur, protein, yogurt', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Main di Luar Rumah', description: 'Ajak anak main di halaman/taman selama 30-60 menit. Biarkan berlari, menyentuh tanah, dan terkena sinar matahari pagi.', age_min: 15, age_max: 18, duration: '30-60 menit', difficulty: 'mudah', materials: 'Mainan outdoor (bola, skuter)', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Jadwal Makan Tetap', description: 'Buat jadwal makan konsisten: sarapan, snack pagi, makan siang, snack sore, makan malam. Konsisten membantu metabolisme.', age_min: 15, age_max: 18, duration: 'Seluruh hari', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Lanjutkan Imunisasi', description: 'Periksa jadwal imunisasi booster (DPT, Polio, Campak). Catat tanggal dan pastikan tidak terlewat.', age_min: 15, age_max: 18, duration: '30 menit', difficulty: 'mudah', materials: 'Buku KIA, kartu imunisasi', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Atasi Anak GTM', description: 'Jika anak susah makan, jangan panik. Coba: sajikan porsi kecil, biarkan makan sendiri, sajikan dengan bentuk menarik (bentuk bintang, hewan).', age_min: 15, age_max: 18, duration: 'Setiap waktu makan', difficulty: 'sedang', materials: 'Cetakan kue/ nasi bentuk lucu', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 18-24 bulan ---
  { domain: 'immunity', title: 'Ajak Anak Memasak', description: 'Ajak anak "membantu" di dapur: cuci sayur, aduk adonan. Ini meningkatkan minat anak pada makanan sehat.', age_min: 18, age_max: 24, duration: '15-20 menit', difficulty: 'sedang', materials: 'Bahan masakan, celemek anak', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Rutin Minum Air Putih', description: 'Sediakan gelas khusus anak di meja. Ajak minum setiap 30-60 menit. Bikin menyenangkan dengan sedotan lucu.', age_min: 18, age_max: 24, duration: 'Setiap hari', difficulty: 'mudah', materials: 'Gelas/ botol minum anak', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Olahraga Ringan Bersama', description: 'Ajak anak berlari kecil, menari, atau senam sederhana. Putar musik ceria dan bergerak bersama 15-20 menit.', age_min: 18, age_max: 24, duration: '15-20 menit', difficulty: 'mudah', materials: 'Musik anak-anak', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Cek Tumbuh Kembang ke Posyandu', description: 'Bawa anak ke Posyandu setiap bulan untuk timbang, ukur tinggi, dan imunisasi. Catat hasil di buku KIA.', age_min: 18, age_max: 24, duration: '60 menit', difficulty: 'mudah', materials: 'Buku KIA', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Atasi Anak Suka Jajan', description: 'Batasi jajan di luar. Sediakan camilan sehat di rumah: potongan buah, yogurt, kue kukus homemade.', age_min: 18, age_max: 24, duration: 'Setiap hari', difficulty: 'sedang', materials: 'Bahan camilan sehat', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 24-30 bulan ---
  { domain: 'immunity', title: 'Kebun Herbal Kecil', description: 'Tanam tanaman herbal sederhana (jahe, kunyit, sereh) di pot. Sediakan minuman herbal hangat untuk anak. Kenalkan rempah alami.', age_min: 24, age_max: 30, duration: '15-20 menit', difficulty: 'mudah', materials: 'Pot, tanah, bibit jahe/ kunyit', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Rutinitas Olahraga', description: 'Jadwalkan aktivitas fisik setiap hari: jalan pagi, bersepeda roda 3, lompat-lompat. Minimal 30 menit aktivitas berat.', age_min: 24, age_max: 30, duration: '30-60 menit', difficulty: 'mudah', materials: 'Sepeda roda 3, bola, tali', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Piramida Makan Sehat', description: 'Gunakan gambar piramida makanan. Tunjukkan mana yang boleh banyak (nasi, sayur) dan mana yang terbatas (gula, garam).', age_min: 24, age_max: 30, duration: '10 menit', difficulty: 'mudah', materials: 'Gambar piramida makanan', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Suplemen Imunitas', description: 'Konsultasi dokter untuk suplemen tambahan (vitamin D, zinc, atau herbal imunomodulator seperti Generos).', age_min: 24, age_max: 30, duration: 'Setiap hari', difficulty: 'mudah', materials: 'Suplemen sesuai resep dokter', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Kurangi Gula Berlebih', description: 'Ganti camilan manis dengan buah. Kurangi minuman kemasan. Buat infused water dengan potongan buah.', age_min: 24, age_max: 30, duration: 'Setiap hari', difficulty: 'sedang', materials: 'Buah segar, air, teko infused water', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 30-36 bulan ---
  { domain: 'immunity', title: 'Aktivitas Fisik Terjadwal', description: 'Ikutkan anak kelas olahraga anak (renang, balet anak, gymnastic). Atau buat obstacle course sederhana di rumah.', age_min: 30, age_max: 36, duration: '30-45 menit', difficulty: 'sedang', materials: 'Bantal, kursi, mainan rintangan', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Edukasi Kebersihan Diri', description: 'Ajarkan anak mandi sendiri (dengan pengawasan), gosok gigi 2x sehari, cuci tangan. Gunakan lagu untuk mengingatkan.', age_min: 30, age_max: 36, duration: 'Setiap hari', difficulty: 'mudah', materials: 'Sikat gigi, sabun mandi, handuk', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Makan Sayur Lewat Cerita', description: 'Ceritakan tentang "superhero sayur" yang membuat kuat. Beri nama lucu pada sayuran: "brokoli pohon kecil", "wortel kelinci".', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'mudah', materials: 'Sayuran, buku cerita', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Pantau Kualitas Tidur', description: 'Pastikan anak tidur 10-12 jam per malam. Kurangi screen time sebelum tidur. Buat rutinitas: cerita sebelum tidur.', age_min: 30, age_max: 36, duration: 'Setiap malam', difficulty: 'sedang', materials: 'Buku cerita, piyama', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Manajemen Stres Anak', description: 'Anak juga bisa stres. Beri waktu tenang, pelukan, dan validasi emosi. Stres menurunkan imunitas.', age_min: 30, age_max: 36, duration: 'Setiap hari', difficulty: 'sedang', materials: 'Area tenang, boneka peluk', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 36-48 bulan ---
  { domain: 'immunity', title: 'Olahraga Teratur', description: 'Ikutkan anak ke kegiatan olahraga: renang, sepak bola anak, atau senam. Target minimal 3x seminggu aktivitas fisik.', age_min: 36, age_max: 48, duration: '30-60 menit', difficulty: 'sedang', materials: 'Perlengkapan olahraga anak', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Kebersihan Diri Mandiri', description: 'Buat checklist kebersihan harian bergambar: mandi, gosok gigi, cuci tangan, pakai baju bersih. Beri stiker setiap selesai.', age_min: 36, age_max: 48, duration: 'Setiap hari', difficulty: 'mudah', materials: 'Checklist, stiker', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Kreatif dengan Sayur', description: 'Buat lomba "makan sayur" dengan anggota keluarga. Siapa yang habiskan sayur dapat bintang. Bikin smoothie sayur + buah.', age_min: 36, age_max: 48, duration: '15-20 menit', difficulty: 'sedang', materials: 'Sayur, buah, blender', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Cek Kesehatan Rutin', description: 'Bawa anak ke dokter gigi 6 bulan sekali. Periksa kesehatan umum setahun sekali. Imunisasi booster sesuai jadwal.', age_min: 36, age_max: 48, duration: '60-120 menit', difficulty: 'mudah', materials: 'Buku KIA, kartu imunisasi', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Mengelola Screen Time', description: 'Batasi screen time maksimal 1 jam/hari. Ajak aktivitas alternatif: menggambar, bermain puzzle, bermain di luar.', age_min: 36, age_max: 48, duration: 'Setiap hari', difficulty: 'sedang', materials: 'Mainan edukatif', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 48-60 bulan ---
  { domain: 'immunity', title: 'Persiapan Makan Sehat', description: 'Ajak anak ke pasar/dapur memilih bahan makanan. Jelaskan manfaat setiap bahan. Biarkan anak menyiapkan bekal sendiri.', age_min: 48, age_max: 60, duration: '15-30 menit', difficulty: 'sedang', materials: 'Bahan makanan, bekal anak', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Ajak Berolahraga Keluarga', description: 'Ajak bersepeda bersama, jalan pagi, atau bermain bulu tangkis di akhir pekan. Jadikan olahraga sebagai kegiatan keluarga.', age_min: 48, age_max: 60, duration: '30-60 menit', difficulty: 'sedang', materials: 'Sepeda, raket, bola', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Edukasi Makanan Sehat Vs Tidak', description: 'Buat dua kolom di kertas: "Makanan Sehat" dan "Makanan Tidak Sehat". Minta anak mengelompokkan gambar makanan.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'mudah', materials: 'Kertas, majalah bekas, gunting, lem', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Pantau Imunisasi Booster', description: 'Pastikan imunisasi booster usia 4-5 tahun (DPT, Polio, Campak Rubella). Catat di buku KIA.', age_min: 48, age_max: 60, duration: '30 menit', difficulty: 'mudah', materials: 'Buku KIA, kartu imunisasi', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Atasi Kecanduan Jajanan', description: 'Buat jadwal jajan: boleh 1x seminggu. Sediakan alternatif homemade yang lebih sehat dan menarik.', age_min: 48, age_max: 60, duration: 'Setiap hari', difficulty: 'sedang', materials: 'Bahan camilan sehat', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 60+ bulan ---
  { domain: 'immunity', title: 'Pola Makan Seimbang', description: 'Pastikan anak makan 3 kali + 2 snack sehat. Porsi: 1/3 piring karbo, 1/3 sayur, 1/6 protein, 1/6 buah.', age_min: 60, age_max: 72, duration: 'Setiap hari', difficulty: 'sedang', materials: 'Bahan makanan segar', category: 'general', sort_order: 1 },
  { domain: 'immunity', title: 'Olahraga Reguler', description: 'Dorong anak mengikuti klub olahraga (renang, karate, sepak bola). Aktivitas fisik 60 menit/hari untuk anak usia sekolah.', age_min: 60, age_max: 72, duration: '60 menit', difficulty: 'sedang', materials: 'Perlengkapan olahraga', category: 'general', sort_order: 2 },
  { domain: 'immunity', title: 'Hidup Sehat Mandiri', description: 'Buat jadwal kesehatan yang diisi anak sendiri: mandi, sikat gigi, sarapan, olahraga. Tanamkan tanggung jawab kesehatan.', age_min: 60, age_max: 72, duration: 'Setiap hari', difficulty: 'sedang', materials: 'Jadwal checklist harian', category: 'general', sort_order: 3 },
  { domain: 'immunity', title: 'Skrining Kesehatan Sekolah', description: 'Pastikan anak ikut skrining kesehatan di sekolah: pemeriksaan gigi, mata, tinggi-berat badan, dan imunisasi.', age_min: 60, age_max: 72, duration: 'Sesuai jadwal', difficulty: 'mudah', materials: 'Buku kesehatan sekolah', category: 'screening_result', sort_order: 1 },
  { domain: 'immunity', title: 'Pendidikan Gizi', description: 'Ajari anak membaca label gizi makanan. Diskusikan tentang gula, garam, dan lemak dalam kemasan. Pilih camilan bersama.', age_min: 60, age_max: 72, duration: '15-20 menit', difficulty: 'sulit', materials: 'Kemasan makanan, kertas, spidol', category: 'tracking_kendala', sort_order: 1 },

  // =========================================================================
  // MOTOR — STIMULASI MOTORIK
  // =========================================================================

  // --- Usia 0-3 bulan ---
  { domain: 'motor', title: 'Tummy Time Dasar', description: 'Tengkurapkan bayi di dada Anda atau di alas empuk selama 1-3 menit. Stimulasi ini memperkuat otot leher, bahu, dan punggung.', age_min: 0, age_max: 3, duration: '1-3 menit', difficulty: 'mudah', materials: 'Matras atau selimut', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Senam Tangan dan Kaki', description: 'Gerakkan perlahan tangan dan kaki bayi seperti gerakan bersepeda. Ini membantu kelenturan sendi dan kesadaran tubuh.', age_min: 0, age_max: 3, duration: '3-5 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Genggam Jari', description: 'Sentuhkan jari Anda ke telapak tangan bayi. Bayi akan menggenggam reflek. Tarik perlahan untuk melatih kekuatan genggaman.', age_min: 0, age_max: 3, duration: '2-3 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Stimulasi Angkat Kepala', description: 'Saat bayi tengkurap, letakkan mainan atau wajah Anda di depannya, panggil namanya. Dorong bayi mengangkat kepala.', age_min: 0, age_max: 3, duration: '2-5 menit', difficulty: 'mudah', materials: 'Mainan warna cerah/ cermin', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Pijat dan Gerakan', description: 'Pijat lembut kaki dan tangan bayi. Lakukan gerakan memutar pergelangan tangan dan kaki secara perlahan.', age_min: 0, age_max: 3, duration: '5-10 menit', difficulty: 'mudah', materials: 'Minyak pijat bayi', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 3-6 bulan ---
  { domain: 'motor', title: 'Waktu Tengkurap Lebih Lama', description: 'Tengkurapkan 3-5 kali sehari masing-masing 3-5 menit. Letakkan mainan di depan untuk menarik perhatian dan mendorong angkat kepala.', age_min: 3, age_max: 6, duration: '3-5 menit/sesi', difficulty: 'mudah', materials: 'Matras, mainan', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Meraih dan Memukul Mainan', description: 'Gantung mainan di atas bayi yang telentang. Biarkan bayi meraih, memukul, dan menggoyangkan mainan.', age_min: 3, age_max: 6, duration: '5-10 menit', difficulty: 'mudah', materials: 'Mainan gantung/ play gym', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Bermain Kaki', description: 'Saat bayi telentang, pegang kakinya dan bantu sentuh ke tangannya. Biarkan bayi "bermain" dengan kakinya sendiri.', age_min: 3, age_max: 6, duration: '3-5 menit', difficulty: 'mudah', materials: '-', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Latihan Berguling', description: 'Saat bayi telentang, goyangkan pinggulnya perlahan ke sisi kanan dan kiri untuk mendorong berguling.', age_min: 3, age_max: 6, duration: '3-5 menit', difficulty: 'sedang', materials: 'Matras', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Mainan Tekstur', description: 'Berikan mainan dengan berbagai tekstur untuk diraba, digenggam, dan dimasukkan ke mulut. Ini merangsang sensorik dan motorik.', age_min: 3, age_max: 6, duration: '5-10 menit', difficulty: 'mudah', materials: 'Mainan tekstur/ teether', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 6-9 bulan ---
  { domain: 'motor', title: 'Duduk dan Bermain', description: 'Bantu bayi duduk dengan bantal sebagai penyangga. Letakkan mainan di sekelilingnya. Kurangi bantuan secara bertahap.', age_min: 6, age_max: 9, duration: '10-15 menit', difficulty: 'mudah', materials: 'Bantal duduk, mainan', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Merangkak', description: 'Dorong bayi merangkak dengan meletakkan mainan sedikit di luar jangkauan saat tengkurap. Bermain "kejar-kejaran" dengan merangkak.', age_min: 6, age_max: 9, duration: '10-15 menit', difficulty: 'sedang', materials: 'Mainan kesukaan', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Ambil Benda Kecil', description: 'Sediakan kismis atau biskuit bayi kecil. Letakkan di alas dan biarkan bayi mengambil dengan jempol dan telunjuk (pincer grasp).', age_min: 6, age_max: 9, duration: '5-10 menit', difficulty: 'sedang', materials: 'Biskuit/ kismis/ potongan buah kecil', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Pindah Tangan', description: 'Berikan mainan di satu tangan, lalu tawarkan mainan kedua. Dorong bayi memindahkan mainan ke tangan lain.', age_min: 6, age_max: 9, duration: '3-5 menit', difficulty: 'mudah', materials: '2 mainan kecil', category: 'general', sort_order: 4 },
  { domain: 'motor', title: 'Stimulasi Pincer Grasp', description: 'Jika bayi belum mengambil benda kecil, bimbing tangannya. Letakkan benda di antara jempol dan telunjuk bayi.', age_min: 6, age_max: 9, duration: '5-10 menit', difficulty: 'sedang', materials: 'Benda kecil (biskuit, kacang)', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Latihan Duduk', description: 'Jika bayi belum stabil duduk, beri latihan: tarik perlahan dari telentang ke duduk. Ulangi 3-5 kali.', age_min: 6, age_max: 9, duration: '5 menit', difficulty: 'sedang', materials: '-', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 9-12 bulan ---
  { domain: 'motor', title: 'Berdiri Berpegangan', description: 'Letakkan mainan di atas kursi/meja rendah. Dorong bayi berdiri dengan berpegangan pada perabotan untuk mencapai mainan.', age_min: 9, age_max: 12, duration: '10-15 menit', difficulty: 'sedang', materials: 'Mainan, kursi/meja rendah', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Makan dengan Tangan', description: 'Biarkan bayi mengambil dan memasukkan finger food ke mulut sendiri. Ini melatih koordinasi tangan-mata dan motorik halus.', age_min: 9, age_max: 12, duration: '15-20 menit', difficulty: 'mudah', materials: 'Finger food (wortel kukus, pisang, roti)', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Bermain Balok', description: 'Sediakan balok besar. Tunjukkan cara menyusun dan merobohkannya. Biarkan bayi meniru dan bermain.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'mudah', materials: 'Balok kayu/plastik besar', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Gelinding Bola', description: 'Duduk berhadapan dengan bayi. Gelindingkan bola ke arahnya. Dorong bayi menangkap dan menggulung balik.', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'mudah', materials: 'Bola lembut ukuran sedang', category: 'general', sort_order: 4 },
  { domain: 'motor', title: 'Berdiri Tanpa Pegangan', description: 'Jika bayi sudah bisa berdiri berpegangan, berdirikan bayi tanpa pegangan selama 2-3 detik. Tangkap dan puji.', age_min: 9, age_max: 12, duration: '3-5 menit', difficulty: 'sedang', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Latihan Berdiri', description: 'Pegang kedua tangan bayi dan tarik ke posisi berdiri. Lepas perlahan selama beberapa detik. Ulangi!', age_min: 9, age_max: 12, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 12-15 bulan ---
  { domain: 'motor', title: 'Berjalan dengan Bantuan', description: 'Pegang kedua tangan bayi dan ajak berjalan perlahan. Kurangi jumlah jari yang dipegang seiring anak lebih percaya diri.', age_min: 12, age_max: 15, duration: '10-15 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Menara Balok', description: 'Tantang anak menyusun balok menjadi menara. Mulai 2, lalu 3-4 balok. Puji setiap pencapaian, jangan khawatir jika roboh.', age_min: 12, age_max: 15, duration: '5-10 menit', difficulty: 'mudah', materials: 'Balok kayu 6-8 buah', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Coret-coret', description: 'Berikan krayon besar dan kertas. Tunjukkan cara mencoret. Biarkan anak mencoret bebas. Ini melatih motorik halus pre-writing.', age_min: 12, age_max: 15, duration: '5-10 menit', difficulty: 'mudah', materials: 'Krayon besar (washable), kertas besar', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Makan Sendok', description: 'Biarkan anak memegang sendok sendiri saat makan. Beri makanan yang mudah diambil. Bantu jika perlu tapi jangan ambil alih.', age_min: 12, age_max: 15, duration: '15-20 menit', difficulty: 'sedang', materials: 'Sendok anak, mangkuk anti tumpah', category: 'general', sort_order: 4 },
  { domain: 'motor', title: 'Berjalan Tanpa Bantuan', description: 'Jika anak sudah mulai berjalan beberapa langkah, buat "jalur" aman tanpa halangan. Beri semangat dari jarak pendek.', age_min: 12, age_max: 15, duration: '10-15 menit', difficulty: 'sedang', materials: 'Mainan kesukaan', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Bermain Dorong Mainan', description: 'Sediakan mainan dorong (baby walker/ troli). Ajak anak berjalan sambil mendorong. Ini menambah kepercayaan diri berjalan.', age_min: 12, age_max: 15, duration: '10-15 menit', difficulty: 'sedang', materials: 'Mainan dorong/tarik', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 15-18 bulan ---
  { domain: 'motor', title: 'Berlari dan Berjingkrak', description: 'Ajak anak berlari kecil di halaman/ ruang aman. Buat permainan kejar-kejaran. Ini memperkuat motorik kasar dan koordinasi.', age_min: 15, age_max: 18, duration: '10-20 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Memanjat Kursi', description: 'Biarkan anak memanjat naik dan turun dari kursi atau sofa. Awasi untuk keamanan. Ini memperkuat otot dan keseimbangan.', age_min: 15, age_max: 18, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kursi stabil, sofa', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Cakaran dan Coretan', description: 'Berikan spidol besar atau kapur tulis. Biarkan anak mencoret di papan tulis atau kertas besar. Gerakan bebas melatih motorik halus.', age_min: 15, age_max: 18, duration: '10-15 menit', difficulty: 'mudah', materials: 'Papan tulis, kapur/spidol besar', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Membalik Halaman Buku', description: 'Bacakan buku dengan halaman tebal. Minta anak membalik halaman meskipun masih 2-3 halaman sekaligus.', age_min: 15, age_max: 18, duration: '5-10 menit', difficulty: 'mudah', materials: 'Buku board book', category: 'general', sort_order: 4 },
  { domain: 'motor', title: 'Menendang Bola', description: 'Letakkan bola di depan anak dan tunjukkan cara menendangnya. Dorong anak meniru. Main bergantian menendang lempar.', age_min: 15, age_max: 18, duration: '10-15 menit', difficulty: 'sedang', materials: 'Bola plastik ukuran sedang', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Rintangan Sederhana', description: 'Buat lintasan rintangan dengan bantal dan kardus. Ajak anak berjalan, memanjat, dan melangkahi rintangan.', age_min: 15, age_max: 18, duration: '15-20 menit', difficulty: 'sedang', materials: 'Bantal, kardus, selimut', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 18-24 bulan ---
  { domain: 'motor', title: 'Lari dan Berhenti', description: 'Main "lari lalu berhenti". Ajak anak berlari, lalu berhenti saat Anda bilang "stop". Ini melatih kontrol motorik dan keseimbangan.', age_min: 18, age_max: 24, duration: '10-15 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Menara Tinggi', description: 'Tantang anak menyusun 6-7 balok. Hitung bersama setiap balok yang ditumpuk. Ini melatih koordinasi mata-tangan.', age_min: 18, age_max: 24, duration: '5-10 menit', difficulty: 'sedang', materials: 'Balok kayu 8-10 buah', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Menggambar Garis', description: 'Ajari anak menggambar garis vertikal dan horizontal. Gambar bersama: "Ini hujan (garis turun), ini jalan (garis datar)."', age_min: 18, age_max: 24, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kertas, krayon/ spidol', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Naik Tangga', description: 'Bantu anak naik tangga dengan berpegangan pada pagar. Mulai dengan 2-3 anak tangga. Awasi selalu.', age_min: 18, age_max: 24, duration: '5-10 menit', difficulty: 'sedang', materials: 'Tangga dengan pagar pengaman', category: 'general', sort_order: 4 },
  { domain: 'motor', title: 'Melempar Bola', description: 'Berdiri sekitar 1 meter dari anak. Minta anak melempar bola ke arah Anda. Gunakan bola empuk/ kain.', age_min: 18, age_max: 24, duration: '5-10 menit', difficulty: 'sedang', materials: 'Bola kain/ bola empuk', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Makan Sendiri', description: 'Biarkan anak makan sendiri dengan sendok. Sediakan lap untuk membersihkan tumpahan. Jangan khawatirkan kekotoran, fokus pada kemandirian.', age_min: 18, age_max: 24, duration: '15-20 menit', difficulty: 'sedang', materials: 'Sendok, mangkuk, celemek', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 24-30 bulan ---
  { domain: 'motor', title: 'Lompat Bersama', description: 'Ajak anak melompat di tempat, ke depan, dan ke belakang. Pegang kedua tangannya dan lompat bersama. "Ayo lompat seperti katak!"', age_min: 24, age_max: 30, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Berdiri Satu Kaki', description: 'Tunjukkan cara berdiri satu kaki. Pegang tangan anak untuk keseimbangan. Lepas perlahan selama 1-2 detik. Tingkatkan durasi.', age_min: 24, age_max: 30, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Menggambar Lingkaran', description: 'Gambar lingkaran di kertas. Minta anak meniru. Mulai dari lingkaran besar, lalu lingkaran kecil. "Ayo buat bola!"', age_min: 24, age_max: 30, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kertas, spidol/ krayon', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Memakai Baju Sendiri', description: 'Biarkan anak mencoba memakai baju, celana, dan kaos kaki sendiri. Beri bantuan minimal. Puji setiap usaha.', age_min: 24, age_max: 30, duration: '10-15 menit', difficulty: 'sedang', materials: 'Baju anak yang mudah dipakai', category: 'general', sort_order: 4 },
  { domain: 'motor', title: 'Bermain Karet/ Tali', description: 'Sediakan tali/ karet gelang besar. Tunjukkan cara merangkai atau menarik. Ini melatih kekuatan tangan dan motorik halus.', age_min: 24, age_max: 30, duration: '10-15 menit', difficulty: 'sedang', materials: 'Tali/ karet gelang besar', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Latihan Keseimbangan', description: 'Buat garis di lantai dengan selotip. Ajak anak berjalan di atas garis. Variasi: jinjit atau berjalan mundur.', age_min: 24, age_max: 30, duration: '5-10 menit', difficulty: 'sedang', materials: 'Selotip/ tali di lantai', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 30-36 bulan ---
  { domain: 'motor', title: 'Lompat Katak', description: 'Ajak anak berjongkok dan melompat seperti katak. Lakukan di tempat atau sambil maju. Lomba lompat katak bersama.', age_min: 30, age_max: 36, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Menggunting Kertas', description: 'Berikan gunting anak yang aman dan kertas. Tunjukkan cara membuka-tutup gunting. Mulai dengan menggunting garis lurus lebar.', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'sulit', materials: 'Gunting anak, kertas bergaris', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Menangkap Bola', description: 'Berdiri 1-2 meter. Lempar bola besar dan lembut ke arah anak. Minta anak menangkap dengan kedua tangan.', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'sedang', materials: 'Bola besar dan ringan', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Puzzle 4-6 Keping', description: 'Sediakan puzzle gambar sederhana 4-6 keping. Ajak anak menyusun. Ini melatih koordinasi tangan dan pemecahan masalah.', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'sedang', materials: 'Puzzle 4-6 keping', category: 'general', sort_order: 4 },
  { domain: 'motor', title: 'Jalan Jinjit', description: 'Tunjukkan cara berjalan jinjit (berdiri di ujung jari). Minta anak meniru. Mainkan musik dan jalan jinjit bersama.', age_min: 30, age_max: 36, duration: '3-5 menit', difficulty: 'sedang', materials: 'Musik anak', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Meronce/ Merangkai', description: 'Gunakan manik-manik besar dan tali. Ajak anak merangkai manik menjadi kalung. Ini melatih motorik halus dan fokus.', age_min: 30, age_max: 36, duration: '10-15 menit', difficulty: 'sulit', materials: 'Manik-manik besar, tali/ sedotan', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 36-48 bulan ---
  { domain: 'motor', title: 'Naik Turun Tangga', description: 'Ajak anak naik turun tangga dengan kaki bergantian. Pegang satu tangan sebagai bantuan. Kurangi bantuan bertahap.', age_min: 36, age_max: 48, duration: '5-10 menit', difficulty: 'sedang', materials: 'Tangga dengan pagar', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Menggambar Bentuk', description: 'Ajari menggambar lingkaran, segitiga, dan kotak. Gambar rumah sederhana dari kombinasi bentuk: kotak + segitiga (atap).', age_min: 36, age_max: 48, duration: '10-15 menit', difficulty: 'sedang', materials: 'Kertas, pensil/spidol', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Mengancing Baju', description: 'Sediakan boneka atau baju dengan kancing besar. Ajak anak berlatih membuka dan mengancing. Sabar adalah kunci.', age_min: 36, age_max: 48, duration: '10-15 menit', difficulty: 'sulit', materials: 'Boneka/baju dengan kancing besar', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Lompat Tali Statis', description: 'Letakkan tali di lantai. Minta anak melompat ke depan dan ke belakang melewati tali. Tingkatkan ke lompat tali ayun rendah.', age_min: 36, age_max: 48, duration: '5-10 menit', difficulty: 'sedang', materials: 'Tali lompat', category: 'general', sort_order: 4 },
  { domain: 'motor', title: 'Berdiri 1 Kaki', description: 'Tantang anak berdiri satu kaki selama 5 detik. Buat permainan: "Siapa yang bisa berdiri lebih lama?"', age_min: 36, age_max: 48, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Kolase dan Tempel', description: 'Sediakan potongan kertas warna, lem, dan karton. Minta anak menempel potongan untuk membuat gambar. Ini melatih koordinasi halus.', age_min: 36, age_max: 48, duration: '15-20 menit', difficulty: 'sedang', materials: 'Kertas warna, lem, karton, gunting', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 48-60 bulan ---
  { domain: 'motor', title: 'Lompat 1 Kaki', description: 'Ajari anak melompat dengan satu kaki. Mulai dengan 3-5 lompatan. Bergantian kaki kiri dan kanan.', age_min: 48, age_max: 60, duration: '5-10 menit', difficulty: 'sedang', materials: '-', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Menulis Huruf', description: 'Ajari anak menulis nama sendiri. Mulai dengan huruf pertama. Beri contoh titik-titik untuk ditiru. Jangan paksa.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sulit', materials: 'Kertas, pensil, spidol', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Olahraga Terstruktur', description: 'Ikutkan anak ke kelas olahraga anak: renang, karate, atau senam. Olahraga terstruktur mengembangkan koordinasi dan disiplin.', age_min: 48, age_max: 60, duration: '30-60 menit', difficulty: 'sedang', materials: 'Perlengkapan olahraga', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Menggambar Orang', description: 'Minta anak menggambar orang. Ajari step-by-step: kepala (lingkaran), badan, tangan, kaki. Puji usahanya.', age_min: 48, age_max: 60, duration: '15-20 menit', difficulty: 'sedang', materials: 'Kertas, pensil, krayon', category: 'general', sort_order: 4 },
  { domain: 'motor', title: 'Memotong dengan Gunting', description: 'Gunting mengikuti garis lurus, zigzag, dan lengkung. Mulai dari garis lebar ke sempit. Pajang hasil karya.', age_min: 48, age_max: 60, duration: '10-15 menit', difficulty: 'sulit', materials: 'Gunting anak, kertas bergambar', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Bermain Pasir/ Air', description: 'Ajak anak bermain pasir kinetik atau air di baskom. Sediakan cetakan, sendok, dan wadah. Sensorik + motorik halus.', age_min: 48, age_max: 60, duration: '20-30 menit', difficulty: 'mudah', materials: 'Pasir kinetik/ air, cetakan, sendok', category: 'tracking_kendala', sort_order: 1 },

  // --- Usia 60+ bulan ---
  { domain: 'motor', title: 'Lompat Tali Aktif', description: 'Ajari anak lompat tali secara bergantian. Mulai dengan ayunan tali yang lambat. Ini melatih koordinasi dan kardio.', age_min: 60, age_max: 72, duration: '10-20 menit', difficulty: 'sulit', materials: 'Tali lompat', category: 'general', sort_order: 1 },
  { domain: 'motor', title: 'Menulis Kalimat Pendek', description: 'Ajari anak menulis kata dan kalimat pendek. "Aku sayang Ibu." "Bola merah." Latihan 10-15 menit per hari.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sulit', materials: 'Buku tulis, pensil', category: 'general', sort_order: 2 },
  { domain: 'motor', title: 'Menggambar Detail', description: 'Minta anak menggambar orang dengan 6+ bagian (kepala, rambut, mata, hidung, mulut, badan, tangan, jari, kaki).', age_min: 60, age_max: 72, duration: '15-20 menit', difficulty: 'sulit', materials: 'Kertas, pensil, krayon', category: 'general', sort_order: 3 },
  { domain: 'motor', title: 'Olahraga Tim', description: 'Ajak anak bermain bola bersama teman atau keluarga. Sepak bola kecil, kasti, atau lomba estafet.', age_min: 60, age_max: 72, duration: '30-60 menit', difficulty: 'sedang', materials: 'Bola, perlengkapan olahraga', category: 'general', sort_order: 4 },
  { domain: 'motor', title: 'Mengikat Tali Sepatu', description: 'Ajarkan cara mengikat tali sepatu. Gunakan sepatu dengan tali berwarna berbeda untuk memudahkan. Sabar, ini butuh latihan.', age_min: 60, age_max: 72, duration: '10-15 menit', difficulty: 'sulit', materials: 'Sepatu bertali', category: 'screening_result', sort_order: 1 },
  { domain: 'motor', title: 'Origami/ Melipat Kertas', description: 'Ajarkan lipatan sederhana: pesawat kertas, perahu, atau topi. Melipat melatih presisi dan koordinasi motorik halus.', age_min: 60, age_max: 72, duration: '15-20 menit', difficulty: 'sulit', materials: 'Kertas lipat/ origami', category: 'tracking_kendala', sort_order: 1 },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seedScreening() {
  try {
    console.log('🌱 Seeding screening questions & stimulation activities...');

    // ── 1. Insert Screening Questions ────────────────────────────────────
    console.log(`\n📋 Screening questions to insert: ${screeningQuestions.length}`);

    const qInsQuery = `
      INSERT INTO screening_questions (domain, age_min, age_max, question_text, question_type, options, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    // Note: ON CONFLICT DO NOTHING but we don't have a unique constraint.
    // We'll use SELECT before INSERT to avoid duplicates.

    let insertedQuestions = 0;
    let skippedQuestions = 0;

    for (const q of screeningQuestions) {
      const check = await pool.query(
        `SELECT id FROM screening_questions WHERE domain = $1 AND age_min = $2 AND age_max = $3 AND sort_order = $4`,
        [q.domain, q.age_min, q.age_max, q.sort_order]
      );

      if (check.rows.length === 0) {
        await pool.query(qInsQuery, [
          q.domain, q.age_min, q.age_max, q.question_text,
          q.question_type, JSON.stringify(q.options || []), q.sort_order
        ]);
        insertedQuestions++;
      } else {
        skippedQuestions++;
      }
    }

    console.log(`  ✓ Screening questions: ${insertedQuestions} inserted, ${skippedQuestions} skipped`);

    // ── 2. Insert Stimulation Activities ─────────────────────────────────
    console.log(`\n🎯 Stimulation activities to insert: ${stimulationActivities.length}`);

    const actInsQuery = `
      INSERT INTO stimulation_activities (domain, title, description, age_min, age_max, duration, difficulty, materials, category, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    let insertedActivities = 0;
    let skippedActivities = 0;

    for (const a of stimulationActivities) {
      const check = await pool.query(
        `SELECT id FROM stimulation_activities WHERE domain = $1 AND age_min = $2 AND age_max = $3 AND sort_order = $4 AND title = $5`,
        [a.domain, a.age_min, a.age_max, a.sort_order, a.title]
      );

      if (check.rows.length === 0) {
        await pool.query(actInsQuery, [
          a.domain, a.title, a.description, a.age_min, a.age_max,
          a.duration, a.difficulty, a.materials, a.category, a.sort_order
        ]);
        insertedActivities++;
      } else {
        skippedActivities++;
      }
    }

    console.log(`  ✓ Stimulation activities: ${insertedActivities} inserted, ${skippedActivities} skipped`);

    // ── Summary ──────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(50));
    console.log('📊 SEED SUMMARY');
    console.log('='.repeat(50));
    console.log(`  Screening questions : ${insertedQuestions} baru, ${screeningQuestions.length} total`);
    console.log(`  Stimulation activities: ${insertedActivities} baru, ${stimulationActivities.length} total`);

    // Count per domain
    const domains = ['cognitive', 'speech', 'immunity', 'motor'];
    console.log('\n  Per domain:');
    for (const d of domains) {
      const qCount = screeningQuestions.filter(q => q.domain === d).length;
      const aCount = stimulationActivities.filter(a => a.domain === d).length;
      console.log(`    ${d.padEnd(12)}: ${qCount} pertanyaan, ${aCount} aktivitas`);
    }

    console.log('\n✅ Seeding screening completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    if (require.main === module) await pool.end();
  }
}

// ── Run ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  seedScreening()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedScreening;
