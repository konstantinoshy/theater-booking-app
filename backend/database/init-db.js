const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true, // Allow multiple queries from schema.sql
  };

  let connection;
  try {
    console.log('Connecting to MariaDB/MySQL...');
    connection = await mysql.createConnection(connectionConfig);

    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    // The schema.sql usually contains CREATE DATABASE IF NOT EXISTS theatre_booking
    await connection.query(schemaSql);

    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:');
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied. Please check your DB_PASSWORD in .env');
    } else {
      console.error(error.message);
    }
  } finally {
    if (connection) await connection.end();
  }
}

initDB();
