const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  toggleCoupon
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/validate', validateCoupon);
router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id/toggle', protect, admin, toggleCoupon);

module.exports = router;
