/**
 * ROAM & REV - SHOPPING CART STATE & PERSISTENCE
 */

const Cart = {
  items: [],
  appliedCoupon: null,

  async init() {
    this.appliedCoupon = JSON.parse(localStorage.getItem('roam_rev_coupon') || 'null');

    if (window.Auth && window.Auth.isLoggedIn()) {
      try {
        const res = await API.getCart();
        if (res.success && res.cart) {
          this.items = res.cart.items || [];
        }
      } catch (err) {
        this.loadGuestCart();
      }
    } else {
      this.loadGuestCart();
    }

    this.updateCounters();
    window.dispatchEvent(new CustomEvent('cart:change', { detail: this.items }));
  },

  loadGuestCart() {
    try {
      this.items = JSON.parse(localStorage.getItem('roam_rev_guest_cart') || '[]');
    } catch (e) {
      this.items = [];
    }
  },

  saveGuestCart() {
    localStorage.setItem('roam_rev_guest_cart', JSON.stringify(this.items));
  },

  async syncGuestCartToServer() {
    const guestItems = JSON.parse(localStorage.getItem('roam_rev_guest_cart') || '[]');
    if (guestItems.length > 0) {
      try {
        const res = await API.syncCart(guestItems.map(i => ({ productId: i.productId, quantity: i.quantity })));
        if (res.success && res.cart) {
          this.items = res.cart.items || [];
          localStorage.removeItem('roam_rev_guest_cart');
        }
      } catch (err) {
        console.warn('[Cart Sync Failed]', err);
      }
    } else {
      const res = await API.getCart();
      if (res.success && res.cart) {
        this.items = res.cart.items || [];
      }
    }
    this.updateCounters();
  },

  getItemCount() {
    return this.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
  },

  async addItem(product, quantity = 1) {
    const q = Number(quantity) || 1;

    if (window.Auth && window.Auth.isLoggedIn()) {
      try {
        const res = await API.addToCart(product._id || product.id, q);
        if (res.success && res.cart) {
          this.items = res.cart.items || [];
        }
      } catch (err) {
        console.error('Server cart error:', err);
      }
    } else {
      const pId = product._id || product.id;
      const idx = this.items.findIndex(i => i.productId === pId);
      const activeImg = product.images && product.images[0] ? product.images[0] : (product.image || '');
      if (idx > -1) {
        this.items[idx].quantity += q;
        if (activeImg) {
          this.items[idx].image = activeImg;
        }
      } else {
        this.items.push({
          productId: pId,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          discountPercent: product.discountPercent,
          image: product.images && product.images[0] ? product.images[0] : '',
          stock: product.stock,
          bikeCompatibility: product.bikeCompatibility,
          quantity: q,
          subtotal: product.price * q
        });
      }
      this.saveGuestCart();
    }

    this.updateCounters();
    window.dispatchEvent(new CustomEvent('cart:change', { detail: this.items }));

    if (window.Toast) {
      window.Toast.show(
        'Added to Cart',
        `${product.name} (Qty: ${q}) added to your expedition cart.`,
        'success'
      );
    }
  },

  async updateQuantity(productId, quantity) {
    const q = Number(quantity);

    if (window.Auth && window.Auth.isLoggedIn()) {
      try {
        const res = await API.updateCartItem(productId, q);
        if (res.success && res.cart) {
          this.items = res.cart.items || [];
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (q <= 0) {
        this.items = this.items.filter(i => i.productId !== productId);
      } else {
        const item = this.items.find(i => i.productId === productId);
        if (item) {
          item.quantity = q;
          item.subtotal = item.price * q;
        }
      }
      this.saveGuestCart();
    }

    this.updateCounters();
    window.dispatchEvent(new CustomEvent('cart:change', { detail: this.items }));
  },

  async removeItem(productId) {
    if (window.Auth && window.Auth.isLoggedIn()) {
      try {
        const res = await API.removeFromCart(productId);
        if (res.success && res.cart) {
          this.items = res.cart.items || [];
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      this.items = this.items.filter(i => i.productId !== productId);
      this.saveGuestCart();
    }

    this.updateCounters();
    window.dispatchEvent(new CustomEvent('cart:change', { detail: this.items }));

    if (window.Toast) {
      window.Toast.show('Item Removed', 'Product removed from your cart.', 'info');
    }
  },

  clearCart() {
    this.items = [];
    this.appliedCoupon = null;
    localStorage.removeItem('roam_rev_guest_cart');
    localStorage.removeItem('roam_rev_coupon');
    this.updateCounters();
    window.dispatchEvent(new CustomEvent('cart:change', { detail: this.items }));
  },

  async applyCoupon(code) {
    const subtotal = this.getSubtotal();
    const res = await API.validateCoupon(code, subtotal);
    if (res.success && res.coupon) {
      this.appliedCoupon = res.coupon;
      localStorage.setItem('roam_rev_coupon', JSON.stringify(res.coupon));
      window.dispatchEvent(new CustomEvent('cart:change', { detail: this.items }));
      return res;
    }
    return res;
  },

  removeCoupon() {
    this.appliedCoupon = null;
    localStorage.removeItem('roam_rev_coupon');
    window.dispatchEvent(new CustomEvent('cart:change', { detail: this.items }));
  },

  updateCounters() {
    const count = this.getItemCount();
    const elements = document.querySelectorAll('.cart-badge-count');
    elements.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

window.Cart = Cart;
document.addEventListener('DOMContentLoaded', () => Cart.init());
