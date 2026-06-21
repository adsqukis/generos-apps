const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    max: 1,
  });

  try {
    // List all admin users
    const admins = await pool.query(
      `SELECT id, email, phone, full_name, role, created_at FROM users WHERE role = 'admin'`
    );
    
    if (admins.rows.length === 0) {
      console.log('Tidak ada akun admin ditemukan.');
      // List all users
      const all = await pool.query(
        `SELECT id, email, phone, full_name, role, created_at FROM users ORDER BY created_at`
      );
      console.log(`\nSemua user (${all.rows.length}):`);
      all.rows.forEach(u => {
        console.log(`  - ${u.email || u.phone} | ${u.full_name} | role: ${u.role} | created: ${u.created_at}`);
      });
      
      // Make first user admin
      if (all.rows.length > 0) {
        await pool.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [all.rows[0].id]);
        console.log(`\n✅ User ${all.rows[0].email} telah dijadikan admin.`);
      }
      return;
    }

    console.log('Akun admin yang ditemukan:');
    admins.rows.forEach(u => {
      console.log(`  - Email: ${u.email || '(kosong)'} | Phone: ${u.phone || '(kosong)'} | Nama: ${u.full_name} | Dibuat: ${u.created_at}`);
    });
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
