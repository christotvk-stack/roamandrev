const { createModel } = require('./modelWrapper');

const couponSchema = {
  code: { type: String, required: true, uppercase: true, unique: true },
  description: { type: String, default: '' },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  minPurchase: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 2000 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date }
};

const Coupon = createModel('Coupon', couponSchema, 'coupons');

module.exports = Coupon;
