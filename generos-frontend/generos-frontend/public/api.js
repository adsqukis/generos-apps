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

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (err) {
      console.error('Network error:', err);
      throw new Error('Koneksi gagal. Periksa internet Anda.');
    }

    // Handle expired token - try refresh once
    if (response.status === 401 && this.getToken()) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        headers.Authorization = `Bearer ${this.getToken()}`;
        try {
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          return await this.handleResponse(retryResponse);
        } catch (err) {
          throw new Error('Koneksi gagal. Periksa internet Anda.');
        }
      }
    }

    return await this.handleResponse(response);
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

  async getProduct(id) {
    return this.request(`/shop/products/${id}`);
  },

  async trackProductClick(productId) {
    return this.request(`/shop/products/${productId}/click`, { method: 'POST' });
  },

  // ============ VIDEOS ============
  async getVideos() {
    return this.request('/videos');
  },

  async getVideo(id) {
    return this.request(`/videos/${id}`);
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

  async updateArticle(id, payload) {
    return this.request(`/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async deleteArticle(id) {
    return this.request(`/knowledge/${id}`, { method: 'DELETE' });
  },

  async getClickAnalytics() {
    return this.request('/shop/analytics/clicks');
  },

  async createVideo(payload) {
    return this.request('/videos', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateVideo(id, payload) {
    return this.request(`/videos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async deleteVideo(id) {
    return this.request(`/videos/${id}`, { method: 'DELETE' });
  },

  async updateProduct(id, payload) {
    return this.request(`/shop/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async deleteProduct(id) {
    return this.request(`/shop/products/${id}`, { method: 'DELETE' });
  },

  async getSettings() {
    return this.request('/user/settings');
  },

  async updateSettings(payload) {
    return this.request('/user/settings', { method: 'PUT', body: JSON.stringify(payload) });
  },

  // ============ UPLOAD ============
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload gagal');
    }
    return res.json();
  },

  async uploadImages(files) {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE_URL}/upload/multiple`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload gagal');
    }
    return res.json();
  },

  // ============ DAILY TRACKER ============
  async getDailySummary(date) {
    const q = date ? `?date=${date}` : '';
    const sep = q ? '&' : '?';
    return this.request(`/daily/summary${q}${sep}_t=${Date.now()}`);
  },

  async getDailySleep(date) {
    return this.request(`/daily/sleep?date=${date}`);
  },

  async createDailySleep(payload) {
    return this.request('/daily/sleep', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getSleepHistory(from, to) {
    let q = '?';
    if (from) q += `from=${from}&`;
    if (to) q += `to=${to}&`;
    return this.request(`/daily/sleep/history${q}`);
  },

  async getSleepAnalytics(days = 7) {
    return this.request(`/daily/sleep/analytics?days=${days}`);
  },

  async getSleepArticles() {
    return this.request('/daily/sleep/articles');
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

  async markImmunization(vaccineName) {
    const today = new Date().toISOString().split('T')[0];
    return this.request('/tracking/immunization', {
      method: 'POST',
      body: JSON.stringify({
        vaccine_name: vaccineName,
        immunization_date: today,
      }),
    });
  },

  // ============ SLEEP DETAIL ============
  async getSleepAnalytics(days) {
    const q = days ? `?days=${days}` : '';
    return this.request(`/daily/sleep/analytics${q}`);
  },

  async getSleepHistory(from, to) {
    let q = '?';
    if (from) q += `from=${from}&`;
    if (to) q += `to=${to}&`;
    return this.request(`/daily/sleep/history${q}`);
  },

  async getSleepArticles() {
    return this.request('/daily/sleep/articles');
  },

  // === GENERIC TRACKER ANALYTICS ===
  async getTrackerAnalytics(type, days = 7) {
    return this.request(`/daily/${type}/analytics?days=${days}`);
  },

  async getTrackerArticles(type) {
    return this.request(`/daily/${type}/articles`);
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

  // ============ CHILD DATA ============
  async getChildProfile() {
    return this.request(`/child/profile?_t=${Date.now()}`);
  },

  async updateChildProfile(data) {
    return this.request('/child/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // ============ ADMIN: USER MANAGEMENT ============
  async getUsers() {
    return this.request('/user/list');
  },

  async getUsersCount() {
    return this.request('/user/count');
  },

  async registerAdmin(payload) {
    return this.request('/auth/register-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateUser(id, payload) {
    return this.request(`/user/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteUser(id) {
    return this.request(`/user/${id}`, {
      method: 'DELETE',
    });
  },
};
