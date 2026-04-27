const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/reservationController');

router.post('/', authenticate, ctrl.create);
router.get('/:id', authenticate, ctrl.getById);
router.put('/:id', authenticate, ctrl.update);
router.put('/:id/cancel', authenticate, ctrl.cancel);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
