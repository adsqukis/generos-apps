// Seeder katalog hadiah loyalty. Idempotent: skip kalau sudah ada.
const pool = require('./db');

const DEFAULT_GIFTS = [
  {
    name: 'Voucher Belanja Rp 25.000',
    description: 'Potongan untuk pembelian produk Generos berikutnya.',
    image_url: '/images/characters/anak-celebrate.png',
    points_required: 100,
    stock: null, // null = stok tak terbatas
  },
  {
    name: 'Ebook Panduan MPASI',
    description: 'Panduan lengkap MPASI bergizi untuk si kecil.',
    image_url: '/images/characters/media-hero-mom-girl.png',
    points_required: 150,
    stock: null,
  },
  {
    name: 'Voucher Belanja Rp 50.000',
    description: 'Potongan lebih besar untuk pembelian produk Generos.',
    image_url: '/images/characters/family-celebrate.png',
    points_required: 250,
    stock: 100,
  },
  {
    name: 'Botol Minum Anak Generos',
    description: 'Botol minum eksklusif edisi Generos Care.',
    image_url: '/images/characters/bayi-minum.png',
    points_required: 400,
    stock: 50,
  },
  {
    name: 'Paket Buku Cerita Anak',
    description: 'Set buku cerita edukatif untuk waktu membaca bersama.',
    image_url: '/images/characters/media-hero-hijab-boy.png',
    points_required: 600,
    stock: 30,
  },
];

async function seedLoyalty() {
  const check = await pool.query('SELECT COUNT(*) AS cnt FROM loyalty_gifts');
  if (parseInt(check.rows[0].cnt, 10) > 0) {
    return { skipped: true };
  }
  for (const g of DEFAULT_GIFTS) {
    await pool.query(
      `INSERT INTO loyalty_gifts (name, description, image_url, points_required, stock, is_active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [g.name, g.description, g.image_url, g.points_required, g.stock]
    );
  }
  return { seeded: DEFAULT_GIFTS.length };
}

module.exports = seedLoyalty;

if (require.main === module) {
  seedLoyalty()
    .then((r) => { console.log('Loyalty seed:', r); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
