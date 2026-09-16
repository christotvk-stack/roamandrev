/**
 * ROAM & REV - SHOP CATALOG CONTROLLER
 * Dynamic Filters, Sort, Search Sync, Active Tags, URL Sync & Pagination
 */

const Shop = {
  state: {
    search: '',
    category: 'all',
    bike: 'all',
    minPrice: 0,
    maxPrice: 10000,
    rating: '',
    inStock: false,
    sort: 'recommended',
    page: 1,
    limit: 12
  },

  init() {
    this.readUrlParams();
    this.bindEvents();
    this.fetchProducts();
  },

  readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('search')) this.state.search = params.get('search');
    if (params.get('q')) this.state.search = params.get('q');
    if (params.get('category')) this.state.category = params.get('category');
    if (params.get('bike')) this.state.bike = params.get('bike');
    if (params.get('maxPrice')) this.state.maxPrice = Number(params.get('maxPrice'));
    if (params.get('sort')) this.state.sort = params.get('sort');
    if (params.get('page')) this.state.page = Number(params.get('page'));

    this.syncFormControls();
  },

  syncFormControls() {
    // Search input
    const searchInput = document.getElementById('shop-search-input');
    if (searchInput && this.state.search) searchInput.value = this.state.search;

    // Categories
    const catRadios = document.querySelectorAll('input[name="filter-category"]');
    catRadios.forEach(radio => {
      radio.checked = radio.value === this.state.category;
    });

    // Bikes
    const bikeRadios = document.querySelectorAll('input[name="filter-bike"]');
    bikeRadios.forEach(radio => {
      radio.checked = radio.value.toUpperCase() === (this.state.bike || '').toUpperCase();
    });

    // Price Slider
    const slider = document.getElementById('filter-price-slider');
    const priceDisplay = document.getElementById('price-max-val');
    if (slider && priceDisplay) {
      slider.value = this.state.maxPrice;
      priceDisplay.textContent = UI.formatINR(this.state.maxPrice);
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('shop-sort-select');
    if (sortSelect) sortSelect.value = this.state.sort;
  },

  bindEvents() {
    // Category radios
    document.querySelectorAll('input[name="filter-category"]').forEach(r => {
      r.addEventListener('change', (e) => {
        this.state.category = e.target.value;
        this.state.page = 1;
        this.updateUrl();
        this.fetchProducts();
      });
    });

    // Bike radios
    document.querySelectorAll('input[name="filter-bike"]').forEach(r => {
      r.addEventListener('change', (e) => {
        this.state.bike = e.target.value;
        this.state.page = 1;
        this.updateUrl();
        this.fetchProducts();
      });
    });

    // Price slider
    const slider = document.getElementById('filter-price-slider');
    const priceDisplay = document.getElementById('price-max-val');
    if (slider && priceDisplay) {
      slider.addEventListener('input', (e) => {
        priceDisplay.textContent = UI.formatINR(e.target.value);
      });
      slider.addEventListener('change', (e) => {
        this.state.maxPrice = Number(e.target.value);
        this.state.page = 1;
        this.updateUrl();
        this.fetchProducts();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('shop-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.state.sort = e.target.value;
        this.updateUrl();
        this.fetchProducts();
      });
    }

    // Shop search form
    const searchForm = document.getElementById('shop-search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('shop-search-input');
        this.state.search = input ? input.value.trim() : '';
        this.state.page = 1;
        this.updateUrl();
        this.fetchProducts();
      });
    }

    // In Stock Checkbox
    const inStockBox = document.getElementById('filter-in-stock');
    if (inStockBox) {
      inStockBox.addEventListener('change', (e) => {
        this.state.inStock = e.target.checked;
        this.state.page = 1;
        this.fetchProducts();
      });
    }

    // Reset All Filters
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetFilters());
    }

    // Mobile filter toggle
    const mobileTrigger = document.getElementById('mobile-filter-btn');
    const mobileClose = document.getElementById('mobile-filter-close');
    const sidebar = document.getElementById('filter-sidebar');

    if (mobileTrigger && sidebar) {
      mobileTrigger.addEventListener('click', () => sidebar.classList.add('mobile-open'));
    }
    if (mobileClose && sidebar) {
      mobileClose.addEventListener('click', () => sidebar.classList.remove('mobile-open'));
    }
  },

  resetFilters() {
    this.state = {
      search: '',
      category: 'all',
      bike: 'all',
      minPrice: 0,
      maxPrice: 10000,
      rating: '',
      inStock: false,
      sort: 'recommended',
      page: 1,
      limit: 12
    };
    this.syncFormControls();
    this.updateUrl();
    this.fetchProducts();
  },

  updateUrl() {
    const params = new URLSearchParams();
    if (this.state.search) params.set('search', this.state.search);
    if (this.state.category && this.state.category !== 'all') params.set('category', this.state.category);
    if (this.state.bike && this.state.bike !== 'all') params.set('bike', this.state.bike);
    if (this.state.maxPrice < 10000) params.set('maxPrice', this.state.maxPrice);
    if (this.state.sort !== 'recommended') params.set('sort', this.state.sort);
    if (this.state.page > 1) params.set('page', this.state.page);

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  },

  renderActiveFilterTags() {
    const bar = document.getElementById('active-filters-bar');
    if (!bar) return;

    const tags = [];

    if (this.state.search) {
      tags.push(`Search: "${this.state.search}" <button onclick="Shop.removeFilter('search')">✕</button>`);
    }
    if (this.state.category && this.state.category !== 'all') {
      tags.push(`Category: ${this.state.category.replace('-', ' ')} <button onclick="Shop.removeFilter('category')">✕</button>`);
    }
    if (this.state.bike && this.state.bike !== 'all') {
      tags.push(`Bike: ${this.state.bike} <button onclick="Shop.removeFilter('bike')">✕</button>`);
    }
    if (this.state.maxPrice < 10000) {
      tags.push(`Under ${UI.formatINR(this.state.maxPrice)} <button onclick="Shop.removeFilter('maxPrice')">✕</button>`);
    }

    if (tags.length > 0) {
      bar.innerHTML = tags.map(t => `<span class="active-filter-tag">${t}</span>`).join('') + `
        <button onclick="Shop.resetFilters()" style="background:transparent; color:var(--text-muted); font-size:0.75rem; font-weight:600; cursor:pointer; margin-left:6px; text-decoration:underline;">
          Clear All
        </button>
      `;
      bar.style.display = 'flex';
    } else {
      bar.innerHTML = '';
      bar.style.display = 'none';
    }
  },

  removeFilter(key) {
    if (key === 'search') this.state.search = '';
    if (key === 'category') this.state.category = 'all';
    if (key === 'bike') this.state.bike = 'all';
    if (key === 'maxPrice') this.state.maxPrice = 10000;

    this.syncFormControls();
    this.updateUrl();
    this.fetchProducts();
  },

  async fetchProducts() {
    const grid = document.getElementById('shop-product-grid');
    const countEl = document.getElementById('results-count');
    const pagination = document.getElementById('pagination-container');

    if (!grid) return;

    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px;">
        <div style="font-size:2rem; color:var(--accent-orange); margin-bottom:12px;">⚡</div>
        <p style="color:var(--text-secondary);">Querying expedition gear catalogue...</p>
      </div>
    `;

    this.renderActiveFilterTags();

    const queryParams = {
      page: this.state.page,
      limit: this.state.limit
    };

    if (this.state.search) queryParams.search = this.state.search;
    if (this.state.category && this.state.category !== 'all') queryParams.category = this.state.category;
    if (this.state.bike && this.state.bike !== 'all') queryParams.bike = this.state.bike;
    if (this.state.maxPrice) queryParams.maxPrice = this.state.maxPrice;
    if (this.state.sort) queryParams.sort = this.state.sort;
    if (this.state.inStock) queryParams.inStock = 'true';

    try {
      const res = await API.getProducts(queryParams);

      if (countEl) {
        countEl.innerHTML = `Showing <strong>${res.products ? res.products.length : 0}</strong> of <strong>${res.total || 0}</strong> gear items`;
      }

      if (res.success && res.products && res.products.length > 0) {
        grid.innerHTML = res.products.map(p => UI.renderProductCard(p)).join('');
        this.renderPagination(res.page, res.pages);
      } else {
        grid.innerHTML = `
          <div class="shop-empty-state" style="grid-column:1/-1;">
            <div class="empty-icon">✕</div>
            <h3>No gear found matching your criteria</h3>
            <p style="margin-top:6px;">Try adjusting your bike compatibility filter or price ceiling.</p>
            <div class="empty-suggestions">
              <span class="empty-suggestion-pill" onclick="Shop.searchKeyword('MT15')">MT-15 Accessories</span>
              <span class="empty-suggestion-pill" onclick="Shop.searchKeyword('NS200')">NS200 Crash Guards</span>
              <span class="empty-suggestion-pill" onclick="Shop.searchKeyword('backpack')">Travel Backpacks</span>
              <span class="empty-suggestion-pill" onclick="Shop.searchKeyword('phone mount')">Phone Mounts</span>
              <span class="empty-suggestion-pill" onclick="Shop.searchKeyword('tank bag')">Tank Bags</span>
            </div>
          </div>
        `;
        if (pagination) pagination.innerHTML = '';
      }
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--accent-red);">Error loading products.</div>`;
    }
  },

  searchKeyword(keyword) {
    this.state.search = keyword;
    this.syncFormControls();
    this.updateUrl();
    this.fetchProducts();
  },

  renderPagination(currentPage, totalPages) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="Shop.goToPage(${currentPage - 1})">‹</button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="Shop.goToPage(${i})">${i}</button>
      `;
    }

    html += `
      <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="Shop.goToPage(${currentPage + 1})">›</button>
    `;

    container.innerHTML = html;
  },

  goToPage(page) {
    this.state.page = page;
    this.updateUrl();
    this.fetchProducts();
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }
};

window.Shop = Shop;
document.addEventListener('DOMContentLoaded', () => Shop.init());
