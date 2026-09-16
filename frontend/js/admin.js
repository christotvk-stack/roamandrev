/**
 * ROAM & REV - ADMIN MANAGEMENT DASHBOARD CONTROLLER
 * KPIs, Inventory CRUD, Order Status Dropdowns, Coupon Manager
 */

const Admin = {
  currentTab: 'overview',
  stats: null,
  products: [],
  orders: [],
  coupons: [],

  async init() {
    if (!window.Auth.isLoggedIn() || !window.Auth.isAdmin()) {
      window.location.href = '/login.html?redirect=/admin.html';
      return;
    }

    await this.loadStats();
    await this.loadProducts();
    await this.loadOrders();
    await this.loadCoupons();

    this.bindEvents();
    this.switchTab('overview');
  },

  async loadStats() {
    try {
      const res = await API.getAdminStats();
      if (res.success && res.stats) {
        this.stats = res.stats;
        this.renderStats(res.stats);
      }
    } catch (err) {
      console.error(err);
    }
  },

  renderStats(stats) {
    const revEl = document.getElementById('kpi-revenue');
    const ordersEl = document.getElementById('kpi-orders');
    const prodsEl = document.getElementById('kpi-products');
    const custEl = document.getElementById('kpi-customers');
    const lowStockCountEl = document.getElementById('low-stock-alert-count');
    const lowStockList = document.getElementById('low-stock-list');

    if (revEl) revEl.textContent = UI.formatINR(stats.totalSales || 0);
    if (ordersEl) ordersEl.textContent = stats.totalOrders || 0;
    if (prodsEl) prodsEl.textContent = stats.totalProducts || 0;
    if (custEl) custEl.textContent = stats.totalCustomers || 0;
    if (lowStockCountEl) lowStockCountEl.textContent = `${stats.lowStockCount || 0} Critical Items`;

    if (lowStockList && stats.lowStockProducts) {
      lowStockList.innerHTML = stats.lowStockProducts.map(p => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-subtle);">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${(p.images && p.images[0]) || ''}" style="width:36px; height:36px; border-radius:4px; object-fit:cover;">
            <div>
              <div style="font-weight:600; font-size:0.85rem; color:#FFF;">${p.name}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${p.category}</div>
            </div>
          </div>
          <span class="badge-tag badge-tag-orange">Only ${p.stock} Left</span>
        </div>
      `).join('');
    }
  },

  async loadProducts() {
    try {
      const res = await API.getProducts({ limit: 100 });
      if (res.success && res.products) {
        this.products = res.products;
        this.renderProductsTable(res.products);
      }
    } catch (err) {
      console.error(err);
    }
  },

  renderProductsTable(products) {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>
          <img src="${(p.images && p.images[0]) || ''}" class="table-thumb" alt="${p.name}">
        </td>
        <td>
          <div style="font-weight:700; color:var(--text-primary); max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${p.name}
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${p.brand || 'ROAM & REV'}</div>
        </td>
        <td>
          <span style="font-size:0.8rem; text-transform:capitalize;">${(p.category || '').replace('-', ' ')}</span>
        </td>
        <td>
          ${UI.renderCompatibilityBadge(p.bikeCompatibility)}
        </td>
        <td style="font-family:var(--font-tech); font-weight:700; color:#FFF;">
          ${UI.formatINR(p.price)}
        </td>
        <td>
          <span style="font-family:var(--font-tech); font-weight:700; color:${p.stock <= 15 ? 'var(--accent-orange)' : 'var(--accent-green)'}">
            ${p.stock} units
          </span>
        </td>
        <td>
          <div class="table-action-btns">
            <button class="btn-table-action" onclick="Admin.openEditProductModal('${p._id}')" title="Edit Gear">✎</button>
            <button class="btn-table-action delete" onclick="Admin.deleteProduct('${p._id}')" title="Delete Gear">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  async loadOrders() {
    try {
      const res = await API.getAllOrders();
      if (res.success && res.orders) {
        this.orders = res.orders;
        this.renderOrdersTable(res.orders);
      }
    } catch (err) {
      console.error(err);
    }
  },

  renderOrdersTable(orders) {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    tbody.innerHTML = orders.map(o => {
      const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return `
        <tr>
          <td>
            <strong style="font-family:var(--font-tech); color:var(--text-primary);">${o.orderNumber}</strong><br>
            <span style="font-size:0.75rem; color:var(--text-muted);">${dateStr}</span>
          </td>
          <td>
            <div style="font-weight:600; color:#FFF;">${o.customer.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${o.customer.phone}</div>
          </td>
          <td>
            <span style="font-size:0.8rem;">${(o.items || []).length} items</span>
          </td>
          <td style="font-family:var(--font-tech); font-weight:800; color:var(--accent-orange);">
            ${UI.formatINR(o.pricing ? o.pricing.total : 0)}
          </td>
          <td>
            <span style="font-size:0.75rem; text-transform:uppercase; font-family:var(--font-tech);">${o.payment.method} (${o.payment.status})</span>
          </td>
          <td>
            <select class="order-status-select" onchange="Admin.updateStatus('${o._id}', this.value)">
              <option value="Confirmed" ${o.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Processing" ${o.orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Shipped" ${o.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Out for Delivery" ${o.orderStatus === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
              <option value="Delivered" ${o.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${o.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  },

  async updateStatus(orderId, newStatus) {
    try {
      const res = await API.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        window.Toast.show('Status Updated', `Order changed to ${newStatus}`, 'success');
        await this.loadStats();
      }
    } catch (err) {
      window.Toast.show('Error', err.message, 'error');
    }
  },

  async loadCoupons() {
    try {
      const res = await API.getAdminCoupons();
      if (res.success && res.coupons) {
        this.coupons = res.coupons;
        this.renderCouponsTable(res.coupons);
      }
    } catch (err) {
      console.error(err);
    }
  },

  renderCouponsTable(coupons) {
    const tbody = document.getElementById('admin-coupons-tbody');
    if (!tbody) return;

    tbody.innerHTML = coupons.map(c => `
      <tr>
        <td><strong style="font-family:var(--font-tech); color:var(--accent-orange); font-size:1rem;">${c.code}</strong></td>
        <td>${c.description}</td>
        <td>${c.discountType === 'percentage' ? `${c.discountValue}%` : UI.formatINR(c.discountValue)}</td>
        <td>Min purchase: ${UI.formatINR(c.minPurchase || 0)}</td>
        <td>
          <button class="btn btn-sm ${c.isActive ? 'btn-primary' : 'btn-secondary'}" onclick="Admin.toggleCoupon('${c._id}')">
            ${c.isActive ? 'Active' : 'Inactive'}
          </button>
        </td>
      </tr>
    `).join('');
  },

  async toggleCoupon(id) {
    try {
      const res = await API.toggleAdminCoupon(id);
      if (res.success) {
        window.Toast.show('Coupon Updated', res.message, 'success');
        await this.loadCoupons();
      }
    } catch (err) {
      window.Toast.show('Error', err.message, 'error');
    }
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.admin-tab-view').forEach(view => {
      view.style.display = view.id === `tab-view-${tabId}` ? 'block' : 'none';
    });
  },

  openAddProductModal() {
    document.getElementById('product-modal-title').textContent = 'Add New Gear Item';
    document.getElementById('edit-product-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('admin-product-modal').classList.add('active');
  },

  openEditProductModal(productId) {
    const p = this.products.find(item => item._id === productId);
    if (!p) return;

    document.getElementById('product-modal-title').textContent = 'Edit Gear Specifications';
    document.getElementById('edit-product-id').value = p._id;
    document.getElementById('prod-input-name').value = p.name;
    document.getElementById('prod-input-category').value = p.category;
    document.getElementById('prod-input-price').value = p.price;
    document.getElementById('prod-input-original-price').value = p.originalPrice;
    document.getElementById('prod-input-stock').value = p.stock;
    document.getElementById('prod-input-brand').value = p.brand || 'ROAM & REV';
    document.getElementById('prod-input-images').value = (p.images || []).join('\n');
    document.getElementById('prod-input-desc').value = p.description;

    // Set bike checkboxes
    const bikes = p.bikeCompatibility || [];
    document.getElementById('bike-check-mt15').checked = bikes.includes('MT-15');
    document.getElementById('bike-check-ns200').checked = bikes.includes('NS200');
    document.getElementById('bike-check-univ').checked = bikes.includes('Universal');

    document.getElementById('admin-product-modal').classList.add('active');
  },

  closeProductModal() {
    document.getElementById('admin-product-modal').classList.remove('active');
  },

  async deleteProduct(id) {
    if (!confirm('Are you sure you want to permanently delete this product from the catalogue?')) return;
    try {
      const res = await API.deleteProduct(id);
      if (res.success) {
        window.Toast.show('Deleted', 'Gear item removed from store', 'info');
        await this.loadProducts();
        await this.loadStats();
      }
    } catch (err) {
      window.Toast.show('Error', err.message, 'error');
    }
  },

  bindEvents() {
    // Tab buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Product Modal Form
    const prodForm = document.getElementById('product-form');
    if (prodForm) {
      prodForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-product-id').value;

        const bikeComp = [];
        if (document.getElementById('bike-check-mt15').checked) bikeComp.push('MT-15');
        if (document.getElementById('bike-check-ns200').checked) bikeComp.push('NS200');
        if (document.getElementById('bike-check-univ').checked) bikeComp.push('Universal');
        if (bikeComp.length === 0) bikeComp.push('Universal');

        const imagesRaw = document.getElementById('prod-input-images').value.trim();
        const images = imagesRaw.split('\n').map(s => s.trim()).filter(Boolean);

        const payload = {
          name: document.getElementById('prod-input-name').value.trim(),
          category: document.getElementById('prod-input-category').value,
          price: Number(document.getElementById('prod-input-price').value),
          originalPrice: Number(document.getElementById('prod-input-original-price').value),
          stock: Number(document.getElementById('prod-input-stock').value),
          brand: document.getElementById('prod-input-brand').value.trim(),
          bikeCompatibility: bikeComp,
          images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80'],
          description: document.getElementById('prod-input-desc').value.trim()
        };

        try {
          if (editId) {
            await API.updateProduct(editId, payload);
            window.Toast.show('Gear Updated', 'Product record updated successfully', 'success');
          } else {
            await API.createProduct(payload);
            window.Toast.show('Gear Created', 'New item added to catalog', 'success');
          }
          this.closeProductModal();
          await this.loadProducts();
          await this.loadStats();
        } catch (err) {
          window.Toast.show('Error', err.message, 'error');
        }
      });
    }

    // Coupon Creation Form
    const couponForm = document.getElementById('create-coupon-form');
    if (couponForm) {
      couponForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('coupon-code-input').value.trim();
        const val = document.getElementById('coupon-val-input').value;
        const type = document.getElementById('coupon-type-select').value;
        const minP = document.getElementById('coupon-min-input').value;
        const desc = document.getElementById('coupon-desc-input').value.trim();

        try {
          const res = await API.createAdminCoupon({
            code,
            discountValue: val,
            discountType: type,
            minPurchase: minP,
            description: desc
          });
          if (res.success) {
            window.Toast.show('Coupon Created', `Discount code ${code} is active.`, 'success');
            couponForm.reset();
            await this.loadCoupons();
          }
        } catch (err) {
          window.Toast.show('Error', err.message, 'error');
        }
      });
    }
  }
};

window.Admin = Admin;
document.addEventListener('DOMContentLoaded', () => Admin.init());
