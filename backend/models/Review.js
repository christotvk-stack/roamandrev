const { createModel } = require('./modelWrapper');

const reviewSchema = {
  productId: { type: String, required: true },
  user: { type: String, default: null },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  bikeOwned: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  comment: { type: String, required: true },
  verifiedPurchase: { type: Boolean, default: true },
  helpfulCount: { type: Number, default: 0 }
};

const Review = createModel('Review', reviewSchema, 'reviews');

module.exports = Review;
