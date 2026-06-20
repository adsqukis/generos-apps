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

  // ============ TUMBUH KEMBANG ============
  async getGrowthRecords() {
    return this.request('/tracking/growth');
  },

  async createGrowthRecord(payload) {
    return this.request('/tracking/growth', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getImmunizationRecords() {
    return this.request('/tracking/immunization');
  },

  async createImmunizationRecord(payload) {
    return this.request('/tracking/immunization', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getScreeningProgress() {
    return this.request('/tracking/screening-progress');
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

  // ============ DAILY TRACKER ============
  async getDailySummary(date) {
    const q = date ? `?date=${date}` : '';
    return this.request(`/daily/summary${q}`);
  },

  async getDailySleep(date) {
    return this.request(`/daily/sleep?date=${date}`);
  },

  async createDailySleep(payload) {
    return this.request('/daily/sleep', { method: 'POST', body: JSON.stringify(payload) });
  },

  async deleteDailySleep(id) {
    return this.request(`/daily/sleep/${id}`, { method: 'DELETE' });
  },

  async getDailyFeeding(date, type) {
    let q = `?date=${date}`;
    if (type) q += `&type=${encodeURIComponent(type)}`;
    return this.request(`/daily/feeding${q}`);
  },

  async getDailyEating(date) {
    return this.getDailyFeeding(date, 'MPASI');
  },

  async createDailyFeeding(payload) {
    return this.request('/daily/feeding', { method: 'POST', body: JSON.stringify(payload) });
  },

  async createDailyEating(payload) {
    return this.request('/daily/feeding', { method: 'POST', body: JSON.stringify({ ...payload, feeding_type: 'MPASI' }) });
  },

  async deleteDailyFeeding(id) {
    return this.request(`/daily/feeding/${id}`, { method: 'DELETE' });
  },

  async getDailyDrink(date) {
    return this.request(`/daily/drink?date=${date}`);
  },

  async createDailyDrink(payload) {
    return this.request('/daily/drink', { method: 'POST', body: JSON.stringify(payload) });
  },

  async deleteDailyDrink(id) {
    return this.request(`/daily/drink/${id}`, { method: 'DELETE' });
  },

  async getDailyPee(date) {
    return this.request(`/daily/pee?date=${date}`);
  },

  async createDailyPee(payload) {
    return this.request('/daily/pee', { method: 'POST', body: JSON.stringify(payload) });
  },

  async deleteDailyPee(id) {
    return this.request(`/daily/pee/${id}`, { method: 'DELETE' });
  },

  async getDailyPoop(date) {
    return this.request(`/daily/poop?date=${date}`);
  },

  async createDailyPoop(payload) {
    return this.request('/daily/poop', { method: 'POST', body: JSON.stringify(payload) });
  },

  async deleteDailyPoop(id) {
    return this.request(`/daily/poop/${id}`, { method: 'DELETE' });
  },

  async getDevelopmentToday(age) {
    const q = age ? `?age=${age}` : '';
    return this.request(`/daily/development${q}`);
  },

  async getReminders() {
    return this.request('/daily/reminders');
  },

  async askDailyAI(message) {
    return this.request('/daily/ai', { method: 'POST', body: JSON.stringify({ message }) });
  },

  // ============ SCREENING ============
  async getScreeningDomains() {
    return this.request('/screening/domains');
  },

  async setScreeningDomains(domains) {
    return this.request('/screening/domains', {
      method: 'POST',
      body: JSON.stringify({ domains }),
    });
  },

  async getScreeningQuestions(domain, age) {
    return this.request(`/screening/questions?domain=${domain}&age=${age}`);
  },

  async createScreeningSession(domain, childAgeMonths) {
    return this.request('/screening/sessions', {
      method: 'POST',
      body: JSON.stringify({ domain, child_age_months: childAgeMonths }),
    });
  },

  async submitScreeningAnswer(sessionId, questionId, answer) {
    return this.request(`/screening/sessions/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, answer }),
    });
  },

  async completeScreeningSession(sessionId) {
    return this.request(`/screening/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  },

  async getScreeningSessions(domain, limit) {
    let query = '/screening/sessions?';
    if (domain) query += `domain=${domain}&`;
    if (limit) query += `limit=${limit}`;
    return this.request(query);
  },

  async getScreeningSession(id) {
    return this.request(`/screening/sessions/${id}`);
  },

  // ============ STIMULATION ============
  async getStimulationGeneral(age, domain) {
    let query = `/stimulation/general?age=${age}`;
    if (domain) query += `&domain=${domain}`;
    return this.request(query);
  },

  async getStimulationRecommendations(status) {
    let query = '/stimulation/recommendations';
    if (status) query += `?status=${status}`;
    return this.request(query);
  },

  async updateRecommendation(id, status) {
    return this.request(`/stimulation/recommendations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async generateStimulationFromTracking(domain, kendala, childAgeMonths) {
    return this.request('/stimulation/from-tracking', {
      method: 'POST',
      body: JSON.stringify({ domain, kendala, child_age_months: childAgeMonths }),
    });
  },
};
