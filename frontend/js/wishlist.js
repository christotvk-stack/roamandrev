/**
 * ROAM & REV - WISHLIST STATE MANAGER
 */

const Wishlist = {
  items: [],

  init() {
    try {
      this.items = JSON.parse(localStorage.getItem('roam_rev_wishlist') || '[]');
    } catch (e) {
      this.items = [];
    }
    this.updateCounters();
  },

  save() {
    localStorage.setItem('roam_rev_wishlist', JSON.stringify(this.items));
    this.updateCounters();
    window.dispatchEvent(new CustomEvent('wishlist:change', { detail: this.items }));
  },

  isWishlisted(productId) {
    return this.items.some(i => (i._id || i.id || i.productId) === productId);
  },

  toggle(product) {
    const pId = product._id || product.id;
    const exists = this.isWishlisted(pId);

    if (exists) {
      this.items = this.items.filter(i => (i._id || i.id || i.productId) !== pId);
      if (window.Toast) {
        window.Toast.show('Removed from Wishlist', `${product.name} removed.`, 'info');
      }
    } else {
      this.items.push({
        _id: pId,
        productId: pId,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        image: product.images && product.images[0] ? product.images[0] : '',
        stock: product.stock,
        bikeCompatibility: product.bikeCompatibility,
        category: product.category,
        rating: product.rating
      });
      if (window.Toast) {
        window.Toast.show('Saved to Wishlist', `${product.name} added to your wishlist.`, 'success');
      }
    }

    this.save();
    return !exists;
  },

  remove(productId) {
    this.items = this.items.filter(i => (i._id || i.id || i.productId) !== productId);
    this.save();
    if (window.Toast) {
      window.Toast.show('Removed from Wishlist', 'Item removed from your saved list.', 'info');
    }
  },

  updateCounters() {
    const count = this.items.length;
    const elements = document.querySelectorAll('.wishlist-badge-count');
    elements.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

window.Wishlist = Wishlist;
document.addEventListener('DOMContentLoaded', () => Wishlist.init());
