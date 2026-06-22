// ============================
// STATE
// ============================
let currentPage = 'login';
let selectedTrackingType = null;
let selectedSeverity = 'normal';
let articlesCache = [];

// ============================
// HELPERS
// ============================
function imgUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return UPLOAD_BASE_URL + url;
  return url;
}

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
  safeAddListener('btn-add-growth', 'click', () => {
    document.getElementById('growth-modal').classList.remove('hidden');
    // auto-focus first input
    setTimeout(() => {
      const input = document.getElementById('hg-weight');
      if (input) input.focus();
    }, 350);
  });
  safeAddListener('btn-submit-home-growth', 'click', submitHomeGrowth);
  safeAddListener('btn-notif', 'click', openNotifModal);
  // Child Data page listeners
  if (typeof initChildDataListeners === 'function') initChildDataListeners();
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
      if (video && video.video_url) {
        // Convert embed URL to watch URL if needed
        let url = video.video_url;
        if (url.includes('/embed/')) {
          url = url.replace('/embed/', '/watch?v=');
        }
        window.open(url, '_blank');
      }
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

  // Product list - buy buttons & carousel
  safeAddListener('product-list', 'click', (e) => {
    const btn = e.target.closest('[data-product-id]');
    if (btn && btn.dataset.productId) {
      buyProduct(btn.dataset.productId);
      return;
    }
    // Carousel navigation
    const carousel = e.target.closest('.product-carousel');
    if (!carousel) return;
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    if (slides.length === 0) return;
    let currentIdx = Array.from(slides).findIndex((s) => parseFloat(s.style.opacity) > 0.5);
    if (currentIdx === -1) currentIdx = 0;
    if (e.target.classList.contains('carousel-prev')) {
      currentIdx = (currentIdx - 1 + slides.length) % slides.length;
    } else if (e.target.classList.contains('carousel-next')) {
      currentIdx = (currentIdx + 1) % slides.length;
    } else if (e.target.classList.contains('carousel-dot')) {
      currentIdx = parseInt(e.target.dataset.index);
    } else return;
    slides.forEach((s, i) => { s.style.opacity = i === currentIdx ? '1' : '0'; });
    dots.forEach((d, i) => { d.style.background = i === currentIdx ? '#fff' : 'rgba(255,255,255,0.5)'; });
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
    const btn = e.target.closest('[data-action]');
    const action = btn ? btn.dataset.action : null;
    if (action === 'show-admin-list-articles') showAdminListArticles();
    else if (action === 'show-admin-list-videos') showAdminListVideos();
    else if (action === 'show-admin-list-products') showAdminListProducts();
    else if (action === 'show-admin-add-article') showAdminAddArticle();
    else if (action === 'show-admin-add-video') showAdminAddVideo();
    else if (action === 'show-admin-add-product') showAdminAddProduct();
    else if (action === 'submit-admin-article') submitAdminArticle();
    else if (action === 'submit-admin-video') submitAdminVideo();
    else if (action === 'submit-admin-product') submitAdminProduct();
    else if (action === 'submit-admin-edit-article') submitAdminEditArticle();
    else if (action === 'submit-admin-edit-video') submitAdminEditVideo();
    else if (action === 'submit-admin-edit-product') submitAdminEditProduct();
    else if (action === 'show-admin-edit-article') showAdminEditArticle(e);
    else if (action === 'show-admin-edit-video') showAdminEditVideo(e);
    else if (action === 'show-admin-edit-product') showAdminEditProduct(e);
    else if (action === 'show-admin-delete-article') confirmDelete('article', e);
    else if (action === 'show-admin-delete-video') confirmDelete('video', e);
    else if (action === 'show-admin-delete-product') confirmDelete('product', e);
    else if (action === 'show-admin-analytics') showAdminAnalytics();
    else if (action === 'show-admin-user-list') showAdminUserList();
    else if (action === 'show-admin-add-admin') showAdminAddAdmin();
    else if (action === 'submit-admin-add-admin') submitAdminAddAdmin();
    else if (action === 'edit-child-data' || action === 'add-child-data') openChildForm();
    else if (action === 'save-cs-settings') saveCsSettings();
    else if (action === 'toggle-privacy') toggleAccordion('accordion-privacy');
    else if (action === 'toggle-help') toggleAccordion('accordion-help');
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
    // Hide top-right gear icon — semua user pake nav settings
    const headerSettings = document.getElementById('btn-settings');
    if (headerSettings) {
      headerSettings.style.display = 'none';
    }
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

  // 2. Fetch fresh child profile dari API (satu sumber utk semua data anak)
  let childData = null;
  let childGrowth = null;
  try {
    const apiData = await Api.getChildProfile();
    childData = apiData.child || null;
    childGrowth = apiData.growth || null;
  } catch (e) { /* fallback ke localStorage */ }

  // Merge: API data lebih prioritas, localStorage sebagai fallback
  const childName = (childData && childData.name) || user.child_name || 'Anak';
  const childDob = (childData && childData.dob) || user.child_dob;
  const childGender = (childData && childData.gender) || user.child_gender;
  const childPhoto = (childData && childData.photo) || user.child_photo;

  // Hitung usia anak
  const age = calculateAgeMonths(childDob);

  // Sembunyikan tracker yang gak relevan berdasarkan usia
  applyAgeBasedVisibility(age);

  // 3. Child Profile — pake data fresh dari API (growth juga dari sini)
  // Gabungin API data + localStorage jadi satu object user
  const mergedUser = {
    ...user,
    child_name: childName,
    child_dob: childDob,
    child_gender: childGender,
    child_photo: childPhoto,
  };
  // Growth record pake dari child profile API biar sinkron dgn Settings
  const growthRecord = childGrowth ? [childGrowth] : [];
  await loadChildProfile(mergedUser, growthRecord);

  // 3. Daily Summary (tidur, menyusui, minum, BAB, BAK)
  await loadDailySummary();

  // 4. Development Today
  await loadDevelopmentToday(user);

  // 5. Growth summary (pake data growth yg udah diambil)
  await loadBerandaGrowthRingkasan(growthRecord);

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

  // Gunakan getAgeParts untuk display yang akurat
  const parts = getAgeParts(user.child_dob);
  document.getElementById('child-name').textContent = childName;
  document.getElementById('child-age').textContent = `${parts.months} bulan ${parts.days} hari`;

  // Avatar — from photo/emoji/SVG
  const avatarEl = document.getElementById('child-avatar');
  const childPhoto = user.child_photo;
  if (childPhoto && childPhoto.startsWith('http')) {
    avatarEl.innerHTML = `<img src="${escapeHtml(childPhoto)}" style="width:100%;height:100%;object-fit:cover;">`;
  } else if (childPhoto) {
    avatarEl.innerHTML = avatarGenerateSVG(childPhoto, 72);
  } else if (user.child_gender === 'Laki-laki') {
    avatarEl.textContent = '👦';
  } else if (user.child_gender === 'Perempuan') {
    avatarEl.textContent = '👧';
  } else {
    avatarEl.textContent = (childName.charAt(0) || '·').toUpperCase();
  }

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
        const icon = s.result === 'sesuai' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' : (s.result === 'meragukan' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>');
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

// === Notification Modal ===
function openNotifModal() {
  const modal = document.getElementById('notif-modal');
  const list = document.getElementById('notif-list');
  list.innerHTML = '<p class="info-text" style="text-align:center;color:#999;padding:20px 0;">Memuat...</p>';
  modal.classList.remove('hidden');

  // Fetch reminders
  Api.getReminders().then(data => {
    const reminders = data.reminders || [];
    if (reminders.length === 0) {
      list.innerHTML = '<p class="info-text" style="text-align:center;color:#999;padding:20px 0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Tidak ada pengingat.</p>';
      return;
    }
    list.innerHTML = reminders.map(r => {
      const icon = r.type === 'imunisasi' ? '💉' : '🏥';
      const days = r.days_left > 0 ? `<span style="color:#E8682E;font-weight:600;">${r.days_left} hari lagi</span>` : '<span style="color:#e53935;font-weight:600;">Hari ini</span>';
      return `<div style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:24px;">${icon}</span>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:500;color:#1A1A1A;">${escapeHtml(r.title)}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">${r.description || ''}</div>
        </div>
        <div style="font-size:13px;white-space:nowrap;">${days}</div>
      </div>`;
    }).join('');
  }).catch(() => {
    list.innerHTML = '<p class="info-text" style="text-align:center;color:#999;padding:20px 0;">Gagal memuat notifikasi.</p>';
  });
}

function closeNotifModal() {
  document.getElementById('notif-modal').classList.add('hidden');
}

// === Quick Add Tracker ===
function openQuickAdd(trackerType) {
  const modal = document.getElementById('quickadd-modal');
  const title = document.getElementById('quickadd-title');
  const fields = document.getElementById('quickadd-fields');
  const today = new Date().toISOString().split('T')[0];

  const configs = {
    sleep: { title: 'Tambah Tidur', html: `
      <div class="form-group"><label>Jam Mulai Tidur</label><input type="time" id="qa-sleep-start"></div>
      <div class="form-group"><label>Jam Bangun</label><input type="time" id="qa-sleep-end"></div>
      <div class="form-group"><label>Catatan <span class="label-optional">(opsional)</span></label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
    `},
    feeding: { title: 'Tambah Menyusui', html: `
      <div class="form-group"><label>Jenis</label>
        <select id="qa-feeding-type"><option value="ASI">ASI</option><option value="Susu Formula">Susu Formula</option><option value="MPASI">MPASI</option></select>
      </div>
      <div class="form-group"><label>Jumlah <span class="label-unit">(ml)</span></label><input type="number" step="1" min="0" id="qa-amount"></div>
      <div class="form-group"><label>Durasi <span class="label-unit">(menit)</span></label><input type="number" min="0" id="qa-duration"></div>
      <div class="form-group"><label>Catatan <span class="label-optional">(opsional)</span></label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
    `},
    drink: { title: 'Tambah Minum', html: `
      <div class="form-group"><label>Jumlah <span class="label-unit">(ml)</span></label><input type="number" step="1" min="0" id="qa-amount" value="100"></div>
      <div class="form-group"><label>Catatan <span class="label-optional">(opsional)</span></label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
    `},
    pee: { title: 'Tambah BAK', html: `
      <div class="form-group"><label>Jumlah <span class="label-unit">(kali)</span></label><input type="number" min="1" id="qa-count" value="1"></div>
      <div class="form-group"><label>Catatan <span class="label-optional">(opsional)</span></label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
    `},
    poop: { title: 'Tambah BAB', html: `
      <div class="form-group"><label>Jumlah <span class="label-unit">(kali)</span></label><input type="number" min="1" id="qa-count" value="1"></div>
      <div class="form-group"><label>Konsistensi</label>
        <select id="qa-consistency"><option value="normal">Normal</option><option value="cair">Cair (diare)</option><option value="keras">Keras (sembelit)</option><option value="lendir">Berlendir</option></select>
      </div>
      <div class="form-group"><label>Catatan <span class="label-optional">(opsional)</span></label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
    `},
    eating: { title: 'Tambah Makan (MPASI)', html: `
      <div class="form-group"><label>Menu Makanan</label><input type="text" id="qa-menu" placeholder="contoh: bubur ayam"></div>
      <div class="form-group"><label>Jumlah <span class="label-unit">(ml/porsi)</span></label><input type="number" step="1" min="0" id="qa-amount" value="100"></div>
      <div class="form-group"><label>Catatan <span class="label-optional">(opsional)</span></label><textarea id="qa-notes" placeholder="Catatan..."></textarea></div>
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
    sleep: { title: 'Riwayat Tidur', icon: '', fmt: (r) => {
      const start = r.sleep_start ? r.sleep_start.slice(0,5) : '-';
      const end = r.sleep_end ? r.sleep_end.slice(0,5) : '-';
      const dur = r.duration_minutes ? `${Math.floor(r.duration_minutes/60)}j ${r.duration_minutes%60}m` : '';
      return `<b>${start} - ${end}</b> ${dur ? '<br><small>'+dur+'</small>' : ''}`;
    }},
    feeding: { title: 'Riwayat Menyusui', icon: '', fmt: (r) => {
      let text = `<b>${escapeHtml(r.feeding_type || '')}</b>`;
      if (r.amount_ml) text += ` · ${r.amount_ml} ml`;
      if (r.duration_minutes) text += ` · ${r.duration_minutes} menit`;
      return text;
    }},
    drink: { title: 'Riwayat Minum', icon: '', fmt: (r) => {
      return `<b>${r.amount_ml || 0} ml</b>`;
    }},
    poop: { title: 'Riwayat BAB', icon: '', fmt: (r) => {
      let text = `<b>${r.count}x</b>`;
      if (r.consistency) text += ` · ${escapeHtml(r.consistency)}`;
      return text;
    }},
    pee: { title: 'Riwayat BAK', icon: '', fmt: (r) => {
      return `<b>${r.count || 1}x</b>`;
    }},
    eating: { title: 'Riwayat Makan', icon: '', fmt: (r) => {
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
    await loadHomeData(); // refresh full homepage
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// === Modal Close (generic) ===
function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('hidden');
}

// === Escape key closes growth modal ===
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('growth-modal');
    if (modal && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
    }
  }
});

function calculateAgeMonths(dob) {
  if (!dob) return '-';
  const now = new Date();
  const birth = new Date(dob);
  const diff = now - birth;
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30)); // tetap 30-day untuk konsistensi dgn extraDays
}

function getAgeParts(dob) {
  if (!dob) return { months: '-', days: 0 };
  const now = new Date();
  const birth = new Date(dob);
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  let days = now.getDate() - birth.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  return { months, days };
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
        ${entry.ai_insight ? `<p style="margin-top: 6px; font-size: 11px; color: #003DA5; font-style: italic;">${escapeHtml(entry.ai_insight)}</p>` : '<p style="margin-top: 6px; font-size: 11px; color: #666;">Tap untuk AI insight</p>'}
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
        const icon = p.latest_result === 'sesuai' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' : p.latest_result === 'meragukan' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
        const history = (p.scores || [])
          .map((s) => `<span class="g-metric">${s.score_percentage != null ? s.score_percentage : '-'}% <small>(${formatDate(s.date)})</small></span>`)
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
          <div class="video-thumb" style="${v.thumbnail_url ? `background-image:url('${imgUrl(v.thumbnail_url)}');background-size:cover;background-position:center` : getThumbnailStyle(categoryName)}">
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
    if (video.age_range) descHtml += `<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M12 2a4 4 0 014 4c0 2-2 3-4 5-2-2-4-3-4-5a4 4 0 014-4z"/><path d="M16 12c-1.5-1-2.8-1.5-4-1.5-1.2 0-2.5.5-4 1.5"/><path d="M8 16c1.5 1 2.8 1.5 4 1.5 1.2 0 2.5-.5 4-1.5"/><path d="M4 22c.5-2 2.5-3 4-3"/><path d="M20 22c-.5-2-2.5-3-4-3"/></svg> ${escapeHtml(video.age_range)}</span>`;
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
        ${article.image_url ? `<img src="${imgUrl(article.image_url)}" alt="${escapeHtml(article.title)}" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin:6px 0;">` : ''}
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
      ${article.image_url ? `<img src="${imgUrl(article.image_url)}" alt="${escapeHtml(article.title)}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin:8px 0;">` : ''}
      <h2 style="color: #003DA5; margin: 12px 0 8px; font-size: 17px;">${escapeHtml(article.title)}</h2>
      <p style="font-size: 13px; color: #1A1A1A; line-height: 1.6;">${escapeHtml(article.content).replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')}</p>
      ${article.red_flags ? `
        <div class="card" style="border-left-color: #EF4444; background: #FEE2E2;">
          <p class="cat" style="color: #991B1B;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Tanda Perlu Diwaspadai:</p>
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
// SHOP PAGE — Shopee-style Grid
// ============================
async function loadProducts() {
  try {
    const data = await Api.getProducts();
    const container = document.getElementById('product-list');

    if (data.products.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada produk.</p>';
      return;
    }

    container.innerHTML = `<div class="product-grid">${
      data.products.map((product) => {
        const imgSrc = imgUrl(product.images && product.images[0] ? product.images[0] : product.image_url);
        const price = Number(product.price);
        const priceStr = 'Rp ' + price.toLocaleString('id-ID');
        const rating = parseFloat(product.rating) || 0;
        const origPrice = product.original_price ? Number(product.original_price) : null;
        const origPriceStr = origPrice ? 'Rp ' + origPrice.toLocaleString('id-ID') : null;

        return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-card-image-wrap">
          ${imgSrc ? `<img src="${imgSrc}" alt="${escapeHtml(product.name)}" loading="lazy">` : ''}
        </div>
        <div class="product-card-content">
          <h3 class="product-card-title">${escapeHtml(product.name)}</h3>
          <div class="product-card-price">${priceStr}${origPriceStr ? ` <span class="product-card-discount">${origPriceStr}</span>` : ''}</div>
          ${rating > 0 ? `<div class="product-card-rating"><span class="star">⭐</span><span>${rating.toFixed(1)}</span></div>` : ''}
          <button class="product-card-btn" data-product-id="${product.id}">Beli di Shopee</button>
        </div>
      </div>`;
      }).join('')
    }</div>`;

    // Event delegation via container
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.product-card-btn');
      if (btn) {
        e.preventDefault();
        buyProduct(btn.dataset.productId);
      }
    });

  } catch (err) {
    console.error('Failed to load products:', err);
    document.getElementById('product-list').innerHTML = '<p class="info-text">Gagal memuat produk.</p>';
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

  container.innerHTML = `
    <div id="cd-settings-wrapper">
      <div class="cd-card" style="padding: 24px; border-radius: 24px;">
        <div class="cd-header" style="display:flex;flex-direction:column;align-items:center;margin-bottom:16px;">
          <div id="cd-avatar-settings" class="cd-avatar" style="width:72px;height:72px;border-radius:50%;background:#FFF0E8;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#E8682E;margin-bottom:8px;overflow:hidden;">·</div>
          <div id="cd-name-settings" style="font-size:18px;font-weight:700;color:#1A1A1A;">${escapeHtml(user.child_name || 'Belum diisi')}</div>
          <div id="cd-age-settings" style="font-size:13px;color:#888;margin-top:2px;">Memuat...</div>
        </div>
        <div class="cd-stats" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <div class="cd-stat" style="background:#F9F9FB;border-radius:12px;padding:8px 12px;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Berat Badan</div>
            <div id="cd-stat-bb-s" style="font-size:16px;font-weight:600;color:#1A1A1A;">-</div>
          </div>
          <div class="cd-stat" style="background:#F9F9FB;border-radius:12px;padding:8px 12px;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Tinggi Badan</div>
            <div id="cd-stat-tb-s" style="font-size:16px;font-weight:600;color:#1A1A1A;">-</div>
          </div>
          <div class="cd-stat" style="background:#F9F9FB;border-radius:12px;padding:8px 12px;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Status Gizi</div>
            <div id="cd-stat-gizi-s" style="font-size:14px;font-weight:600;color:#1A1A1A;">-</div>
          </div>
          <div class="cd-stat" style="background:#F9F9FB;border-radius:12px;padding:8px 12px;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Perkembangan</div>
            <div id="cd-stat-dev-s" style="font-size:14px;font-weight:600;color:#1A1A1A;">-</div>
          </div>
        </div>
        <button id="btn-edit-child-settings" data-action="edit-child-data" style="background:none;border:none;color:#E8682E;font-size:13px;font-weight:600;cursor:pointer;padding:4px 0;width:100%;text-align:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit Data Anak</button>
      </div>
    </div>
    <div class="card" style="border-left:none;margin-top:16px;">
      <p class="cat">Nama Anda</p>
      <p class="title">${escapeHtml(user.full_name)}</p>
    </div>

    <!-- Customer Service Settings -->
    <div class="card" style="border-left:none;margin-top:16px;padding:12px 16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <p class="cat" style="margin:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg> Customer Service</p>
        ${user.role === 'admin' ? `<button id="btn-toggle-cs-edit" style="background:none;border:none;font-size:14px;cursor:pointer;color:#E8682E;padding:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>` : ''}
      </div>
      <div style="font-size:13px;color:#555;margin-top:6px;">
        <span id="cs-wa-display">Memuat...</span> · <span id="cs-email-display">Memuat...</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <a id="cs-wa-link" href="#" target="_blank" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:8px;background:#25D366;color:white;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> WhatsApp</a>
        <a id="cs-email-link" href="#" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:8px;background:#E5E7EB;color:#333;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Email</a>
      </div>
      ${user.role === 'admin' ? `
      <div id="cs-edit-form" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0;">
        <div class="form-group"><label style="font-size:12px;">No. WhatsApp</label>
          <input type="text" id="cs-wa-input" style="width:100%;padding:8px;border:2px solid #E5E7EB;border-radius:8px;font-size:13px;" placeholder="6281234567890">
        </div>
        <div class="form-group" style="margin-top:6px;"><label style="font-size:12px;">Email CS</label>
          <input type="text" id="cs-email-input" style="width:100%;padding:8px;border:2px solid #E5E7EB;border-radius:8px;font-size:13px;" placeholder="support@generos.id">
        </div>
        <button class="btn-primary" data-action="save-cs-settings" style="margin-top:6px;padding:8px 14px;font-size:12px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Simpan</button>
      </div>` : ''}
    </div>

    <!-- Settings Menu: Accordion Items -->
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:10px;">
      <!-- Kebijakan dan Privasi -->
      <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <div class="accordion-header" data-action="toggle-privacy" style="display:flex;justify-content:space-between;align-items:center;padding:16px;cursor:pointer;user-select:none;">
          <span style="font-weight:600;font-size:14px;color:#1A1A1A;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Kebijakan dan Privasi</span>
          <span class="accordion-arrow" data-action="toggle-privacy" style="font-size:12px;color:#999;transition:transform 0.2s;">▼</span>
        </div>
        <div id="accordion-privacy" class="accordion-content" style="display:none;padding:0 16px 16px;font-size:13px;color:#555;line-height:1.7;border-top:1px solid #f0f0f0;padding-top:12px;">
          <p style="margin:0 0 10px;">Aplikasi Generos Care menghormati dan melindungi privasi Anda. Data pribadi dan data perkembangan anak Anda hanya digunakan untuk memberikan layanan terbaik, termasuk pemantauan tumbuh kembang, rekomendasi stimulasi, dan skrining perkembangan.</p>
          <p style="margin:0 0 10px;">Kami tidak akan membagikan data Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali diwajibkan oleh hukum yang berlaku.</p>
          <p style="margin:0 0 10px;">Data yang kami kumpulkan meliputi: nama lengkap, nomor telepon, alamat email, data anak (nama, tanggal lahir, berat/tinggi badan, riwayat imunisasi, hasil skrining perkembangan), dan riwayat interaksi Anda dengan fitur aplikasi.</p>
          <p style="margin:0;">Anda berhak mengakses, mengubah, atau menghapus data Anda kapan saja melalui menu Pengaturan. Untuk pertanyaan lebih lanjut, hubungi kami di <b>support@generos.id</b>.</p>
        </div>
      </div>

      <!-- Pusat Bantuan & FAQ -->
      <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <div class="accordion-header" data-action="toggle-help" style="display:flex;justify-content:space-between;align-items:center;padding:16px;cursor:pointer;user-select:none;">
          <span style="font-weight:600;font-size:14px;color:#1A1A1A;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Pusat Bantuan & FAQ</span>
          <span class="accordion-arrow" data-action="toggle-help" style="font-size:12px;color:#999;transition:transform 0.2s;">▼</span>
        </div>
        <div id="accordion-help" class="accordion-content" style="display:none;padding:0 16px 16px;font-size:13px;color:#555;line-height:1.7;border-top:1px solid #f0f0f0;padding-top:12px;">
          <p style="margin:0 0 12px;font-weight:600;color:#333;">Butuh bantuan? Kami siap membantu Anda.</p>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <a href="https://wa.me/6281234567890?text=Halo%20Generos%20Care" target="_blank" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f5f5f5;border-radius:12px;text-decoration:none;color:#1A1A1A;">
              <span style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></span>
              <span style="font-weight:500;">Hubungi Customer Service via WhatsApp</span>
            </a>
            <a href="mailto:support@generos.id" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f5f5f5;border-radius:12px;text-decoration:none;color:#1A1A1A;">
              <span style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
              <span style="font-weight:500;">Kirim Email ke support@generos.id</span>
            </a>
          </div>
          <p style="margin:12px 0 0;font-size:12px;color:#999;">Respon dalam 1×24 jam pada hari kerja.</p>
        </div>
      </div>
    </div>
  `;

  // Load child profile data
  loadChildProfileSettings();
  // Load CS settings
  loadCsSettings();

  if (user.role === 'admin') {
    const adminHtml = `
      <div class="admin-section" style="margin-top: 20px;">
        <h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> Admin Panel</h4>
        <button class="btn-secondary" data-action="show-admin-list-articles"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Artikel</button>
        <button class="btn-secondary" data-action="show-admin-list-videos"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> Video</button>
        <button class="btn-secondary" data-action="show-admin-list-products"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> Produk</button>
        <button class="btn-secondary" data-action="show-admin-analytics"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Analytics</button>
        <button class="btn-secondary" data-action="show-admin-user-list"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> Pengguna</button>
        <button class="btn-secondary" data-action="show-admin-add-admin"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg> +Admin</button>
        <div id="admin-panel-content"></div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', adminHtml);
  }

  // Toggle CS edit form (admin only)
  if (user.role === 'admin') {
    const toggleBtn = document.getElementById('btn-toggle-cs-edit');
    if (toggleBtn) {
      toggleBtn.onclick = function() {
        const form = document.getElementById('cs-edit-form');
        if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
      };
    }
  }
}

async function loadChildProfileSettings() {
  try {
    const data = await Api.getChildProfile();
    const child = data.child || {};
    cdData = child;
    const g = data.growth || {};

    // Avatar — photo/emoji/SVG
    const avatar = document.getElementById('cd-avatar-settings');
    if (avatar) {
      if (child.photo && typeof child.photo === 'string' && child.photo.startsWith('http')) {
        avatar.innerHTML = `<img src="${escapeHtml(child.photo)}" style="width:100%;height:100%;object-fit:cover;">`;
      } else if (child.photo && child.photo.length > 2) {
        // New SVG avatar system (JSON) or legacy emoji
        avatar.innerHTML = avatarGenerateSVG(child.photo, 72);
      } else if (child.gender === 'Laki-laki') {
        avatar.innerHTML = avatarGenerateSVG({ type: 'child', skinTone: 'warm-peach', hair: 'short-flat', hairColor: 'dark-brown', eyes: 'dots', mouth: 'smile', clothingColor: 'navy' }, 72);
      } else if (child.gender === 'Perempuan') {
        avatar.innerHTML = avatarGenerateSVG({ type: 'child', skinTone: 'warm-peach', hair: 'long-straight', hairColor: 'dark-brown', eyes: 'dots', mouth: 'smile', clothingColor: 'coral' }, 72);
      } else {
        avatar.innerHTML = (child.name || 'A')[0].toUpperCase();
      }
    }

    setText('cd-name-settings', child.name || 'Belum diisi');
    setText('cd-age-settings', child.age || '-');
    setText('cd-stat-bb-s', g.weight_kg ? `${g.weight_kg} kg` : '-');
    setText('cd-stat-tb-s', g.height_cm ? `${g.height_cm} cm` : '-');
    setText('cd-stat-gizi-s', data.nutrition_status || '-');
    setText('cd-stat-dev-s', data.development_status || '-');
  } catch (err) {
    console.error('Load child profile settings error:', err);
  }
}

function toggleAccordion(contentId) {
  const content = document.getElementById(contentId);
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  // Rotate arrow
  const header = content.closest('div[style*="border-radius"]')?.querySelector('.accordion-arrow');
  if (header) {
    header.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

async function loadCsSettings() {
  try {
    const data = await Api.getSettings();
    const wa = data.settings.wa_number || '';
    const email = data.settings.email_support || '';

    // Update edit form inputs
    const waInput = document.getElementById('cs-wa-input');
    const emailInput = document.getElementById('cs-email-input');
    if (waInput) waInput.value = wa;
    if (emailInput) emailInput.value = email;

    // Update display
    setText('cs-wa-display', wa || 'Belum diatur');
    setText('cs-email-display', email || 'Belum diatur');

    // Update quick-action links
    const waLink = document.getElementById('cs-wa-link');
    if (waLink && wa) {
      waLink.href = `https://wa.me/${wa}?text=Halo%20Generos%20Care`;
    }
    const emailLink = document.getElementById('cs-email-link');
    if (emailLink && email) {
      emailLink.href = `mailto:${email}`;
    }

    // Update FAQ links (existing)
    const faqWa = document.querySelector('a[href*="wa.me"]');
    if (faqWa && wa) {
      faqWa.href = `https://wa.me/${wa}?text=Halo%20Generos%20Care`;
    }
    const faqEmail = document.querySelector('a[href*="mailto"]');
    if (faqEmail && email) {
      faqEmail.href = `mailto:${email}`;
    }
  } catch (err) {
    console.error('Load CS settings error:', err);
  }
}

async function saveCsSettings() {
  try {
    const wa = document.getElementById('cs-wa-input').value.trim();
    const email = document.getElementById('cs-email-input').value.trim();
    const data = await Api.updateSettings({ wa_number: wa, email_support: email });
    showToast('CS Settings berhasil disimpan', 'success');
    loadCsSettings(); // Refresh all display & links
    // Close edit form
    const form = document.getElementById('cs-edit-form');
    if (form) form.style.display = 'none';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// ADMIN FUNCTIONS
// ============================
function showAdminAddArticle() {
  const panel = document.getElementById('admin-panel-content');
  panel.innerHTML = `
    <div class="admin-form-wrap">
      <div class="admin-form-group"><label>Judul</label><input type="text" class="af-input" id="adm-art-title"></div>
      <div class="admin-form-group"><label>Kategori</label>
        <select class="af-select" id="adm-art-category">
          <option value="speech">Bicara</option>
          <option value="immunity">Imunitas</option>
          <option value="brain">Otak</option>
          <option value="tantrum">Tantrum</option>
          <option value="adhd">ADHD</option>
          <option value="autism">Autisme</option>
          <option value="other">Lainnya</option>
        </select>
      </div>
      <div class="admin-form-group"><label>Gambar Ilustrasi</label><input type="file" accept="image/*" class="af-file" id="adm-art-image-input"><div class="af-file-status" id="adm-art-image-preview"></div><span class="af-hint">Maksimal 5MB — format: JPG, PNG, WebP, GIF</span></div>
      <input type="hidden" id="adm-art-image-url" value="">
      <div class="admin-form-group"><label>Ringkasan</label><textarea class="af-textarea" id="adm-art-summary"></textarea></div>
      <div class="admin-form-group"><label>Konten</label><textarea class="af-textarea" id="adm-art-content"></textarea></div>
      <div class="admin-form-group"><label>Tanda Bahaya (opsional)</label><textarea class="af-textarea" id="adm-art-redflags"></textarea></div>
      <div class="admin-form-group"><label>Kapan ke Dokter (opsional)</label><textarea class="af-textarea" id="adm-art-doctor"></textarea></div>
      <button class="af-btn-primary" data-action="submit-admin-article">Simpan Artikel</button>
    </div>
  `;
  // Auto-upload on file select
  document.getElementById('adm-art-image-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById('adm-art-image-preview');
    preview.textContent = 'Mengupload...';
    try {
      const result = await Api.uploadImage(file);
      document.getElementById('adm-art-image-url').value = result.url;
      preview.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> <img src="${result.url}" style="height:40px;border-radius:4px;vertical-align:middle;"> Terupload`;
    } catch (err) {
      preview.textContent = '❌ ' + err.message;
    }
  });
}

async function submitAdminArticle() {
  try {
    await Api.createArticle({
      title: document.getElementById('adm-art-title').value,
      category: document.getElementById('adm-art-category').value,
      image_url: document.getElementById('adm-art-image-url').value || null,
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
    <div class="admin-form-wrap">
      <div class="admin-form-group"><label>Nama Produk</label><input type="text" class="af-input" id="adm-prod-name"></div>
      <div class="admin-form-group"><label>Harga Jual (Rp)</label><input type="number" class="af-input" id="adm-prod-price" placeholder="contoh: 125000"></div>
      <div class="admin-form-group"><label>Harga Coret (Rp) — opsional</label><input type="number" class="af-input" id="adm-prod-original-price" placeholder="lebih tinggi dari harga jual, contoh: 150000"></div>
      <div class="admin-form-group"><label>Rating ⭐ — opsional</label><input type="number" class="af-input" id="adm-prod-rating" min="1" max="5" step="0.1" placeholder="contoh: 4.8"></div>
      <div class="admin-form-group"><label>Link Shopee</label><input type="text" class="af-input" id="adm-prod-link" placeholder="https://shopee.co.id/..."></div>
      <div class="admin-form-group"><label>Gambar Produk (max 5)</label><input type="file" accept="image/*" multiple class="af-file" id="adm-prod-images-input"><div class="af-file-status" id="adm-prod-images-preview"></div><span class="af-hint">Maksimal 5MB per gambar — format: JPG, PNG, WebP, GIF</span></div>
      <input type="hidden" id="adm-prod-images" value="[]">
      <div class="admin-form-group"><label>URL Gambar Utama (opsional, jika tidak upload)</label><input type="text" class="af-input" id="adm-prod-image" placeholder="https://..."></div>
      <button class="af-btn-primary" data-action="submit-admin-product">Simpan Produk</button>
    </div>
  `;
  document.getElementById('adm-prod-images-input').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (files.length > 5) { showToast('Maksimal 5 gambar', 'error'); return; }
    const preview = document.getElementById('adm-prod-images-preview');
    preview.textContent = 'Mengupload...';
    try {
      const result = await Api.uploadImages(files);
      document.getElementById('adm-prod-images').value = JSON.stringify(result.urls);
      preview.innerHTML = result.urls.map((u) => `<img src="${u}" style="height:40px;border-radius:4px;margin:2px;">`).join('') + ' Terupload <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } catch (err) {
      preview.textContent = '❌ ' + err.message;
    }
  });
}

async function submitAdminProduct() {
  let images = [];
  try { images = JSON.parse(document.getElementById('adm-prod-images').value || '[]'); } catch(e) {}
  try {
    await Api.createProduct({
      name: document.getElementById('adm-prod-name').value,
      price: parseFloat(document.getElementById('adm-prod-price').value),
      original_price: document.getElementById('adm-prod-original-price').value ? parseFloat(document.getElementById('adm-prod-original-price').value) : null,
      rating: document.getElementById('adm-prod-rating').value ? parseFloat(document.getElementById('adm-prod-rating').value) : 0,
      shopee_link: document.getElementById('adm-prod-link').value,
      image_url: document.getElementById('adm-prod-image').value || (images.length > 0 ? images[0] : null),
      images: images,
    });
    showToast('Produk berhasil ditambahkan', 'success');
    document.getElementById('admin-panel-content').innerHTML = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function showAdminAddVideo() {
  const panel = document.getElementById('admin-panel-content');
  panel.innerHTML = `
    <div class="admin-form-wrap">
      <div class="admin-form-group"><label>Judul Video</label><input type="text" class="af-input" id="adm-vid-title"></div>
      <div class="admin-form-group"><label>URL Video (YouTube)</label><input type="text" class="af-input" id="adm-vid-url" placeholder="https://youtube.com/..."></div>
      <div class="admin-form-group"><label>Thumbnail</label><input type="file" accept="image/*" class="af-file" id="adm-vid-thumb-input"><div class="af-file-status" id="adm-vid-thumb-preview"></div><span class="af-hint">Maksimal 5MB — format: JPG, PNG, WebP, GIF</span></div>
      <input type="hidden" id="adm-vid-thumb" value="">
      <div class="admin-form-group"><label>Kategori</label>
        <select class="af-select" id="adm-vid-category">
          <option value="speech">Bicara</option>
          <option value="motor">Motorik</option>
          <option value="immunity">Imunitas</option>
          <option value="cognitive">Kognitif</option>
          <option value="parenting">Parenting</option>
        </select>
      </div>
      <div class="admin-form-group"><label>Durasi (menit, opsional)</label><input type="number" class="af-input" id="adm-vid-dur" placeholder="5"></div>
      <div class="admin-form-group"><label>Rentang Usia (opsional)</label><input type="text" class="af-input" id="adm-vid-age" placeholder="contoh: 1-3 tahun"></div>
      <div class="admin-form-group"><label>Deskripsi (opsional)</label><textarea class="af-textarea" id="adm-vid-desc"></textarea></div>
      <button class="af-btn-primary" data-action="submit-admin-video">Simpan Video</button>
    </div>
  `;
  document.getElementById('adm-vid-thumb-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById('adm-vid-thumb-preview');
    preview.textContent = 'Mengupload...';
    try {
      const result = await Api.uploadImage(file);
      document.getElementById('adm-vid-thumb').value = result.url;
      preview.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> <img src="${result.url}" style="height:40px;border-radius:4px;vertical-align:middle;"> Terupload`;
    } catch (err) {
      preview.textContent = '❌ ' + err.message;
    }
  });
}

async function submitAdminVideo() {
  try {
    await Api.createVideo({
      title: document.getElementById('adm-vid-title').value,
      video_url: document.getElementById('adm-vid-url').value,
      thumbnail_url: document.getElementById('adm-vid-thumb').value || null,
      category: document.getElementById('adm-vid-category').value,
      duration_minutes: parseInt(document.getElementById('adm-vid-dur').value) || null,
      age_range: document.getElementById('adm-vid-age').value || null,
      description: document.getElementById('adm-vid-desc').value || null,
    });
    showToast('Video berhasil ditambahkan', 'success');
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
// ADMIN: List Users
// ============================
async function showAdminUserList() {
  const panel = document.getElementById('admin-panel-content');
  try {
    const [userData, countData] = await Promise.all([Api.getUsers(), Api.getUsersCount()]);
    panel.innerHTML =
      '<h4 style="margin-top:12px;">Data Pengguna</h4>' +
      `<p style="font-size:13px;color:#666;margin-bottom:10px;">Total: ${countData.total_users} pengguna · ${countData.total_admins} admin</p>` +
      (userData.users.length === 0
        ? '<p class="info-text">Belum ada pengguna.</p>'
        : userData.users.map((u) =>
            `<div class="card" style="border-left:none;margin-bottom:6px;padding:10px;">
              <p class="title" style="font-size:14px;">${escapeHtml(u.full_name)}</p>
              <p class="desc" style="font-size:12px;color:#666;">
                ${u.email || '-'} · ${u.phone || '-'} · ${u.child_name ? 'Anak: '+escapeHtml(u.child_name) : '-'}<br>
                <span style="color:${u.role === 'admin' ? '#E86C3A' : '#4CAF82'};">${u.role === 'admin' ? 'Admin' : 'User'}</span>
                · Bergabung ${new Date(u.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>`
          ).join('')
      );
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// ADMIN: Add Admin Form
// ============================
function showAdminAddAdmin() {
  const panel = document.getElementById('admin-panel-content');
  panel.innerHTML =
    '<h4 style="margin-top:12px;">Tambah Admin Baru</h4>' +
    '<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">' +
      '<input type="text" id="admin-add-name" placeholder="Nama lengkap" style="padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">' +
      '<input type="text" id="admin-add-identifier" placeholder="Email atau nomor telepon" style="padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">' +
      '<input type="password" id="admin-add-password" placeholder="Password (min 8 karakter, wajib angka)" style="padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">' +
      '<button class="btn-primary" data-action="submit-admin-add-admin" style="margin-top:6px;">Buat Admin</button>' +
    '</div>';
}

// ============================
// ADMIN: Submit Add Admin
// ============================
async function submitAdminAddAdmin() {
  const name = document.getElementById('admin-add-name');
  const identifier = document.getElementById('admin-add-identifier');
  const password = document.getElementById('admin-add-password');
  if (!name || !identifier || !password) return;

  const full_name = name.value.trim();
  const idVal = identifier.value.trim();
  const pwVal = password.value;

  if (!full_name || !idVal || !pwVal) {
    showToast('Semua field wajib diisi', 'error');
    return;
  }
  if (pwVal.length < 8 || !/\d/.test(pwVal)) {
    showToast('Password minimal 8 karakter dan harus mengandung angka', 'error');
    return;
  }

  try {
    const result = await Api.registerAdmin({ identifier: idVal, password: pwVal, full_name });
    showToast('Admin berhasil dibuat: ' + result.admin.full_name, 'success');
    name.value = '';
    identifier.value = '';
    password.value = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// ADMIN: List Articles
// ============================
async function showAdminListArticles() {
  const panel = document.getElementById('admin-panel-content');
  try {
    const data = await Api.getArticles();
    panel.innerHTML =
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
        '<button class="btn-secondary" data-action="show-admin-add-article"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Tambah Baru</button>' +
        '<button class="btn-secondary" data-action="show-admin-list-articles"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Refresh</button>' +
      '</div>' +
      (data.articles.length === 0
        ? '<p class="info-text">Belum ada artikel.</p>'
        : data.articles.map((a) =>
            `<div class="card" style="border-left:none;margin-bottom:8px;padding:10px;">
              ${a.image_url ? `<img src="${a.image_url}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:6px;">` : ''}
              <p class="title" style="font-size:14px;">${escapeHtml(a.title)}</p>
              <p class="desc" style="font-size:12px;color:#666;">${escapeHtml(a.category || '')} · ${a.published_at ? new Date(a.published_at).toLocaleDateString('id-ID') : ''}</p>
              <div style="display:flex;gap:6px;margin-top:6px;">
                <button class="btn-sm" data-action="show-admin-edit-article" data-id="${a.id}" data-item='${encodeURIComponent(JSON.stringify(a))}'><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit</button>
                <button class="btn-sm btn-danger" data-action="show-admin-delete-article" data-id="${a.id}" data-name="${escapeHtml(a.title)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Hapus</button>
              </div>
            </div>`
          ).join('')
      );
  } catch (err) {
    panel.innerHTML = '<p class="info-text" style="color:red;">Gagal memuat daftar artikel.</p>';
    showToast(err.message, 'error');
  }
}

// ============================
// ADMIN: Edit Article
// ============================
function showAdminEditArticle(e) {
  const item = JSON.parse(decodeURIComponent(e.target.dataset.item));
  const panel = document.getElementById('admin-panel-content');
  panel.innerHTML = `
    <div class="admin-form-wrap">
      <h4 class="af-header"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit Artikel</h4>
      <div class="admin-form-group"><label>Judul</label><input type="text" class="af-input" id="adm-art-title" value="${escapeHtml(item.title || '')}"></div>
      <div class="admin-form-group"><label>Kategori</label>
        <select class="af-select" id="adm-art-category">
          <option value="speech" ${item.category === 'speech' ? 'selected' : ''}>Bicara</option>
          <option value="immunity" ${item.category === 'immunity' ? 'selected' : ''}>Imunitas</option>
          <option value="brain" ${item.category === 'brain' ? 'selected' : ''}>Otak</option>
          <option value="tantrum" ${item.category === 'tantrum' ? 'selected' : ''}>Tantrum</option>
          <option value="adhd" ${item.category === 'adhd' ? 'selected' : ''}>ADHD</option>
          <option value="autism" ${item.category === 'autism' ? 'selected' : ''}>Autisme</option>
          <option value="other" ${item.category === 'other' ? 'selected' : ''}>Lainnya</option>
        </select>
      </div>
      <div class="admin-form-group"><label>Gambar Ilustrasi</label><input type="file" accept="image/*" class="af-file" id="adm-art-image-input"><div class="af-file-status" id="adm-art-image-preview">${item.image_url ? `<span class="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span> <img src="${item.image_url}" style="height:40px;border-radius:4px;vertical-align:middle;">` : ''}</div><span class="af-hint">Maksimal 5MB — format: JPG, PNG, WebP, GIF</span>${item.image_url ? `<button type="button" class="af-del-btn" id="btn-remove-art-image"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Hapus Gambar</button>` : ''}</div>
      <input type="hidden" id="adm-art-image-url" value="${item.image_url || ''}">
      <div class="admin-form-group"><label>Ringkasan</label><textarea class="af-textarea" id="adm-art-summary">${escapeHtml(item.summary || '')}</textarea></div>
      <div class="admin-form-group"><label>Konten</label><textarea class="af-textarea" id="adm-art-content">${escapeHtml(item.content || '')}</textarea></div>
      <div class="admin-form-group"><label>Tanda Bahaya (opsional)</label><textarea class="af-textarea" id="adm-art-redflags">${escapeHtml(item.red_flags || '')}</textarea></div>
      <div class="admin-form-group"><label>Kapan ke Dokter (opsional)</label><textarea class="af-textarea" id="adm-art-doctor">${escapeHtml(item.when_to_see_doctor || '')}</textarea></div>
      <input type="hidden" id="adm-edit-id" value="${item.id}">
      <button class="af-btn-primary" data-action="submit-admin-edit-article"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Simpan Perubahan</button>
      <button class="af-btn-secondary" data-action="show-admin-list-articles">← Kembali</button>
    </div>
  `;
  // Auto-upload on file select
  document.getElementById('adm-art-image-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById('adm-art-image-preview');
    preview.textContent = 'Mengupload...';
    try {
      const result = await Api.uploadImage(file);
      document.getElementById('adm-art-image-url').value = result.url;
      preview.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> <img src="${result.url}" style="height:40px;border-radius:4px;vertical-align:middle;"> Terupload`;
    } catch (err) {
      preview.textContent = '❌ ' + err.message;
    }
  });
  // Remove image button
  const removeBtn = document.getElementById('btn-remove-art-image');
  if (removeBtn) {
    removeBtn.onclick = function() {
      document.getElementById('adm-art-image-url').value = '';
      document.getElementById('adm-art-image-preview').innerHTML = '<span style="color:#999;">Gambar dihapus</span>';
      this.remove();
    };
  }
}

async function submitAdminEditArticle() {
  const id = document.getElementById('adm-edit-id').value;
  try {
    await Api.updateArticle(id, {
      title: document.getElementById('adm-art-title').value,
      category: document.getElementById('adm-art-category').value,
      image_url: document.getElementById('adm-art-image-url').value || null,
      summary: document.getElementById('adm-art-summary').value,
      content: document.getElementById('adm-art-content').value,
      red_flags: document.getElementById('adm-art-redflags').value,
      when_to_see_doctor: document.getElementById('adm-art-doctor').value,
    });
    showToast('Artikel berhasil diperbarui', 'success');
    showAdminListArticles();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// ADMIN: List Videos
// ============================
async function showAdminListVideos() {
  const panel = document.getElementById('admin-panel-content');
  try {
    const data = await Api.getVideos();
    panel.innerHTML =
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
        '<button class="btn-secondary" data-action="show-admin-add-video"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Tambah Baru</button>' +
        '<button class="btn-secondary" data-action="show-admin-list-videos"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Refresh</button>' +
      '</div>' +
      (data.videos.length === 0
        ? '<p class="info-text">Belum ada video.</p>'
        : data.videos.map((v) =>
            `<div class="card" style="border-left:none;margin-bottom:8px;padding:10px;">
              ${v.thumbnail_url ? `<img src="${v.thumbnail_url}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:6px;">` : ''}
              <p class="title" style="font-size:14px;">${escapeHtml(v.title)}</p>
              <p class="desc" style="font-size:12px;color:#666;">${escapeHtml(v.category || '')} · ${v.duration_minutes ? v.duration_minutes + ' menit' : ''}</p>
              <div style="display:flex;gap:6px;margin-top:6px;">
                <button class="btn-sm" data-action="show-admin-edit-video" data-id="${v.id}" data-item='${encodeURIComponent(JSON.stringify(v))}'><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit</button>
                <button class="btn-sm btn-danger" data-action="show-admin-delete-video" data-id="${v.id}" data-name="${escapeHtml(v.title)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Hapus</button>
              </div>
            </div>`
          ).join('')
      );
  } catch (err) {
    panel.innerHTML = '<p class="info-text" style="color:red;">Gagal memuat daftar video.</p>';
    showToast(err.message, 'error');
  }
}

// ============================
// ADMIN: Edit Video
// ============================
function showAdminEditVideo(e) {
  const item = JSON.parse(decodeURIComponent(e.target.dataset.item));
  const panel = document.getElementById('admin-panel-content');
  panel.innerHTML = `
    <div class="admin-form-wrap">
      <h4 class="af-header"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit Video</h4>
      <div class="admin-form-group"><label>Judul Video</label><input type="text" class="af-input" id="adm-vid-title" value="${escapeHtml(item.title || '')}"></div>
      <div class="admin-form-group"><label>URL Video (YouTube)</label><input type="text" class="af-input" id="adm-vid-url" value="${escapeHtml(item.video_url || '')}"></div>
      <div class="admin-form-group"><label>Thumbnail</label><input type="file" accept="image/*" class="af-file" id="adm-vid-thumb-input"><div class="af-file-status" id="adm-vid-thumb-preview">${item.thumbnail_url ? `<span class="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span> <img src="${item.thumbnail_url}" style="height:40px;border-radius:4px;vertical-align:middle;">` : ''}</div><span class="af-hint">Maksimal 5MB — format: JPG, PNG, WebP, GIF</span>${item.thumbnail_url ? `<button type="button" class="af-del-btn" id="btn-remove-vid-thumb"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Hapus Thumbnail</button>` : ''}</div>
      <input type="hidden" id="adm-vid-thumb" value="${item.thumbnail_url || ''}">
      <div class="admin-form-group"><label>Kategori</label>
        <select class="af-select" id="adm-vid-category">
          <option value="speech" ${item.category === 'speech' ? 'selected' : ''}>Bicara</option>
          <option value="motor" ${item.category === 'motor' ? 'selected' : ''}>Motorik</option>
          <option value="immunity" ${item.category === 'immunity' ? 'selected' : ''}>Imunitas</option>
          <option value="cognitive" ${item.category === 'cognitive' ? 'selected' : ''}>Kognitif</option>
          <option value="parenting" ${item.category === 'parenting' ? 'selected' : ''}>Parenting</option>
        </select>
      </div>
      <div class="admin-form-group"><label>Durasi (menit, opsional)</label><input type="number" class="af-input" id="adm-vid-dur" value="${item.duration_minutes || ''}"></div>
      <div class="admin-form-group"><label>Rentang Usia (opsional)</label><input type="text" class="af-input" id="adm-vid-age" value="${escapeHtml(item.age_range || '')}"></div>
      <div class="admin-form-group"><label>Deskripsi (opsional)</label><textarea class="af-textarea" id="adm-vid-desc">${escapeHtml(item.description || '')}</textarea></div>
      <input type="hidden" id="adm-edit-id" value="${item.id}">
      <button class="af-btn-primary" data-action="submit-admin-edit-video"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Simpan Perubahan</button>
      <button class="af-btn-secondary" data-action="show-admin-list-videos">← Kembali</button>
    </div>
  `;
  document.getElementById('adm-vid-thumb-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById('adm-vid-thumb-preview');
    preview.textContent = 'Mengupload...';
    try {
      const result = await Api.uploadImage(file);
      document.getElementById('adm-vid-thumb').value = result.url;
      preview.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> <img src="${result.url}" style="height:40px;border-radius:4px;vertical-align:middle;"> Terupload`;
    } catch (err) {
      preview.textContent = '❌ ' + err.message;
    }
  });
  // Remove thumbnail button
  const removeBtn = document.getElementById('btn-remove-vid-thumb');
  if (removeBtn) {
    removeBtn.onclick = function() {
      document.getElementById('adm-vid-thumb').value = '';
      document.getElementById('adm-vid-thumb-preview').innerHTML = '<span style="color:#999;">Thumbnail dihapus</span>';
      this.remove();
    };
  }
}

async function submitAdminEditVideo() {
  const id = document.getElementById('adm-edit-id').value;
  try {
    await Api.updateVideo(id, {
      title: document.getElementById('adm-vid-title').value,
      video_url: document.getElementById('adm-vid-url').value,
      thumbnail_url: document.getElementById('adm-vid-thumb').value || null,
      category: document.getElementById('adm-vid-category').value,
      duration_minutes: parseInt(document.getElementById('adm-vid-dur').value) || null,
      age_range: document.getElementById('adm-vid-age').value || null,
      description: document.getElementById('adm-vid-desc').value || null,
    });
    showToast('Video berhasil diperbarui', 'success');
    showAdminListVideos();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// ADMIN: List Products
// ============================
async function showAdminListProducts() {
  const panel = document.getElementById('admin-panel-content');
  try {
    const data = await Api.getProducts();
    panel.innerHTML =
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
        '<button class="btn-secondary" data-action="show-admin-add-product"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Tambah Baru</button>' +
        '<button class="btn-secondary" data-action="show-admin-list-products"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Refresh</button>' +
      '</div>' +
      (data.products.length === 0
        ? '<p class="info-text">Belum ada produk.</p>'
        : data.products.map((p) =>
            `<div class="card" style="border-left:none;margin-bottom:8px;padding:10px;">
              ${p.images && p.images.length > 0 ? `<img src="${p.images[0]}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:6px;">` : p.image_url ? `<img src="${p.image_url}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:6px;">` : ''}
              <p class="title" style="font-size:14px;">${escapeHtml(p.name)}</p>
              <p class="desc" style="font-size:12px;color:#666;">Rp ${Number(p.price).toLocaleString('id-ID')}${p.images && p.images.length > 1 ? ` · ${p.images.length} foto` : ''}</p>
              <div style="display:flex;gap:6px;margin-top:6px;">
                <button class="btn-sm" data-action="show-admin-edit-product" data-id="${p.id}" data-item='${encodeURIComponent(JSON.stringify(p))}'><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit</button>
                <button class="btn-sm btn-danger" data-action="show-admin-delete-product" data-id="${p.id}" data-name="${escapeHtml(p.name)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Hapus</button>
              </div>
            </div>`
          ).join('')
      );
  } catch (err) {
    panel.innerHTML = '<p class="info-text" style="color:red;">Gagal memuat daftar produk.</p>';
    showToast(err.message, 'error');
  }
}

// ============================
// ADMIN: Edit Product
// ============================
function showAdminEditProduct(e) {
  const item = JSON.parse(decodeURIComponent(e.target.dataset.item));
  const existingImages = item.images || (item.image_url ? [item.image_url] : []);
  const panel = document.getElementById('admin-panel-content');
  panel.innerHTML = `
    <div class="admin-form-wrap">
      <h4 class="af-header"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit Produk</h4>
      <div class="admin-form-group"><label>Nama Produk</label><input type="text" class="af-input" id="adm-prod-name" value="${escapeHtml(item.name || '')}"></div>
      <div class="admin-form-group"><label>Harga Jual (Rp)</label><input type="number" class="af-input" id="adm-prod-price" value="${item.price || ''}"></div>
      <div class="admin-form-group"><label>Harga Coret (Rp) — opsional</label><input type="number" class="af-input" id="adm-prod-original-price" value="${item.original_price || ''}" placeholder="lebih tinggi dari harga jual"></div>
      <div class="admin-form-group"><label>Rating ⭐ — opsional</label><input type="number" class="af-input" id="adm-prod-rating" min="1" max="5" step="0.1" value="${item.rating || ''}" placeholder="contoh: 4.8"></div>
      <div class="admin-form-group"><label>Link Shopee</label><input type="text" class="af-input" id="adm-prod-link" value="${escapeHtml(item.shopee_link || '')}"></div>
      <div class="admin-form-group"><label>Gambar Produk (max 5)</label><input type="file" accept="image/*" multiple class="af-file" id="adm-prod-images-input"><div class="af-file-status" id="adm-prod-images-preview">${existingImages.map((u) => `<img src="${u}" style="height:40px;border-radius:4px;margin:2px;">`).join('')} ${existingImages.length > 0 ? 'Gambar existing' : ''}</div><span class="af-hint">Maksimal 5MB per gambar — format: JPG, PNG, WebP, GIF</span>${existingImages.length > 0 ? `<button type="button" class="af-del-btn" id="btn-remove-prod-images"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Hapus Semua Gambar</button>` : ''}</div>
      <input type="hidden" id="adm-prod-images" value='${JSON.stringify(existingImages)}'>
      <div class="admin-form-group"><label>Deskripsi (opsional)</label><textarea class="af-textarea" id="adm-prod-desc">${escapeHtml(item.description || '')}</textarea></div>
      <div class="admin-form-group"><label>Kategori (opsional)</label><input type="text" class="af-input" id="adm-prod-category" value="${escapeHtml(item.category || '')}"></div>
      <input type="hidden" id="adm-edit-id" value="${item.id}">
      <button class="af-btn-primary" data-action="submit-admin-edit-product"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Simpan Perubahan</button>
      <button class="af-btn-secondary" data-action="show-admin-list-products">← Kembali</button>
    </div>
  `;
  document.getElementById('adm-prod-images-input').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (files.length > 5) { showToast('Maksimal 5 gambar', 'error'); return; }
    const preview = document.getElementById('adm-prod-images-preview');
    preview.textContent = 'Mengupload...';
    try {
      const result = await Api.uploadImages(files);
      const current = JSON.parse(document.getElementById('adm-prod-images').value || '[]');
      const combined = [...current, ...result.urls].slice(0, 5);
      document.getElementById('adm-prod-images').value = JSON.stringify(combined);
      preview.innerHTML = combined.map((u) => `<img src="${u}" style="height:40px;border-radius:4px;margin:2px;">`).join('') + ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } catch (err) {
      preview.textContent = '❌ ' + err.message;
    }
  });
  // Remove all product images button
  const removeBtn = document.getElementById('btn-remove-prod-images');
  if (removeBtn) {
    removeBtn.onclick = function() {
      document.getElementById('adm-prod-images').value = '[]';
      document.getElementById('adm-prod-images-preview').innerHTML = '<span style="color:#999;">Semua gambar dihapus</span>';
      this.remove();
    };
  }
}

async function submitAdminEditProduct() {
  const id = document.getElementById('adm-edit-id').value;
  let images = [];
  try { images = JSON.parse(document.getElementById('adm-prod-images').value || '[]'); } catch(e) {}
  try {
    await Api.updateProduct(id, {
      name: document.getElementById('adm-prod-name').value,
      price: parseFloat(document.getElementById('adm-prod-price').value),
      original_price: document.getElementById('adm-prod-original-price').value ? parseFloat(document.getElementById('adm-prod-original-price').value) : null,
      rating: document.getElementById('adm-prod-rating').value ? parseFloat(document.getElementById('adm-prod-rating').value) : 0,
      shopee_link: document.getElementById('adm-prod-link').value,
      description: document.getElementById('adm-prod-desc').value || null,
      image_url: images.length > 0 ? images[0] : null,
      images: images,
      category: document.getElementById('adm-prod-category').value || null,
    });
    showToast('Produk berhasil diperbarui', 'success');
    showAdminListProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// ADMIN: Confirm & Delete
// ============================
async function confirmDelete(type, e) {
  const id = e.target.dataset.id;
  const name = e.target.dataset.name || id;
  const typeLabel = { article: 'artikel', video: 'video', product: 'produk' }[type] || type;

  if (!confirm(`Hapus ${typeLabel} "${name}"?`)) return;

  try {
    if (type === 'article') await Api.deleteArticle(id);
    else if (type === 'video') await Api.deleteVideo(id);
    else if (type === 'product') await Api.deleteProduct(id);
    showToast(`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} berhasil dihapus`, 'success');
    // Refresh the list
    if (type === 'article') showAdminListArticles();
    else if (type === 'video') showAdminListVideos();
    else if (type === 'product') showAdminListProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================
// DOMAIN LABEL HELPERS
// ============================
const domainLabels = {
  cognitive: 'Kecerdasan',
  speech: 'Bicara',
  immunity: 'Imunitas',
  motor: 'Motorik',
};

const domainEmojis = {
  cognitive: '🧠',
  speech: '💬',
  immunity: '🛡️',
  motor: '🚶',
};

const domainSvg = {
  cognitive: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;"><path d="M12 2a4 4 0 014 4c0 2-2 3-4 5-2-2-4-3-4-5a4 4 0 014-4z"/><path d="M16 12c-1.5-1-2.8-1.5-4-1.5-1.2 0-2.5.5-4 1.5"/><path d="M8 16c1.5 1 2.8 1.5 4 1.5 1.2 0 2.5-.5 4-1.5"/><path d="M4 22c.5-2 2.5-3 4-3"/><path d="M20 22c-.5-2-2.5-3-4-3"/></svg>',
  speech: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  immunity: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  motor: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
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

    container.innerHTML = '<h3 style="margin-bottom:12px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Riwayat Skrining</h3>' +
      data.sessions.map(s => {
        const label = domainLabel(s.domain);
        const zoneIcon = s.result === 'sesuai' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' : (s.result === 'meragukan' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>');
        return `
          <div class="screening-history-item" data-session-id="${s.id}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span class="domain">${label}</span>
              <span class="score">${zoneIcon} ${s.score_percentage != null ? s.score_percentage : '-'}%</span>
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

  document.getElementById('screening-progress').innerHTML =
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> ${domainLabel(screeningDomain)} — Pertanyaan ${screeningCurrentIndex + 1}/${screeningQuestions.length}`;
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
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        label: 'Sesuai',
        desc: 'Perkembangan anak sesuai dengan tahap usianya. Lanjutkan stimulasi rutin!',
        color: '#10B981',
      },
      meragukan: {
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        label: 'Meragukan',
        desc: 'Ada beberapa aspek yang perlu diperhatikan. Lakukan stimulasi lebih intensif dan konsultasi dengan dokter jika perlu.',
        color: '#F59E0B',
      },
      menyimpang: {
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
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
      <button class="btn-primary" data-action="go-stimulation"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg> Lihat Aktivitas Stimulasi</button>
      <button class="btn-secondary" data-action="go-screening-again"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Skrining Lainnya</button>
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
          <button class="complete-btn" data-rec-id="${r.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Selesai</button>
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
    showToast(status === 'completed' ? 'Aktivitas selesai! <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg>' : 'Rekomendasi ditutup', 'success');
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
  const parts = getAgeParts(user.child_dob);
  document.getElementById('dev-age-label').textContent = `${parts.months} bulan ${parts.days} hari`;
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

    // Group timeline items into baby (0-24) and toddler (24-72)
    const babyItems = [];
    const toddlerItems = [];
    timeline.forEach(t => {
      // Parse age from label — e.g., "1 bulan", "2 tahun 6 bulan"
      let ageMonths = 0;
      const label = t.label || '';
      const yearMatch = label.match(/(\d+)\s*tahun/);
      const monthMatch = label.match(/(\d+)\s*bulan/);
      if (yearMatch) ageMonths += parseInt(yearMatch[1]) * 12;
      if (monthMatch) ageMonths += parseInt(monthMatch[1]);
      // Handle plain number labels (e.g., "1", "2")
      if (!yearMatch && !monthMatch) {
        const numMatch = label.match(/(\d+)/);
        if (numMatch) ageMonths = parseInt(numMatch[1]);
      }
      t._ageMonths = ageMonths;
      if (ageMonths <= 24) babyItems.push(t);
      else toddlerItems.push(t);
    });

    function renderTimelineItem(t) {
      const isPast = t.is_past;
      const isCurrent = t.is_current;
      const isFuture = !isPast && !isCurrent;
      const milestones = t.milestones || [];

      // Determine dot class
      let dotClass = 'upcoming';
      if (isCurrent) dotClass = 'active';
      else if (isPast && t._ageMonths <= 24) dotClass = 'active';
      else if (isPast) dotClass = 'completed';

      const visibleMs = milestones.slice(0, 3);
      const hiddenMs = milestones.slice(3);
      const hasMore = hiddenMs.length > 0;

      return `<div class="dev-tl-item" data-age="${t._ageMonths}">
        <div class="dev-tl-dot ${dotClass}"></div>
        <div class="dev-tl-content">
          <div class="dev-tl-age">${escapeHtml(t.label || '')}</div>
          ${visibleMs.map(m => `
            <div class="dev-tl-milestone">
              <span class="dev-tl-check">${isPast ? '✓' : isCurrent ? '⏳' : '○'}</span>
              <span class="dev-tl-text">${escapeHtml(m)}</span>
            </div>
          `).join('')}
          ${hasMore ? `
            <div class="dev-tl-hidden" id="tl-hidden-${(t.label || 'age-' + t._ageMonths).replace(/\s+/g, '-')}">
              ${hiddenMs.map(m => `
                <div class="dev-tl-milestone">
                  <span class="dev-tl-check">${isPast ? '✓' : '○'}</span>
                  <span class="dev-tl-text">${escapeHtml(m)}</span>
                </div>
              `).join('')}
            </div>
            <div class="dev-tl-expand" onclick="(function(el){
              const hidden = el.previousElementSibling;
              if(hidden.classList.contains('show')){
                hidden.classList.remove('show');
                el.textContent = '+${hiddenMs.length} lainnya';
              } else {
                hidden.classList.add('show');
                el.textContent = 'Sembunyikan';
              }
            })(this)">+${hiddenMs.length} lainnya</div>
          ` : ''}
        </div>
      </div>`;
    }

    let timelineHtml = '';
    if (babyItems.length > 0) {
      timelineHtml += `<div class="dev-timeline-section baby">
        <div class="dev-timeline-section-label">👶 Bayi (0–24 Bulan)</div>
        ${babyItems.map(renderTimelineItem).join('')}
      </div>`;
    }
    if (toddlerItems.length > 0) {
      timelineHtml += `<div class="dev-timeline-section toddler">
        <div class="dev-timeline-section-label">🧒 Balita (2–6 Tahun)</div>
        ${toddlerItems.map(renderTimelineItem).join('')}
      </div>`;
    }
    document.getElementById('dev-timeline').innerHTML = timelineHtml || '<p class="info-text">Belum ada data perkembangan.</p>';
  } catch (err) {
    console.error('Development page error:', err);
  }
}
