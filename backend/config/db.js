const mysql = require('mysql2/promise');

const trim = (v, fallback = '') =>
  (v != null && String(v).trim()) || fallback;

const pool = mysql.createPool({
  host:     trim(process.env.DB_HOST, 'localhost'),
  port:     Number(process.env.DB_PORT) || 3306,
  user:     trim(process.env.DB_USER, 'root'),
  password: trim(process.env.DB_PASSWORD, ''),
  database: trim(process.env.DB_NAME, 'theatre_booking'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
