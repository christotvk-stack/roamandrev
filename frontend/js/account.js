/**
 * ROAM & REV - ACCOUNT & ORDER TRACKING CONTROLLER
 * Profile editor, Saved Addresses, Historical Orders & Shipment Timeline
 */

const Account = {
  user: null,

  async init() {
    if (!window.Auth.isLoggedIn()) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    this.user = window.Auth.getUser();
    this.renderUserProfileHeader();

    // Check which page we are on
    if (document.getElementById('profile-form')) {
      this.initProfileEditor();
    }

    if (document.getElementById('orders-list-container')) {
      await this.loadCustomerOrders();
    }
  },

  renderUserProfileHeader() {
    const nameEl = document.getElementById('account-user-name');
    const emailEl = document.getElementById('account-user-email');
    const avatarEl = document.getElementById('account-user-avatar');

    if (nameEl) nameEl.textContent = this.user.name;
    if (emailEl) emailEl.textContent = this.user.email;
    if (avatarEl) avatarEl.textContent = (this.user.name || 'R').charAt(0).toUpperCase();
  },

  initProfileEditor() {
    const form = document.getElementById('profile-form');
    if (!form) return;

    document.getElementById('profile-name').value = this.user.name || '';
    document.getElementById('profile-email').value = this.user.email || '';
    document.getElementById('profile-phone').value = this.user.phone || '';

    // If there is a saved address
    if (this.user.addresses && this.user.addresses.length > 0) {
      const a = this.user.addresses[0];
      if (document.getElementById('profile-street')) document.getElementById('profile-street').value = a.street || '';
      if (document.getElementById('profile-city')) document.getElementById('profile-city').value = a.city || '';
      if (document.getElementById('profile-state')) document.getElementById('profile-state').value = a.state || '';
      if (document.getElementById('profile-postal')) document.getElementById('profile-postal').value = a.postalCode || '';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name').value.trim();
      const phone = document.getElementById('profile-phone').value.trim();

      const street = document.getElementById('profile-street') ? document.getElementById('profile-street').value.trim() : '';
      const city = document.getElementById('profile-city') ? document.getElementById('profile-city').value.trim() : '';
      const state = document.getElementById('profile-state') ? document.getElementById('profile-state').value.trim() : '';
      const postal = document.getElementById('profile-postal') ? document.getElementById('profile-postal').value.trim() : '';

      const addresses = street ? [{
        fullName: name,
        street,
        city,
        state,
        postalCode: postal,
        phone,
        isDefault: true
      }] : [];

      try {
        const res = await API.updateProfile({ name, phone, addresses });
        if (res.success && res.user) {
          window.Auth.setUser(res.user);
          this.user = res.user;
          this.renderUserProfileHeader();
          window.Toast.show('Profile Updated', 'Your profile and addresses have been saved.', 'success');
        }
      } catch (err) {
        window.Toast.show('Update Failed', err.message, 'error');
      }
    });
  },

  async loadCustomerOrders() {
    const container = document.getElementById('orders-list-container');
    if (!container) return;

    try {
      const res = await API.getMyOrders();
      if (!res.success || !res.orders || res.orders.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:60px; background:var(--bg-secondary); border-radius:16px;">
            <div style="font-size:2rem; margin-bottom:12px;">📦</div>
            <h3>No Orders Placed Yet</h3>
            <p style="margin:10px 0 20px; color:var(--text-secondary);">Your expeditions haven't started yet. Equip yourself today!</p>
            <a href="/shop.html" class="btn btn-primary">Start Exploring Gear</a>
          </div>
        `;
        return;
      }

      container.innerHTML = res.orders.map(order => this.renderOrderCard(order)).join('');
    } catch (err) {
      container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--accent-red);">Failed to load orders history.</div>`;
    }
  },

  renderOrderCard(order) {
    const items = order.items || [];
    const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const statusClass = `status-${(order.orderStatus || 'processing').toLowerCase().replace(/\s+/g, '-')}`;

    // Timeline calculation
    const stages = ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentIdx = stages.indexOf(order.orderStatus);

    const timelineHtml = `
      <div class="shipment-timeline">
        ${stages.map((stage, idx) => {
          let stateClass = '';
          if (idx < currentIdx) stateClass = 'passed';
          else if (idx === currentIdx) stateClass = 'current';

          return `
            <div class="timeline-milestone ${stateClass}">
              <div class="milestone-icon">
                ${idx < currentIdx ? '✓' : (idx === currentIdx ? '●' : (idx + 1))}
              </div>
              <div class="milestone-title">${stage}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Latest status note
    const latestHistory = (order.statusHistory && order.statusHistory.length > 0)
      ? order.statusHistory[order.statusHistory.length - 1]
      : null;

    return `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <div style="font-family:var(--font-tech); font-weight:800; font-size:1.05rem; color:#FFF;">
              ${order.orderNumber}
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted);">
              Ordered on ${dateStr} • Tracking: <strong style="color:var(--accent-cyan);">${order.trackingNumber || 'BLUEDART-882391'}</strong>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="order-status-badge ${statusClass}">● ${order.orderStatus}</span>
            <span style="font-family:var(--font-tech); font-size:1.1rem; font-weight:800; color:var(--accent-orange);">
              ${UI.formatINR(order.pricing ? order.pricing.total : 0)}
            </span>
          </div>
        </div>

        ${timelineHtml}

        ${latestHistory ? `
          <div style="background:var(--bg-tertiary); padding:10px 14px; border-radius:8px; font-size:0.85rem; color:var(--text-secondary); margin-bottom:16px;">
            <strong style="color:var(--accent-orange);">Live Dispatch Update:</strong> ${latestHistory.note || latestHistory.status}
          </div>
        ` : ''}

        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          ${items.map(item => `
            <div style="display:flex; align-items:center; gap:8px; background:var(--bg-tertiary); padding:6px 10px; border-radius:8px;">
              <img src="${item.image || ''}" style="width:36px; height:36px; border-radius:4px; object-fit:cover;" alt="${item.name}">
              <div style="font-size:0.8rem; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${item.name} (×${item.quantity})
              </div>
            </div>
          `).join('')}
          <a href="/shop.html" class="btn btn-secondary btn-sm" style="margin-left:auto;">
            Reorder Gear
          </a>
        </div>
      </div>
    `;
  }
};

window.Account = Account;
document.addEventListener('DOMContentLoaded', () => Account.init());
