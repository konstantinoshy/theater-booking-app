const pool = require('../config/db');

async function findByShowId(showId) {
  const [rows] = await pool.query(
    `SELECT st.*, 
            (st.total_seats - COALESCE(booked.cnt, 0)) AS available_seats
     FROM showtimes st
     LEFT JOIN (
       SELECT rs.showtime_id, SUM(rs.quantity) AS cnt
       FROM reservation_seats rs
       JOIN reservations r ON rs.reservation_id = r.reservation_id
       WHERE r.status = 'COMPLETED'
       GROUP BY rs.showtime_id
     ) booked ON booked.showtime_id = st.showtime_id
     WHERE st.show_id = ? AND st.start_time >= NOW()
     ORDER BY st.start_time`,
    [showId]
  );
  return rows;
}

async function findById(showtimeId) {
  const [rows] = await pool.query('SELECT * FROM showtimes WHERE showtime_id = ?', [showtimeId]);
  return rows[0] || null;
}

module.exports = { findByShowId, findById };
