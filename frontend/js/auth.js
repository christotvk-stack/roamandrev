/**
 * ROAM & REV - AUTHENTICATION STATE MANAGER
 */

const Auth = {
  getUser() {
    try {
      const user = localStorage.getItem('roam_rev_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('roam_rev_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('roam_rev_user');
    }
  },

  isLoggedIn() {
    return !!API.getToken() && !!this.getUser();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  async login(email, password) {
    const res = await API.login({ email, password });
    if (res.success && res.token) {
      API.setToken(res.token);
      this.setUser(res.user);

      // Trigger cart sync if there are guest items in local storage
      if (window.Cart && window.Cart.syncGuestCartToServer) {
        await window.Cart.syncGuestCartToServer();
      }

      window.dispatchEvent(new CustomEvent('auth:change', { detail: res.user }));
    }
    return res;
  },

  async register(data) {
    const res = await API.register(data);
    if (res.success && res.token) {
      API.setToken(res.token);
      this.setUser(res.user);

      if (window.Cart && window.Cart.syncGuestCartToServer) {
        await window.Cart.syncGuestCartToServer();
      }

      window.dispatchEvent(new CustomEvent('auth:change', { detail: res.user }));
    }
    return res;
  },

  logout() {
    API.setToken(null);
    this.setUser(null);
    window.dispatchEvent(new CustomEvent('auth:change', { detail: null }));
    window.location.href = '/index.html';
  }
};

window.Auth = Auth;
