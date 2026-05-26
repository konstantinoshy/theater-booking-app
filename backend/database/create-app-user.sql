-- ΠΡΩΤΑ: Στο HeidiSQL η σύνδεσή σου πρέπει να έχει ίδιο Port με το DB_PORT στο backend/.env
--         (π.χ. αν το .env έχει 3307, μην τρέχεις εδώ όταν είσαι συνδεδεμένος σε 3306).
-- Τρέξε όλο το αρχείο σε Query tab (F9) ως root.

DROP USER IF EXISTS 'theatreapp'@'localhost';
DROP USER IF EXISTS 'theatreapp'@'127.0.0.1';

CREATE USER 'theatreapp'@'localhost' IDENTIFIED BY 'your_secure_password';
CREATE USER 'theatreapp'@'127.0.0.1' IDENTIFIED BY 'your_secure_password';

GRANT SELECT, INSERT, UPDATE, DELETE ON theatre_booking.* TO 'theatreapp'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON theatre_booking.* TO 'theatreapp'@'127.0.0.1';

FLUSH PRIVILEGES;
