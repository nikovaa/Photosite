const { Pool } = require('pg');

// Railway / .env: DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// HAE kaikki palvelut
async function getPalvelut() {
  const result = await pool.query(
    'SELECT id, nimi, hinta, yksikko, kuvaus, kuva FROM palvelut ORDER BY id'
  );
  return result.rows;
}

// TALLENNA koko lista uusiksi
async function savePalvelut(palvelut) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // tyhjennä vanhat rivit
    await client.query('DELETE FROM palvelut');

    const sql =
      'INSERT INTO palvelut (id, nimi, hinta, yksikko, kuvaus, kuva) VALUES ($1, $2, $3, $4, $5, $6)';

    for (const p of palvelut) {
      await client.query(sql, [
        p.id,
        p.nimi,
        p.hinta,
        p.yksikko,
        p.kuvaus,
        p.kuva,
      ]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getPalvelut,
  savePalvelut,
};
