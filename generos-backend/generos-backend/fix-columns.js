require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

async function run() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS child_nickname VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS child_photo TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_weight DECIMAL(5,2);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_height DECIMAL(5,2);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_head_circumference DECIMAL(5,2);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_notes TEXT;
    `);
    console.log('✓ All columns added successfully');
  } catch(e) {
    console.error('Failed:', e.message);
  }
  await pool.end();
}

run();
