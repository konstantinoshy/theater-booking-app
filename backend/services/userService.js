const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

const SALT_ROUNDS = 12;
const GREEK_MONTHS = [
  'Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου',
  'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου',
  'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου',
];

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

/** DECIMAL / currency string to integer cents (no float accumulation). */
function moneyToCents(amount) {
  if (amount == null || amount === '') return 0;
  const s = String(amount).trim();
  const sign = s.startsWith('-') ? -1 : 1;
  const u = sign === -1 ? s.slice(1) : s;
  const [whole, frac = ''] = u.split('.');
  const w = Number.parseInt(whole, 10);
  if (!Number.isFinite(w)) return 0;
  const f = Number.parseInt((frac + '00').slice(0, 2), 10);
  return sign * (w * 100 + f);
}

async function getProfile(userId) {
  const [rows] = await pool.query(
    'SELECT user_id, name, email, created_at, role, (auth0_sub IS NOT NULL) AS auth0 FROM users WHERE user_id = ?',
    [userId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    auth0: Boolean(row.auth0),
  };
}

async function updateProfile(userId, name, email) {
  const [existing] = await pool.query(
    'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
    [email, userId]
  );
  if (existing.length > 0)
    throw createError(409, 'Email already in use');

  await pool.query(
    'UPDATE users SET name = ?, email = ? WHERE user_id = ?',
    [name, email, userId]
  );
}

async function changePassword(userId, currentPassword, newPassword) {
  const [rows] = await pool.query(
    'SELECT password FROM users WHERE user_id = ?',
    [userId]
  );
  if (rows.length === 0)
    throw createError(404, 'User not found');

  const match = await bcrypt.compare(currentPassword, rows[0].password);
  if (!match)
    throw createError(401, 'Current password is incorrect');

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, userId]);
}

async function deleteAccount(userId) {
  await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
}

async function getReservations(userId) {
  const [rows] = await pool.query(
    `SELECT r.reservation_id, r.status, r.created_at, r.showtime_id,
            s.title AS show_title, st.start_time,
            t.name AS theatre_name, t.location,
            rs.quantity, rs.seat_details, sc.category_name, sc.price,
            rs.seat_category_id
     FROM reservations r
     JOIN showtimes st ON r.showtime_id = st.showtime_id
     JOIN shows s ON st.show_id = s.show_id
     JOIN theatres t ON s.theatre_id = t.theatre_id
     LEFT JOIN reservation_seats rs ON rs.reservation_id = r.reservation_id
     LEFT JOIN seat_categories sc ON rs.seat_category_id = sc.seat_category_id
     WHERE r.user_id = ?
     ORDER BY st.start_time DESC`,
    [userId]
  );

  const resMap = new Map();
  for (const row of rows) {
    if (!resMap.has(row.reservation_id)) {
      resMap.set(row.reservation_id, {
        reservation_id: row.reservation_id,
        status: row.status,
        created_at: row.created_at,
        showtime_id: row.showtime_id,
        show_title: row.show_title,
        start_time: row.start_time,
        theatre_name: row.theatre_name,
        location: row.location,
        seats: []
      });
    }
    if (row.quantity) {
      resMap.get(row.reservation_id).seats.push({
        seat_category_id: row.seat_category_id,
        quantity: row.quantity,
        seat_details: row.seat_details,
        category_name: row.category_name,
        price: row.price
      });
    }
  }

  return Array.from(resMap.values());
}

async function getPayments(userId) {
  const [rows] = await pool.query(
    `SELECT r.reservation_id AS id, r.status, r.created_at AS date,
            s.title AS showTitle,
            rs.quantity, sc.price
     FROM reservations r
     JOIN showtimes st ON r.showtime_id = st.showtime_id
     JOIN shows s ON st.show_id = s.show_id
     LEFT JOIN reservation_seats rs ON rs.reservation_id = r.reservation_id
     LEFT JOIN seat_categories sc ON rs.seat_category_id = sc.seat_category_id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC`,
    [userId]
  );

  const resMap = new Map();
  for (const row of rows) {
    if (!resMap.has(row.id)) {
      const d = new Date(row.date);
      const formattedDate = `${d.getDate()} ${GREEK_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      resMap.set(row.id, {
        id: row.id,
        status: row.status,
        date: formattedDate,
        showTitle: row.showTitle,
        quantity: 0,
        totalCents: 0
      });
    }
    if (row.quantity) {
      const payment = resMap.get(row.id);
      payment.quantity += row.quantity;
      const unitCents = moneyToCents(row.price);
      payment.totalCents += unitCents * row.quantity;
    }
  }

  const payments = Array.from(resMap.values());
  for (const p of payments) {
    p.totalPrice = (p.totalCents / 100).toFixed(2);
    delete p.totalCents;
  }

  return payments;
}

async function updatePreferences(userId, notificationsEnabled) {
  await pool.query(
    'UPDATE users SET notifications_enabled = ? WHERE user_id = ?',
    [notificationsEnabled, userId]
  );
}

async function getFavorites(userId) {
  const [rows] = await pool.query(
    `SELECT s.show_id, s.title, s.description, s.duration, s.age_rating, t.name AS theatre_name, f.created_at AS favored_at
     FROM user_favorites f
     JOIN shows s ON f.show_id = s.show_id
     JOIN theatres t ON s.theatre_id = t.theatre_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
}

async function addFavorite(userId, showId) {
  await pool.query(
    'INSERT IGNORE INTO user_favorites (user_id, show_id) VALUES (?, ?)',
    [userId, showId]
  );
}

async function removeFavorite(userId, showId) {
  await pool.query(
    'DELETE FROM user_favorites WHERE user_id = ? AND show_id = ?',
    [userId, showId]
  );
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getReservations,
  getPayments,
  updatePreferences,
  getFavorites,
  addFavorite,
  removeFavorite,
};
