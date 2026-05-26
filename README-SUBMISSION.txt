CN6035 - Mobile & Distributed Systems
Σύστημα Κρατήσεων Θεατρικών Παραστάσεων
================================================================================

ΠΑΡΑΔΟΤΕΑ
---------
1. Κώδικας (GitHub):
   https://github.com/konstantinoshy/theater-booking-app

2. Παρουσίαση PowerPoint:
   CN6035-2678420.pptx

ΟΔΗΓΙΕΣ ΕΓΚΑΤΑΣΤΑΣΗΣ (σύντομα)
-------------------------------
Βλ. README.md στο root του repository.

1. MariaDB: εκτέλεση create-app-user.sql και schema.sql
2. Backend: cd backend → npm install → ρύθμιση .env → node server.js
3. Frontend: cd frontend → npm install → ρύθμιση IP στο src/config/api.js → npx expo start

ΤΕΧΝΟΛΟΓΙΕΣ
------------
- Frontend: React Native (Expo)
- Backend: Node.js / Express.js
- Database: MariaDB
- Authentication: JWT + Auth0 (OAuth 2.1 / PKCE)
