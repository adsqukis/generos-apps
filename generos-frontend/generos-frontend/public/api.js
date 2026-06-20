// ============================
// API CLIENT
// ============================

const Api = {
  getToken() {
    return localStorage.getItem('accessToken');
  },

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  },

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle expired token - try refresh once
      if (response.status === 401 && this.getToken()) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          headers.Authorization = `Bearer ${this.getToken()}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          return await this.handleResponse(retryResponse);
        }
      }

      return await this.handleResponse(response);
    } catch (err) {
      console.error('API request failed:', err);
      throw new Error('Koneksi gagal. Periksa internet Anda.');
    }
  },

  async handleResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Terjadi kesalahan');
    }
    return data;
  },

  async tryRefreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json();
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // ============ AUTH ============
  async login(identifier, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    this.setUser(data.user);
    return data;
  },

  async register(payload) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    this.setUser(data.user);
    return data;
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // ignore errors on logout
    }
    this.clearTokens();
  },

  // ============ TRACKING ============
  async getTrackingEntries() {
    return this.request('/tracking');
  },

  async createTrackingEntry(payload) {
    return this.request('/tracking', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getDashboardSummary() {
    return this.request('/tracking/dashboard/summary');
  },

  async getAiInsight(entryId) {
    return this.request(`/tracking/${entryId}/ai-insight`, { method: 'POST' });
  },

  // ============ KNOWLEDGE ============
  async getArticles(category) {
    const query = category ? `?category=${category}` : '';
    return this.request(`/knowledge${query}`);
  },

  async getArticle(id) {
    return this.request(`/knowledge/${id}`);
  },

  async searchArticles(q) {
    return this.request(`/knowledge/search?q=${encodeURIComponent(q)}`);
  },

  // ============ FOOD ============
  async getFoodMenu(ageRange) {
    const query = ageRange ? `?age_range=${encodeURIComponent(ageRange)}` : '';
    return this.request(`/food${query}`);
  },

  async getFoodDetail(id) {
    return this.request(`/food/${id}`);
  },

  // ============ CHAT ============
  async sendChatMessage(message) {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async getChatHistory() {
    return this.request('/chat/history');
  },

  // ============ SHOP ============
  async getProducts() {
    return this.request('/shop/products');
  },

  async trackProductClick(productId) {
    return this.request(`/shop/products/${productId}/click`, { method: 'POST' });
  },

  // ============ ADMIN ============
  async createArticle(payload) {
    return this.request('/knowledge', { method: 'POST', body: JSON.stringify(payload) });
  },

  async createFood(payload) {
    return this.request('/food', { method: 'POST', body: JSON.stringify(payload) });
  },

  async createProduct(payload) {
    return this.request('/shop/products', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getClickAnalytics() {
    return this.request('/shop/analytics/clicks');
  },
};
