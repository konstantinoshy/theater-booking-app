const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.get('/profile', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, ctrl.updateProfile);
router.put('/password', authenticate, ctrl.changePassword);
router.delete('/account', authenticate, ctrl.deleteAccount);
router.get('/reservations', authenticate, ctrl.getReservations);
router.get('/payments', authenticate, ctrl.getPayments);
router.put('/preferences', authenticate, ctrl.updatePreferences);
router.get('/favorites', authenticate, ctrl.getFavorites);
router.post('/favorites', authenticate, ctrl.addFavorite);
router.delete('/favorites/:showId', authenticate, ctrl.removeFavorite);

module.exports = router;
