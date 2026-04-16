/** Schema εφαρμογής θεατρικών κρατήσεων (MariaDB). UTF8mb4 για ελληνικά κείμενα. */
CREATE DATABASE IF NOT EXISTS theatre_booking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE theatre_booking;

-- Πίνακας χρηστών με bcrypt hash και στήριξη notifications.
CREATE TABLE IF NOT EXISTS users (
  user_id    INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password            VARCHAR(255) NOT NULL,          -- bcrypt hash
  auth0_sub  VARCHAR(128) DEFAULT NULL UNIQUE,       -- Auth0 "sub"; links OAuth logins to this row
  role       ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  notifications_enabled BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
);

-- Θέατρα με τοποθεσία και περιγραφή για φιλτράρισμα αναζήτησης.
CREATE TABLE IF NOT EXISTS theatres (
  theatre_id  INT          NOT NULL AUTO_INCREMENT,
  name        VARCHAR(150) NOT NULL,
  location    VARCHAR(255) NOT NULL,
  description TEXT,
  image_url   VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (theatre_id)
);

-- Παραστάσεις με CASCADE delete σε θέατρα για ακεραιότητα δεδομένων.
CREATE TABLE IF NOT EXISTS shows (
  show_id    INT          NOT NULL AUTO_INCREMENT,
  theatre_id INT          NOT NULL,
  title      VARCHAR(200) NOT NULL,
  description TEXT,
  duration   SMALLINT     NOT NULL COMMENT 'Duration in minutes',
  age_rating VARCHAR(10)  NOT NULL DEFAULT 'ALL',
  image_url  VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (show_id),
  CONSTRAINT fk_show_theatre
    FOREIGN KEY (theatre_id) REFERENCES theatres (theatre_id)
    ON DELETE CASCADE
);

-- Προβολές με total_seats = άθροισμα categories, CASCADE από παραστάσεις.
CREATE TABLE IF NOT EXISTS showtimes (
  showtime_id  INT      NOT NULL AUTO_INCREMENT,
  show_id      INT      NOT NULL,
  start_time   DATETIME NOT NULL,
  total_seats  INT      NOT NULL DEFAULT 0,
  hall         VARCHAR(100),
  PRIMARY KEY (showtime_id),
  CONSTRAINT fk_showtime_show
    FOREIGN KEY (show_id) REFERENCES shows (show_id)
    ON DELETE CASCADE
);

-- Κατηγορίες καθισμάτων (Πάρτερ, Εξώστης, VIP) με τιμές ανά προβολή, CASCADE.
CREATE TABLE IF NOT EXISTS seat_categories (
  seat_category_id INT          NOT NULL AUTO_INCREMENT,
  showtime_id      INT          NOT NULL,
  category_name    VARCHAR(100) NOT NULL,
  price            DECIMAL(8,2) NOT NULL,
  total_seats      INT          NOT NULL,
  PRIMARY KEY (seat_category_id),
  CONSTRAINT fk_seatcat_showtime
    FOREIGN KEY (showtime_id) REFERENCES showtimes (showtime_id)
    ON DELETE CASCADE
);

-- Κρατήσεις με status (COMPLETED/CANCELLED/REFUNDED) και CASCADE FKs.
CREATE TABLE IF NOT EXISTS reservations (
  reservation_id INT      NOT NULL AUTO_INCREMENT,
  user_id        INT      NOT NULL,
  showtime_id    INT      NOT NULL,
  total_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status         ENUM('COMPLETED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'COMPLETED',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (reservation_id),
  CONSTRAINT fk_res_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_res_showtime
    FOREIGN KEY (showtime_id) REFERENCES showtimes (showtime_id)
    ON DELETE CASCADE
);

-- Γραμμές κράτησης με ποσότητα ανά κατηγορία καθισμάτων, CASCADE.
CREATE TABLE IF NOT EXISTS reservation_seats (
  id               INT NOT NULL AUTO_INCREMENT,
  reservation_id   INT NOT NULL,
  showtime_id      INT NOT NULL,
  seat_category_id INT NOT NULL,
  quantity         INT NOT NULL DEFAULT 1,
  seat_details     VARCHAR(255) DEFAULT NULL COMMENT 'e.g. Σειρά 4, Θέση 12',
  PRIMARY KEY (id),
  CONSTRAINT fk_rs_reservation
    FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_rs_category
    FOREIGN KEY (seat_category_id) REFERENCES seat_categories (seat_category_id)
    ON DELETE CASCADE
);

-- Αγαπημένες παραστάσεις με composite PK (user_id, show_id), CASCADE.
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id    INT      NOT NULL,
  show_id    INT      NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, show_id),
  CONSTRAINT fk_fav_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_fav_show
    FOREIGN KEY (show_id) REFERENCES shows (show_id)
    ON DELETE CASCADE
);

-- Sample data με σταθερά IDs (theatres 1-3, shows 1-5, showtimes 1-10) για dev/testing.

INSERT INTO theatres (theatre_id, name, location, description, image_url) VALUES
  (1, 'Αθηνών', 'Βουκουρεστίου 10, Κέντρο, Αθήνα', 'Τηλ. 2103312343', 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=500&q=80'),
  (2, 'Ακροπόλ', 'Ιπποκράτους 9-11, Κέντρο, Αθήνα', 'Τηλ. 2103648303', 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=500&q=80'),
  (3, 'Art 63', '3ης Σεπτεμβρίου 63, Κέντρο, Αθήνα', 'Τηλ. 2103233537', 'https://images.unsplash.com/photo-1563842188231-1521743a60a7?w=500&q=80');

INSERT INTO shows (show_id, theatre_id, title, description, duration, age_rating, image_url) VALUES
  (1, 1, '#Cancel', 'Κωμωδία. Μαύρη κωμωδία γύρω από την εξουσία, την πολιτική ορθότητα και τις συγκρούσεις στον καλλιτεχνικό χώρο.', 110, '16+', 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=500&q=80'),
  (2, 2, 'Ο αγαπητικός της βοσκοπούλας', 'Μιούζικαλ. Νέα μουσικοθεατρική προσέγγιση του κλασικού ελληνικού έργου με έμφαση στον έρωτα και την παράδοση.', 120, '12+', 'https://images.unsplash.com/photo-1600100412853-272e0a2936a2?w=500&q=80'),
  (3, 2, 'Πολύ καλύτερα τώρα...', 'Stand up comedy. Παράσταση με καθημερινά θέματα, σχέσεις, οικογένεια και σύγχρονες συνήθειες.', 90, '16+', 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=500&q=80'),
  (4, 3, 'Ο επιθεωρητής Ντρέικ και η μαύρη χήρα', 'Κωμωδία. Κωμωδία μυστηρίου με ανατροπές, σάτιρα και αστυνομική πλοκή.', 100, '12+', 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&q=80'),
  (5, 3, 'Το καταφύγιο', 'Δράμα. Σύγχρονο έργο επιστημονικής φαντασίας και ηθικών διλημμάτων γύρω από την τεχνολογία και την εικονική πραγματικότητα.', 90, '16+', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&q=80');

INSERT INTO showtimes (showtime_id, show_id, start_time, total_seats, hall) VALUES
  (1, 1, '2026-05-08 21:00:00', 180, 'Κεντρική Σκηνή'),
  (2, 1, '2026-05-09 21:00:00', 176, 'Κεντρική Σκηνή'),
  (3, 2, '2026-05-10 20:00:00', 210, 'Κεντρική Σκηνή'),
  (4, 2, '2026-05-11 20:00:00', 205, 'Κεντρική Σκηνή'),
  (5, 3, '2026-05-12 21:30:00', 198, 'Κεντρική Σκηνή'),
  (6, 3, '2026-05-13 21:30:00', 194, 'Κεντρική Σκηνή'),
  (7, 4, '2026-05-14 20:30:00', 120, 'Σκηνή Art 63'),
  (8, 4, '2026-05-15 20:30:00', 116, 'Σκηνή Art 63'),
  (9, 5, '2026-05-16 20:00:00', 108, 'Σκηνή Art 63'),
  (10, 5, '2026-05-17 20:00:00', 104, 'Σκηνή Art 63');

-- Αθροίσματα κατηγοριών = total_seats της αντίστοιχης προβολής (συμβατό με booking)
INSERT INTO seat_categories (showtime_id, category_name, price, total_seats) VALUES
  (1, 'Πάρτερ',  32.00,  95),
  (1, 'Εξώστης', 22.00,  55),
  (1, 'VIP',     52.00,  30),
  (2, 'Πάρτερ',  32.00,  93),
  (2, 'Εξώστης', 22.00,  53),
  (2, 'VIP',     52.00,  30),
  (3, 'Πάρτερ',  38.00, 110),
  (3, 'Εξώστης', 28.00,  70),
  (3, 'VIP',     62.00,  30),
  (4, 'Πάρτερ',  38.00, 105),
  (4, 'Εξώστης', 28.00,  70),
  (4, 'VIP',     62.00,  30),
  (5, 'Πάρτερ',  34.00, 100),
  (5, 'Εξώστης', 24.00,  63),
  (5, 'VIP',     58.00,  35),
  (6, 'Πάρτερ',  34.00,  95),
  (6, 'Εξώστης', 24.00,  64),
  (6, 'VIP',     58.00,  35),
  (7, 'Πάρτερ',  28.00,  65),
  (7, 'Εξώστης', 18.00,  35),
  (7, 'VIP',     48.00,  20),
  (8, 'Πάρτερ',  28.00,  61),
  (8, 'Εξώστης', 18.00,  35),
  (8, 'VIP',     48.00,  20),
  (9, 'Πάρτερ',  28.00,  58),
  (9, 'Εξώστης', 18.00,  30),
  (9, 'VIP',     48.00,  20),
  (10, 'Πάρτερ',  28.00,  54),
  (10, 'Εξώστης', 18.00,  30),
  (10, 'VIP',     48.00,  20);
