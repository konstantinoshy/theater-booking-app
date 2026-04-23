const pool = require('../config/db');

async function findAll({ name, location } = {}) {
  let sql = 'SELECT * FROM theatres WHERE 1=1';
  const params = [];

  if (name) {
    sql += ' AND name LIKE ?';
    params.push(`%${name}%`);
  }
  if (location) {
    sql += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(theatreId) {
  const [rows] = await pool.query('SELECT * FROM theatres WHERE theatre_id = ?', [theatreId]);
  return rows[0] || null;
}

module.exports = { findAll, findById };
