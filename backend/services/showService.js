const pool = require('../config/db');

async function findAll({ theatreId, title, date } = {}) {
  let sql = `
    SELECT s.*, t.name AS theatre_name, t.location
    FROM shows s
    JOIN theatres t ON s.theatre_id = t.theatre_id
    WHERE 1=1
  `;
  const params = [];

  if (theatreId) { sql += ' AND s.theatre_id = ?';  params.push(theatreId); }
  if (title) { sql += ' AND s.title LIKE ?'; params.push(`%${title}%`); }
  if (date) {
    sql += ' AND EXISTS (SELECT 1 FROM showtimes st WHERE st.show_id = s.show_id AND DATE(st.start_time) = ?)';
    params.push(date);
  }

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(showId) {
  const [rows] = await pool.query(
    `SELECT s.*, t.name AS theatre_name, t.location
     FROM shows s JOIN theatres t ON s.theatre_id = t.theatre_id
     WHERE s.show_id = ?`,
    [showId]
  );
  return rows[0] || null;
}

module.exports = { findAll, findById };
