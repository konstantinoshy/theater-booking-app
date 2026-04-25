const pool = require('../config/db');

async function findByShowtimeId(showtimeId) {
  const [rows] = await pool.query(
    `SELECT sc.seat_category_id, sc.category_name, sc.price,
            sc.total_seats,
            COALESCE(b.booked, 0) AS booked_seats,
            (sc.total_seats - COALESCE(b.booked, 0)) AS available_seats
     FROM seat_categories sc
     LEFT JOIN (
       SELECT rs.seat_category_id, SUM(rs.quantity) AS booked
       FROM reservation_seats rs
       JOIN reservations r ON rs.reservation_id = r.reservation_id
       WHERE r.status = 'COMPLETED' AND rs.showtime_id = ?
       GROUP BY rs.seat_category_id
     ) b ON b.seat_category_id = sc.seat_category_id
     WHERE sc.showtime_id = ?`,
    [showtimeId, showtimeId]
  );
  return rows;
}

module.exports = { findByShowtimeId };
