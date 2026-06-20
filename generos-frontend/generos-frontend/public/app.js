// ============================
// STATE
// ============================
let currentPage = 'login';
let selectedTrackingType = null;
let selectedSeverity = 'normal';
let articlesCache = [];
let foodsCache = [];

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', () => {
  if (Api.getToken() && Api.getUser()) {
    navigate('home');
  } else {
    navigate('login');
  }

  // Setup nav bar
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Setup tracking category buttons
  document.querySelectorAll('.cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectTrackingType(btn.dataset.type, btn.textContent));
  });

  // Setup severity buttons
  document.querySelectorAll('.severity-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectSeverity(btn.dataset.severity));
  });

  // Default date for tracking
  const dateInput = document.getElementById('tracking-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Chat input enter key
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChat();
    });
  }
});

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
  if (page === 'tracking') loadTrackingList();
  if (page === 'food') loadFoodMenu();
  if (page === 'knowledge') loadArticles();
  if (page === 'chat') loadChatHistory();
  if (page === 'shop') loadProducts();
  if (page === 'settings') loadSettings();
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
// HOME PAGE
// ============================
async function loadHomeData() {
  const user = Api.getUser();
  if (!user) return;

  const age = calculateAgeMonths(user.child_dob);
  document.getElementById('home-greeting').textContent = `Selamat datang, ${user.full_name}`;
  document.getElementById('home-child-info').textContent = `${user.child_name}, ${age} bulan`;

  try {
    const summary = await Api.getDashboardSummary();
    document.getElementById('stat-weekly').textContent = summary.weekly_entries;
    document.getElementById('stat-consistency').textContent = `${summary.consistency_percentage}%`;
  } catch (err) {
    console.error('Failed to load summary:', err);
  }

  try {
    const data = await Api.getTrackingEntries();
    const recent = data.entries.slice(0, 2);
    const container = document.getElementById('home-recent-tracking');

    if (recent.length === 0) {
      container.innerHTML = '<p class="info-text">Belum ada tracking. Mulai catat sekarang!</p>';
    } else {
      container.innerHTML = recent
        .map(
          (entry) => `
        <div class="card">
          <p class="cat">${entryTypeLabel(entry.entry_type)}</p>
          <p class="desc">${escapeHtml(entry.description)}</p>
          <small>${formatDate(entry.date)}</small>
        </div>
      `
        )
        .join('');
    }
  } catch (err) {
    console.error('Failed to load tracking:', err);
  }
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
      <div class="card" onclick="getAiInsightFor('${entry.id}')">
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
      <button class="food-item" onclick="showFoodDetail(${idx})">
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
    <button class="btn-secondary" onclick="loadFoodMenu()" style="text-align: center;">← Kembali</button>
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
      <div class="card" onclick="showArticleDetail('${article.id}')">
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
      <button class="btn-secondary" onclick="loadArticles()" style="text-align: center;">← Kembali</button>
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
        <button onclick="buyProduct('${product.id}')">🛒 Beli di Shopee</button>
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
        <button class="btn-secondary" onclick="showAdminAddArticle()">➕ Tambah Artikel</button>
        <button class="btn-secondary" onclick="showAdminAddFood()">➕ Tambah Menu Makanan</button>
        <button class="btn-secondary" onclick="showAdminAddProduct()">➕ Tambah Produk</button>
        <button class="btn-secondary" onclick="showAdminAnalytics()">📊 Lihat Analytics</button>
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
    <button class="btn-primary" onclick="submitAdminArticle()">Simpan Artikel</button>
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
    <button class="btn-primary" onclick="submitAdminFood()">Simpan Menu</button>
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
    <button class="btn-primary" onclick="submitAdminProduct()">Simpan Produk</button>
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
