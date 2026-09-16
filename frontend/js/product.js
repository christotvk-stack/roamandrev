/**
 * ROAM & REV - PRODUCT DETAIL CONTROLLER
 * Gallery Zoom, Multi-Angle Thumbnails, Specs, Reviews & Fast Buy
 */

const ProductPage = {
  product: null,
  quantity: 1,

  async init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || params.get('slug');

    if (!id) {
      window.location.href = '/shop.html';
      return;
    }

    try {
      const res = await API.getProductById(id);
      if (!res.success || !res.product) {
        document.getElementById('product-container').innerHTML = `
          <div style="text-align:center; padding:80px 20px;">
            <h2>Product Not Found</h2>
            <p style="margin:12px 0 24px;">The gear you are looking for may be out of stock or relocated.</p>
            <a href="/shop.html" class="btn btn-primary">Return to Shop</a>
          </div>
        `;
        return;
      }

      this.product = res.product;
      this.renderProductDetails(res.product, res.reviews || [], res.related || []);
      this.bindEvents();
    } catch (err) {
      console.error(err);
    }
  },

  renderProductDetails(p, reviews, related) {
    document.title = `${p.name} | ROAM & REV`;

    // Breadcrumbs
    const crumbs = document.getElementById('breadcrumb-nav');
    if (crumbs) {
      crumbs.innerHTML = `
        <a href="/index.html">Home</a>
        <span class="separator">/</span>
        <a href="/shop.html">Shop</a>
        <span class="separator">/</span>
        <a href="/shop.html?category=${p.category}">${p.category.replace('-', ' ')}</a>
        <span class="separator">/</span>
        <span class="current">${p.name}</span>
      `;
    }

    // Images
    const mainImg = document.getElementById('product-main-img');
    const thumbRow = document.getElementById('product-thumbnails-row');
    const images = p.images && p.images.length > 0 ? p.images : [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80'
    ];

    if (mainImg) {
      mainImg.src = images[0];
      mainImg.alt = p.name;
      mainImg.onerror = () => { mainImg.src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80'; };
    }

    if (thumbRow) {
      thumbRow.innerHTML = images.map((imgUrl, idx) => `
        <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="ProductPage.switchThumb('${imgUrl}', this)">
          <img src="${imgUrl}" alt="${p.name} angle ${idx + 1}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80';" />
        </div>
      `).join('');
    }

    // Info Column
    document.getElementById('product-title').textContent = p.name;
    document.getElementById('product-brand').textContent = p.brand || 'ROAM & REV';
    document.getElementById('product-price').textContent = UI.formatINR(p.price);

    const strikePrice = document.getElementById('product-original-price');
    if (strikePrice) {
      if (p.originalPrice > p.price) {
        strikePrice.textContent = UI.formatINR(p.originalPrice);
        strikePrice.style.display = 'inline';
      } else {
        strikePrice.style.display = 'none';
      }
    }

    const discountPill = document.getElementById('product-discount-pill');
    if (discountPill) {
      if (p.discountPercent > 0) {
        discountPill.textContent = `SAVE ${p.discountPercent}%`;
        discountPill.style.display = 'inline-block';
      } else {
        discountPill.style.display = 'none';
      }
    }

    // Rating
    const ratingStars = document.getElementById('product-rating-stars');
    if (ratingStars) ratingStars.innerHTML = UI.renderStars(p.rating);
    const reviewCountEl = document.getElementById('product-review-count');
    if (reviewCountEl) reviewCountEl.textContent = `(${p.reviewCount || 0} verified reviews)`;

    // Compatibility Banner
    const compatBanner = document.getElementById('product-compatibility-banner');
    if (compatBanner) {
      const bikes = p.bikeCompatibility || [];
      if (bikes.includes('MT-15')) {
        compatBanner.innerHTML = `
          <div class="compat-icon">🏍</div>
          <div class="compat-text">
            <strong>Certified Yamaha MT-15 Compatibility</strong><br>
            Engineered with zero-gap tolerance for MT-15 chassis & fuel tank profile.
          </div>
        `;
      } else if (bikes.includes('NS200')) {
        compatBanner.innerHTML = `
          <div class="compat-icon">⚡</div>
          <div class="compat-text">
            <strong>Certified Bajaj Pulsar NS200 Compatibility</strong><br>
            Custom-bracket bolt-on design for NS200 engine guard and frame geometry.
          </div>
        `;
      } else {
        compatBanner.innerHTML = `
          <div class="compat-icon">🌐</div>
          <div class="compat-text">
            <strong>Universal Overland Fitment</strong><br>
            Includes multi-size mounting shims and heavy-duty straps for any touring motorcycle.
          </div>
        `;
      }
    }

    // Stock Indicator
    const stockEl = document.getElementById('product-stock-indicator');
    if (stockEl) {
      if (p.stock <= 5) {
        stockEl.innerHTML = `<span class="stock-dot low"></span> <span style="color:var(--accent-amber);">Only ${p.stock} units remaining in warehouse!</span>`;
      } else {
        stockEl.innerHTML = `<span class="stock-dot"></span> <span style="color:var(--accent-green);">In Stock & Ready for Rapid Dispatch</span>`;
      }
    }

    // Description & Features
    document.getElementById('product-description-text').textContent = p.description;

    const featureList = document.getElementById('product-feature-list');
    if (featureList && p.features) {
      featureList.innerHTML = p.features.map(f => `
        <div class="feature-item">
          <span class="bullet-icon">⚡</span>
          <span>${f}</span>
        </div>
      `).join('');
    }

    // Specs Table
    const specsTable = document.getElementById('specs-table-body');
    if (specsTable && p.specifications) {
      const s = p.specifications;
      specsTable.innerHTML = `
        <tr><td class="spec-name">Material & Finish</td><td class="spec-value">${s.material || 'Heavy-Duty'}</td></tr>
        <tr><td class="spec-name">Dimensions</td><td class="spec-value">${s.dimensions || 'Standard'}</td></tr>
        <tr><td class="spec-name">Weight</td><td class="spec-value">${s.weight || 'Standard'}</td></tr>
        <tr><td class="spec-name">Capacity / Volume</td><td class="spec-value">${s.capacity || 'N/A'}</td></tr>
        <tr><td class="spec-name">Compatibility</td><td class="spec-value">${s.compatibility || 'Universal'}</td></tr>
        <tr><td class="spec-name">Warranty Protection</td><td class="spec-value">${s.warranty || '1 Year Manufacturer Warranty'}</td></tr>
        <tr><td class="spec-name">In The Box</td><td class="spec-value">${s.packageContents || '1 x Product Unit'}</td></tr>
      `;
    }

    // Reviews
    this.renderReviews(reviews, p.rating);

    // Related Products Grid
    const relatedGrid = document.getElementById('related-products-grid');
    if (relatedGrid && related && related.length > 0) {
      relatedGrid.innerHTML = related.map(r => UI.renderProductCard(r)).join('');
    }
  },

  switchThumb(url, el) {
    const mainImg = document.getElementById('product-main-img');
    if (mainImg) mainImg.src = url;

    document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
  },

  renderReviews(reviews, avgRating) {
    const container = document.getElementById('reviews-list-container');
    const avgScoreEl = document.getElementById('reviews-average-score');
    const totalCountEl = document.getElementById('reviews-total-count');

    if (avgScoreEl) avgScoreEl.textContent = Number(avgRating || 4.8).toFixed(1);
    if (totalCountEl) totalCountEl.textContent = `Based on ${reviews.length} authenticated rider reviews`;

    if (!container) return;

    if (reviews.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-muted); background:var(--bg-tertiary); border-radius:12px;">
          No reviews yet. Be the first adventurer to review this gear!
        </div>
      `;
      return;
    }

    container.innerHTML = reviews.map(r => `
      <div class="review-item-card">
        <div class="review-header-row">
          <div>
            <span class="reviewer-name">${r.userName}</span>
            ${r.verifiedPurchase ? '<span class="badge-tag badge-tag-green" style="margin-left:8px; font-size:0.65rem;">✓ Verified Rider</span>' : ''}
          </div>
          <div class="reviewer-bike">${r.bikeOwned || ''}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          ${UI.renderStars(r.rating)}
          <span style="font-weight:700; font-size:0.95rem; color:#FFF;">${r.title}</span>
        </div>
        <p class="review-body">${r.comment}</p>
      </div>
    `).join('');
  },

  bindEvents() {
    // Quantity stepper
    const decBtn = document.getElementById('qty-dec-btn');
    const incBtn = document.getElementById('qty-inc-btn');
    const input = document.getElementById('qty-input');

    if (decBtn && input) {
      decBtn.addEventListener('click', () => {
        let val = parseInt(input.value, 10) || 1;
        if (val > 1) {
          input.value = val - 1;
          this.quantity = val - 1;
        }
      });
    }

    if (incBtn && input) {
      incBtn.addEventListener('click', () => {
        let val = parseInt(input.value, 10) || 1;
        input.value = val + 1;
        this.quantity = val + 1;
      });
    }

    // Add to cart
    const addBtn = document.getElementById('detail-add-cart-btn');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        if (!this.product) return;
        await window.Cart.addItem(this.product, this.quantity);
        if (window.UI && typeof window.UI.openCartDrawer === 'function') {
          window.UI.openCartDrawer();
        }
      });
    }

    // Buy Now
    const buyBtn = document.getElementById('detail-buy-now-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', async () => {
        if (!this.product) return;
        await window.Cart.addItem(this.product, this.quantity);
        window.location.href = '/checkout.html';
      });
    }

    // Wishlist Toggle
    const wishBtn = document.getElementById('detail-wishlist-btn');
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        if (!this.product) return;
        const added = window.Wishlist.toggle(this.product);
        wishBtn.style.color = added ? 'var(--accent-orange)' : 'var(--text-primary)';
      });
    }

    // Tabs Switcher
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');
      });
    });

    // Review Form Submit
    const reviewForm = document.getElementById('write-review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = document.getElementById('review-rating-select').value;
        const title = document.getElementById('review-title-input').value;
        const comment = document.getElementById('review-comment-input').value;
        const bike = document.getElementById('review-bike-input').value;
        const name = document.getElementById('review-name-input').value;

        try {
          const res = await API.submitReview({
            productId: this.product._id,
            rating,
            title,
            comment,
            bikeOwned: bike,
            userName: name
          });

          if (res.success) {
            window.Toast.show('Review Posted', 'Thank you for your valuable feedback!', 'success');
            reviewForm.reset();
            // Reload reviews
            const updated = await API.getProductById(this.product._id);
            if (updated.success) {
              this.renderReviews(updated.reviews || [], updated.product.rating);
            }
          }
        } catch (err) {
          window.Toast.show('Submission Failed', err.message, 'error');
        }
      });
    }
  }
};

window.ProductPage = ProductPage;
document.addEventListener('DOMContentLoaded', () => ProductPage.init());
