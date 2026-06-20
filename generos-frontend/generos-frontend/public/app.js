// ============================
// STATE
// ============================
let currentPage = 'login';
let selectedTrackingType = null;
let selectedSeverity = 'normal';
let articlesCache = [];
let foodsCache = [];

// ============================
// INIT — jalan langsung karena script di akhir <body> (DOM sudah siap)
// ============================
function initApp() {
  // Guard: cek apakah sudah pernah diinit
  if (window._appInitialized) return;
  window._appInitialized = true;

  if (Api.getToken() && Api.getUser()) {
    navigate('home');
  } else {
    navigate('login');
  }

  // Setup nav bar
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Tumbuh Kembang: tab switching
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchGrowthTab(btn.dataset.tab));
  });

  // Tumbuh Kembang: default dates (hari ini) untuk form
  const today = new Date().toISOString().split('T')[0];
  const growthDate = document.getElementById('growth-date');
  if (growthDate) growthDate.value = today;
  const immDate = document.getElementById('imm-date');
  if (immDate) immDate.value = today;

  // Chat input enter key
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChat();
    });
  }

  // ============ STATIC EVENT LISTENERS (replace inline onclick) ============
  safeAddListener('btn-login', 'click', handleLogin);
  safeAddListener('link-register', 'click', showRegisterForm);
  safeAddListener('btn-register', 'click', handleRegister);
  safeAddListener('link-login', 'click', showLoginForm);
  safeAddListener('btn-settings', 'click', () => navigate('settings'));
  safeAddListener('btn-go-tracking', 'click', () => navigate('tracking'));
  safeAddListener('btn-go-food', 'click', () => navigate('food'));
  safeAddListener('btn-go-knowledge', 'click', () => navigate('knowledge'));
  safeAddListener('btn-go-screening', 'click', () => navigate('screening'));
  safeAddListener('btn-go-stimulation', 'click', () => navigate('stimulation'));
  safeAddListener('btn-submit-growth', 'click', submitGrowthRecord);
  safeAddListener('btn-submit-immunization', 'click', submitImmunizationRecord);
  safeAddListener('imm-date', 'change', updateImmunizationAge);
  safeAddListener('btn-send-chat', 'click', sendChat);
  safeAddListener('btn-logout', 'click', handleLogout);
  // === HOME PAGE Listeners ===
  safeAddListener('btn-add-growth', 'click', () => document.getElementById('growth-modal').classList.remove('hidden'));
  safeAddListener('btn-submit-home-growth', 'click', submitHomeGrowth);
  safeAddListener('btn-notif', 'click', () => { /* placeholder */ });
  safeAddListener('ai-floating-btn', 'click', openAIChat);
  safeAddListener('btn-ai-send', 'click', sendAIChat);
  safeAddListener('btn-submit-quickadd', 'click', submitQuickAdd);
  // AI input enter key
  const aiInput = document.getElementById('ai-input');
  if (aiInput) aiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendAIChat(); });

  // Tracker add buttons (± ada 5, pake onclick property biar reliable)
  document.querySelectorAll('.tracker-add').forEach(btn => {
    btn.onclick = function(e) {
      e.stopPropagation();
      openQuickAdd(this.dataset.tracker);
    };
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.onclick = function() {
      const id = this.dataset.closeModal;
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    };
  });

  // Click outside modal to close
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) this.classList.add('hidden');
    });
  });

  // All back buttons (navigate home)
  document.querySelectorAll('.back-btn').forEach((btn) => {
    btn.addEventListener('click', () => navigate('home'));
  });

  // ============ EVENT DELEGATION FOR DYNAMIC CONTENT ============
  // Food list items
  safeAddListener('food-list', 'click', (e) => {
    const item = e.target.closest('.food-item');
    if (item && item.dataset.foodIdx !== undefined) {
      showFoodDetail(parseInt(item.dataset.foodIdx));
    }
  });

  // Food detail back button
  safeAddListener('food-detail', 'click', (e) => {
    if (e.target.dataset.action === 'back-food-list') {
      loadFoodMenu();
    }
  });

  // Article list items
  safeAddListener('article-list', 'click', (e) => {
    const card = e.target.closest('.card');
    if (card && card.dataset.articleId) {
      showArticleDetail(card.dataset.articleId);
    }
  });

  // Article detail back button
  safeAddListener('article-detail', 'click', (e) => {
    if (e.target.dataset.action === 'back-article-list') {
      loadArticles();
    }
  });

  // Product list - buy buttons
  safeAddListener('product-list', 'click', (e) => {
    const btn = e.target.closest('[data-product-id]');
    if (btn && btn.dataset.productId) {
      buyProduct(btn.dataset.productId);
    }
  });

  // Admin panel actions
  safeAddListener('admin-panel-content', 'click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'submit-admin-article') submitAdminArticle();
    else if (action === 'submit-admin-food') submitAdminFood();
    else if (action === 'submit-admin-product') submitAdminProduct();
  });

  // Settings page admin buttons (show forms)
  safeAddListener('settings-content', 'click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'show-admin-add-article') showAdminAddArticle();
    else if (action === 'show-admin-add-food') showAdminAddFood();
    else if (action === 'show-admin-add-product') showAdminAddProduct();
    else if (action === 'show-admin-analytics') showAdminAnalytics();
  });

  // Screening domain selection — onclick property langsung (CSP-safe)
  document.querySelectorAll('.domain-btn').forEach((btn) => {
    btn.onclick = function(e) {
      e.preventDefault();
      startScreening(this.dataset.domain);
    };
  });

  // Screening answer buttons — onclick property langsung
  document.querySelectorAll('.answer-btn').forEach((btn) => {
    btn.onclick = function(e) {
      e.preventDefault();
      submitScreeningAnswer(this.dataset.answer);
    };
  });

  // Screening history items
  safeAddListener('screening-history', 'click', (e) => {
    const item = e.target.closest('.screening-history-item');
    if (item && item.dataset.sessionId) {
      viewScreeningResult(item.dataset.sessionId);
    }
  });

  // Stimulation domain filter
  safeAddListener('stim-domain-filter', 'change', () => {
    loadStimulationActivities();
  });

  // Stimulation recommendations - complete/dismiss
  safeAddListener('rec-list', 'click', (e) => {
    const btn = e.target.closest('.complete-btn, .dismiss-btn');
    if (btn && btn.dataset.recId) {
      const status = btn.classList.contains('complete-btn') ? 'completed' : 'dismissed';
      updateRecommendationStatus(btn.dataset.recId, status);
    }
  });

  // Result page - view stimulation & screening-again
  safeAddListener('result-content', 'click', (e) => {
    if (e.target.dataset.action === 'go-stimulation') {
      navigate('stimulation');
    }
    if (e.target.dataset.action === 'go-screening-again') {
      navigate('screening');
    }
  });
}

// Helper: safe add event listener (tidak throw jika element tidak ada)
function safeAddListener(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

// Fallback: init lewat DOMContentLoaded (untuk browser standard)
// Tapi juga jalan langsung karena script di akhir <body>
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ============================
// TOAST NOTIFICATION
// ============================
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => {
    toast.className = 'toast hidden';
  }, 3000);
}

// ============================
// NAVIGATION
// ============================
function navigate(page) {
  document.querySelectorAll('.page').forEach((p) => p.classList.add('hidden'));
  document.getElementById(`page-${page}`).classList.remove('hidden');
  currentPage = page;

  const navBar = document.getElementById('nav-bar');
  if (page === 'login') {
    navBar.classList.add('hidden');
  } else {
    navBar.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });
  }

  // Load data per page
  if (page === 'home') loadHomeData();
  if (page === 'tracking') loadGrowthPage();
  if (page === 'food') loadFoodMenu();
  if (page === 'knowledge') loadArticles();
  if (page === 'chat') loadChatHistory();
  if (page === 'shop') loadProducts();
  if (page === 'settings') loadSettings();
  if (page === 'screening') loadScreeningPage();
  if (page === 'stimulation') loadStimulationPage();
}

// ============================
// AUTH
// ============================
function showRegisterForm() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
}

function showLoginForm() {
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
}

async function handleLogin() {
  const identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-password').value;

  if (!identifier || !password) {
    showToast('Mohon isi semua field', 'error');
    return;
  }

  try {
    await Api.login(identifier, password);
    showToast('Login berhasil', 'success');
    navigate('home');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegister() {
  const payload = {
    identifier: document.getElementById('reg-identifier').value.trim(),
    password: document.getElementById('reg-password').value,
    full_name: document.getElementById('reg-fullname').value.trim(),
    child_name: document.getElementById('reg-childname').value.trim(),
    child_dob: document.getElementById('reg-childdob').value,
  };

  if (!payload.identifier || !payload.password || !payload.full_name || !payload.child_name || !payload.child_dob) {
    showToast('Mohon isi semua field', 'error');
    return;
  }

  try {
    await Api.register(payload);
    showToast('Registrasi berhasil!', 'success');
    navigate('home');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleLogout() {
  await Api.logout();
  navigate('login');
}

// ============================
// HOME PAGE — Beranda Baru
// ============================
async function loadHomeData() {
  const user = Api.getUser();
  if (!user) return;

  // 1. Header greeting
  const nameParts = (user.full_name || '').split(' ');
  const firstName = nameParts[0] || 'Pengguna';
  document.getElementById('home-greeting').textContent = `Hi, ${firstName}!`;

  // 2. Child Profile
  await loadChildProfile(user);

  // 3. Daily Summary (tidur, menyusui, minum, BAB, BAK)
  await loadDailySummary();

  // 4. Development Today
  await loadDevelopmentToday(user);

  // 5. Growth summary (ringkasan data BB/TB/LK & screening)
  await loadBerandaGrowthRingkasan();

  // 6. Reminders
  await loadReminders();
}

// === 2. Child Profile ===
async function loadChildProfile(user) {
  const childName = user.child_name || 'Anak';
  const age = calculateAgeMonths(user.child_dob);
  const dob = user.child_dob ? new Date(user.child_dob) : null;
  let extraDays = 0;
  if (dob) {
    const diff = new Date() - dob;
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    extraDays = totalDays % 30;
  }

  document.getElementById('child-name').textContent = childName;
  document.getElementById('child-age').textContent = `${age} bulan ${extraDays} hari`;

  // Avatar initial
  const initial = (childName.charAt(0) || '·').toUpperCase();
  document.getElementById('child-avatar').textContent = initial;

  // Ambil data pertumbuhan terakhir
  try {
    const data = await Api.getGrowthRecords();
    const latest = data.records && data.records[0];
    if (latest) {
      document.getElementById('stat-bb').textContent = latest.weight_kg != null ? `${latest.weight_kg} kg` : '-';
      document.getElementById('stat-tb').textContent = latest.height_cm != null ? `${latest.height_cm} cm` : '-';
      document.getElementById('stat-lk').textContent = latest.head_circumference_cm != null ? `${latest.head_circumference_cm} cm` : '-';

      // Status gizi sederhana
      const bb = parseFloat(latest.weight_kg);
      const nutStatus = document.getElementById('nutrition-status');
      if (bb > 0) {
        // Estimasi sederhana berdasarkan BB rata-rata per usia
        if (bb < 2.5) nutStatus.textContent = '🔴 Risiko';
        else if (bb < 5) nutStatus.textContent = '🟡 Perlu Perhatian';
        else nutStatus.textContent = '✅ Gizi Baik';
      } else {
        nutStatus.textContent = '✅ Gizi Baik';
      }
    } else {
      // Fallback — tampilin apa yang ada dari user
      document.getElementById('stat-bb').textContent = '-';
      document.getElementById('stat-tb').textContent = '-';
      document.getElementById('stat-lk').textContent = '-';
    }
  } catch (e) {
    console.error('Failed to load growth for profile:', e);
  }
}

// === 3. Daily Summary ===
async function loadDailySummary() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const data = await Api.getDailySummary(today);
    const s = data.summary || {};

    // Tidur
    const sleepVal = document.getElementById('tracker-sleep-value');
    const sleepTime = document.getElementById('tracker-sleep-time');
    if (s.sleep && s.sleep.total_minutes > 0) {
      const hrs = Math.floor(s.sleep.total_minutes / 60);
      const min = s.sleep.total_minutes % 60;
      sleepVal.textContent = `${hrs}j ${min}m`;
      sleepTime.textContent = s.sleep.last_record ? s.sleep.last_record.slice(0, 5) : '-';
    } else {
      sleepVal.textContent = 'Belum';
      sleepTime.textContent = '—';
    }

    // Menyusui
    const feedVal = document.getElementById('tracker-feeding-value');
    const feedTime = document.getElementById('tracker-feeding-time');
    if (s.feeding && s.feeding.count > 0) {
      feedVal.textContent = `${s.feeding.count}x`;
      feedTime.textContent = s.feeding.last_record ? s.feeding.last_record.slice(0, 5) : '-';
    } else {
      feedVal.textContent = '0';
      feedTime.textContent = '—';
    }

    // Minum
    const drinkVal = document.getElementById('tracker-drink-value');
    const drinkTime = document.getElementById('tracker-drink-time');
    if (s.drink && s.drink.count > 0) {
      drinkVal.textContent = `${s.drink.total_ml || 0} ml`;
      drinkTime.textContent = s.drink.last_record ? s.drink.last_record.slice(0, 5) : '-';
    } else {
      drinkVal.textContent = '0';
      drinkTime.textContent = '—';
    }

    // BAB
    const poopVal = document.getElementById('tracker-poop-value');
    const poopTime = document.getElementById('tracker-poop-time');
    if (s.poop && s.poop.count > 0) {
      poopVal.textContent = `${s.poop.count}x`;
      poopTime.textContent = s.poop.last_record ? s.poop.last_record.slice(0, 5) : '-';
    } else {
      poopVal.textContent = '0';
      poopTime.textContent = '—';
    }

    // BAK
    const peeVal = document.getElementById('tracker-pee-value');
    const peeTime = document.getElementById('tracker-pee-time');
    if (s.pee && s.pee.count > 0) {
      peeVal.textContent = `${s.pee.count}x`;
      peeTime.textContent = s.pee.last_record ? s.pee.last_record.slice(0, 5) : '-';
    } else {
      peeVal.textContent = '0';
      peeTime.textContent = '—';
    }
  } catch (err) {
    console.error('Failed to load daily summary:', err);
    document.querySelectorAll('.tracker-value').forEach(el => el.textContent = '!');
  }
}

// === 4. Development Today ===
async function loadDevelopmentToday(user) {
  const age = calculateAgeMonths(user.child_dob);
  try {
    const data = await Api.getDevelopmentToday(age);
    const dev = data.development || {};
    document.getElementById('dev-title').textContent = `${age} Bulan`;
    document.getElementById('dev-text').textContent = dev.tip || 'Pantau terus tumbuh kembang si kecil!';
  } catch (e) {
    document.getElementById('dev-title').textContent = `${age} Bulan`;
    document.getElementById('dev-text').textContent = 'Pantau terus tumbuh kembang si kecil!';
  }
}

// === 5. Growth & Screening Ringkasan (dipertahankan dari versi lama) ===
async function loadBerandaGrowthRingkasan() {
  let html = '';
  // Growth
  try {
    const growthData = await Api.getGrowthRecords();
    const latest = growthData.records && growthData.records[0];
    if (latest) {
      const parts = [];
      if (latest.weight_kg != null) parts.push(`<span class="g-metric"><b>${latest.weight_kg}</b> kg</span>`);
      if (latest.height_cm != null) parts.push(`<span class="g-metric"><b>${latest.height_cm}</b> cm</span>`);
      if (latest.head_circumference_cm != null) parts.push(`<span class="g-metric">LK <b>${latest.head_circumference_cm}</b> cm</span>`);
      html += `<div class="card" style="cursor:default;"><p class="cat">📏 Pertumbuhan Terakhir</p><div class="g-metric-row">${parts.join('')}</div><small>${formatDate(latest.record_date)}</small></div>`;
    }
  } catch (e) { /* skip */ }

  // Screening ringkasan
  try {
    const screenData = await Api.getScreeningSessions(null, 5);
    const sessions = screenData.sessions || [];
    if (sessions.length > 0) {
      const byDomain = {};
      sessions.forEach(s => { if (!byDomain[s.domain]) byDomain[s.domain] = s; });
      html += Object.entries(byDomain).map(([dom, s]) => {
        const icon = s.result === 'sesuai' ? '✅' : (s.result === 'meragukan' ? '⚠️' : '❌');
        return `<div class="card" style="cursor:default;"><p class="cat">${domainLabel(dom)}</p><p class="desc">${icon} Skor: <b>${s.score_percentage || '-'}%</b></p><small>${s.completed_at ? formatDate(s.completed_at) : ''}</small></div>`;
      }).join('');
    }
  } catch (e) { /* skip */ }

  const container = document.getElementById('home-recent-tracking');
  container.innerHTML = html || '<p class="info-text">Belum ada data. Mulai catat tumbuh kembang!</p>';
}

// === 6. Reminders ===
async function loadReminders() {
  const container = document.getElementById('reminders-list');
  try {
    const data = await Api.getReminders();
    const reminders = data.reminders || [];
    if (reminders.length === 0) {
      container.innerHTML = '<p class="info-text">Tidak ada pengingat.</p>';
      return;
    }
    container.innerHTML = reminders.slice(0, 3).map(r => {
      const icon = r.type === 'imunisasi' ? '💉' : '🏥';
      const days = r.days_left > 0 ? `${r.days_left} hari lagi` : 'Hari ini';
      return `<div class="reminder-item"><span>${icon} ${escapeHtml(r.title)}</span><span class="reminder-days">${days}</span></div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<p class="info-text">Tidak ada pengingat.</p>';
  }
}

// === Quick Add Tracker ===
function openQuickAdd(trackerType) {
  const modal = document.getElementById('quickadd-modal');
  const title = document.getElementById('quickadd-title');
  const fields = document.getElementById('quickadd-fields');
  const today = new Date().toISOString().split('T')[0];

  const configs = {
    sleep: { title: '😴 Tambah Tidur', html: `
      <div class="form-group"><label>Jam Mulai Tidur</label><input type="time" id="qa-sleep-start"></div>
      <div class="form-group"><label>Jam Bangun</label><input type="time" id="qa-sleep-end"></div>
      <div class="form-group"><label>Catatan</label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
    `},
    feeding: { title: '🍼 Tambah Menyusui', html: `
      <div class="form-group"><label>Jenis</label>
        <select id="qa-feeding-type"><option value="ASI">ASI</option><option value="Susu Formula">Susu Formula</option><option value="MPASI">MPASI</option></select>
      </div>
      <div class="form-group"><label>Jumlah (ml)</label><input type="number" step="1" min="0" id="qa-amount"></div>
      <div class="form-group"><label>Durasi (menit)</label><input type="number" min="0" id="qa-duration"></div>
      <div class="form-group"><label>Catatan</label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
    `},
    drink: { title: '💧 Tambah Minum', html: `
      <div class="form-group"><label>Jumlah (ml)</label><input type="number" step="1" min="0" id="qa-amount" value="100"></div>
      <div class="form-group"><label>Catatan</label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
    `},
    pee: { title: '🚽 Tambah BAK', html: `
      <div class="form-group"><label>Jumlah</label><input type="number" min="1" id="qa-count" value="1"></div>
      <div class="form-group"><label>Catatan</label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
    `},
    poop: { title: '💩 Tambah BAB', html: `
      <div class="form-group"><label>Jumlah</label><input type="number" min="1" id="qa-count" value="1"></div>
      <div class="form-group"><label>Konsistensi</label>
        <select id="qa-consistency"><option value="normal">Normal</option><option value="cair">Cair (diare)</option><option value="keras">Keras (sembelit)</option><option value="lendir">Berlendir</option></select>
      </div>
      <div class="form-group"><label>Catatan</label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
    `},
  };

  const config = configs[trackerType] || configs.sleep;
  title.textContent = config.title;
  fields.innerHTML = config.html + `<input type="hidden" id="qa-type" value="${trackerType}">`;
  modal.classList.remove('hidden');
}

async function submitQuickAdd() {
  const type = document.getElementById('qa-type').value;
  const today = new Date().toISOString().split('T')[0];
  let payload = { record_date: today };

  try {
    switch (type) {
      case 'sleep': {
        payload.sleep_start = document.getElementById('qa-sleep-start').value || null;
        payload.sleep_end = document.getElementById('qa-sleep-end').value || null;
        if (payload.sleep_start && payload.sleep_end) {
          const [sh, sm] = payload.sleep_start.split(':');
          const [eh, em] = payload.sleep_end.split(':');
          let minutes = (parseInt(eh) * 60 + parseInt(em)) - (parseInt(sh) * 60 + parseInt(sm));
          if (minutes < 0) minutes += 1440; // melewati tengah malam
          payload.duration_minutes = minutes;
        }
        payload.notes = document.getElementById('qa-notes').value.trim() || null;
        await Api.createDailySleep(payload);
        break;
      }
      case 'feeding': {
        payload.feeding_type = document.getElementById('qa-feeding-type').value;
        const amt = document.getElementById('qa-amount').value;
        if (amt) payload.amount_ml = parseFloat(amt);
        const dur = document.getElementById('qa-duration').value;
        if (dur) payload.duration_minutes = parseInt(dur);
        payload.notes = document.getElementById('qa-notes').value.trim() || null;
        await Api.createDailyFeeding(payload);
        break;
      }
      case 'drink': {
        const amt = document.getElementById('qa-amount').value;
        payload.amount_ml = amt ? parseFloat(amt) : 100;
        payload.notes = document.getElementById('qa-notes').value.trim() || null;
        await Api.createDailyDrink(payload);
        break;
      }
      case 'pee': {
        const cnt = document.getElementById('qa-count').value;
        payload.count = cnt ? parseInt(cnt) : 1;
        payload.notes = document.getElementById('qa-notes').value.trim() || null;
        await Api.createDailyPee(payload);
        break;
      }
      case 'poop': {
        const cnt = document.getElementById('qa-count').value;
        payload.count = cnt ? parseInt(cnt) : 1;
        payload.consistency = document.getElementById('qa-consistency').value;
        payload.notes = document.getElementById('qa-notes').value.trim() || null;
        await Api.createDailyPoop(payload);
        break;
      }
    }
    showToast('Data tersimpan', 'success');
    document.getElementById('quickadd-modal').classList.add('hidden');
    await loadDailySummary(); // refresh
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan', 'error');
  }
}

// === AI Chat (dari floating button) ===
function openAIChat() {
  document.getElementById('ai-overlay').classList.remove('hidden');
  document.getElementById('ai-messages').innerHTML = '<div class="chat-bubble bot">Halo! 👋 Ada yang bisa saya bantu seputar pengasuhan si kecil?</div>';
  document.getElementById('ai-input').value = '';
  document.getElementById('ai-input').focus();
}

async function sendAIChat() {
  const input = document.getElementById('ai-input');
  const msg = input.value.trim();
  if (!msg) return;

  const container = document.getElementById('ai-messages');
  container.innerHTML += `<div class="chat-bubble user">${escapeHtml(msg)}</div>`;
  input.value = '';
  container.scrollTop = container.scrollHeight;

  try {
    const data = await Api.askDailyAI(msg);
    container.innerHTML += `<div class="chat-bubble bot">${escapeHtml(data.reply)}</div>`;
  } catch (err) {
    container.innerHTML += `<div class="chat-bubble bot">Maaf, saya belum bisa menjawab sekarang. Coba lagi ya!</div>`;
  }
  container.scrollTop = container.scrollHeight;
}

// === Growth dari Beranda ===
async function submitHomeGrowth() {
  const weight = document.getElementById('hg-weight').value;
  const height = document.getElementById('hg-height').value;
  const head = document.getElementById('hg-head').value;
  const notes = document.getElementById('hg-notes').value.trim();

  if (!weight && !height && !head) {
    showToast('Isi minimal salah satu: berat, tinggi, atau lingkar kepala', 'error');
    return;
  }

  try {
    await Api.createGrowthRecord({
      weight_kg: weight || null,
      height_cm: height || null,
      head_circumference_cm: head || null,
      record_date: new Date().toISOString().split('T')[0],
      notes: notes || null,
    });
    showToast('Data pertumbuhan tersimpan', 'success');
    document.getElementById('growth-modal').classList.add('hidden');
    document.getElementById('hg-weight').value = '';
    document.getElementById('hg-height').value = '';
    document.getElementById('hg-head').value = '';
    document.getElementById('hg-notes').value = '';
    await loadChildProfile(Api.getUser()); // refresh
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// === Modal Close (generic) ===
function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('hidden');
}

function calculateAgeMonths(dob) {
  if (!dob) return '-';
  const diff = new Date() - new Date(dob);
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function entryTypeLabel(type) {
  const labels = {
    speech: 'Bicara',
    behavior: 'Perilaku',
    illness: 'Kesehatan',
    sleep: 'Tidur',
    motor: 'Motorik',
    other: 'Lainnya',
  };
  return labels[type] || type;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================
// TRACKING PAGE
// ============================
function selectTrackingType(type, label) {
  selectedTrackingType = type;
  document.getElementById('tracking-categories').classList.add('hidden');
  document.getElementById('tracking-form').classList.remove('hidden');
  document.getElementById('tracking-selected-cat').textContent = `Kategori: ${label.trim()}`;
}

function selectSeverity(severity) {
  selectedSeverity = severity;
  document.querySelectorAll('.severity-btn').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.severity === severity);
  });
}

function cancelTrackingForm() {
  document.getElementById('tracking-form').classList.add('hidden');
  document.getElementById('tracking-categories').classList.remove('hidden');
  document.getElementById('tracking-description').value = '';
  selectedTrackingType = null;
  selectedSeverity = 'normal';
}

async function submitTracking() {
  const description = document.getElementById('tracking-description').value.trim();
  const date = document.getElementById('tracking-date').value;

  if (!description) {
    showToast('Mohon isi deskripsi', 'error');
    return;
  }

  try {
    await Api.createTrackingEntry({
      entry_type: selectedTrackingType,
      description,
      severity: selectedSeverity,
      date,
    });
    showToast('Tracking berhasil disimpan', 'success');
    cancelTrackingForm();
    loadTrackingList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadTrackingList() {
  // Reset form state saat masuk halaman
  selectedTrackingType = null;
  selectedSeverity = 'normal';
  document.getElementById('tracking-categories').classList.remove('hidden');
  document.getElementById('tracking-form').classList.add('hidden');
  document.getElementById('tracking-description').value = '';
  document.querySelectorAll('.severity-btn').forEach((btn) => btn.classList.remove('selected'));

  try {
    const data = await Api.getTrackingEntries();
    const container = document.getElementById('tracking-list');

    if (data.entries.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML =
      '<h3 style="margin-top: 16px;">Riwayat Tracking</h3>' +
      data.entries
        .map(
          (entry) => `
      <div class="card" data-entry-id="${entry.id}">
        <p class="cat">${entryTypeLabel(entry.entry_type)}</p>
        <p class="desc">${escapeHtml(entry.description)}</p>
        <span class="severity-badge severity-${entry.severity}">${entry.severity}</span>
        <br><small>${formatDate(entry.date)}</small>
        ${entry.ai_insight ? `<p style="margin-top: 6px; font-size: 11px; color: #003DA5; font-style: italic;">🤖 ${escapeHtml(entry.ai_insight)}</p>` : '<p style="margin-top: 6px; font-size: 11px; color: #666;">Tap untuk AI insight</p>'}
      </div>
    `
        )
        .join('');
  } catch (err) {
    console.error('Failed to load tracking list:', err);
  }
}

async function getAiInsightFor(entryId) {
  showToast('Meminta AI insight...', 'info');
  try {
    await Api.getAiInsight(entryId);
    showToast('AI insight berhasil didapat', 'success');
    loadTrackingList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// TUMBUH KEMBANG (GROWTH TRACKER) PAGE
// ============================
function loadGrowthPage() {
  // Default ke tab Pertumbuhan setiap kali masuk halaman
  switchGrowthTab('growth');
}

function switchGrowthTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.add('hidden'));
  const active = document.getElementById(`tab-${tab}`);
  if (active) active.classList.remove('hidden');

  if (tab === 'growth') loadGrowthTab();
  else if (tab === 'immunization') loadImmunizationTab();
  else if (tab === 'screening') loadScreeningProgressTab();
}

// ---- Pertumbuhan (BB/TB/LK) ----
async function loadGrowthTab() {
  const container = document.getElementById('growth-history');
  if (!container) return;
  try {
    const data = await Api.getGrowthRecords();
    const records = data.records || [];
    if (records.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada data pertumbuhan.</p>';
      return;
    }
    container.innerHTML =
      '<h3 style="margin-bottom:12px;">Riwayat Pertumbuhan</h3>' +
      records
        .map((r) => {
          const parts = [];
          if (r.weight_kg != null) parts.push(`<span class="g-metric">BB <b>${r.weight_kg}</b> kg</span>`);
          if (r.height_cm != null) parts.push(`<span class="g-metric">TB <b>${r.height_cm}</b> cm</span>`);
          if (r.head_circumference_cm != null) parts.push(`<span class="g-metric">LK <b>${r.head_circumference_cm}</b> cm</span>`);
          return `
        <div class="growth-card">
          <div class="g-metric-row">${parts.join('')}</div>
          ${r.notes ? `<p class="desc">${escapeHtml(r.notes)}</p>` : ''}
          <small>${formatDate(r.record_date)}</small>
        </div>`;
        })
        .join('');
  } catch (err) {
    console.error('Failed to load growth tab:', err);
    container.innerHTML = '<p class="info-text">Gagal memuat data pertumbuhan.</p>';
  }
}

async function submitGrowthRecord() {
  const weight = document.getElementById('growth-weight').value;
  const height = document.getElementById('growth-height').value;
  const head = document.getElementById('growth-head').value;
  const date = document.getElementById('growth-date').value;
  const notes = document.getElementById('growth-notes').value.trim();

  if (!date) {
    showToast('Mohon isi tanggal', 'error');
    return;
  }
  if (!weight && !height && !head) {
    showToast('Isi minimal salah satu: berat, tinggi, atau lingkar kepala', 'error');
    return;
  }

  try {
    await Api.createGrowthRecord({
      weight_kg: weight || null,
      height_cm: height || null,
      head_circumference_cm: head || null,
      record_date: date,
      notes: notes || null,
    });
    showToast('Data pertumbuhan tersimpan', 'success');
    document.getElementById('growth-weight').value = '';
    document.getElementById('growth-height').value = '';
    document.getElementById('growth-head').value = '';
    document.getElementById('growth-notes').value = '';
    loadGrowthTab();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---- Imunisasi ----
function updateImmunizationAge() {
  const ageField = document.getElementById('imm-age');
  const user = Api.getUser();
  if (!ageField || !user || !user.child_dob) return;
  const immDate = document.getElementById('imm-date').value;
  const ref = immDate ? new Date(immDate) : new Date();
  const months = Math.floor((ref - new Date(user.child_dob)) / (1000 * 60 * 60 * 24 * 30));
  ageField.value = months >= 0 ? `${months} bulan` : '';
}

async function loadImmunizationTab() {
  updateImmunizationAge();
  const container = document.getElementById('immunization-history');
  if (!container) return;
  try {
    const data = await Api.getImmunizationRecords();
    const records = data.records || [];
    if (records.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada data imunisasi.</p>';
      return;
    }
    container.innerHTML =
      '<h3 style="margin-bottom:12px;">Riwayat Imunisasi</h3>' +
      records
        .map((r) => {
          const meta = [];
          if (r.age_in_months != null) meta.push(`Usia ${r.age_in_months} bulan`);
          if (r.given_by) meta.push(escapeHtml(r.given_by));
          if (r.location) meta.push(escapeHtml(r.location));
          return `
        <div class="imm-card">
          <p class="imm-name">💉 ${escapeHtml(r.vaccine_name)}</p>
          ${meta.length ? `<p class="desc">${meta.join(' · ')}</p>` : ''}
          ${r.notes ? `<p class="desc">${escapeHtml(r.notes)}</p>` : ''}
          <small>${formatDate(r.immunization_date)}</small>
          ${r.next_schedule ? `<p class="imm-next">📅 Jadwal berikutnya: ${formatDate(r.next_schedule)}</p>` : ''}
        </div>`;
        })
        .join('');
  } catch (err) {
    console.error('Failed to load immunization tab:', err);
    container.innerHTML = '<p class="info-text">Gagal memuat data imunisasi.</p>';
  }
}

async function submitImmunizationRecord() {
  const vaccine = document.getElementById('imm-vaccine').value.trim();
  const date = document.getElementById('imm-date').value;
  const givenBy = document.getElementById('imm-given-by').value.trim();
  const location = document.getElementById('imm-location').value.trim();
  const notes = document.getElementById('imm-notes').value.trim();
  const next = document.getElementById('imm-next').value;

  if (!vaccine) {
    showToast('Mohon isi nama vaksin', 'error');
    return;
  }
  if (!date) {
    showToast('Mohon isi tanggal imunisasi', 'error');
    return;
  }

  // Hitung usia otomatis dari tanggal lahir anak
  const user = Api.getUser();
  let ageInMonths = null;
  if (user && user.child_dob) {
    const m = Math.floor((new Date(date) - new Date(user.child_dob)) / (1000 * 60 * 60 * 24 * 30));
    if (m >= 0) ageInMonths = m;
  }

  try {
    await Api.createImmunizationRecord({
      vaccine_name: vaccine,
      immunization_date: date,
      age_in_months: ageInMonths,
      given_by: givenBy || null,
      location: location || null,
      notes: notes || null,
      next_schedule: next || null,
    });
    showToast('Data imunisasi tersimpan', 'success');
    document.getElementById('imm-vaccine').value = '';
    document.getElementById('imm-given-by').value = '';
    document.getElementById('imm-location').value = '';
    document.getElementById('imm-notes').value = '';
    document.getElementById('imm-next').value = '';
    loadImmunizationTab();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---- Progres Screening per domain ----
async function loadScreeningProgressTab() {
  const container = document.getElementById('screening-progress-content');
  if (!container) return;
  const domains = ['cognitive', 'speech', 'immunity', 'motor'];
  try {
    const data = await Api.getScreeningProgress();
    const byDomain = {};
    (data.progress || []).forEach((p) => {
      byDomain[p.domain] = p;
    });

    container.innerHTML = domains
      .map((dom) => {
        const p = byDomain[dom];
        if (!p) {
          return `
        <div class="growth-card">
          <p class="cat">${domainLabel(dom)}</p>
          <p class="info-text">Belum pernah diskrining.</p>
        </div>`;
        }
        const icon = p.latest_result === 'sesuai' ? '✅' : p.latest_result === 'meragukan' ? '⚠️' : '❌';
        const history = (p.scores || [])
          .map((s) => `<span class="g-metric">${s.score_percentage}% <small>(${formatDate(s.date)})</small></span>`)
          .join('');
        return `
        <div class="growth-card">
          <p class="cat">${domainLabel(dom)}</p>
          <p class="desc">${icon} Skor terakhir: <b>${p.latest_score != null ? p.latest_score + '%' : '-'}</b> · ${p.sessions_count}x skrining</p>
          <small>Terakhir: ${p.latest_date ? formatDate(p.latest_date) : '-'}</small>
          ${history ? `<div class="g-metric-row" style="margin-top:8px;">${history}</div>` : ''}
        </div>`;
      })
      .join('');
  } catch (err) {
    console.error('Failed to load screening progress:', err);
    container.innerHTML = '<p class="info-text">Gagal memuat progres skrining.</p>';
  }
}

// ============================
// FOOD MENU PAGE
// ============================
async function loadFoodMenu() {
  try {
    const data = await Api.getFoodMenu();
    foodsCache = data.foods;
    const container = document.getElementById('food-list');
    document.getElementById('food-detail').classList.add('hidden');
    container.classList.remove('hidden');

    if (data.foods.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada menu makanan.</p>';
      return;
    }

    container.innerHTML = data.foods
      .map(
        (food, idx) => `
      <button class="food-item" data-food-idx="${idx}">
        <span class="emoji">🍽️</span>
        <div>
          <p class="name">${escapeHtml(food.name)}</p>
          <p class="age">${escapeHtml(food.age_range)}</p>
        </div>
      </button>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load food menu:', err);
  }
}

function showFoodDetail(idx) {
  const food = foodsCache[idx];
  document.getElementById('food-list').classList.add('hidden');
  const detail = document.getElementById('food-detail');
  detail.classList.remove('hidden');

  detail.innerHTML = `
    <button class="btn-secondary" data-action="back-food-list" style="text-align: center;">← Kembali</button>
    <div style="text-align: center; margin: 16px 0;">
      <div style="font-size: 50px;">🍽️</div>
      <h2 style="color: #003DA5; margin: 8px 0 4px;">${escapeHtml(food.name)}</h2>
      <p class="info-text">Usia: ${escapeHtml(food.age_range)}</p>
    </div>
    <div class="card" style="border-left: none;">
      <p class="cat">Manfaat:</p>
      <p class="desc">${escapeHtml(food.benefits)}</p>
    </div>
    <div class="card" style="border-left: none;">
      <p class="cat">Cara Membuat:</p>
      <p class="desc">${escapeHtml(food.recipe)}</p>
    </div>
  `;
}

// ============================
// KNOWLEDGE BASE PAGE
// ============================
async function loadArticles() {
  try {
    const data = await Api.getArticles();
    articlesCache = data.articles;
    const container = document.getElementById('article-list');
    document.getElementById('article-detail').classList.add('hidden');
    container.classList.remove('hidden');

    if (data.articles.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada artikel.</p>';
      return;
    }

    container.innerHTML = data.articles
      .map(
        (article, idx) => `
      <div class="card" data-article-id="${article.id}">
        <p class="cat">${escapeHtml(article.category)}</p>
        <p class="title">${escapeHtml(article.title)}</p>
        <p class="desc">${escapeHtml(article.summary)}</p>
      </div>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load articles:', err);
  }
}

async function showArticleDetail(id) {
  try {
    const data = await Api.getArticle(id);
    const article = data.article;

    document.getElementById('article-list').classList.add('hidden');
    const detail = document.getElementById('article-detail');
    detail.classList.remove('hidden');

    detail.innerHTML = `
      <button class="btn-secondary" data-action="back-article-list" style="text-align: center;">← Kembali</button>
      <h2 style="color: #003DA5; margin: 12px 0 8px; font-size: 17px;">${escapeHtml(article.title)}</h2>
      <p style="font-size: 13px; color: #1A1A1A; line-height: 1.6; margin-bottom: 16px;">${escapeHtml(article.content).replace(/\n/g, '<br><br>')}</p>
      ${article.red_flags ? `
        <div class="card" style="border-left-color: #EF4444; background: #FEE2E2;">
          <p class="cat" style="color: #991B1B;">⚠️ Tanda Perlu Diwaspadai:</p>
          <p class="desc" style="color: #1A1A1A;">${escapeHtml(article.red_flags)}</p>
        </div>
      ` : ''}
      ${article.when_to_see_doctor ? `
        <div class="card" style="border-left-color: #F59E0B; background: #FEF3C7;">
          <p class="cat" style="color: #92400E;">🏥 Kapan ke Dokter:</p>
          <p class="desc" style="color: #1A1A1A;">${escapeHtml(article.when_to_see_doctor)}</p>
        </div>
      ` : ''}
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// CHAT PAGE
// ============================
async function loadChatHistory() {
  const container = document.getElementById('chat-messages');
  try {
    const data = await Api.getChatHistory();
    if (data.history.length === 0) {
      container.innerHTML = `
        <div class="chat-bubble bot">
          Halo! 👋 Saya siap membantu. Tanya tentang produk Generos atau tips parenting umum.
        </div>
      `;
    } else {
      container.innerHTML = data.history
        .map(
          (msg) => `
        <div class="chat-bubble ${msg.message_type === 'user' ? 'user' : 'bot'}">
          ${escapeHtml(msg.message_content)}
        </div>
      `
        )
        .join('');
    }
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    console.error('Failed to load chat history:', err);
  }
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  const container = document.getElementById('chat-messages');
  container.innerHTML += `<div class="chat-bubble user">${escapeHtml(message)}</div>`;
  input.value = '';
  container.scrollTop = container.scrollHeight;

  try {
    const data = await Api.sendChatMessage(message);
    container.innerHTML += `<div class="chat-bubble bot">${escapeHtml(data.reply)}</div>`;
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// SHOP PAGE
// ============================
async function loadProducts() {
  try {
    const data = await Api.getProducts();
    const container = document.getElementById('product-list');

    if (data.products.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada produk.</p>';
      return;
    }

    container.innerHTML = data.products
      .map(
        (product) => `
      <div class="product-card">
        <h3>${escapeHtml(product.name)}</h3>
        <p class="price">Rp ${Number(product.price).toLocaleString('id-ID')}</p>
        <button data-product-id="${product.id}">🛒 Beli di Shopee</button>
      </div>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

async function buyProduct(productId) {
  try {
    const data = await Api.trackProductClick(productId);
    window.open(data.redirect_url, '_blank');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// SETTINGS PAGE
// ============================
function loadSettings() {
  const user = Api.getUser();
  const container = document.getElementById('settings-content');

  if (!user) return;

  let html = `
    <div class="card" style="border-left: none;">
      <p class="cat">Nama Anda</p>
      <p class="title">${escapeHtml(user.full_name)}</p>
    </div>
    <div class="card" style="border-left: none;">
      <p class="cat">Nama Anak</p>
      <p class="title">${escapeHtml(user.child_name)}</p>
    </div>
  `;

  if (user.role === 'admin') {
    html += `
      <div class="admin-section" style="margin-top: 20px;">
        <h4>🔧 Admin Panel</h4>
        <button class="btn-secondary" data-action="show-admin-add-article">➕ Tambah Artikel</button>
        <button class="btn-secondary" data-action="show-admin-add-food">➕ Tambah Menu Makanan</button>
        <button class="btn-secondary" data-action="show-admin-add-product">➕ Tambah Produk</button>
        <button class="btn-secondary" data-action="show-admin-analytics">📊 Lihat Analytics</button>
        <div id="admin-panel-content"></div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ============================
// ADMIN FUNCTIONS
// ============================
function showAdminAddArticle() {
  const panel = document.getElementById('admin-panel-content');
  panel.innerHTML = `
    <div class="form-group"><label>Judul</label><input type="text" id="adm-art-title"></div>
    <div class="form-group"><label>Kategori</label>
      <select id="adm-art-category" style="width:100%; padding:10px; border:2px solid #E5E7EB; border-radius:8px;">
        <option value="speech">Bicara</option>
        <option value="immunity">Imunitas</option>
        <option value="brain">Otak</option>
        <option value="tantrum">Tantrum</option>
        <option value="adhd">ADHD</option>
        <option value="autism">Autisme</option>
        <option value="other">Lainnya</option>
      </select>
    </div>
    <div class="form-group"><label>Ringkasan</label><textarea id="adm-art-summary"></textarea></div>
    <div class="form-group"><label>Konten</label><textarea id="adm-art-content" style="height:120px;"></textarea></div>
    <div class="form-group"><label>Tanda Bahaya (opsional)</label><textarea id="adm-art-redflags"></textarea></div>
    <div class="form-group"><label>Kapan ke Dokter (opsional)</label><textarea id="adm-art-doctor"></textarea></div>
    <button class="btn-primary" data-action="submit-admin-article">Simpan Artikel</button>
  `;
}

async function submitAdminArticle() {
  try {
    await Api.createArticle({
      title: document.getElementById('adm-art-title').value,
      category: document.getElementById('adm-art-category').value,
      summary: document.getElementById('adm-art-summary').value,
      content: document.getElementById('adm-art-content').value,
      red_flags: document.getElementById('adm-art-redflags').value,
      when_to_see_doctor: document.getElementById('adm-art-doctor').value,
    });
    showToast('Artikel berhasil ditambahkan', 'success');
    document.getElementById('admin-panel-content').innerHTML = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function showAdminAddFood() {
  const panel = document.getElementById('admin-panel-content');
  panel.innerHTML = `
    <div class="form-group"><label>Nama Makanan</label><input type="text" id="adm-food-name"></div>
    <div class="form-group"><label>Rentang Usia</label><input type="text" id="adm-food-age" placeholder="contoh: 8-12 bulan"></div>
    <div class="form-group"><label>Manfaat</label><textarea id="adm-food-benefits"></textarea></div>
    <div class="form-group"><label>Resep</label><textarea id="adm-food-recipe"></textarea></div>
    <button class="btn-primary" data-action="submit-admin-food">Simpan Menu</button>
  `;
}

async function submitAdminFood() {
  try {
    await Api.createFood({
      name: document.getElementById('adm-food-name').value,
      age_range: document.getElementById('adm-food-age').value,
      benefits: document.getElementById('adm-food-benefits').value,
      recipe: document.getElementById('adm-food-recipe').value,
    });
    showToast('Menu makanan berhasil ditambahkan', 'success');
    document.getElementById('admin-panel-content').innerHTML = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function showAdminAddProduct() {
  const panel = document.getElementById('admin-panel-content');
  panel.innerHTML = `
    <div class="form-group"><label>Nama Produk</label><input type="text" id="adm-prod-name"></div>
    <div class="form-group"><label>Harga (Rp)</label><input type="number" id="adm-prod-price"></div>
    <div class="form-group"><label>Link Shopee</label><input type="text" id="adm-prod-link" placeholder="https://shopee.co.id/..."></div>
    <button class="btn-primary" data-action="submit-admin-product">Simpan Produk</button>
  `;
}

async function submitAdminProduct() {
  try {
    await Api.createProduct({
      name: document.getElementById('adm-prod-name').value,
      price: parseFloat(document.getElementById('adm-prod-price').value),
      shopee_link: document.getElementById('adm-prod-link').value,
    });
    showToast('Produk berhasil ditambahkan', 'success');
    document.getElementById('admin-panel-content').innerHTML = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function showAdminAnalytics() {
  const panel = document.getElementById('admin-panel-content');
  try {
    const data = await Api.getClickAnalytics();
    panel.innerHTML =
      '<h4 style="margin-top:12px;">Klik Produk</h4>' +
      data.analytics
        .map((item) => `<div class="card" style="border-left:none;"><p class="title">${escapeHtml(item.name)}</p><p class="desc">${item.click_count} klik</p></div>`)
        .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// DOMAIN LABEL HELPERS
// ============================
const domainLabels = {
  cognitive: 'Kecerdasan 🧠',
  speech: 'Bicara 💬',
  immunity: 'Imunitas 🛡️',
  motor: 'Motorik 🚶',
};

const domainEmojis = {
  cognitive: '🧠',
  speech: '💬',
  immunity: '🛡️',
  motor: '🚶',
};

function domainLabel(domain) {
  return domainLabels[domain] || domain;
}

// ============================
// SCREENING FUNCTIONS
// ============================

// State
let screeningQuestions = [];
let screeningCurrentIndex = 0;
let screeningSessionId = null;
let screeningDomain = null;

function loadScreeningPage() {
  // Reset form
  document.getElementById('screening-domain-select').classList.remove('hidden');
  document.getElementById('screening-questions').classList.add('hidden');
  document.getElementById('screening-scoring').classList.add('hidden');
  screeningQuestions = [];
  screeningCurrentIndex = 0;
  screeningSessionId = null;
  screeningDomain = null;

  loadScreeningHistory();
}

async function loadScreeningHistory() {
  try {
    const data = await Api.getScreeningSessions(null, 5);
    const container = document.getElementById('screening-history');

    if (!data.sessions || data.sessions.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = '<h3 style="margin-bottom:12px;">📋 Riwayat Skrining</h3>' +
      data.sessions.map(s => {
        const label = domainLabel(s.domain);
        const zoneIcon = s.result === 'sesuai' ? '✅' : (s.result === 'meragukan' ? '⚠️' : '❌');
        return `
          <div class="screening-history-item" data-session-id="${s.id}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span class="domain">${label}</span>
              <span class="score">${zoneIcon} ${s.score_percentage}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
              <span class="date">${formatDate(s.completed_at || s.started_at)}</span>
              <span style="font-size:11px;color:var(--text-light);">${s.total_questions} pertanyaan</span>
            </div>
          </div>
        `;
      }).join('');
  } catch (err) {
    console.error('Failed to load screening history:', err);
  }
}

async function startScreening(domain) {
  screeningDomain = domain;
  const user = Api.getUser();
  const age = calculateAgeMonths(user.child_dob);

  if (age === '-' || age < 0) {
    showToast('Data usia anak tidak valid', 'error');
    return;
  }

  // Show loading
  document.getElementById('screening-domain-select').classList.add('hidden');
  document.getElementById('screening-questions').classList.remove('hidden');
  document.getElementById('screening-question-text').textContent = 'Memuat pertanyaan...';
  document.getElementById('screening-progress').textContent = `🔄 ${domainLabel(domain)}`;

  try {
    // Get questions
    const qData = await Api.getScreeningQuestions(domain, age);
    if (!qData.questions || qData.questions.length === 0) {
      showToast('Belum ada pertanyaan untuk usia ini', 'error');
      loadScreeningPage();
      return;
    }

    screeningQuestions = qData.questions;

    // Create session
    const sessionData = await Api.createScreeningSession(domain, age);
    screeningSessionId = sessionData.session.id;

    // Show first question
    screeningCurrentIndex = 0;
    showScreeningQuestion();
  } catch (err) {
    showToast(err.message, 'error');
    loadScreeningPage();
  }
}

function showScreeningQuestion() {
  const q = screeningQuestions[screeningCurrentIndex];
  if (!q) return;

  document.getElementById('screening-progress').textContent =
    `📋 ${domainLabel(screeningDomain)} — Pertanyaan ${screeningCurrentIndex + 1}/${screeningQuestions.length}`;
  document.getElementById('screening-question-text').textContent = q.question_text;
}

async function submitScreeningAnswer(answer) {
  if (!screeningSessionId || !screeningQuestions[screeningCurrentIndex]) return;

  const q = screeningQuestions[screeningCurrentIndex];

  try {
    await Api.submitScreeningAnswer(screeningSessionId, q.id, answer);

    // Next question or complete
    screeningCurrentIndex++;
    if (screeningCurrentIndex < screeningQuestions.length) {
      showScreeningQuestion();
    } else {
      // All answered - complete session
      document.getElementById('screening-questions').classList.add('hidden');
      document.getElementById('screening-scoring').classList.remove('hidden');

      const result = await Api.completeScreeningSession(screeningSessionId);
      showToast('Skrining selesai!', 'success');

      // Navigate to result page
      viewScreeningResult(screeningSessionId);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function viewScreeningResult(sessionId) {
  try {
    const data = await Api.getScreeningSession(sessionId);
    const session = data.session;
    const domain = session.domain;
    const score = session.score_percentage;
    const result = session.result;

    // Zone config
    const zoneConfig = {
      sesuai: {
        icon: '✅',
        label: 'Sesuai',
        desc: 'Perkembangan anak sesuai dengan tahap usianya. Lanjutkan stimulasi rutin!',
        color: '#10B981',
      },
      meragukan: {
        icon: '⚠️',
        label: 'Meragukan',
        desc: 'Ada beberapa aspek yang perlu diperhatikan. Lakukan stimulasi lebih intensif dan konsultasi dengan dokter jika perlu.',
        color: '#F59E0B',
      },
      menyimpang: {
        icon: '❌',
        label: 'Menyimpang',
        desc: 'Perkembangan anak memerlukan perhatian khusus. Segera konsultasi dengan dokter anak atau tumbuh kembang.',
        color: '#EF4444',
      },
    };

    const zone = zoneConfig[result] || zoneConfig.meragukan;

    // Navigate to result page
    navigate('screening-result');

    document.getElementById('result-content').innerHTML = `
      <div class="result-domain-label">${domainLabel(domain)} — Usia ${session.child_age_months} bulan</div>
      <div class="result-card ${result}">
        <div class="result-icon">${zone.icon}</div>
        <div class="result-score" style="color:${zone.color}">${score}%</div>
        <div class="result-label" style="color:${zone.color}">${zone.label}</div>
        <div class="result-detail">${session.answered_yes} dari ${session.total_questions} pertanyaan terjawab "Ya"</div>
        <div class="result-desc">${zone.desc}</div>
      </div>
      <button class="btn-primary" data-action="go-stimulation">🧩 Lihat Aktivitas Stimulasi</button>
      <button class="btn-secondary" data-action="go-screening-again">📋 Skrining Lainnya</button>
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// STIMULATION FUNCTIONS
// ============================

async function loadStimulationPage() {
  loadStimulationRecommendations();
  loadStimulationActivities();
}

async function loadStimulationRecommendations() {
  try {
    const data = await Api.getStimulationRecommendations('pending');
    const container = document.getElementById('rec-list');

    if (!data.recommendations || data.recommendations.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada rekomendasi. Lakukan skrining dulu!</p>';
      return;
    }

    container.innerHTML = data.recommendations.map(r => `
      <div class="stim-card" style="border-left-color: #F59E0B;">
        <span class="rec-domain">${domainLabel(r.domain)}</span>
        <div class="title">${escapeHtml(r.title)}</div>
        <div class="desc">${escapeHtml(r.description)}</div>
        <div class="meta">
          ${r.duration ? `<span>⏱ ${r.duration}</span>` : ''}
          ${r.difficulty ? `<span>📊 ${r.difficulty}</span>` : ''}
          ${r.materials ? `<span>📦 ${escapeHtml(r.materials)}</span>` : ''}
        </div>
        <div style="margin-top:6px;">
          <button class="complete-btn" data-rec-id="${r.id}">✅ Selesai</button>
          <button class="dismiss-btn" data-rec-id="${r.id}">✖ Tutup</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load recommendations:', err);
  }
}

async function loadStimulationActivities() {
  const user = Api.getUser();
  const age = calculateAgeMonths(user.child_dob);
  const domain = document.getElementById('stim-domain-filter').value;

  if (age === '-') return;

  try {
    const data = await Api.getStimulationGeneral(age, domain || undefined);
    const container = document.getElementById('stim-list');

    if (!data.activities || data.activities.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada aktivitas untuk usia ini.</p>';
      return;
    }

    container.innerHTML = data.activities.map(a => `
      <div class="stim-card">
        <span class="rec-domain">${domainLabel(a.domain)}</span>
        <div class="title">${escapeHtml(a.title)}</div>
        <div class="desc">${escapeHtml(a.description)}</div>
        <div class="meta">
          ${a.duration ? `<span>⏱ ${a.duration}</span>` : ''}
          ${a.difficulty ? `<span>📊 ${a.difficulty}</span>` : ''}
          ${a.materials ? `<span>📦 ${escapeHtml(a.materials)}</span>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load activities:', err);
  }
}

async function updateRecommendationStatus(recId, status) {
  try {
    await Api.updateRecommendation(recId, status);
    showToast(status === 'completed' ? 'Aktivitas selesai! 🎉' : 'Rekomendasi ditutup', 'success');
    loadStimulationRecommendations();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
