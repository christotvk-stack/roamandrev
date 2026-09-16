const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview
} = require('../controllers/reviewController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/:productId', getProductReviews);
router.post('/', optionalAuth, createReview);

module.exports = router;
