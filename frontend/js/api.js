// =====================================================================
// INTELLISTAY: Client-Side API Communication & Utilities
// =====================================================================

const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('intellistay_token') || null;
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('intellistay_token', token);
    } else {
      localStorage.removeItem('intellistay_token');
    }
  },

  getUser() {
    try {
      const u = localStorage.getItem('intellistay_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('intellistay_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('intellistay_user');
    }
  },

  clearAuth() {
    localStorage.removeItem('intellistay_token');
    localStorage.removeItem('intellistay_user');
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/me')) {
          this.clearAuth();
          // Optionally redirect if on protected page
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const qs = query.toString();
    return this.request(qs ? `${endpoint}?${qs}` : endpoint, { method: 'GET' });
  },

  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  showToast(message, type = 'success') {
    let container = document.getElementById('intellistay-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'intellistay-toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '24px';
      container.style.right = '24px';
      container.style.zIndex = '9999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColors = {
      success: '#1B382B',
      error: '#D32F2F',
      warning: '#ED6C02',
      info: '#0288D1'
    };

    toast.style.backgroundColor = bgColors[type] || bgColors.success;
    toast.style.color = '#FFFFFF';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '500';
    toast.style.maxWidth = '380px';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.animation = 'fadeInUp 0.3s ease';

    const iconClass = type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';
    toast.innerHTML = `<i class="bi ${iconClass}"></i> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }
};

