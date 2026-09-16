const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');

function generateOrderNumber() {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `RR-2026-${rand}`;
}

function generateTrackingNumber() {
  const rand = Math.floor(1000000 + Math.random() * 9000000);
  return `BLUEDART-${rand}`;
}

async function createOrder(req, res) {
  try {
    const {
      customer,
      items,
      shippingAddress,
      deliveryMethod,
      payment,
      couponCode
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Cannot place order.' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.postalCode) {
      return res.status(400).json({ success: false, message: 'Please provide complete shipping address details.' });
    }

    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.name || item.productId} not found.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const itemSubtotal = product.price * item.quantity;
      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images && product.images[0] ? product.images[0] : '',
        quantity: item.quantity,
        subtotal: itemSubtotal
      });

      // Reduce product stock
      await Product.findByIdAndUpdate(product._id, {
        stock: Math.max(0, product.stock - item.quantity)
      });
    }

    // Handle coupon discount
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && calculatedSubtotal >= (coupon.minPurchase || 0)) {
        if (coupon.discountType === 'percentage') {
          discount = Math.round((calculatedSubtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
      }
    }

    const shippingFee = deliveryMethod && deliveryMethod.type === 'express' ? 150 : (calculatedSubtotal > 999 ? 0 : 99);
    const total = Math.max(0, calculatedSubtotal - discount + shippingFee);

    const orderNumber = generateOrderNumber();
    const trackingNumber = generateTrackingNumber();

    const newOrder = await Order.create({
      orderNumber,
      user: req.user ? req.user._id : null,
      customer: {
        name: customer ? customer.name : (req.user ? req.user.name : shippingAddress.fullName),
        email: customer ? customer.email : (req.user ? req.user.email : 'guest@roamrev.com'),
        phone: customer ? customer.phone : (req.user ? req.user.phone : shippingAddress.phone)
      },
      items: validatedItems,
      shippingAddress,
      deliveryMethod: deliveryMethod || {
        type: 'standard',
        title: 'Standard Express (3-5 Days)',
        cost: shippingFee,
        estimatedDays: '3-5 business days'
      },
      payment: {
        method: payment ? payment.method : 'upi',
        status: payment && payment.method === 'cod' ? 'pending' : 'paid',
        transactionId: payment && payment.transactionId ? payment.transactionId : `MOCK-TXN-${Date.now()}`,
        paidAt: payment && payment.method === 'cod' ? null : new Date()
      },
      pricing: {
        subtotal: calculatedSubtotal,
        discount,
        couponCode: couponCode || '',
        shippingFee,
        tax: 0,
        total
      },
      orderStatus: 'Confirmed',
      trackingNumber,
      statusHistory: [
        {
          status: 'Confirmed',
          timestamp: new Date(),
          note: 'Order confirmed & payment verified. Pack slip queued for dispatch.'
        },
        {
          status: 'Processing',
          timestamp: new Date(),
          note: 'Inventory reserved at Overland Distribution Hub.'
        }
      ]
    });

    // Clear user cart if logged in
    if (req.user) {
      await Cart.deleteOne({ user: req.user._id });
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: newOrder
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getMyOrders(req, res) {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    const allOrders = await Order.find({}).exec();
    const myOrders = allOrders
      .filter(o => o.user === userId || (o.customer && o.customer.email === userEmail))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.json({
      success: true,
      count: myOrders.length,
      orders: myOrders
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    let order = await Order.findById(id);

    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // If user is not admin and not the owner of this order, block access
    if (req.user && req.user.role !== 'admin' && order.user && order.user !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order.' });
    }

    return res.json({
      success: true,
      order
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getAllOrders(req, res) {
  try {
    const { status } = req.query;
    let allOrders = await Order.find({}).exec();

    if (status && status !== 'all') {
      allOrders = allOrders.filter(o => o.orderStatus.toLowerCase() === status.toLowerCase());
    }

    allOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.json({
      success: true,
      count: allOrders.length,
      orders: allOrders
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const validStatuses = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const history = order.statusHistory || [];
    history.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status} by fulfillment team.`
    });

    const updated = await Order.findByIdAndUpdate(id, {
      orderStatus: status,
      statusHistory: history
    });

    return res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
