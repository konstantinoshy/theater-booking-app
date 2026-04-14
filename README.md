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

## License
University project - All rights reserved.
