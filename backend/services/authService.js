const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

const SALT_ROUNDS = 12;

/**
 * Φέρνει πραγματικό όνομα/email (π.χ. Google) — το access JWT συχνά δεν τα έχει για το audience σου.
 */
async function fetchAuth0UserInfo(accessToken) {
  const domain = process.env.AUTH0_DOMAIN;
  if (!domain || !accessToken) return null;

  try {
    const res = await fetch(`https://${domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Αντικαθιστά placeholder email/όνομα μετά από userinfo. */
async function finalizeAuth0ProfileHints(user_id, hintedEmail, hintedName) {
  const [rows] = await pool.query(
    'SELECT email, name FROM users WHERE user_id = ?',
    [user_id]
  );
  if (!rows.length) return null;

  let { email, name } = rows[0];
  let newEmail = email;
  let newName = name;

  const hEmail =
    typeof hintedEmail === 'string' && hintedEmail.includes('@')
      ? hintedEmail.trim().slice(0, 150)
      : null;

  const hName =
    typeof hintedName === 'string' && hintedName.trim().length > 0
      ? hintedName.trim().slice(0, 100)
      : null;

  const placeholderMail = /@auth0\.placeholder$/i.test(email);

  if (hEmail && placeholderMail) {
    const [conflict] = await pool.query(
      'SELECT user_id FROM users WHERE email = ? AND user_id <> ?',
      [hEmail, user_id]
    );
    if (!conflict.length) newEmail = hEmail;
  }

  if (hName && (String(name || '').trim() === 'Auth0 χρήστης' || !String(name || '').trim())) {
    newName = hName;
  }

  if (newEmail !== email || newName !== name) {
    await pool.query('UPDATE users SET email = ?, name = ? WHERE user_id = ?', [
      newEmail,
      newName,
      user_id,
    ]);
  }

  const [out] = await pool.query(
    'SELECT user_id, name, email FROM users WHERE user_id = ?',
    [user_id]
  );
  return out[0] || null;
}

/** Stable synthetic email when the access token has no email claim (FK + uniqueness). */
function syntheticEmailFromSub(sub) {
  const slug = String(sub)
    .replace(/\|/g, '_')
    .replace(/\W/g, '_')
    .replace(/^_+|_+$/g, '');
  const base = slug.slice(0, 72) || 'user';
  return `${base}@auth0.placeholder`;
}

/**
 * Map Auth0 JWT claims to our users row (INT user_id).
 * Reservations and favorites FK require this numeric id.
 */
async function findOrCreateAuth0User({ sub, email, name }) {
  if (!sub) throw new Error('Auth0 token missing sub');

  const trimmedEmail =
    typeof email === 'string' && email.includes('@')
      ? email.trim().slice(0, 150)
      : null;

  let userId;

  const [rowsBySub] = await pool.query(
    'SELECT user_id FROM users WHERE auth0_sub = ? LIMIT 1',
    [sub]
  );

  if (rowsBySub.length > 0) {
    userId = rowsBySub[0].user_id;
  } else if (trimmedEmail) {
    const [rowsByEmail] = await pool.query(
      'SELECT user_id, auth0_sub FROM users WHERE email = ? LIMIT 1',
      [trimmedEmail]
    );
    if (rowsByEmail.length > 0) {
      const byEmail = rowsByEmail[0];
      if (!byEmail.auth0_sub) {
        await pool.query('UPDATE users SET auth0_sub = ? WHERE user_id = ?', [
          sub,
          byEmail.user_id,
        ]);
      }
      userId = byEmail.user_id;
    }
  }

  if (!userId) {
    const insertEmail = trimmedEmail || syntheticEmailFromSub(sub);
    const displayName =
      (typeof name === 'string' && name.trim()) || 'Auth0 χρήστης';

    const placeholderPassword = await bcrypt.hash(
      crypto.randomBytes(32).toString('hex'),
      SALT_ROUNDS
    );

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, auth0_sub) VALUES (?, ?, ?, ?)',
      [displayName.trim().slice(0, 100), insertEmail, placeholderPassword, sub]
    );
    userId = result.insertId;
  }

  const updated = await finalizeAuth0ProfileHints(userId, email, name);
  if (updated) return updated;

  const [fallback] = await pool.query(
    'SELECT user_id, name, email FROM users WHERE user_id = ?',
    [userId]
  );
  return fallback[0];
}

async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function createUser(name, email, password) {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashed]
  );
  return result.insertId;
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
}

function refreshAccessToken(refreshToken) {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const payload = { user_id: decoded.user_id, email: decoded.email, name: decoded.name };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
  return accessToken;
}

module.exports = {
  findUserByEmail,
  createUser,
  verifyPassword,
  generateTokens,
  refreshAccessToken,
  findOrCreateAuth0User,
  fetchAuth0UserInfo,
};
