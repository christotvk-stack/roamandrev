/**
 * ROAM & REV - GLOBAL UI HELPERS, TOASTS, QUICKVIEW & NAVIGATION
 */

const UI = {
  formatINR(num) {
    if (num === null || num === undefined) return '₹0';
    return `₹${Number(num).toLocaleString('en-IN')}`;
  },

  renderStars(rating = 4.8) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '<div class="stars">';
    for (let i = 0; i < fullStars; i++) {
      html += '★';
    }
    if (hasHalf) {
      html += '★';
    }
    const emptyCount = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyCount; i++) {
      html += '<span style="opacity:0.3">★</span>';
    }
    html += '</div>';
    return html;
  },

  renderCompatibilityBadge(compatibility = []) {
    if (!compatibility || compatibility.length === 0) return '';
    if (compatibility.includes('MT-15')) {
      return `<span class="compat-pill compat-pill-mt15">✓ MT-15 Fit</span>`;
    }
    if (compatibility.includes('NS200')) {
      return `<span class="compat-pill compat-pill-ns200">✓ NS200 Fit</span>`;
    }
    return `<span class="compat-pill compat-pill-universal">Universal Fit</span>`;
  },

  renderProductCard(product) {
    const isWishlisted = window.Wishlist && window.Wishlist.isWishlisted(product._id || product.id);
    const thumb = (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80';
    const compatBadge = this.renderCompatibilityBadge(product.bikeCompatibility);
    const discountBadge = product.discountPercent > 0
      ? `<span class="badge-discount">-${product.discountPercent}%</span>`
      : '';
    const newBadge = product.isNewArrival
      ? `<span class="badge-new">NEW</span>`
      : '';

    return `
      <div class="product-card" data-product-id="${product._id || product.id}">
        <div class="product-thumb-box">
          <div class="card-badges">
            ${discountBadge}
            ${newBadge}
          </div>
          <div class="card-actions">
            <button class="btn-wishlist ${isWishlisted ? 'active' : ''}" onclick="UI.handleWishlistToggle(event, '${product._id || product.id}')" title="Save to Wishlist">
              ♥
            </button>
          </div>
          <a href="/product.html?id=${product._id || product.slug || product.id}">
            <img src="${thumb}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80';" />
          </a>
          <button class="quickview-btn" onclick="UI.openQuickView('${product._id || product.id}')">
            Quick View
          </button>
        </div>
        <div class="product-details">
          <div class="product-compat">
            ${compatBadge}
          </div>
          <h4 class="product-title">
            <a href="/product.html?id=${product._id || product.slug || product.id}">
              ${product.name}
            </a>
          </h4>
          <div class="product-rating">
            ${this.renderStars(product.rating)}
            <span class="rating-count">(${product.reviewCount || 0})</span>
          </div>
          <div class="product-pricing">
            <span class="current-price">${this.formatINR(product.price)}</span>
            ${product.originalPrice > product.price ? `<span class="original-price">${this.formatINR(product.originalPrice)}</span>` : ''}
          </div>
          <div class="card-cta-row">
            <button class="btn-add-cart" onclick="UI.handleAddToCart(event, '${product._id || product.id}')">
              <span>+</span> Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async handleAddToCart(e, productId) {
    if (e) e.stopPropagation();
    try {
      const res = await API.getProductById(productId);
      if (res.success && res.product) {
        await window.Cart.addItem(res.product, 1);
        this.openCartDrawer();
      }
    } catch (err) {
      window.Toast.show('Error', 'Failed to add item to cart', 'error');
    }
  },

  /* Cart Drawer Functions */
  openCartDrawer() {
    let overlay = document.getElementById('cart-drawer-overlay');
    let drawer = document.getElementById('cart-drawer');
    if (!overlay || !drawer) {
      this.injectCartDrawer();
      overlay = document.getElementById('cart-drawer-overlay');
      drawer = document.getElementById('cart-drawer');
    }
    this.renderCartDrawer();
    overlay.classList.add('active');
    drawer.classList.add('active');
  },

  closeCartDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay) overlay.classList.remove('active');
    if (drawer) drawer.classList.remove('active');
  },

  injectCartDrawer() {
    if (document.getElementById('cart-drawer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'cart-drawer-overlay';
    overlay.className = 'cart-drawer-overlay';
    overlay.onclick = () => this.closeCartDrawer();

    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.className = 'cart-drawer';
    drawer.innerHTML = `
      <div class="cart-drawer-header">
        <h3><span>🛒</span> Expedition Cart</h3>
        <button class="cart-drawer-close" onclick="UI.closeCartDrawer()">✕</button>
      </div>
      <div class="cart-drawer-body" id="cart-drawer-body"></div>
      <div class="cart-drawer-footer" id="cart-drawer-footer"></div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  },

  renderCartDrawer() {
    this.injectCartDrawer();
    const body = document.getElementById('cart-drawer-body');
    const footer = document.getElementById('cart-drawer-footer');
    if (!body || !footer) return;

    const items = (window.Cart && window.Cart.items) || [];
    const subtotal = window.Cart.getSubtotal();

    if (items.length === 0) {
      body.innerHTML = `
        <div style="text-align:center; padding:40px 10px; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:8px;">🛒</div>
          <p>Your cart is empty.</p>
          <a href="/shop.html" class="btn btn-secondary btn-sm" style="margin-top:12px;" onclick="UI.closeCartDrawer()">Browse Gear</a>
        </div>
      `;
      footer.innerHTML = '';
      return;
    }

    body.innerHTML = items.map(item => `
      <div class="cart-drawer-item">
        <img src="${item.image || ''}" class="cart-drawer-thumb" alt="${item.name}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1571188654248-7a89213915f7?auto=format&fit=crop&w=400&q=80';">
        <div class="cart-drawer-item-info">
          <div class="cart-drawer-item-title">${item.name}</div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:4px;">
            <div class="cart-drawer-item-price">${UI.formatINR(item.price)}</div>
            <div class="quantity-stepper" style="height:28px;">
              <button class="qty-btn" style="width:28px; height:28px; font-size:0.9rem;" onclick="window.Cart.updateQuantity('${item.productId}', ${item.quantity - 1})">-</button>
              <span style="font-family:var(--font-tech); font-weight:700; padding:0 8px; font-size:0.85rem;">${item.quantity}</span>
              <button class="qty-btn" style="width:28px; height:28px; font-size:0.9rem;" onclick="window.Cart.updateQuantity('${item.productId}', ${item.quantity + 1})">+</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    const freeShippingRemaining = Math.max(0, 999 - subtotal);

    footer.innerHTML = `
      <div style="font-size:0.75rem; color:var(--text-secondary); background:var(--bg-tertiary); padding:8px 12px; border-radius:6px;">
        ${freeShippingRemaining === 0 ? '🎉 <strong>FREE Air Express Delivery</strong> Unlocked!' : `Add <strong>${UI.formatINR(freeShippingRemaining)}</strong> more for <strong>FREE Delivery</strong>`}
      </div>
      <div class="cart-drawer-subtotal-row">
        <span>Cart Subtotal:</span>
        <span class="cart-drawer-subtotal-val">${UI.formatINR(subtotal)}</span>
      </div>
      <div style="display:flex; gap:10px;">
        <a href="/cart.html" class="btn btn-secondary" style="flex:1;" onclick="UI.closeCartDrawer()">View Cart</a>
        <a href="/checkout.html" class="btn btn-primary" style="flex:2;" onclick="UI.closeCartDrawer()">Checkout ⚡</a>
      </div>
    `;
  },

  checkDeliveryPin(pincode) {
    const statusEl = document.getElementById('pincode-status-msg');
    if (!statusEl) return;

    if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--accent-red)';
      statusEl.textContent = 'Please enter a valid 6-digit Indian PIN code.';
      return;
    }

    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--accent-green)';
    statusEl.innerHTML = `⚡ <strong>Express Dispatch to ${pincode}</strong>: Expected Delivery by Tomorrow 2:00 PM via BlueDart Air Cargo.`;
  },

  async handleWishlistToggle(e, productId) {
    if (e) e.stopPropagation();
    try {
      const res = await API.getProductById(productId);
      if (res.success && res.product) {
        const added = window.Wishlist.toggle(res.product);
        const btn = e.currentTarget;
        if (btn) {
          btn.classList.toggle('active', added);
        }
      }
    } catch (err) {
      console.error(err);
    }
  },

  async openQuickView(productId) {
    try {
      const res = await API.getProductById(productId);
      if (!res.success || !res.product) return;

      const p = res.product;
      const modal = document.getElementById('quickview-modal');
      const container = document.getElementById('quickview-content');

      if (!modal || !container) return;

      const thumb = (p.images && p.images[0]) || '';
      const specs = p.specifications || {};

      container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px;">
          <div>
            <img src="${thumb}" alt="${p.name}" style="width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:12px;" />
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>${UI.renderCompatibilityBadge(p.bikeCompatibility)}</div>
            <h3 style="font-size:1.3rem;">${p.name}</h3>
            <div style="display:flex; align-items:center; gap:8px;">
              ${UI.renderStars(p.rating)}
              <span style="font-size:0.85rem; color:var(--text-muted);">(${p.reviewCount} reviews)</span>
            </div>
            <div style="display:flex; align-items:baseline; gap:10px; margin: 8px 0;">
              <span style="font-size:1.6rem; font-weight:800; font-family:var(--font-tech);">${UI.formatINR(p.price)}</span>
              ${p.originalPrice > p.price ? `<span style="text-decoration:line-through; color:var(--text-muted); font-size:1rem;">${UI.formatINR(p.originalPrice)}</span>` : ''}
              <span class="badge-tag badge-tag-orange">SAVE ${p.discountPercent}%</span>
            </div>
            <p style="font-size:0.9rem; color:var(--text-secondary);">${p.description}</p>
            <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px; font-size:0.85rem;">
              <div><strong>Material:</strong> ${specs.material || 'Heavy-Duty'}</div>
              <div><strong>Warranty:</strong> ${specs.warranty || '1 Year'}</div>
            </div>
            <div style="margin-top:auto; display:flex; gap:12px; padding-top:16px;">
              <button class="btn btn-primary btn-block" onclick="UI.handleAddToCart(event, '${p._id}'); UI.closeQuickView();">
                Add to Cart
              </button>
              <a href="/product.html?id=${p._id || p.slug}" class="btn btn-secondary" style="white-space:nowrap;">
                Full Details
              </a>
            </div>
          </div>
        </div>
      `;

      modal.classList.add('active');
    } catch (err) {
      console.error(err);
    }
  },

  closeQuickView() {
    const modal = document.getElementById('quickview-modal');
    if (modal) modal.classList.remove('active');
  },

  initGlobalUI() {
    // Header Sticky Scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      });
    }

    // Account Dropdown Setup
    this.setupAccountMenu();

    // Live Search Setup
    this.setupLiveSearch();

    // Mobile Navigation Setup
    this.setupMobileNav();

    // Listen to Auth Changes
    window.addEventListener('auth:change', () => this.setupAccountMenu());
  },

  setupAccountMenu() {
    const trigger = document.getElementById('account-menu-trigger');
    const menu = document.getElementById('account-dropdown');
    if (!trigger || !menu) return;

    const user = window.Auth ? window.Auth.getUser() : null;

    if (user) {
      menu.innerHTML = `
        <div class="account-menu-header">
          <div class="account-menu-name">${user.name}</div>
          <div class="account-menu-email">${user.email}</div>
        </div>
        <a href="/profile.html" class="account-menu-item">My Profile</a>
        <a href="/orders.html" class="account-menu-item">Track Orders</a>
        <a href="/wishlist.html" class="account-menu-item">Saved Wishlist</a>
        ${user.role === 'admin' ? '<a href="/admin.html" class="account-menu-item" style="color:var(--accent-orange); font-weight:700;">★ Admin Dashboard</a>' : ''}
        <div class="account-menu-divider"></div>
        <a href="#" class="account-menu-item" onclick="window.Auth.logout(); return false;" style="color:var(--accent-red);">Logout</a>
      `;
    } else {
      menu.innerHTML = `
        <div class="account-menu-header">
          <div class="account-menu-name">Welcome, Rider!</div>
          <div class="account-menu-email">Sign in to track orders</div>
        </div>
        <a href="/login.html" class="account-menu-item">Sign In</a>
        <a href="/register.html" class="account-menu-item">Create Account</a>
        <div class="account-menu-divider"></div>
        <a href="/login.html" class="account-menu-item" style="color:var(--accent-orange);">Admin Portal Login</a>
      `;
    }

    trigger.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
    };

    document.addEventListener('click', () => {
      menu.classList.remove('active');
    });
  },

  setupLiveSearch() {
    const input = document.getElementById('global-search-input');
    const dropdown = document.getElementById('global-search-suggestions');
    if (!input || !dropdown) return;

    let debounceTimer;

    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value.trim();

      if (!val) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await API.getProducts({ q: val, limit: 5 });
          if (res.success && res.products && res.products.length > 0) {
            dropdown.innerHTML = res.products.map(p => `
              <a href="/product.html?id=${p._id || p.slug}" class="search-suggestion-item">
                <img src="${(p.images && p.images[0]) || ''}" class="search-thumb" alt="${p.name}">
                <div class="search-info">
                  <div class="search-title">${p.name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${UI.renderCompatibilityBadge(p.bikeCompatibility)}</div>
                  <div class="search-price">${UI.formatINR(p.price)}</div>
                </div>
              </a>
            `).join('') + `
              <a href="/shop.html?search=${encodeURIComponent(val)}" style="display:block; padding:10px; text-align:center; font-size:0.8rem; font-weight:700; color:var(--accent-orange); background:var(--bg-tertiary);">
                View all results for "${val}" →
              </a>
            `;
            dropdown.classList.add('active');
          } else {
            dropdown.innerHTML = `
              <div style="padding:16px; text-align:center; font-size:0.85rem; color:var(--text-muted);">
                No matching gear found for "<strong>${val}</strong>".
                <div style="margin-top:6px;"><a href="/shop.html" style="color:var(--accent-orange);">Browse full catalog</a></div>
              </div>
            `;
            dropdown.classList.add('active');
          }
        } catch (err) {
          console.error(err);
        }
      }, 250);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) {
          window.location.href = `/shop.html?search=${encodeURIComponent(val)}`;
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        dropdown.classList.remove('active');
      }
    });
  },

  setupMobileNav() {
    const toggle = document.getElementById('mobile-nav-toggle');
    const drawer = document.getElementById('mobile-nav-drawer');
    const closeBtn = document.getElementById('mobile-nav-close');

    if (!toggle || !drawer) return;

    toggle.addEventListener('click', () => {
      drawer.classList.add('active');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        drawer.classList.remove('active');
      });
    }

    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        drawer.classList.remove('active');
      }
    });
  }
};

/**
 * Toast Notifications
 */
const Toast = {
  show(title, message, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'info') icon = 'ℹ';

    toast.innerHTML = `
      <div style="font-size:1.1rem; font-weight:800; color:inherit;">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

window.UI = UI;
window.Toast = Toast;

document.addEventListener('DOMContentLoaded', () => {
  UI.initGlobalUI();
});
