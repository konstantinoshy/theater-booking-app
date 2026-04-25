const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/seatController');

router.get('/', authenticate, ctrl.list);

module.exports = router;
