/**
 * Έλεγχος σύνδεσης με τα ίδια στοιχεία με το API.
 * Τρέξε από το φάκελο backend: npm run db:ping
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const trim = (v, fb) => ((v != null && String(v).trim()) || fb);

async function main() {
  const cfg = {
    host: trim(process.env.DB_HOST, '127.0.0.1'),
    port: Number(process.env.DB_PORT) || 3306,
    user: trim(process.env.DB_USER, ''),
    password: trim(process.env.DB_PASSWORD, ''),
    database: trim(process.env.DB_NAME, 'theatre_booking'),
  };

  console.log('Δοκιμή σύνδεσης (όπως το API):');
  console.log('  host/port:', `${cfg.host}:${cfg.port}`);
  console.log('  user:', cfg.user);
  console.log('  database:', cfg.database);
  console.log('  password:', cfg.password ? `(length ${cfg.password.length})` : '(κενό)');

  try {
    const c = await mysql.createConnection(cfg);
    await c.query('SELECT 1 AS ok');
    console.log('\nΕπιτυχία: η βάση δέχεται αυτά τα στοιχεία.');
    await c.end();
  } catch (e) {
    console.error('\nΑποτυχία:', e.code, e.sqlMessage || e.message);
    console.error(
      '\nΣτο HeidiSQL: άνοιξε το session → επεξεργασία → δες Host και Port.\n' +
        'Το Port ΠΡΕΠΕΙ να είναι ίδιο με το DB_PORT στο .env.\n' +
        'Μετά τρέξε ξανά το αρχείο database/create-app-user.sql ΣΕ ΑΥΤΗ ΤΗ σύνδεση.\n'
    );
    process.exit(1);
  }
}

main();
