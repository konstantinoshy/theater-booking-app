require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const authRoutes        = require('./routes/auth');
const theatreRoutes     = require('./routes/theatres');
const showRoutes        = require('./routes/shows');
const showtimeRoutes    = require('./routes/showtimes');
const seatRoutes        = require('./routes/seats');
const reservationRoutes = require('./routes/reservations');
const userRoutes        = require('./routes/user');

const app = express();

const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:8081', 'http://localhost:3000', 'exp://localhost:8081'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'Theatre Booking API is running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

async function start() {
  const dbPort = Number(process.env.DB_PORT) || 3306;
  console.log(
    `DB: ${process.env.DB_HOST || '127.0.0.1'}:${dbPort} user=${process.env.DB_USER} db=${process.env.DB_NAME}`
  );
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('Database connection OK');
  } catch (err) {
    console.error('\n[FATAL] Cannot connect to MySQL.');
    if (err.sqlMessage) console.error('        MySQL says:', err.sqlMessage);
    console.error('        Code:', err.code || err.errno || err.message);
    console.error('        Check backend/.env: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('        HeidiSQL must use the SAME port as DB_PORT; run create-app-user.sql on that session.');
    console.error('        Test: npm run db:ping\n');
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on 0.0.0.0:${PORT}`));
}

start();
