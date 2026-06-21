// ============================
// STATE
// ============================
let currentPage = 'login';
let selectedTrackingType = null;
let selectedSeverity = 'normal';
let articlesCache = [];

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
  safeAddListener('btn-go-knowledge', 'click', () => navigate('knowledge'));
  safeAddListener('btn-go-screening', 'click', () => navigate('screening'));
  safeAddListener('btn-go-stimulation', 'click', () => navigate('stimulation'));
  safeAddListener('btn-go-video', 'click', () => navigate('video'));
  safeAddListener('btn-submit-growth', 'click', submitGrowthRecord);
  safeAddListener('btn-submit-immunization', 'click', submitImmunizationRecord);
  safeAddListener('imm-date', 'change', updateImmunizationAge);
  safeAddListener('btn-send-chat', 'click', sendChat);
  safeAddListener('btn-logout', 'click', handleLogout);
  // === HOME PAGE Listeners ===
  safeAddListener('btn-add-growth', 'click', () => document.getElementById('growth-modal').classList.remove('hidden'));
  safeAddListener('btn-submit-home-growth', 'click', submitHomeGrowth);
  safeAddListener('btn-notif', 'click', () => { /* placeholder */ });
  safeAddListener('btn-submit-quickadd', 'click', submitQuickAdd);
  // Tracker card body — klik lihat detail riwayat hari ini
  document.querySelectorAll('.tracker-add').forEach(btn => {
    btn.onclick = function(e) {
      e.stopPropagation();
      openQuickAdd(this.dataset.tracker);
    };
  });

  // Tracker card body — klik lihat detail riwayat hari ini
  document.querySelectorAll('.tracker-card').forEach(card => {
    card.addEventListener('click', function() {
      openTrackerDetail(this.dataset.tracker);
    });
  });

  // Tracker detail: tambah lagi
  safeAddListener('btn-tracker-detail-add', 'click', () => {
    const type = document.getElementById('tracker-detail-modal').dataset.activeType || 'sleep';
    document.getElementById('tracker-detail-modal').classList.add('hidden');
    openQuickAdd(type);
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

  // === SLEEP PAGE Listeners ===
  safeAddListener('btn-back-sleep', 'click', () => navigate('home'));
  safeAddListener('btn-save-sleep', 'click', saveSleepRecord);
  safeAddListener('sl-start', 'change', updateSleepDurPreview);
  safeAddListener('sl-end', 'change', updateSleepDurPreview);
  safeAddListener('btn-sleep-history-toggle', 'click', toggleSleepHistory);
  safeAddListener('btn-sleep-hist-filter', 'click', loadSleepHistory);
  // Delete sleep records via delegation
  safeAddListener('sleep-today-records', 'click', (e) => {
    const del = e.target.closest('.sleep-rec-del');
    if (del && del.dataset.id) deleteSleepRecord(del.dataset.id);
  });
  // Sleep articles click → ke halaman artikel
  safeAddListener('sleep-articles', 'click', (e) => {
    const el = e.target.closest('.article-horiz');
    if (el && el.dataset.articleId) {
      navigate('knowledge');
      setTimeout(() => showArticleDetail(el.dataset.articleId), 400);
    }
  });
  // Default history dates
  const histFrom = document.getElementById('sl-hist-from');
  const histTo = document.getElementById('sl-hist-to');
  if (histFrom) {
    const d = new Date(); d.setDate(d.getDate() - 30);
    histFrom.value = d.toISOString().split('T')[0];
  }
  if (histTo) histTo.value = new Date().toISOString().split('T')[0];

  // === TRACKER CARD → DETAIL PAGE ===
  const trackerPageMap = { sleep: 'sleep', feeding: 'tracker-detail', drink: 'tracker-detail', poop: 'tracker-detail', pee: 'tracker-detail', eating: 'tracker-detail' };
  document.querySelectorAll('.tracker-card').forEach(card => {
    const type = card.dataset.tracker;
    card.addEventListener('click', function(e) {
      if (e.target.closest('.tracker-add')) return;
      const page = trackerPageMap[type];
      if (page === 'tracker-detail') {
        window._activeTrackerType = type;
      }
      if (page) navigate(page);
    });
  });

  // === GENERIC TRACKER PAGE Listeners ===
  safeAddListener('btn-back-tracker', 'click', () => navigate('home'));
  safeAddListener('btn-save-tracker', 'click', saveTrackerRecord);
  // Delete via delegation
  safeAddListener('tracker-today-records', 'click', (e) => {
    const del = e.target.closest('.sleep-rec-del');
    if (del && del.dataset.id) deleteTrackerRecordGeneric(del.dataset.id);
  });
  safeAddListener('sleep-articles', 'click', (e) => {
    const card = e.target.closest('.article-horiz');
    if (card) navigate('knowledge');
  });

  // === DEVELOPMENT PAGE Listeners ===
  safeAddListener('btn-back-dev', 'click', () => navigate('home'));
  safeAddListener('btn-dev-screening', 'click', () => navigate('screening'));
  safeAddListener('btn-dev-share', 'click', () => {
    const text = document.getElementById('dev-insight-text')?.textContent || 'Perkembangan anak';
    navigator.clipboard.writeText(text).then(() => showToast('Disalin!', 'success')).catch(() => {});
  });
  let devCurrentAge = null;
  safeAddListener('dev-age-prev', 'click', () => {
    if (devCurrentAge > 1) { devCurrentAge--; loadDevelopmentPageData(devCurrentAge); }
  });
  safeAddListener('dev-age-next', 'click', () => {
    if (devCurrentAge < 72) { devCurrentAge++; loadDevelopmentPageData(devCurrentAge); }
  });

  // All back buttons (navigate home)
  document.querySelectorAll('.back-btn').forEach((btn) => {
    btn.addEventListener('click', () => navigate('home'));
  });

  // Video page: filter chip delegation
  safeAddListener('video-filter', 'click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (chip) {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadVideoPage();
    }
  });

  // Video page: grid item click delegation
  safeAddListener('video-grid', 'click', (e) => {
    const card = e.target.closest('.video-card');
    if (card && card.dataset.videoId) {
      const videos = window._videosCache || [];
      const video = videos.find(v => v.id == card.dataset.videoId);
      if (video) openVideoModal(video);
    }
  });

  // Video modal close
  safeAddListener('btn-close-video-modal', 'click', closeVideoModal);

  // Video modal: click outside to close
  const videoModal = document.getElementById('video-modal');
  if (videoModal) {
    videoModal.addEventListener('click', function(e) {
      if (e.target === this) closeVideoModal();
    });
  }

  // ============ EVENT DELEGATION FOR DYNAMIC CONTENT ============
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
    else if (action === 'submit-admin-product') submitAdminProduct();
  });

  // Tracker detail delete buttons
  safeAddListener('tracker-detail-list', 'click', (e) => {
    const del = e.target.closest('.tracker-record-del');
    if (del && del.dataset.recordId) {
      deleteTrackerRecord(del.dataset.trackerType, del.dataset.recordId);
    }
  });

  // Settings page admin buttons (show forms)
  safeAddListener('settings-content', 'click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'show-admin-add-article') showAdminAddArticle();
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
  if (page === 'video') loadVideoPage();
  if (page === 'knowledge') loadArticles();
  if (page === 'chat') loadChatHistory();
  if (page === 'shop') loadProducts();
  if (page === 'settings') loadSettings();
  if (page === 'screening') loadScreeningPage();
  if (page === 'stimulation') loadStimulationPage();
  if (page === 'sleep') loadSleepPage();
  if (page === 'development') loadDevelopmentPage();
  if (page === 'tracker-detail') loadTrackerDetailPage();
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

  // Hitung usia anak
  const age = calculateAgeMonths(user.child_dob);

  // Sembunyikan tracker yang gak relevan berdasarkan usia
  applyAgeBasedVisibility(age);

  // 2. Child Profile (ambil growth records buat dipake ulang)
  let growthRecords = null;
  try {
    const data = await Api.getGrowthRecords();
    growthRecords = data.records || [];
  } catch (e) { /* skip */ }
  await loadChildProfile(user, growthRecords);

  // 3. Daily Summary (tidur, menyusui, minum, BAB, BAK)
  await loadDailySummary();

  // 4. Development Today
  await loadDevelopmentToday(user);

  // 5. Growth summary (pake data growth yg udah diambil)
  await loadBerandaGrowthRingkasan(growthRecords);

  // 6. Reminders
  await loadReminders();
}

// === 2. Child Profile ===
async function loadChildProfile(user, growthRecords) {
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

  // Ambil data pertumbuhan terakhir (dari parameter)
  const latest = growthRecords && growthRecords[0];
  if (latest) {
      document.getElementById('stat-bb').textContent = latest.weight_kg != null ? `${latest.weight_kg} kg` : '-';
      document.getElementById('stat-tb').textContent = latest.height_cm != null ? `${latest.height_cm} cm` : '-';
      document.getElementById('stat-lk').textContent = latest.head_circumference_cm != null ? `${latest.head_circumference_cm} cm` : '-';

      // Status gizi — WHO BB/U (Berat Badan menurut Umur)
      const bb = parseFloat(latest.weight_kg);
      const nutStatus = document.getElementById('nutrition-status');
      if (bb > 0 && age > 0) {
        const status = calculateNutritionStatus(bb, age);
        nutStatus.textContent = status;
      } else {
        nutStatus.textContent = '✅ Gizi Baik';
      }
    } else {
      // Fallback
      document.getElementById('stat-bb').textContent = '-';
      document.getElementById('stat-tb').textContent = '-';
      document.getElementById('stat-lk').textContent = '-';
    }
}

// Hitung status gizi berdasarkan BB & Usia (WHO BB/U reference)
function calculateNutritionStatus(weightKg, ageMonths) {
  // Median weight for age (kg) — unisex approximate WHO Child Growth Standards
  const medians = [
    { max: 1, med: 3.5, sd: 0.5 },    // 0-1 bulan
    { max: 2, med: 4.5, sd: 0.6 },
    { max: 3, med: 5.5, sd: 0.6 },
    { max: 4, med: 6.2, sd: 0.7 },
    { max: 5, med: 6.8, sd: 0.7 },
    { max: 6, med: 7.3, sd: 0.8 },
    { max: 9, med: 8.0, sd: 0.9 },
    { max: 12, med: 8.8, sd: 1.0 },
    { max: 15, med: 9.6, sd: 1.0 },
    { max: 18, med: 10.2, sd: 1.1 },
    { max: 24, med: 11.5, sd: 1.3 },
    { max: 30, med: 12.5, sd: 1.4 },
    { max: 36, med: 13.5, sd: 1.5 },
    { max: 48, med: 15.2, sd: 1.8 },
    { max: 60, med: 17.0, sd: 2.2 },
    { max: 72, med: 19.0, sd: 2.6 },
    { max: 999, med: 22.0, sd: 3.5 },
  ];

  const ref = medians.find(m => ageMonths <= m.max) || medians[medians.length - 1];
  const diff = (weightKg - ref.med) / ref.sd; // Z-score approximate

  if (diff < -3) return '🔴 Gizi Buruk';
  if (diff < -2) return '🟡 Gizi Kurang';
  if (diff > 3) return '🔴 Obesitas';
  if (diff > 2) return '🟡 Risiko Gizi Lebih';
  return '✅ Gizi Baik';
}

// === Age-based visibility — sembunyikan tracker sesuai usia ===
function applyAgeBasedVisibility(age) {
  const showCard = (tracker, show) => {
    const card = document.querySelector(`.tracker-card[data-tracker="${tracker}"]`);
    if (card) card.style.display = show ? '' : 'none';
  };

  const trackerSection = document.getElementById('daily-trackers');
  const title = trackerSection?.previousElementSibling; // <h3>

  if (age > 72) {
    // >6 tahun: sembunyikan semua daily tracker, tunjukkin growth & screening aja
    if (trackerSection) trackerSection.style.display = 'none';
    if (title) title.style.display = 'none';
    return;
  }

  // Tampilkan section tracker
  if (trackerSection) trackerSection.style.display = '';
  if (title) {
    title.style.display = '';
    title.textContent = age > 36 ? '📋 Kebiasaan Harian' : '📋 Aktivitas Harian';
  }

  // Menyusui: hanya relevan sampai ~3 tahun
  showCard('feeding', age <= 36);

  // Makan (MPASI): relevan sampai ~5 tahun
  showCard('eating', age <= 60);

  // Sisanya selalu tampil
  showCard('sleep', true);
  showCard('drink', true);
  showCard('poop', true);
  showCard('pee', true);
}

// === 3. Daily Summary ===
async function loadDailySummary() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const data = await Api.getDailySummary(today);
    const s = data.summary || {};
    const fmtLast = (val) => {
      if (!val) return '—';
      if (val.includes('T')) return val.split('T')[1].slice(0, 5); // ISO → HH:MM
      return val.slice(0, 5); // already TIME format
    };

    // Tidur
    const sleepVal = document.getElementById('tracker-sleep-value');
    const sleepTime = document.getElementById('tracker-sleep-time');
    if (s.sleep && s.sleep.total_minutes > 0) {
      const hrs = Math.floor(s.sleep.total_minutes / 60);
      const min = s.sleep.total_minutes % 60;
      sleepVal.textContent = `${hrs}j ${min}m`;
      sleepTime.textContent = fmtLast(s.sleep.last_time);
    } else {
      sleepVal.textContent = 'Belum';
      sleepTime.textContent = '—';
    }

    // Menyusui
    const feedVal = document.getElementById('tracker-feeding-value');
    const feedTime = document.getElementById('tracker-feeding-time');
    if (s.feeding && s.feeding.count > 0) {
      feedVal.textContent = `${s.feeding.count}x`;
      feedTime.textContent = fmtLast(s.feeding.last_time);
    } else {
      feedVal.textContent = '0';
      feedTime.textContent = '—';
    }

    // Minum
    const drinkVal = document.getElementById('tracker-drink-value');
    const drinkTime = document.getElementById('tracker-drink-time');
    if (s.drink && s.drink.count > 0) {
      drinkVal.textContent = `${s.drink.total_ml || 0} ml`;
      drinkTime.textContent = fmtLast(s.drink.last_time);
    } else {
      drinkVal.textContent = '0';
      drinkTime.textContent = '—';
    }

    // BAB
    const poopVal = document.getElementById('tracker-poop-value');
    const poopTime = document.getElementById('tracker-poop-time');
    if (s.poop && s.poop.total > 0) {
      poopVal.textContent = `${s.poop.total}x`;
      poopTime.textContent = fmtLast(s.poop.last_time);
    } else {
      poopVal.textContent = '0';
      poopTime.textContent = '—';
    }

    // BAK
    const peeVal = document.getElementById('tracker-pee-value');
    const peeTime = document.getElementById('tracker-pee-time');
    if (s.pee && s.pee.total > 0) {
      peeVal.textContent = `${s.pee.total}x`;
      peeTime.textContent = fmtLast(s.pee.last_time);
    } else {
      peeVal.textContent = '0';
      peeTime.textContent = '—';
    }

    // Makan (MPASI)
    const eatVal = document.getElementById('tracker-eating-value');
    const eatTime = document.getElementById('tracker-eating-time');
    if (s.eating && s.eating.count > 0) {
      eatVal.textContent = `${s.eating.count}x`;
      eatTime.textContent = fmtLast(s.eating.last_time);
    } else {
      eatVal.textContent = '0';
      eatTime.textContent = '—';
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

// === 5. Growth & Screening Ringkasan ===
async function loadBerandaGrowthRingkasan(growthRecords) {
  let html = '';
  const records = growthRecords || [];

  // Trend card — perubahan antara 2 catatan terakhir
  if (records.length >= 2) {
    const latest = records[0];
    const prev = records[1];
    const trendParts = [];
    const daysDiff = latest.record_date && prev.record_date
      ? Math.round((new Date(latest.record_date) - new Date(prev.record_date)) / (1000 * 60 * 60 * 24))
      : null;

    if (latest.weight_kg != null && prev.weight_kg != null) {
      const diff = parseFloat(latest.weight_kg) - parseFloat(prev.weight_kg);
      const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      const sign = diff > 0 ? '+' : '';
      trendParts.push(`<span class="g-metric">${arrow} BB: <b>${sign}${diff.toFixed(2)} kg</b></span>`);
    }
    if (latest.height_cm != null && prev.height_cm != null) {
      const diff = parseFloat(latest.height_cm) - parseFloat(prev.height_cm);
      const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      const sign = diff > 0 ? '+' : '';
      trendParts.push(`<span class="g-metric">${arrow} TB: <b>${sign}${diff.toFixed(1)} cm</b></span>`);
    }
    if (latest.head_circumference_cm != null && prev.head_circumference_cm != null) {
      const diff = parseFloat(latest.head_circumference_cm) - parseFloat(prev.head_circumference_cm);
      const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      const sign = diff > 0 ? '+' : '';
      trendParts.push(`<span class="g-metric">${arrow} LK: <b>${sign}${diff.toFixed(1)} cm</b></span>`);
    }

    if (trendParts.length > 0) {
      const since = daysDiff ? ` (${daysDiff} hari)` : '';
      html += `<div class="card" style="cursor:default;border-left-color:#F59E0B;">
        <p class="cat">📊 Perubahan Terakhir${since}</p>
        <div class="g-metric-row">${trendParts.join('')}</div>
      </div>`;
    }
  }

  // Growth — latest data
  const latest = records[0];
  if (latest) {
    const parts = [];
    if (latest.weight_kg != null) parts.push(`<span class="g-metric"><b>${latest.weight_kg}</b> kg</span>`);
    if (latest.height_cm != null) parts.push(`<span class="g-metric"><b>${latest.height_cm}</b> cm</span>`);
    if (latest.head_circumference_cm != null) parts.push(`<span class="g-metric">LK <b>${latest.head_circumference_cm}</b> cm</span>`);
    html += `<div class="card" style="cursor:default;"><p class="cat">📏 Data Terbaru</p><div class="g-metric-row">${parts.join('')}</div><small>${formatDate(latest.record_date)}</small></div>`;
  }

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
    eating: { title: '🍚 Tambah Makan (MPASI)', html: `
      <div class="form-group"><label>Menu Makanan</label><input type="text" id="qa-menu" placeholder="contoh: bubur ayam"></div>
      <div class="form-group"><label>Jumlah (ml/porsi)</label><input type="number" step="1" min="0" id="qa-amount" value="100"></div>
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
      case 'eating': {
        const menu = document.getElementById('qa-menu').value.trim();
        const amt = document.getElementById('qa-amount').value;
        payload.notes = (menu ? `${menu}` : '') + (document.getElementById('qa-notes').value.trim() ? ` · ${document.getElementById('qa-notes').value.trim()}` : '');
        if (amt) payload.amount_ml = parseFloat(amt);
        await Api.createDailyEating(payload);
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

// === Tracker Detail — lihat riwayat hari ini ===
async function openTrackerDetail(type) {
  const modal = document.getElementById('tracker-detail-modal');
  const title = document.getElementById('tracker-detail-title');
  const list = document.getElementById('tracker-detail-list');
  const today = new Date().toISOString().split('T')[0];

  const labels = {
    sleep: { title: '😴 Riwayat Tidur', icon: '😴', fmt: (r) => {
      const start = r.sleep_start ? r.sleep_start.slice(0,5) : '-';
      const end = r.sleep_end ? r.sleep_end.slice(0,5) : '-';
      const dur = r.duration_minutes ? `${Math.floor(r.duration_minutes/60)}j ${r.duration_minutes%60}m` : '';
      return `<b>${start} - ${end}</b> ${dur ? '<br><small>'+dur+'</small>' : ''}`;
    }},
    feeding: { title: '🍼 Riwayat Menyusui', icon: '🍼', fmt: (r) => {
      let text = `<b>${escapeHtml(r.feeding_type || '')}</b>`;
      if (r.amount_ml) text += ` · ${r.amount_ml} ml`;
      if (r.duration_minutes) text += ` · ${r.duration_minutes} menit`;
      return text;
    }},
    drink: { title: '💧 Riwayat Minum', icon: '💧', fmt: (r) => {
      return `<b>${r.amount_ml || 0} ml</b>`;
    }},
    poop: { title: '💩 Riwayat BAB', icon: '💩', fmt: (r) => {
      let text = `<b>${r.count}x</b>`;
      if (r.consistency) text += ` · ${escapeHtml(r.consistency)}`;
      return text;
    }},
    pee: { title: '🚽 Riwayat BAK', icon: '🚽', fmt: (r) => {
      return `<b>${r.count || 1}x</b>`;
    }},
    eating: { title: '🍚 Riwayat Makan', icon: '🍚', fmt: (r) => {
      let text = `<b>${r.amount_ml || 0} ml</b>`;
      if (r.notes) text += ` · ${escapeHtml(r.notes)}`;
      return text;
    }},
  };

  const cfg = labels[type] || labels.sleep;
  title.textContent = cfg.title;
  list.innerHTML = '<p class="info-text">Memuat...</p>';
  // Simpan type buat tombol "Tambah Lagi"
  document.getElementById('tracker-detail-modal').dataset.activeType = type;
  modal.classList.remove('hidden');

  try {
    let records = [];
    switch (type) {
      case 'sleep': records = (await Api.getDailySleep(today)).records || []; break;
      case 'feeding': records = (await Api.getDailyFeeding(today)).records || []; break;
      case 'drink': records = (await Api.getDailyDrink(today)).records || []; break;
      case 'poop': records = (await Api.getDailyPoop(today)).records || []; break;
      case 'pee': records = (await Api.getDailyPee(today)).records || []; break;
      case 'eating': records = (await Api.getDailyEating(today)).records || []; break;
    }

    if (records.length === 0) {
      list.innerHTML = '<p class="info-text">Belum ada catatan hari ini.</p>';
      return;
    }

    list.innerHTML = records.map(r => {
      const time = r.created_at ? formatTime(r.created_at) : '';
      return `<div class="tracker-record-item">
        <div class="tracker-record-info">${cfg.fmt(r)}</div>
        <div class="tracker-record-meta">
          <span class="tracker-record-time">${time}</span>
          <button class="tracker-record-del" data-tracker-type="${type}" data-record-id="${r.id}">✕</button>
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = '<p class="info-text">Gagal memuat data.</p>';
  }
}

// === Delete tracker record ===
async function deleteTrackerRecord(type, id) {
  try {
    switch (type) {
      case 'sleep': await Api.deleteDailySleep(id); break;
      case 'feeding': await Api.deleteDailyFeeding(id); break;
      case 'drink': await Api.deleteDailyDrink(id); break;
      case 'poop': await Api.deleteDailyPoop(id); break;
      case 'pee': await Api.deleteDailyPee(id); break;
      case 'eating': await Api.deleteDailyFeeding(id); break;
    }
    showToast('Data dihapus', 'success');
    openTrackerDetail(type); // refresh list
    loadDailySummary();     // refresh summary
  } catch (err) {
    showToast('Gagal menghapus', 'error');
  }
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

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
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
  // Deprecated: food page no longer exists, this function kept for reference
  const food = {};
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
// VIDEO EDUKASI PAGE
// ============================

// Color gradients for video thumbnails by category
const thumbnailColors = {
  'Speech': ['#667eea', '#764ba2'],
  'Motor': ['#f093fb', '#f5576c'],
  'Imunitas': ['#4facfe', '#00f2fe'],
  'Parenting': ['#43e97b', '#38f9d7'],
  'default': ['#a18cd1', '#fbc2eb'],
};

function getThumbnailStyle(category) {
  const colors = thumbnailColors[category] || thumbnailColors['default'];
  return `background: linear-gradient(135deg, ${colors[0]}, ${colors[1]});`;
}

async function loadVideoPage() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;
  grid.innerHTML = '<p class="info-text">Memuat video...</p>';

  // Get active category filter
  const activeChip = document.querySelector('.filter-chip.active');
  const category = activeChip ? activeChip.dataset.category : '';

  try {
    const data = await Api.getVideos();
    let videos = data.videos || [];

    // Cache for detail view
    window._videosCache = videos;

    // Filter by category
    if (category) {
      videos = videos.filter(v => v.category === category);
    }

    if (videos.length === 0) {
      grid.innerHTML = '<p class="info-text">Belum ada video untuk kategori ini.</p>';
      return;
    }

    grid.innerHTML = videos.map(v => {
      const duration = v.duration_minutes ? `${v.duration_minutes} menit` : '';
      const ageRange = v.age_range || '';
      const categoryName = v.category || '';
      const title = v.title || 'Video Edukasi';

      return `
        <div class="video-card" data-video-id="${v.id}">
          <div class="video-thumb" style="${getThumbnailStyle(categoryName)}">
            <div class="play-overlay">▶️</div>
            ${duration ? `<span class="video-duration">${duration}</span>` : ''}
          </div>
          <div class="video-card-body">
            <div class="video-card-title">${escapeHtml(title)}</div>
            <span class="video-category">${escapeHtml(categoryName)}</span>
            ${ageRange ? `<div class="video-age">${escapeHtml(ageRange)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load videos:', err);
    grid.innerHTML = '<p class="info-text">Gagal memuat video. Periksa koneksi Anda.</p>';
  }
}

function openVideoModal(video) {
  const modal = document.getElementById('video-modal');
  const title = document.getElementById('video-modal-title');
  const embedContainer = document.getElementById('video-embed-container');
  const descContainer = document.getElementById('video-modal-desc');

  if (!modal || !title || !embedContainer || !descContainer) return;

  title.textContent = `🎬 ${escapeHtml(video.title || 'Video Edukasi')}`;

  // Build YouTube embed if video_url contains a YouTube ID
  let embedHtml = '';
  if (video.video_url) {
    // Extract YouTube video ID from various URL formats
    let videoId = '';
    const url = video.video_url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    } else {
      // Try direct URL as video ID fallback
      videoId = url;
    }
    embedHtml = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
  } else {
    embedHtml = '<div class="video-placeholder">🎬 Video tidak tersedia</div>';
  }

  embedContainer.innerHTML = embedHtml;

  // Description
  let descHtml = '';
  if (video.description) {
    descHtml += `<p>${escapeHtml(video.description)}</p>`;
  }
  if (video.duration_minutes || video.category || video.age_range) {
    descHtml += '<div class="video-meta">';
    if (video.duration_minutes) descHtml += `<span>⏱ ${video.duration_minutes} menit</span>`;
    if (video.category) descHtml += `<span>🏷️ ${escapeHtml(video.category)}</span>`;
    if (video.age_range) descHtml += `<span>👶 ${escapeHtml(video.age_range)}</span>`;
    descHtml += '</div>';
  }
  descContainer.innerHTML = descHtml;

  modal.classList.remove('hidden');
}

function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  if (modal) {
    modal.classList.add('hidden');
    // Stop video playback by removing iframe
    const container = document.getElementById('video-embed-container');
    if (container) {
      container.innerHTML = '<div class="video-placeholder">Memuat video...</div>';
    }
  }
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

    // Jika ada pending article dari sleep page (fallback)
    if (window._pendingArticleId) {
      const id = window._pendingArticleId;
      window._pendingArticleId = null;
      showArticleDetailById(id);
    }
  } catch (err) {
    console.error('Failed to load articles:', err);
  }
}

function showArticleDetailById(id) {
  const card = document.querySelector(`[data-article-id="${id}"]`);
  if (card) {
    showArticleDetail(id);
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

// ============================
// SLEEP DETAIL PAGE
// ============================

// Sleep need by age (jam per hari)
const sleepNeeds = [
  { max: 3, label: '0-3 bulan', range: '14-17 jam' },
  { max: 6, label: '4-6 bulan', range: '12-16 jam' },
  { max: 12, label: '7-12 bulan', range: '12-15 jam' },
  { max: 24, label: '1-2 tahun', range: '11-14 jam' },
  { max: 36, label: '2-3 tahun', range: '10-13 jam' },
  { max: 72, label: '3-6 tahun', range: '10-12 jam' },
  { max: 999, label: '6+ tahun', range: '9-11 jam' },
];

function getSleepNeed(ageMonths) {
  for (const n of sleepNeeds) {
    if (ageMonths <= n.max) return n;
  }
  return sleepNeeds[sleepNeeds.length - 1];
}

async function loadSleepPage() {
  const user = Api.getUser();
  if (!user) return;
  const age = calculateAgeMonths(user.child_dob);
  const today = new Date().toISOString().split('T')[0];
  const childName = user.child_name || 'Anak';

  document.getElementById('sl-date').value = today;
  document.getElementById('sl-start').value = '';
  document.getElementById('sl-end').value = '';

  // Recommendation
  const need = getSleepNeed(age);
  document.getElementById('sleep-rec-text').textContent =
    `Pada usia ${need.label}, ${childName} membutuhkan ${need.range} tidur per hari termasuk tidur siang dan malam.`;

  // Today records
  await loadSleepToday();

  // Analytics
  await loadSleepAnalytics();

  // Articles
  await loadSleepArticles();
}

// === Save Manual Entry ===
async function saveSleepRecord() {
  const date = document.getElementById('sl-date').value;
  const start = document.getElementById('sl-start').value;
  const end = document.getElementById('sl-end').value;

  if (!date || !start || !end) {
    showToast('Isi tanggal, jam mulai, dan jam selesai', 'error');
    return;
  }

  const [sh, sm] = start.split(':');
  const [eh, em] = end.split(':');
  let minutes = (parseInt(eh) * 60 + parseInt(em)) - (parseInt(sh) * 60 + parseInt(sm));
  if (minutes < 0) minutes += 1440;
  const notes = document.getElementById('sl-notes').value.trim() || null;

  try {
    await Api.createDailySleep({
      record_date: date,
      sleep_start: start,
      sleep_end: end,
      duration_minutes: minutes,
      notes,
    });
    showToast('Catatan tidur tersimpan', 'success');
    document.getElementById('sl-start').value = '';
    document.getElementById('sl-end').value = '';
    document.getElementById('sl-notes').value = '';
    document.getElementById('sl-duration-display').innerHTML = 'Durasi: <b>—</b>';
    await loadSleepToday();
    await loadSleepAnalytics();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// === Auto-calc duration ===
function updateSleepDurPreview() {
  const start = document.getElementById('sl-start').value;
  const end = document.getElementById('sl-end').value;
  const el = document.getElementById('sl-duration-display');
  if (!start || !end) { el.innerHTML = 'Durasi: <b>—</b>'; return; }
  const [sh, sm] = start.split(':');
  const [eh, em] = end.split(':');
  let minutes = (parseInt(eh) * 60 + parseInt(em)) - (parseInt(sh) * 60 + parseInt(sm));
  if (minutes < 0) minutes += 1440;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  el.innerHTML = `Durasi: <b>${hrs} jam ${mins} menit</b>`;
}

// === Today Records ===
async function loadSleepToday() {
  const today = new Date().toISOString().split('T')[0];
  const container = document.getElementById('sleep-today-records');
  const totalEl = document.getElementById('sleep-today-total');
  try {
    const data = await Api.getDailySleep(today);
    const records = data.records || [];
    let totalMin = 0;
    records.forEach(r => { if (r.duration_minutes) totalMin += r.duration_minutes; });
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    totalEl.textContent = `Total: ${hrs}j ${mins}m`;

    if (records.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada catatan tidur hari ini.</p>';
      return;
    }

    container.innerHTML = records.map(r => {
      const start = r.sleep_start ? r.sleep_start.slice(0, 5) : '?';
      const end = r.sleep_end ? r.sleep_end.slice(0, 5) : '?';
      const dur = r.duration_minutes
        ? `${Math.floor(r.duration_minutes / 60)}j ${r.duration_minutes % 60}m`
        : '-';
      return `<div class="sleep-record-item">
        <div class="sleep-rec-time">${start} - ${end}</div>
        <div class="sleep-rec-dur">${dur}</div>
        ${r.notes ? `<div class="sleep-rec-note">${escapeHtml(r.notes)}</div>` : ''}
        <button class="sleep-rec-del" data-id="${r.id}">✕</button>
      </div>`;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p class="info-text">Gagal memuat data.</p>';
  }
}

// === Analytics ===
async function loadSleepAnalytics() {
  try {
    const data = await Api.getSleepAnalytics(7);
    const avg = data.avg || {};
    document.getElementById('sl-avg-dur').textContent = avg.avg_hours_display || '-';
    document.getElementById('sl-avg-freq').textContent = `${avg.avg_sessions || 0}x/hari`;
    const sc = data.score || {};
    document.getElementById('sl-score').textContent = sc.label || '-';

    // Insight
    const daily = data.daily || [];
    if (daily.length > 0) {
      const totalMin = daily.reduce((s, d) => s + d.total_minutes, 0);
      const avgMin = Math.round(totalMin / daily.length);
      const trend = data.trend || {};
      const trendText = trend.change_pct !== 0
        ? ` ${trend.change_pct > 0 ? 'Naik' : 'Turun'} ${Math.abs(trend.change_pct)}% dibanding minggu lalu.`
        : '';
      document.getElementById('sleep-insight').textContent =
        `Rata-rata tidur ${Math.floor(avgMin / 60)}j ${avgMin % 60}m per hari. Skor kualitas: ${sc.label || '-'}.${trendText}`;
    } else {
      document.getElementById('sleep-insight').textContent = 'Belum cukup data untuk analisis. Catat tidur setiap hari untuk melihat pola.';
    }

    // Bar chart
    renderSleepChart(daily);
  } catch (err) {
    console.error('Sleep analytics error:', err);
  }
}

// === Bar Chart Render ===
function renderSleepChart(daily) {
  const container = document.getElementById('sleep-chart');
  if (!daily || daily.length === 0) {
    container.innerHTML = '<p class="info-text">Belum ada data 7 hari terakhir.</p>';
    return;
  }
  const maxMin = Math.max(...daily.map(d => d.total_minutes), 900); // 15 jam min height
  const idealMin = 720; // 12 jam
  const idealMax = 960; // 16 jam

  container.innerHTML = '<div class="bar-chart">' + daily.map(d => {
    const pct = Math.min(Math.round((d.total_minutes / maxMin) * 100), 100);
    const label = d.date ? d.date.slice(5) : '';
    const hrs = Math.floor(d.total_minutes / 60);
    const mins = d.total_minutes % 60;
    const isToday = d.date === new Date().toISOString().split('T')[0];
    return `<div class="bar-col ${isToday ? 'bar-today' : ''}">
      <div class="bar-val">${hrs}j</div>
      <div class="bar" style="height:${pct}%"></div>
      <div class="bar-label">${label}</div>
    </div>`;
  }).join('') + '<div class="bar-ideal-line" style="top:' + (100 - Math.round((idealMin / maxMin) * 100)) + '%" title="Ideal min 12j"></div></div>';
}

// === History Toggle ===
function toggleSleepHistory() {
  const section = document.getElementById('sleep-history-section');
  const btn = document.getElementById('btn-sleep-history-toggle');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    btn.textContent = '📅 Tutup Riwayat';
    loadSleepHistory();
  } else {
    section.classList.add('hidden');
    btn.textContent = '📅 Lihat Semua Catatan';
  }
}

async function loadSleepHistory() {
  const from = document.getElementById('sl-hist-from').value;
  const to = document.getElementById('sl-hist-to').value;
  const container = document.getElementById('sleep-history-list');
  container.innerHTML = '<p class="info-text">Memuat...</p>';
  try {
    const data = await Api.getSleepHistory(from || undefined, to || undefined);
    const records = data.records || [];
    if (records.length === 0) {
      container.innerHTML = '<p class="info-text">Tidak ada catatan di rentang ini.</p>';
      return;
    }
    // Group by date
    const byDate = {};
    records.forEach(r => {
      const d = r.record_date;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(r);
    });
    container.innerHTML = Object.entries(byDate).map(([date, recs]) => {
      const total = recs.reduce((s, r) => s + (r.duration_minutes || 0), 0);
      const hrs = Math.floor(total / 60);
      const mins = total % 60;
      return `<div class="sleep-hist-group">
        <div class="sleep-hist-date"><b>${formatDate(date)}</b> — ${hrs}j ${mins}m</div>
        ${recs.map(r => `<div class="sleep-hist-item">
          ${r.sleep_start?.slice(0,5) || '?'} - ${r.sleep_end?.slice(0,5) || '?'}
          ${r.duration_minutes ? `· ${Math.floor(r.duration_minutes/60)}j ${r.duration_minutes%60}m` : ''}
          ${r.notes ? `<small>${escapeHtml(r.notes)}</small>` : ''}
        </div>`).join('')}
      </div>`;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p class="info-text">Gagal memuat riwayat.</p>';
  }
}

// === Delete sleep record ===
async function deleteSleepRecord(id) {
  try {
    await Api.deleteDailySleep(id);
    showToast('Catatan dihapus', 'success');
    await loadSleepToday();
    await loadSleepAnalytics();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// === Articles ===
async function loadSleepArticles() {
  const container = document.getElementById('sleep-articles');
  try {
    const data = await Api.getSleepArticles();
    const articles = data.articles || [];
    if (articles.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada artikel.</p>';
      return;
    }
    container.innerHTML = articles.map(a => `<div class="article-horiz" ${a.id ? `data-article-id="${a.id}"` : ''}>
      <div class="article-horiz-body">
        <div class="article-horiz-title">${escapeHtml(a.title)}</div>
        <div class="article-horiz-summary">${escapeHtml(a.summary)}</div>
      </div>
    </div>`).join('');
  } catch (err) {
    container.innerHTML = '<p class="info-text">Gagal memuat artikel.</p>';
  }
}

// ============================
// GENERIC TRACKER DETAIL PAGE
// feeding, drink, poop, pee, eating
// ============================

const TRACKER_CONFIGS = {
  feeding: {
    name: '🍼 Menyusui', title: 'Menyusui', formTitle: 'Catat Menyusui',
    todayApi: (d) => Api.getDailyFeeding(d, 'ASI'),
    createApi: (p) => Api.createDailyFeeding({ ...p, feeding_type: 'ASI' }),
    deleteApi: (id) => Api.deleteDailyFeeding(id),
    analyticsApi: () => Api.getTrackerAnalytics('feeding'),
    articlesApi: () => Api.getTrackerArticles('feeding'),
    formFields: () => `
      <div class="form-group"><label>Tanggal</label><input type="date" id="g-sl-date"></div>
      <div class="sleep-time-row">
        <div class="form-group"><label>Jam Mulai</label><input type="time" id="g-sl-start"></div>
        <div class="form-group"><label>Jam Selesai</label><input type="time" id="g-sl-end"></div>
      </div>
      <div class="form-group"><label>Jumlah (ml)</label><input type="number" id="g-amount" placeholder="100"></div>
      <div class="form-group"><label>Durasi (menit)</label><input type="number" id="g-duration" placeholder="15"></div>
      <div class="form-group"><label>Catatan</label><textarea id="g-notes" placeholder="Catatan..."></textarea></div>`,
    getPayload: () => {
      const d = document.getElementById('g-sl-date').value;
      const start = document.getElementById('g-sl-start').value;
      const end = document.getElementById('g-sl-end').value;
      let minutes = null;
      if (start && end) {
        const [sh,sm]=start.split(':'); const [eh,em]=end.split(':');
        minutes = (parseInt(eh)*60+parseInt(em))-(parseInt(sh)*60+parseInt(sm));
        if (minutes < 0) minutes += 1440;
      }
      return { record_date: d, sleep_start: start || null, sleep_end: end || null,
        duration_minutes: minutes, amount_ml: parseFloat(document.getElementById('g-amount').value) || null, notes: document.getElementById('g-notes').value.trim() || null };
    },
    formatRecord: (r) => {
      const start = r.sleep_start?.slice(0,5)||'?', end = r.sleep_end?.slice(0,5)||'?';
      let text = `<b>${start} - ${end}</b>`;
      if (r.amount_ml) text += ` · ${r.amount_ml} ml`;
      if (r.duration_minutes) text += ` · ${Math.floor(r.duration_minutes/60)}j ${r.duration_minutes%60}m`;
      return { time: `${start} - ${end}`, detail: text };
    },
    formatTotal: (records) => {
      const totalMl = records.reduce((s,r) => s + (r.amount_ml||0), 0);
      const count = records.length;
      return `${count}x (${totalMl} ml)`;
    },
    formatAnalytics: (avg) => ({ val: `${avg.avg_value} ml`, freq: `${avg.avg_count}x/hari` }),
    formatInsight: (avg, score, daily) => {
      if (!daily || daily.length === 0) return 'Belum cukup data.';
      const avgMl = Math.round(daily.reduce((s,d) => s + d.total_value, 0) / daily.length);
      return `Rata-rata ${avgMl} ml per hari. Skor: ${score.label || '-'}.`;
    },
  },
  drink: {
    name: '💧 Minum', title: 'Minum', formTitle: 'Catat Minum',
    todayApi: (d) => Api.getDailyDrink(d),
    createApi: (p) => Api.createDailyDrink(p),
    deleteApi: (id) => Api.deleteDailyDrink(id),
    analyticsApi: () => Api.getTrackerAnalytics('drink'),
    articlesApi: () => Api.getTrackerArticles('drink'),
    formFields: () => `
      <div class="form-group"><label>Tanggal</label><input type="date" id="g-sl-date"></div>
      <div class="form-group"><label>Jumlah (ml)</label><input type="number" id="g-amount" value="100"></div>
      <div class="form-group"><label>Catatan</label><textarea id="g-notes" placeholder="Catatan..."></textarea></div>`,
    getPayload: () => ({
      record_date: document.getElementById('g-sl-date').value,
      amount_ml: parseFloat(document.getElementById('g-amount').value) || 100,
      notes: document.getElementById('g-notes').value.trim() || null,
    }),
    formatRecord: (r) => ({ time: '', detail: `<b>${r.amount_ml || 0} ml</b>` }),
    formatTotal: (records) => `${records.reduce((s,r) => s + (r.amount_ml||0), 0)} ml (${records.length}x)`,
    formatAnalytics: (avg) => ({ val: `${avg.avg_value} ml`, freq: `${avg.avg_count}x/hari` }),
    formatInsight: (avg, score, daily) => {
      if (!daily || daily.length === 0) return 'Belum cukup data.';
      const avgMl = Math.round(daily.reduce((s,d) => s + d.total_value, 0) / daily.length);
      return `Rata-rata ${avgMl} ml per hari. Skor: ${score.label || '-'}.`;
    },
  },
  poop: {
    name: '💩 BAB', title: 'BAB', formTitle: 'Catat BAB',
    todayApi: (d) => Api.getDailyPoop(d),
    createApi: (p) => Api.createDailyPoop(p),
    deleteApi: (id) => Api.deleteDailyPoop(id),
    analyticsApi: () => Api.getTrackerAnalytics('poop'),
    articlesApi: () => Api.getTrackerArticles('poop'),
    formFields: () => `
      <div class="form-group"><label>Tanggal</label><input type="date" id="g-sl-date"></div>
      <div class="form-group"><label>Jumlah</label><input type="number" min="1" id="g-count" value="1"></div>
      <div class="form-group"><label>Konsistensi</label>
        <select id="g-consistency"><option value="normal">Normal</option><option value="cair">Cair (diare)</option><option value="keras">Keras (sembelit)</option><option value="lendir">Berlendir</option></select>
      </div>
      <div class="form-group"><label>Catatan</label><textarea id="g-notes" placeholder="Catatan..."></textarea></div>`,
    getPayload: () => ({
      record_date: document.getElementById('g-sl-date').value,
      count: parseInt(document.getElementById('g-count').value) || 1,
      consistency: document.getElementById('g-consistency').value,
      notes: document.getElementById('g-notes').value.trim() || null,
    }),
    formatRecord: (r) => {
      let text = `<b>${r.count || 1}x</b>`;
      if (r.consistency) text += ` · ${r.consistency}`;
      return { time: '', detail: text };
    },
    formatTotal: (records) => `${records.reduce((s,r) => s + (r.count||0), 0)}x`,
    formatAnalytics: (avg) => ({ val: `${avg.avg_value}x/hari`, freq: `${avg.avg_count}x/hari` }),
    formatInsight: (avg, score, daily) => {
      if (!daily || daily.length === 0) return 'Belum cukup data.';
      const avgC = Math.round(daily.reduce((s,d) => s + d.total_value, 0) / daily.length);
      return `Rata-rata ${avgC}x per hari. Skor: ${score.label || '-'}.`;
    },
  },
  pee: {
    name: '🚽 BAK', title: 'BAK', formTitle: 'Catat BAK',
    todayApi: (d) => Api.getDailyPee(d),
    createApi: (p) => Api.createDailyPee(p),
    deleteApi: (id) => Api.deleteDailyPee(id),
    analyticsApi: () => Api.getTrackerAnalytics('pee'),
    articlesApi: () => Api.getTrackerArticles('pee'),
    formFields: () => `
      <div class="form-group"><label>Tanggal</label><input type="date" id="g-sl-date"></div>
      <div class="form-group"><label>Jumlah</label><input type="number" min="1" id="g-count" value="1"></div>
      <div class="form-group"><label>Catatan</label><textarea id="g-notes" placeholder="Catatan..."></textarea></div>`,
    getPayload: () => ({
      record_date: document.getElementById('g-sl-date').value,
      count: parseInt(document.getElementById('g-count').value) || 1,
      notes: document.getElementById('g-notes').value.trim() || null,
    }),
    formatRecord: (r) => ({ time: '', detail: `<b>${r.count || 1}x</b>` }),
    formatTotal: (records) => `${records.reduce((s,r) => s + (r.count||0), 0)}x`,
    formatAnalytics: (avg) => ({ val: `${avg.avg_value}x/hari`, freq: `${avg.avg_count}x/hari` }),
    formatInsight: (avg, score, daily) => {
      if (!daily || daily.length === 0) return 'Belum cukup data.';
      const avgC = Math.round(daily.reduce((s,d) => s + d.total_value, 0) / daily.length);
      return `Rata-rata ${avgC}x per hari. Skor: ${score.label || '-'}.`;
    },
  },
  eating: {
    name: '🍚 Makan', title: 'Makan (MPASI)', formTitle: 'Catat Makan',
    todayApi: (d) => Api.getDailyFeeding(d, 'MPASI'),
    createApi: (p) => Api.createDailyFeeding({ ...p, feeding_type: 'MPASI' }),
    deleteApi: (id) => Api.deleteDailyFeeding(id),
    analyticsApi: () => Api.getTrackerAnalytics('feeding'),
    articlesApi: () => Api.getTrackerArticles('feeding'),
    formFields: () => `
      <div class="form-group"><label>Tanggal</label><input type="date" id="g-sl-date"></div>
      <div class="form-group"><label>Menu</label><input type="text" id="g-menu" placeholder="contoh: bubur ayam"></div>
      <div class="form-group"><label>Jumlah (ml)</label><input type="number" id="g-amount" value="100"></div>
      <div class="form-group"><label>Catatan</label><textarea id="g-notes" placeholder="Catatan..."></textarea></div>`,
    getPayload: () => {
      const menu = document.getElementById('g-menu').value.trim();
      const notes = document.getElementById('g-notes').value.trim();
      return {
        record_date: document.getElementById('g-sl-date').value,
        amount_ml: parseFloat(document.getElementById('g-amount').value) || null,
        notes: (menu ? menu : '') + (notes ? ` · ${notes}` : ''),
      };
    },
    formatRecord: (r) => ({ time: '', detail: `<b>${r.amount_ml || 0} ml</b>${r.notes ? ' · '+escapeHtml(r.notes) : ''}` }),
    formatTotal: (records) => `${records.length}x (${records.reduce((s,r) => s + (r.amount_ml||0), 0)} ml)`,
    formatAnalytics: (avg) => ({ val: `${avg.avg_value} ml`, freq: `${avg.avg_count}x/hari` }),
    formatInsight: (avg, score, daily) => {
      if (!daily || daily.length === 0) return 'Belum cukup data.';
      const avgMl = Math.round(daily.reduce((s,d) => s + d.total_value, 0) / daily.length);
      return `Rata-rata ${avgMl} ml per hari. Skor: ${score.label || '-'}.`;
    },
  },
};

// === Load Generic Tracker Detail ===
async function loadTrackerDetailPage() {
  const type = window._activeTrackerType || 'sleep';
  const cfg = TRACKER_CONFIGS[type];
  if (!cfg) return;
  const today = new Date().toISOString().split('T')[0];

  document.getElementById('tracker-page-title').textContent = cfg.name;
  document.getElementById('tracker-form-title').textContent = cfg.formTitle;
  document.getElementById('tracker-form-fields').innerHTML = cfg.formFields();
  document.getElementById('g-sl-date').value = today;

  await loadTrackerToday(type, cfg);
  await loadTrackerAnalytics(type, cfg);
  await loadTrackerArticles(type, cfg);
}

// === Today Records ===
async function loadTrackerToday(type, cfg) {
  const today = new Date().toISOString().split('T')[0];
  const container = document.getElementById('tracker-today-records');
  const totalEl = document.getElementById('tracker-today-total');
  try {
    const data = await cfg.todayApi(today);
    const records = data.records || [];
    totalEl.textContent = `Total: ${cfg.formatTotal(records)}`;

    if (records.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada catatan hari ini.</p>';
      return;
    }
    container.innerHTML = records.map(r => {
      const f = cfg.formatRecord(r);
      const time = r.created_at ? formatTime(r.created_at) : '';
      return `<div class="sleep-record-item">
        <div class="sleep-rec-time">${f.time || time}</div>
        <div class="sleep-rec-dur">${f.detail}</div>
        <button class="sleep-rec-del" data-id="${r.id}">✕</button>
      </div>`;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p class="info-text">Gagal memuat data.</p>';
  }
}

// === Analytics ===
async function loadTrackerAnalytics(type, cfg) {
  try {
    const data = await cfg.analyticsApi();
    const avg = data.avg || {};
    const fa = cfg.formatAnalytics(avg);
    document.getElementById('tr-avg-val').textContent = fa.val;
    document.getElementById('tr-avg-freq').textContent = fa.freq;
    const sc = data.score || {};
    document.getElementById('tr-score').textContent = sc.label || '-';
    document.getElementById('tracker-insight').textContent = cfg.formatInsight(avg, sc, data.daily);

    // Bar chart
    const daily = data.daily || [];
    const container = document.getElementById('tracker-chart');
    if (daily.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada data 7 hari terakhir.</p>';
      return;
    }
    const maxVal = Math.max(...daily.map(d => d.total_value), 1);
    container.innerHTML = '<div class="bar-chart">' + daily.map(d => {
      const pct = Math.min(Math.round((d.total_value / maxVal) * 100), 100);
      const label = d.date ? d.date.slice(5) : '';
      const isToday = d.date === new Date().toISOString().split('T')[0];
      return `<div class="bar-col ${isToday ? 'bar-today' : ''}">
        <div class="bar-val">${d.total_value}</div>
        <div class="bar" style="height:${pct}%"></div>
        <div class="bar-label">${label}</div>
      </div>`;
    }).join('') + '</div>';
  } catch (err) {
    console.error('Tracker analytics error:', err);
  }
}

// === Articles ===
async function loadTrackerArticles(type, cfg) {
  const container = document.getElementById('tracker-articles');
  try {
    const data = await cfg.articlesApi();
    const articles = data.articles || [];
    if (articles.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada artikel.</p>';
      return;
    }
    container.innerHTML = articles.map(a => `<div class="article-horiz" style="cursor:pointer;">
      <div class="article-horiz-body">
        <div class="article-horiz-title">${escapeHtml(a.title)}</div>
        <div class="article-horiz-summary">${escapeHtml(a.summary)}</div>
      </div>
    </div>`).join('');
  } catch (err) {
    container.innerHTML = '<p class="info-text">Gagal memuat artikel.</p>';
  }
}

// === Save Generic Record ===
async function saveTrackerRecord() {
  const type = window._activeTrackerType || 'sleep';
  const cfg = TRACKER_CONFIGS[type];
  if (!cfg) return;

  const payload = cfg.getPayload();
  if (!payload.record_date) {
    showToast('Mohon isi tanggal', 'error');
    return;
  }

  try {
    await cfg.createApi(payload);
    showToast('Data tersimpan', 'success');
    document.getElementById('g-notes').value = '';
    if (document.getElementById('g-amount')) document.getElementById('g-amount').value = '';
    if (document.getElementById('g-sl-start')) document.getElementById('g-sl-start').value = '';
    if (document.getElementById('g-sl-end')) document.getElementById('g-sl-end').value = '';
    await loadTrackerToday(type, cfg);
    await loadTrackerAnalytics(type, cfg);
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan', 'error');
  }
}

// === Delete Generic Record ===
async function deleteTrackerRecordGeneric(id) {
  const type = window._activeTrackerType || 'sleep';
  const cfg = TRACKER_CONFIGS[type];
  if (!cfg) return;
  try {
    await cfg.deleteApi(id);
    showToast('Data dihapus', 'success');
    await loadTrackerToday(type, cfg);
    await loadTrackerAnalytics(type, cfg);
  } catch (err) {
    showToast('Gagal menghapus', 'error');
  }
}

// ============================
// DEVELOPMENT PAGE
// ============================
async function loadDevelopmentPage() {
  const user = Api.getUser();
  if (!user) return;
  const age = calculateAgeMonths(user.child_dob);
  devCurrentAge = age;
  await loadDevelopmentPageData(age);
}

async function loadDevelopmentPageData(age) {
  const user = Api.getUser();
  if (!user) return;
  const childName = user.child_name || 'Anak';
  const dob = user.child_dob ? new Date(user.child_dob) : null;
  let extraDays = 0;
  if (dob) {
    const diff = new Date() - dob;
    extraDays = Math.floor(diff / (1000 * 60 * 60 * 24)) % 30;
  }
  document.getElementById('dev-age-label').textContent = `${age} bulan ${extraDays} hari`;
  try {
    const data = await Api.request(`/development?age=${age}`);
    if (!data) return;
    document.getElementById('dev-today-text').textContent = data.tip || 'Memuat...';
    const doList = document.getElementById('dev-do-list');
    const dontList = document.getElementById('dev-dont-list');
    doList.innerHTML = (data.recommended || []).map(r => `<li>${escapeHtml(r)}</li>`).join('');
    dontList.innerHTML = (data.not_recommended || []).map(r => `<li>${escapeHtml(r)}</li>`).join('');
    document.getElementById('dev-insight-text').textContent = data.insight || 'Memuat analisis...';
    const warnCard = document.getElementById('dev-warning-card');
    if (data.score && data.score.value !== null && data.score.value < 60) {
      warnCard.style.display = 'block';
      document.getElementById('dev-warning-text').textContent = `Skor perkembangan ${childName} adalah ${data.score.value} (${data.score.label}). Disarankan konsultasi dengan dokter anak.`;
    } else {
      warnCard.style.display = 'none';
    }
    const p = data.progress || {};
    document.getElementById('dev-progress-count').textContent = `${p.completed || 0} / ${p.total || 0}`;
    document.getElementById('dev-progress-fill').style.width = `${p.percentage || 0}%`;
    document.getElementById('dev-progress-pct').textContent = `${p.percentage || 0}%`;
    const bc = data.by_category || {};
    const catMap = { motor: 'dev-cat-motor', speech: 'dev-cat-speech', social: 'dev-cat-social', cognitive: 'dev-cat-cognitive' };
    const catListMap = { motor: 'dev-cat-motor-list', speech: 'dev-cat-speech-list', social: 'dev-cat-social-list', cognitive: 'dev-cat-cognitive-list' };
    Object.entries(catMap).forEach(([cat, id]) => {
      const c = bc[cat] || { completed: 0, total: 0, items: [] };
      document.getElementById(id).textContent = `${c.completed}/${c.total}`;
      document.getElementById(catListMap[cat]).innerHTML = (c.items || []).map(m => `<li class="${m.done ? 'done' : 'pending'}">${escapeHtml(m.title)}</li>`).join('');
    });
    const sc = data.score || {};
    document.getElementById('dev-score-num').textContent = sc.value !== null ? `${sc.value}%` : '—';
    document.getElementById('dev-score-label').textContent = sc.label || '-';
    const circle = document.getElementById('dev-score-circle');
    if (sc.value !== null) circle.style.borderColor = sc.value >= 75 ? '#10B981' : sc.value >= 60 ? '#F59E0B' : '#EF4444';
    const timeline = data.timeline || [];
    document.getElementById('dev-timeline').innerHTML = timeline.map(t => {
      const cls = t.is_current ? 'current' : t.is_past ? 'past' : '';
      return `<div class="dev-timeline-item ${cls}">
        <div class="dev-timeline-age">${escapeHtml(t.label)}</div>
        <div class="dev-timeline-ms">
          ${(t.milestones || []).slice(0, 3).map(m => `<div class="tl-title">${t.is_past ? '✅' : t.is_current ? '⏳' : '○'} ${escapeHtml(m)}</div>`).join('')}
          ${t.milestones && t.milestones.length > 3 ? `<div class="tl-detail">+${t.milestones.length - 3} lainnya</div>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    console.error('Development page error:', err);
  }
}
