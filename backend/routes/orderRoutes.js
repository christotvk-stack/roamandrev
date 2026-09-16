const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', optionalAuth, getOrderById);
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
