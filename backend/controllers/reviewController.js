const Review = require('../models/Review');
const Product = require('../models/Product');

async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId }).exec();
    reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createReview(req, res) {
  try {
    const { productId, rating, title, comment, bikeOwned, userName } = req.body;

    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, rating (1-5), title, and review comment are required.'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const review = await Review.create({
      productId,
      user: req.user ? req.user._id : null,
      userName: userName ? userName.trim() : (req.user ? req.user.name : 'Verified Rider'),
      bikeOwned: bikeOwned ? bikeOwned.trim() : 'Motorcycle Enthusiast',
      rating: Math.max(1, Math.min(5, Number(rating))),
      title: title.trim(),
      comment: comment.trim(),
      verifiedPurchase: true,
      helpfulCount: 0
    });

    // Recalculate product rating & review count
    const allProductReviews = await Review.find({ productId }).exec();
    const count = allProductReviews.length;
    const avgRating = count > 0
      ? Number((allProductReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
      : Number(rating);

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      reviewCount: count
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully! Thank you for helping fellow riders.',
      review
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getProductReviews,
  createReview
};
