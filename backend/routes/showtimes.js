const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/showtimeController');

router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.getById);

module.exports = router;
