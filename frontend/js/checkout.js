/**
 * ROAM & REV - MULTI-STEP CHECKOUT CONTROLLER
 * 5-Step Wizard, Shipping, Delivery Method, UPI/Card Simulator & Confirmation
 */

const Checkout = {
  currentStep: 1,
  customerData: {},
  shippingData: {},
  deliveryMethod: {
    type: 'standard',
    title: 'Standard Express (3-5 Days)',
    cost: 0
  },
  paymentData: {
    method: 'upi',
    transactionId: ''
  },

  init() {
    if (!window.Cart.items || window.Cart.items.length === 0) {
      const container = document.getElementById('checkout-wizard-container');
      if (container) {
        container.innerHTML = `
          <div style="text-align:center; padding:80px 20px; background:var(--bg-secondary); border-radius:16px;">
            <h3>Your Expedition Cart is Empty</h3>
            <p style="margin:12px 0 24px;">Please select accessories from our catalog before checking out.</p>
            <a href="/shop.html" class="btn btn-primary">Browse Catalog</a>
          </div>
        `;
      }
      return;
    }

    this.prefillUserInfo();
    this.renderOrderSummary();
    this.bindEvents();
    this.goToStep(1);
  },

  prefillUserInfo() {
    const user = window.Auth ? window.Auth.getUser() : null;
    if (user) {
      const nameInput = document.getElementById('cust-name');
      const emailInput = document.getElementById('cust-email');
      const phoneInput = document.getElementById('cust-phone');

      if (nameInput) nameInput.value = user.name || '';
      if (emailInput) emailInput.value = user.email || '';
      if (phoneInput) phoneInput.value = user.phone || '';

      if (user.addresses && user.addresses.length > 0) {
        const addr = user.addresses[0];
        const fullName = document.getElementById('ship-fullname');
        const street = document.getElementById('ship-street');
        const city = document.getElementById('ship-city');
        const state = document.getElementById('ship-state');
        const postal = document.getElementById('ship-postal');
        const phone = document.getElementById('ship-phone');

        if (fullName) fullName.value = addr.fullName || user.name;
        if (street) street.value = addr.street || '';
        if (city) city.value = addr.city || '';
        if (state) state.value = addr.state || '';
        if (postal) postal.value = addr.postalCode || '';
        if (phone) phone.value = addr.phone || user.phone;
      }
    }
  },

  renderOrderSummary() {
    const itemsList = document.getElementById('checkout-items-list');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const discountEl = document.getElementById('checkout-discount');
    const shippingEl = document.getElementById('checkout-shipping');
    const totalEl = document.getElementById('checkout-total');

    const subtotal = window.Cart.getSubtotal();
    const coupon = window.Cart.appliedCoupon;
    let discount = 0;

    if (coupon) {
      if (coupon.discountType === 'percentage') {
        discount = Math.round((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
      } else {
        discount = coupon.discountValue;
      }
    }

    let shipping = this.deliveryMethod.type === 'express' ? 150 : (subtotal > 999 ? 0 : 99);
    this.deliveryMethod.cost = shipping;

    const total = Math.max(0, subtotal - discount + shipping);

    if (itemsList) {
      itemsList.innerHTML = window.Cart.items.map(i => `
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">
          <img src="${i.image || ''}" style="width:48px; height:48px; border-radius:6px; object-fit:cover;" alt="${i.name}">
          <div style="flex:1; min-width:0;">
            <div style="font-size:0.85rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${i.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Qty: ${i.quantity} × ${UI.formatINR(i.price)}</div>
          </div>
          <div style="font-family:var(--font-tech); font-weight:700; font-size:0.9rem;">${UI.formatINR(i.price * i.quantity)}</div>
        </div>
      `).join('');
    }

    if (subtotalEl) subtotalEl.textContent = UI.formatINR(subtotal);
    if (discountEl) {
      discountEl.textContent = discount > 0 ? `-${UI.formatINR(discount)}` : '₹0';
      discountEl.style.color = discount > 0 ? 'var(--accent-green)' : 'inherit';
    }
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : UI.formatINR(shipping);
    if (totalEl) totalEl.textContent = UI.formatINR(total);
  },

  goToStep(stepNum) {
    this.currentStep = stepNum;

    // Update stepper visual nodes
    document.querySelectorAll('.step-node').forEach(node => {
      const step = parseInt(node.getAttribute('data-step'), 10);
      node.classList.remove('active', 'completed');
      if (step === stepNum) node.classList.add('active');
      else if (step < stepNum) node.classList.add('completed');
    });

    // Update step containers
    document.querySelectorAll('.checkout-step-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`checkout-step-${stepNum}`);
    if (activeSec) activeSec.classList.add('active');

    window.scrollTo({ top: 120, behavior: 'smooth' });
  },

  bindEvents() {
    // Step 1 -> Next
    const step1Form = document.getElementById('step-1-form');
    if (step1Form) {
      step1Form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.customerData = {
          name: document.getElementById('cust-name').value.trim(),
          email: document.getElementById('cust-email').value.trim(),
          phone: document.getElementById('cust-phone').value.trim()
        };
        this.goToStep(2);
      });
    }

    // Step 2 -> Next
    const step2Form = document.getElementById('step-2-form');
    if (step2Form) {
      step2Form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.shippingData = {
          fullName: document.getElementById('ship-fullname').value.trim(),
          street: document.getElementById('ship-street').value.trim(),
          city: document.getElementById('ship-city').value.trim(),
          state: document.getElementById('ship-state').value.trim(),
          postalCode: document.getElementById('ship-postal').value.trim(),
          phone: document.getElementById('ship-phone').value.trim(),
          landmark: document.getElementById('ship-landmark') ? document.getElementById('ship-landmark').value.trim() : ''
        };
        this.goToStep(3);
      });
    }

    // Step 3 Delivery method radio changes
    document.querySelectorAll('input[name="delivery-option"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.value === 'express') {
          this.deliveryMethod = {
            type: 'express',
            title: 'Priority Speed Courier (Air Cargo)',
            cost: 150
          };
        } else {
          this.deliveryMethod = {
            type: 'standard',
            title: 'Standard Express (3-5 Days)',
            cost: 0
          };
        }
        this.renderOrderSummary();
      });
    });

    const step3Next = document.getElementById('step-3-next-btn');
    if (step3Next) {
      step3Next.addEventListener('click', () => this.goToStep(4));
    }

    // Step 4 Payment Selection
    document.querySelectorAll('.payment-method-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const method = card.getAttribute('data-method');
        this.paymentData.method = method;

        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;

        document.querySelectorAll('.payment-subpanel').forEach(p => p.classList.remove('active'));
        const activeSub = document.getElementById(`payment-subpanel-${method}`);
        if (activeSub) activeSub.classList.add('active');
      });
    });

    // Step 4 Complete Order Button
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', () => this.executeOrderPlacement());
    }
  },

  async executeOrderPlacement() {
    const btn = document.getElementById('place-order-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳</span> Securing Transaction...`;
    }

    try {
      const orderPayload = {
        customer: this.customerData,
        items: window.Cart.items,
        shippingAddress: this.shippingData,
        deliveryMethod: this.deliveryMethod,
        payment: {
          method: this.paymentData.method,
          transactionId: `TXN-RR-${Date.now()}`
        },
        couponCode: window.Cart.appliedCoupon ? window.Cart.appliedCoupon.code : ''
      };

      const res = await API.createOrder(orderPayload);

      if (res.success && res.order) {
        // Clear local cart
        window.Cart.clearCart();

        // Render Confirmation screen
        this.renderOrderConfirmation(res.order);
        this.goToStep(5);
      } else {
        throw new Error(res.message || 'Order placement failed');
      }
    } catch (err) {
      window.Toast.show('Order Failed', err.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Retry Order Placement';
      }
    }
  },

  renderOrderConfirmation(order) {
    const orderNumEl = document.getElementById('conf-order-number');
    const trackingEl = document.getElementById('conf-tracking-number');
    const customerEl = document.getElementById('conf-customer-name');
    const totalEl = document.getElementById('conf-order-total');

    if (orderNumEl) orderNumEl.textContent = order.orderNumber;
    if (trackingEl) trackingEl.textContent = order.trackingNumber || 'BLUEDART-EXP-88912';
    if (customerEl) customerEl.textContent = order.customer.name;
    if (totalEl) totalEl.textContent = UI.formatINR(order.pricing.total);
  }
};

window.Checkout = Checkout;
document.addEventListener('DOMContentLoaded', () => Checkout.init());
