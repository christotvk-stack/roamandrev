const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  syncCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/', updateCartItem);
router.delete('/:productId', removeFromCart);
router.post('/sync', syncCart);

module.exports = router;
