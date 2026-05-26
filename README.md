# Θέατρο - Σύστημα Κρατήσεων Παραστάσεων

## Περιγραφή
Πλήρες full-stack σύστημα κρατήσεων θεατρικών παραστάσεων, υλοποιημένο ως κατανεμημένη εφαρμογή (distributed application). Η εφαρμογή παρέχει πλήρη λειτουργικότητα από την αναζήτηση θεάτρων και παραστάσεων, μέχρι την ολοκλήρωση κρατήσεων με αυτοματοποιημένο υπολογισμό διαθέσιμων θέσεων.

## Τεχνολογικό Stack
- **Frontend**: React Native (Expo)
- **Backend**: Node.js / Express.js
- **Database**: MariaDB
- **Authentication**: JWT (JSON Web Tokens)
- **Database Driver**: mysql2 (raw SQL queries)
- **Security**: bcrypt (hashing passwords)

## Αρχιτεκτονική
Η εφαρμογή ακολουθεί client-server αρχιτεκτονική με **RESTful API** επικοινωνία. Το frontend (mobile app) αλληλεπιδρά με το backend μέσω HTTP requests. Το backend διαχειρίζεται business logic και persistence σε MariaDB, εξασφαλίζοντας scalability και separation of concerns.

```
[React Native Mobile App] <--> [REST API (Express.js)] <--> [MariaDB]
```

## Οδηγίες Εγκατάστασης

### 1. Ρύθμιση Βάσης Δεδομένων (MariaDB)
Εκτελέστε τα SQL scripts **με τη σειρά**:

```sql
-- Πρώτα: Δημιουργία ασφαλούς χρήστη εφαρμογής
source backend/database/create-app-user.sql
```

```sql
-- Δεύτερον: Δημιουργία πινάκων και sample data
source backend/database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Δημιουργήστε `.env` file:
```
DB_HOST=localhost
DB_PORT=3306              # ή 3307 αν forward port
DB_USER=theatreapp        # από create-app-user.sql
DB_PASS=12345             # από create-app-user.sql
DB_NAME=theatre_booking
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
```

Εκκίνηση:
```bash
node server.js
```

### 3. Frontend Setup
**Σημείωση**: Στο `frontend/src/config/api.js`, αντικαταστήστε την IP διεύθυνση (`192.168.1.32`) με την τοπική IP του υπολογιστή σας (π.χ. `192.168.1.5:3000`). Χρησιμοποιήστε `10.0.2.2:3000` για Android emulator.

```bash
cd frontend
npm install
npx expo start
```

Ανοίξτε Expo Go app στο κινητό σας και σκανάρετε το QR code.

## Βασικά Χαρακτηριστικά

### Αυθεντικοποίηση Χρηστών
- Register / Login με email/password
- Protected routes με JWT tokens

### Πλοήγηση & Αναζήτηση
- Λίστα θεάτρων (Αthinon, Akropol, Art63)
- Λίστα παραστάσεων με showtimes
- Λεπτομέρειες παράστασης με cast members

### Σύστημα Κρατήσεων
- Επιλογή κατηγορίας θέσεων: **Πάρτερ**, **Εξώστης**, **VIP**
- Αυτόματος υπολογισμός διαθέσιμων θέσεων
- Ολοκλήρωση κρατήσεων με ιστορικό

### Διαχείριση Συντελεστών (Cast)
- Τοπικά assets για optimal performance
- CastMemberCard component με images

### Ασφάλεια
- **bcrypt** για κρυπτογράφηση passwords
- **JWT** για authentication/authorization
- Ασφαλής database user με περιορισμένα privileges
- Input validation σε όλα τα endpoints

## API Endpoints
```
POST   /api/register                 Εγγραφή χρήστη
POST   /api/login                    Σύνδεση (επιστρέφει JWT)
POST   /api/refresh                  Ανανέωση access token
GET    /api/theatres                 Λίστα θεάτρων (?name=&location=)
GET    /api/theatres/:id             Λεπτομέρειες θεάτρου
GET    /api/shows                    Λίστα παραστάσεων (?theatreId=&title=&date=)
GET    /api/shows/:id                Λεπτομέρειες παράστασης
GET    /api/showtimes                Ημερομηνίες/ώρες (?showId=)
GET    /api/seats                    Διαθεσιμότητα θέσεων (?showtimeId=)
POST   /api/reservations             Δημιουργία κράτησης
GET    /api/reservations/:id         Λεπτομέρειες κράτησης
PUT    /api/reservations/:id         Τροποποίηση κράτησης
PUT    /api/reservations/:id/cancel  Ακύρωση κράτησης
GET    /api/user/profile             Στοιχεία χρήστη
PUT    /api/user/profile             Ενημέρωση προφίλ
PUT    /api/user/password            Αλλαγή κωδικού
DELETE /api/user/account             Διαγραφή λογαριασμού
GET    /api/user/reservations        Ιστορικό κρατήσεων χρήστη
GET    /api/user/payments            Ιστορικό πληρωμών
GET    /api/user/favorites           Αγαπημένες παραστάσεις
POST   /api/user/favorites           Προσθήκη αγαπημένης
DELETE /api/user/favorites/:showId   Αφαίρεση αγαπημένης
```
## Δομή Έργου

Ακολουθεί η δομή των αρχείων του έργου σε μορφή δέντρου (tree) με τη λειτουργία του καθενός:

```text
.
├── .gitignore — Αρχείο ρύθμισης για την εξαίρεση αρχείων/φακέλων από το Git (π.χ. node_modules, .env).
├── README.md — Το παρόν αρχείο τεκμηρίωσης του έργου.
├── backend/ — Ο διακομιστής (API & Database) της εφαρμογής.
│   ├── .env — Αρχείο ρυθμίσεων περιβάλλοντος (στοιχεία σύνδεσης βάσης, JWT secret κ.λπ. - δεν ανεβαίνει στο Git).
│   ├── .env.example — Υπόδειγμα αρχείου .env με ενδεικτικές μεταβλητές.
│   ├── package.json — Διαχείριση πακέτων, εξαρτήσεων (dependencies) και scripts εκτέλεσης του backend.
│   ├── package-lock.json — Κλειδώνει τις ακριβείς εκδόσεις των εγκατεστημένων πακέτων του backend.
│   ├── server.js — Το σημείο εισόδου (entry point) του Express backend, ρυθμίζει middlewares, routes και συνδέσεις.
│   ├── start-db-and-server.ps1 — Script PowerShell για την αυτόματη εκκίνηση της MariaDB και του backend server.
│   ├── config/ — Ρυθμίσεις παραμέτρων του συστήματος.
│   │   └── db.js — Ρύθμιση διασύνδεσης με τη βάση δεδομένων MariaDB χρησιμοποιώντας το mysql2/promise.
│   ├── controllers/ — Οι ελεγκτές (controllers) που περιέχουν τη λογική επεξεργασίας των αιτημάτων (HTTP requests).
│   │   ├── authController.js — Διαχειρίζεται τις λειτουργίες εγγραφής (register), σύνδεσης (login) και ανανέωσης token.
│   │   ├── reservationController.js — Διαχειρίζεται τη δημιουργία, τροποποίηση, ακύρωση και προβολή κρατήσεων.
│   │   ├── seatController.js — Ελέγχει τη διαθεσιμότητα των θέσεων για συγκεκριμένες ώρες παραστάσεων.
│   │   ├── showController.js — Διαχειρίζεται την ανάκτηση της λίστας παραστάσεων και των λεπτομερειών τους.
│   │   ├── showtimeController.js — Διαχειρίζεται τις ημερομηνίες και ώρες διεξαγωγής των παραστάσεων (showtimes).
│   │   ├── theatreController.js — Διαχειρίζεται την ανάκτηση των θεάτρων και των πληροφοριών τους.
│   │   └── userController.js — Διαχειρίζεται το προφίλ, την αλλαγή κωδικού και το ιστορικό του χρήστη.
│   ├── database/ — Αρχεία που αφορούν τη βάση δεδομένων.
│   │   ├── create-app-user.sql — SQL Script για τη δημιουργία χρήστη βάσης δεδομένων με περιορισμένα δικαιώματα.
│   │   ├── init-db.js — Script Node.js για την αρχικοποίηση των πινάκων της βάσης δεδομένων.
│   │   ├── migration_add_auth0_sub.sql — SQL Script μετανάστευσης της βάσης (migration) για την υποστήριξη Auth0.
│   │   └── schema.sql — SQL Script για τη δημιουργία πινάκων και την εισαγωγή δοκιμαστικών δεδομένων.
│   ├── middleware/ — Ενδιάμεσο λογισμικό (middlewares).
│   │   └── auth.js — Middleware επαλήθευσης της εγκυρότητας του JWT token (Authentication).
│   ├── routes/ — Ορισμός των διαδρομών (API routing).
│   │   ├── auth.js — Ορισμός REST endpoints για τις λειτουργίες αυθεντικοποίησης.
│   │   ├── reservations.js — Ορισμός REST endpoints για τη διαχείριση κρατήσεων.
│   │   ├── seats.js — Ορισμός REST endpoints για τον έλεγχο διαθέσιμων θέσεων.
│   │   ├── shows.js — Ορισμός REST endpoints για τις παραστάσεις.
│   │   ├── showtimes.js — Ορισμός REST endpoints για τα showtimes (ώρες/ημερομηνίες).
│   │   ├── theatres.js — Ορισμός REST endpoints για τα θέατρα.
│   │   └── user.js — Ορισμός REST endpoints για το προφίλ, τις ρυθμίσεις και το ιστορικό χρήστη.
│   ├── scripts/ — Βοηθητικά σενάρια εκτέλεσης.
│   │   └── db-ping.js — Script ελέγχου διασύνδεσης με τη βάση δεδομένων.
│   └── services/ — Υπηρεσίες (services) με το business logic της εφαρμογής.
│       ├── authService.js — Business logic για εγγραφή/σύνδεση και password hashing με bcrypt.
│       ├── reservationService.js — Business logic για κρατήσεις (υπολογισμός διαθέσιμων θέσεων, δημιουργία/ακύρωση).
│       ├── seatService.js — Business logic για τον έλεγχο διαθεσιμότητας θέσεων ανά ζώνη (VIP, Πάρτερ, Εξώστης).
│       ├── showService.js — Business logic για την ανάκτηση και φιλτράρισμα παραστάσεων.
│       ├── showtimeService.js — Business logic για την ανάκτηση των showtimes.
│       ├── theatreService.js — Business logic για τα θέατρα και τις πληροφορίες τους.
│       └── userService.js — Business logic για τη διαχείριση προφίλ, αλλαγής κωδικού και ιστορικού του χρήστη.
└── frontend/ — Η εφαρμογή κινητού τηλεφώνου (React Native / Expo).
    ├── App.js — Το κεντρικό αρχείο της εφαρμογής, ορίζει το Navigation (React Navigation) και τους Context Providers.
    ├── app.json — Αρχείο ρυθμίσεων της εφαρμογής Expo (όνομα, έκδοση, εικονίδια, splash screens).
    ├── babel.config.js — Ρυθμίσεις του Babel για τη μεταγλώττιση του κώδικα JavaScript/React Native.
    ├── package.json — Διαχείριση πακέτων, εξαρτήσεων (dependencies) και scripts εκτέλεσης του frontend.
    ├── package-lock.json — Κλειδώνει τις ακριβείς εκδόσεις των εγκατεστημένων πακέτων του frontend.
    ├── assets/ — Στατικοί πόροι της εφαρμογής (λογότυπα, εικονίδια, splash screens, εικόνες κ.λπ.).
    └── src/ — Ο πηγαίος κώδικας του frontend.
        ├── components/ — Επαναχρησιμοποιήσιμα στοιχεία διεπαφής (UI components).
        │   ├── CastMemberCard.js — UI component κάρτας για την προβολή ενός συντελεστή/ηθοποιού με την εικόνα του.
        │   └── ImagePreviewModal.js — Component modal για προβολή εικόνων σε μεγέθυνση (π.χ. θεάτρων, παραστάσεων).
        ├── config/ — Ρυθμίσεις συστήματος.
        │   ├── api.js — Ρύθμιση του Base URL για το API και βοηθητικές συναρτήσεις επικοινωνίας με το backend.
        │   └── auth0.js — Ρυθμίσεις για την ενσωμάτωση του Auth0 authentication (εάν επιλεγεί).
        ├── context/ — Διαχείριση καθολικής κατάστασης (Global State Management).
        │   ├── AuthContext.js — Context Provider για τη διαχείριση της κατάστασης σύνδεσης του χρήστη και αποθήκευσης του JWT token.
        │   ├── FavoritesContext.js — Context Provider για τη διαχείριση των αγαπημένων παραστάσεων του χρήστη.
        │   └── NotificationContext.js — Context Provider για τη διαχείριση και λήψη push notifications.
        ├── Data/ — Στατικά/Τοπικά δεδομένα.
        │   └── localContributors.js — Τοπικά δεδομένα συντελεστών για χρήση ως fallback.
        ├── screens/ — Οι οθόνες της εφαρμογής (application screens).
        │   ├── BookingScreen.js — Οθόνη επιλογής ζώνης θέσεων (Πάρτερ, Εξώστης, VIP) και επιβεβαίωσης της κράτησης.
        │   ├── FavoritesScreen.js — Οθόνη εμφάνισης των αγαπημένων παραστάσεων που έχει αποθηκεύσει ο χρήστης.
        │   ├── FullHistoryScreen.js — Οθόνη εμφάνισης του αναλυτικού ιστορικού κρατήσεων του χρήστη.
        │   ├── HomeScreen.js — Η αρχική οθόνη της εφαρμογής με προτεινόμενα θέατρα και παραστάσεις.
        │   ├── LoginScreen.js — Οθόνη εισαγωγής στοιχείων (email, κωδικός) για τη σύνδεση του χρήστη.
        │   ├── PaymentHistoryScreen.js — Οθόνη εμφάνισης του ιστορικού πληρωμών για τις κρατήσεις του χρήστη.
        │   ├── ProfileScreen.js — Οθόνη προφίλ του χρήστη με επιλογές πλοήγησης στο ιστορικό, τις ρυθμίσεις και αποσύνδεση.
        │   ├── ProfileSettingsScreen.js — Οθόνη επεξεργασίας των στοιχείων προφίλ (email, όνομα) και αλλαγής κωδικού.
        │   ├── RegisterScreen.js — Οθόνη εγγραφής νέου χρήστη.
        │   ├── ShowDetailScreen.js — Οθόνη λεπτομερειών μιας παράστασης με πληροφορίες, συντελεστές και showtimes.
        │   ├── ShowsScreen.js — Οθόνη εμφάνισης των παραστάσεων με δυνατότητα αναζήτησης και φιλτραρίσματος.
        │   ├── TheatresScreen.js — Οθόνη εμφάνισης της λίστας όλων των θεάτρων με δυνατότητα αναζήτησης.
        │   └── TicketScreen.js — Οθόνη εμφάνισης του ψηφιακού εισιτηρίου μιας ολοκληρωμένης κράτησης.
        ├── theme/ — Στυλ και θέματα της εφαρμογής.
        │   └── colors.js — Ορισμός της χρωματικής παλέτας της εφαρμογής για ομοιομορφία στο UI.
        └── utils/ — Βοηθητικές συναρτήσεις (utility functions).
            ├── descriptionForDisplay.js — Βοηθητική συνάρτηση για τη μορφοποίηση και προβολή των περιγραφών.
            ├── localCastImageMap.js — Αντιστοίχιση των ονομάτων των ηθοποιών με τα τοπικά αρχεία εικόνων τους.
            ├── localImageMap.js — Αντιστοίχιση των θεάτρων και των παραστάσεων με τα τοπικά αρχεία εικόνων τους.
            └── notifications.js — Βοηθητικές συναρτήσεις για τη ρύθμιση και αποστολή push notifications.
```


## License
University project - All rights reserved.
