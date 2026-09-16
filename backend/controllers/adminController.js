const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');

async function getDashboardStats(req, res) {
  try {
    const orders = await Order.find({}).exec();
    const products = await Product.find({}).exec();
    const users = await User.find({}).exec();
    const reviews = await Review.find({}).exec();

    const totalSales = orders
      .filter(o => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + (o.pricing ? o.pricing.total : 0), 0);

    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalCustomers = users.filter(u => u.role !== 'admin').length;

    const lowStockProducts = products
      .filter(p => (p.stock || 0) <= 20)
      .sort((a, b) => (a.stock || 0) - (b.stock || 0));

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8);

    // Sales breakdown by category
    const salesByCategory = {};
    orders.forEach(order => {
      if (order.orderStatus !== 'Cancelled' && order.items) {
        order.items.forEach(item => {
          const prod = products.find(p => p._id === item.productId);
          const cat = prod ? prod.category : 'General';
          salesByCategory[cat] = (salesByCategory[cat] || 0) + item.subtotal;
        });
      }
    });

    return res.json({
      success: true,
      stats: {
        totalSales,
        totalOrders,
        totalProducts,
        totalCustomers,
        totalReviews: reviews.length,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders,
        salesByCategory
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getCoupons(req, res) {
  try {
    const coupons = await Coupon.find({}).exec();
    return res.json({ success: true, coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createCoupon(req, res) {
  try {
    const { code, description, discountType, discountValue, minPurchase, maxDiscount, isActive } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required.' });
    }

    const codeUpper = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: codeUpper });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon with this code already exists.' });
    }

    const newCoupon = await Coupon.create({
      code: codeUpper,
      description: description || '',
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minPurchase: Number(minPurchase) || 0,
      maxDiscount: Number(maxDiscount) || 2000,
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      message: `Coupon ${codeUpper} created successfully.`,
      coupon: newCoupon
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function toggleCoupon(req, res) {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    const updated = await Coupon.findByIdAndUpdate(id, { isActive: !coupon.isActive });
    return res.json({
      success: true,
      message: `Coupon ${coupon.code} is now ${updated.isActive ? 'Active' : 'Inactive'}.`,
      coupon: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function validateCoupon(req, res) {
  try {
    const { code, orderAmount = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const amount = Number(orderAmount);
    if (amount < (coupon.minPurchase || 0)) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum purchase of ₹${coupon.minPurchase.toLocaleString('en-IN')}.`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((amount * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    return res.json({
      success: true,
      message: `Coupon ${coupon.code} applied! You saved ₹${discount.toLocaleString('en-IN')}.`,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDashboardStats,
  getCoupons,
  createCoupon,
  toggleCoupon,
  validateCoupon
};
