const pool = require('../config/db');

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const generateSeatDetails = (categoryName, qty, bookedBefore) => {
  const details = [];
  let rowStart, rowEnd, maxSeat;

  const name = categoryName.toLowerCase();
  if (name.includes('vip')) {
    rowStart = 1; rowEnd = 2; maxSeat = 20;
  } else if (name.includes('πάρτερ') || name.includes('parter')) {
    rowStart = 3; rowEnd = 8; maxSeat = 24;
  } else {
    rowStart = 1; rowEnd = 4; maxSeat = 18;
  }

  const start = Number(bookedBefore) || 0;
  const rowSpan = rowEnd - rowStart + 1;
  const capacity = rowSpan * maxSeat;

  for (let i = 0; i < qty; i++) {
    const k = start + i;
    if (k >= capacity) {
      throw createError(500, 'Seat layout overflow for category');
    }
    const rowOffset = Math.floor(k / maxSeat);
    const row = rowStart + rowOffset;
    const seatNum = (k % maxSeat) + 1;
    details.push(`Σειρά ${row}, Θέση ${seatNum}`);
  }
  return details.join(' | ');
};

async function create(userId, showtimeId, seats) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let totalPrice = 0;
    const processedSeats = [];
    const pendingByCategory = new Map();

    const [stRows] = await conn.query('SELECT start_time FROM showtimes WHERE showtime_id = ? FOR UPDATE', [showtimeId]);
    if (stRows.length === 0) throw createError(404, 'Showtime not found');
    if (new Date(stRows[0].start_time) <= new Date()) throw createError(400, 'Cannot book past showtimes');

    for (const seat of seats) {
      if (!Number.isInteger(seat.quantity) || seat.quantity <= 0) {
        throw createError(400, 'Invalid seat quantity');
      }
      const [cats] = await conn.query(
        `SELECT sc.category_name, sc.price, sc.total_seats,
                COALESCE(b.booked, 0) AS booked
         FROM seat_categories sc
         LEFT JOIN (
           SELECT rs.seat_category_id, SUM(rs.quantity) AS booked
           FROM reservation_seats rs
           JOIN reservations r ON rs.reservation_id = r.reservation_id
           WHERE r.status = 'COMPLETED' AND rs.showtime_id = ?
           GROUP BY rs.seat_category_id
         ) b ON b.seat_category_id = sc.seat_category_id
         WHERE sc.seat_category_id = ? AND sc.showtime_id = ?
         FOR UPDATE`,
        [showtimeId, seat.seat_category_id, showtimeId]
      );

      if (cats.length === 0)
        throw createError(404, `Seat category ${seat.seat_category_id} not found`);

      const available = cats[0].total_seats - cats[0].booked;
      if (seat.quantity > available)
        throw createError(409, `Not enough seats in category ${seat.seat_category_id}. Available: ${available}`);

      totalPrice += Number(cats[0].price) * seat.quantity;

      const committedBooked = Number(cats[0].booked) || 0;
      const pendingForCat = pendingByCategory.get(seat.seat_category_id) || 0;
      const bookedBefore = committedBooked + pendingForCat;
      const generatedDetails = generateSeatDetails(cats[0].category_name, seat.quantity, bookedBefore);
      pendingByCategory.set(seat.seat_category_id, pendingForCat + seat.quantity);

      processedSeats.push({
        seat_category_id: seat.seat_category_id,
        quantity: seat.quantity,
        seat_details: generatedDetails
      });
    }

    const [resResult] = await conn.query(
      'INSERT INTO reservations (user_id, showtime_id, total_price, status) VALUES (?, ?, ?, "COMPLETED")',
      [userId, showtimeId, totalPrice]
    );
    const reservationId = resResult.insertId;

    for (const pSeat of processedSeats) {
      await conn.query(
        'INSERT INTO reservation_seats (reservation_id, showtime_id, seat_category_id, quantity, seat_details) VALUES (?, ?, ?, ?, ?)',
        [reservationId, showtimeId, pSeat.seat_category_id, pSeat.quantity, pSeat.seat_details]
      );
    }

    await conn.commit();
    return {
      reservationId,
      totalPrice,
      seats: processedSeats.map(s => ({
        seat_category_id: s.seat_category_id,
        quantity: s.quantity,
        seat_details: s.seat_details
      }))
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function findByIdAndUser(reservationId, userId) {
  const [rows] = await pool.query(
    `SELECT r.*, s.title AS show_title, st.start_time, t.name AS theatre_name
     FROM reservations r
     JOIN showtimes st ON r.showtime_id = st.showtime_id
     JOIN shows s ON st.show_id = s.show_id
     JOIN theatres t ON s.theatre_id = t.theatre_id
     WHERE r.reservation_id = ? AND r.user_id = ?`,
    [reservationId, userId]
  );
  if (rows.length === 0) return null;

  const [seats] = await pool.query(
    `SELECT rs.seat_category_id, rs.quantity, rs.seat_details, sc.category_name, sc.price
     FROM reservation_seats rs
     JOIN seat_categories sc ON rs.seat_category_id = sc.seat_category_id
     WHERE rs.reservation_id = ?`,
    [reservationId]
  );
  return { ...rows[0], seats };
}

async function update(reservationId, userId, seats) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      `SELECT r.reservation_id, st.start_time, r.showtime_id
       FROM reservations r
       JOIN showtimes st ON r.showtime_id = st.showtime_id
       WHERE r.reservation_id = ? AND r.user_id = ? AND r.status = 'COMPLETED'`,
      [reservationId, userId]
    );
    if (existing.length === 0)
      throw createError(404, 'Reservation not found or already cancelled');
    if (new Date(existing[0].start_time) <= new Date())
      throw createError(400, 'Cannot modify past reservations');

    const showtimeId = existing[0].showtime_id;
    const processedSeats = [];
    let totalPrice = 0;
    const pendingByCategory = new Map();

    // Verify availability first, excluding current reservation
    for (const seat of seats) {
      if (!Number.isInteger(seat.quantity) || seat.quantity <= 0) {
        throw createError(400, 'Invalid seat quantity');
      }
      const [cats] = await conn.query(
        `SELECT sc.total_seats, sc.category_name, sc.price,
                COALESCE(b.booked, 0) AS booked
         FROM seat_categories sc
         LEFT JOIN (
           SELECT rs.seat_category_id, SUM(rs.quantity) AS booked
           FROM reservation_seats rs
           JOIN reservations r ON rs.reservation_id = r.reservation_id
           WHERE r.status = 'COMPLETED' AND rs.showtime_id = ? AND r.reservation_id != ?
           GROUP BY rs.seat_category_id
         ) b ON b.seat_category_id = sc.seat_category_id
         WHERE sc.seat_category_id = ? AND sc.showtime_id = ?
         FOR UPDATE`,
        [showtimeId, reservationId, seat.seat_category_id, showtimeId]
      );
      
      if (cats.length === 0) throw createError(404, `Category ${seat.seat_category_id} not found`);
      const available = cats[0].total_seats - cats[0].booked;
      if (seat.quantity > available)
        throw createError(409, `Not enough seats in category ${seat.seat_category_id}`);

      totalPrice += Number(cats[0].price) * seat.quantity;

      const committedBooked = Number(cats[0].booked) || 0;
      const pendingForCat = pendingByCategory.get(seat.seat_category_id) || 0;
      const bookedBefore = committedBooked + pendingForCat;
      const generated =
        seat.seat_details ||
        generateSeatDetails(cats[0].category_name, seat.quantity, bookedBefore);
      pendingByCategory.set(seat.seat_category_id, pendingForCat + seat.quantity);

      processedSeats.push({
        seat_category_id: seat.seat_category_id,
        quantity: seat.quantity,
        seat_details: generated
      });
    }

    // Now safe to delete old seats and insert new ones
    await conn.query('DELETE FROM reservation_seats WHERE reservation_id = ?', [reservationId]);

    for (const pSeat of processedSeats) {
      await conn.query(
        'INSERT INTO reservation_seats (reservation_id, showtime_id, seat_category_id, quantity, seat_details) VALUES (?, ?, ?, ?, ?)',
        [reservationId, showtimeId, pSeat.seat_category_id, pSeat.quantity, pSeat.seat_details]
      );
    }

    await conn.query(
      'UPDATE reservations SET total_price = ? WHERE reservation_id = ?',
      [totalPrice, reservationId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function cancel(reservationId, userId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      `SELECT r.reservation_id, st.start_time
       FROM reservations r
       JOIN showtimes st ON r.showtime_id = st.showtime_id
       WHERE r.reservation_id = ? AND r.user_id = ? AND r.status = 'COMPLETED'`,
      [reservationId, userId]
    );
    if (existing.length === 0)
      throw createError(404, 'Reservation not found or already cancelled');
    if (new Date(existing[0].start_time) <= new Date())
      throw createError(400, 'Cannot cancel past reservations');

    await conn.query(
      "UPDATE reservations SET status = 'CANCELLED' WHERE reservation_id = ?",
      [reservationId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function remove(reservationId, userId) {
  const [existing] = await pool.query(
    'SELECT reservation_id FROM reservations WHERE reservation_id = ? AND user_id = ?',
    [reservationId, userId]
  );
  if (existing.length === 0)
    throw createError(404, 'Reservation not found');

  await pool.query(
    'DELETE FROM reservations WHERE reservation_id = ? AND user_id = ?',
    [reservationId, userId]
  );
}

module.exports = { create, findByIdAndUser, update, cancel, remove };
