const { createModel } = require('./modelWrapper');

const orderSchema = {
  orderNumber: { type: String, required: true, unique: true },
  user: { type: String, default: null },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  items: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      image: { type: String },
      quantity: { type: Number, required: true, default: 1 },
      subtotal: { type: Number, required: true }
    }
  ],
  shippingAddress: {
    fullName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String, required: true },
    landmark: { type: String, default: '' }
  },
  deliveryMethod: {
    type: { type: String, default: 'standard' },
    title: { type: String, default: 'Standard Express (3-5 Days)' },
    cost: { type: Number, default: 0 },
    estimatedDays: { type: String, default: '3-5 business days' }
  },
  payment: {
    method: { type: String, enum: ['upi', 'card', 'cod'], default: 'upi' },
    status: { type: String, enum: ['paid', 'pending', 'failed'], default: 'pending' },
    transactionId: { type: String, default: '' },
    paidAt: { type: Date }
  },
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  orderStatus: {
    type: String,
    enum: ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Processing'
  },
  trackingNumber: { type: String, default: '' },
  statusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String
    }
  ]
};

const Order = createModel('Order', orderSchema, 'orders');

module.exports = Order;
