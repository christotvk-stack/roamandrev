/**
 * ROAM & REV - CENTRAL REST API CLIENT
 */

const API_BASE = '/api';

const API = {
  getToken() {
    return localStorage.getItem('roam_rev_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('roam_rev_token', token);
    } else {
      localStorage.removeItem('roam_rev_token');
    }
  },

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err.message);
      throw err;
    }
  },

  // Auth Endpoints
  register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  getProfile() {
    return this.request('/auth/profile');
  },

  updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Products Endpoints
  getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  },

  getProductById(id) {
    return this.request(`/products/${id}`);
  },

  createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  // Categories Endpoints
  getCategories() {
    return this.request('/categories');
  },

  // Cart Endpoints
  getCart() {
    return this.request('/cart');
  },

  addToCart(productId, quantity = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  },

  updateCartItem(productId, quantity) {
    return this.request('/cart', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity })
    });
  },

  removeFromCart(productId) {
    return this.request(`/cart/${productId}`, {
      method: 'DELETE'
    });
  },

  syncCart(items) {
    return this.request('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },

  // Orders Endpoints
  createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  getMyOrders() {
    return this.request('/orders/myorders');
  },

  getOrderById(id) {
    return this.request(`/orders/${id}`);
  },

  getAllOrders(status) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/orders${query}`);
  },

  updateOrderStatus(orderId, status, note) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    });
  },

  // Reviews Endpoints
  getProductReviews(productId) {
    return this.request(`/reviews/${productId}`);
  },

  submitReview(reviewData) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  // Coupons & Admin Endpoints
  validateCoupon(code, orderAmount) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderAmount })
    });
  },

  getAdminStats() {
    return this.request('/admin/stats');
  },

  getAdminCoupons() {
    return this.request('/coupons');
  },

  createAdminCoupon(couponData) {
    return this.request('/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData)
    });
  },

  toggleAdminCoupon(id) {
    return this.request(`/coupons/${id}/toggle`, {
      method: 'PUT'
    });
  }
};

window.API = API;
