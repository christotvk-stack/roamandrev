const { createModel } = require('./modelWrapper');

const cartSchema = {
  user: { type: String, required: true },
  items: [
    {
      productId: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 }
    }
  ]
};

const Cart = createModel('Cart', cartSchema, 'carts');

module.exports = Cart;
