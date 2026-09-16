const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getPopulatedCart(cart) {
  if (!cart || !cart.items || cart.items.length === 0) {
    return { items: [], subtotal: 0, totalItems: 0 };
  }

  const populatedItems = [];
  let subtotal = 0;
  let totalItems = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.productId);
    if (product) {
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      totalItems += item.quantity;
      populatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        image: product.images && product.images[0] ? product.images[0] : '',
        stock: product.stock,
        bikeCompatibility: product.bikeCompatibility,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }
  }

  return {
    items: populatedItems,
    subtotal,
    totalItems
  };
}

async function getCart(req, res) {
  try {
    const userId = req.user._id;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const populated = await getPopulatedCart(cart);
    return res.json({ success: true, cart: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function addToCart(req, res) {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(i => i.productId === productId);
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({ productId, quantity: Number(quantity) });
    }

    await Cart.findByIdAndUpdate(cart._id, { items: cart.items });
    const populated = await getPopulatedCart(cart);

    return res.json({
      success: true,
      message: `Added ${product.name} to cart.`,
      cart: populated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function updateCartItem(req, res) {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    const q = Number(quantity);
    if (q <= 0) {
      cart.items = cart.items.filter(i => i.productId !== productId);
    } else {
      const idx = cart.items.findIndex(i => i.productId === productId);
      if (idx > -1) {
        cart.items[idx].quantity = q;
      }
    }

    await Cart.findByIdAndUpdate(cart._id, { items: cart.items });
    const populated = await getPopulatedCart(cart);

    return res.json({ success: true, cart: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function removeFromCart(req, res) {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    cart.items = cart.items.filter(i => i.productId !== productId);
    await Cart.findByIdAndUpdate(cart._id, { items: cart.items });
    const populated = await getPopulatedCart(cart);

    return res.json({
      success: true,
      message: 'Item removed from cart.',
      cart: populated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function syncCart(req, res) {
  try {
    const userId = req.user._id;
    const { items = [] } = req.body;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    for (const incoming of items) {
      const idx = cart.items.findIndex(i => i.productId === incoming.productId);
      if (idx > -1) {
        cart.items[idx].quantity = Math.max(cart.items[idx].quantity, Number(incoming.quantity));
      } else {
        cart.items.push({ productId: incoming.productId, quantity: Number(incoming.quantity) });
      }
    }

    await Cart.findByIdAndUpdate(cart._id, { items: cart.items });
    const populated = await getPopulatedCart(cart);

    return res.json({ success: true, cart: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  syncCart
};
