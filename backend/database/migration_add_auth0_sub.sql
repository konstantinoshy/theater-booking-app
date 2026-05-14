-- Run once on existing DBs: OAuth users need INTEGER user_id for reservations FK.
-- If MariaDB/MySQL reports "Duplicate column name", skip — column already exists.
USE theatre_booking;

ALTER TABLE users
  ADD COLUMN auth0_sub VARCHAR(128) DEFAULT NULL UNIQUE AFTER password;
