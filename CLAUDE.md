# Generos Care — Beranda Redesign

## Project Path
Backend: /root/generos-apps-work/generos-backend/generos-backend
Frontend: /root/generos-apps-work/generos-frontend/generos-frontend/public

## Tech Stack
- Backend: Node.js + Express + PostgreSQL (internal Railway)
- Frontend: Vanilla JS + CSS (SPA, mobile-first)
- Deploy: Railway auto-deploy via git push origin main

## Current State
- Login/Register ✅
- Screening (0-72 months, 4 domains) ✅
- Stimulasi ✅
- Tumbuh Kembang (growth BB/TB/LK, immunization, screening progress) ✅
- Makanan, Artikel, Chat AI, Belanja ✅
- **Daily tracker tables already added** via config/daily-migrate.js (sleep_records, feeding_records, drink_records, pee_records, poop_records, doctor_visits, ai_conversations, notifications)
- **Auto-migrate already registered** in server.js (reads config/daily-migrate.js and executes)

## What Needs to Be Done

### 1. Backend: Create routes/daily.js
Create Express router with these endpoints (all auth-protected via authMiddleware):

**Sleep:**
- GET /daily/sleep?date=YYYY-MM-DD — get sleep records for a date
- POST /daily/sleep — create sleep record (record_date, sleep_start, sleep_end, duration_minutes, notes)
- DELETE /daily/sleep/:id — delete sleep record

**Feeding (Menyusui):**
- GET /daily/feeding?date=YYYY-MM-DD — get feeding records
- POST /daily/feeding — create (record_date, feeding_type, amount_ml, duration_minutes, notes)
- DELETE /daily/feeding/:id

**Drink (Minum):**
- GET /daily/drink?date=YYYY-MM-DD
- POST /daily/drink — create (record_date, drink_type, amount_ml, notes)
- DELETE /daily/drink/:id

**Pee (BAK):**
- GET /daily/pee?date=YYYY-MM-DD
- POST /daily/pee — create (record_date, count, notes)
- DELETE /daily/pee/:id

**Poop (BAB):**
- GET /daily/poop?date=YYYY-MM-DD
- POST /daily/poop — create (record_date, count, consistency, color, notes)
- DELETE /daily/poop/:id

**Dashboard Summary** (GET /daily/summary?date=YYYY-MM-DD):
Return total/aggregated for today:
- sleep: total duration_minutes, last record
- feeding: count, total amount_ml, last record
- drink: count, total amount_ml
- pee: sum of count
- poop: sum of count
- growth: latest weight/height/LK

**Development Today** (GET /daily/development?age=X):
Return a milestone/tip based on child's age in months. Can return hardcoded age-based tips:
- 0-3 months: "Sering ajak bicara, responsif terhadap tangisan"
- 4-6 months: "Vokal 'a' mulai sering diucapkan, perkenalkan makanan padat"
- 7-9 months: "Mulai merangkak, beri mainan aman"
- etc up to 72 months

**Reminders** (GET /daily/reminders):
Return upcoming immunizations and doctor visits from immunization_records and doctor_visits tables.

**AI Chat Enhancement** (POST /daily/ai — uses DeepSeek):
Simple chat endpoint that accepts {message} and returns AI response. Store in ai_conversations table.

### 2. Server.js: Register daily routes
Already have daily-migrate. Need to add:
```js
const dailyRoutes = require('./routes/daily');
app.use('/daily', authMiddleware, dailyRoutes);
```

### 3. Frontend: Rewrite index.html — Home Page
The home page (#page-home) section should be rewritten to:

**a) Header:**
```
<div id="home-header">
  <div>
    <p class="greeting">Hi, {user.full_name}!</p>
  </div>
  <div class="header-actions">
    <button class="icon-btn" id="btn-notif">🔔</button>
    <button class="icon-btn" id="btn-settings">⚙️</button>
    <!-- or keep existing settings btn -->
  </div>
</div>
```

**b) Child Profile Card:**
```
<div id="child-profile" class="profile-card">
  <div class="child-avatar">{initial}</div>
  <div class="child-info">
    <h2>{child_name}</h2>
    <p>{age} bulan {days} hari</p>
  </div>
  <div class="child-stats">
    <span>BB: {weight} kg</span>
    <span>TB: {height} cm</span>
    <span>LK: {head} cm</span>
  </div>
  <div class="nutrition-status">Status: Gizi Baik ✅</div>
  <button class="btn-outline" id="btn-add-growth">+ Tambah Data</button>
</div>
```
When "Tambah Data" clicked → show modal with weight, height, head_circumference, notes inputs.

**c) Daily Tracker Dashboard:**
5 cards in a grid:
```
<div id="daily-trackers">
  <div class="tracker-card" data-tracker="sleep">
    <div class="tracker-icon">😴</div>
    <div class="tracker-label">Tidur</div>
    <div class="tracker-value">{total_hours} Jam</div>
    <div class="tracker-time">Terakhir: {time}</div>
    <button class="tracker-add">+</button>
  </div>
  <!-- same for: feeding (🍼), drink (💧), BAB (💩), BAK (🚽) -->
</div>
```
Each card loads from daily/summary. The + button opens a quick-add modal.

Quick add modals should be simple inline modals with the relevant fields.

**d) Development Today:**
```
<div id="development-today" class="card">
  <p class="cat">✨ Milestone Hari Ini</p>
  <p class="title">{child_age} — "{milestone_text}"</p>
  <button class="btn-text">Lihat Detail →</button>
</div>
```

**e) Growth Summary:**
Keep existing growth ringkasan but simplify to just show latest weight/height/LK.

**f) Reminder Widget:**
```
<div id="reminders" class="card">
  <p class="cat">📅 Pengingat</p>
  <div class="reminder-item">💉 Imunisasi DPT — 2 Hari Lagi</div>
  <div class="reminder-item">🏥 Kontrol Dokter — 5 Hari Lagi</div>
</div>
```

**g) AI Floating Button:**
```
<button id="ai-floating-btn" class="floating-btn">🤖</button>
```
Click opens a chat overlay with the AI chat interface.

**h) Bottom Navigation:**
Keep existing nav-bar but order: Beranda, Belanja, Kembang, Artikel, Makanan

### 4. Frontend: Rewrite app.js — Home + Daily Tracker Functions

Functions needed:
- `loadHomePage()` — main orchestrator: load header, child profile, daily summary, development, reminders
- `loadChildProfile()` — fetch growth records, render profile card
- `loadDailySummary()` — fetch GET /daily/summary, render 5 tracker cards
- `openQuickAdd(trackerType)` — open modal for specific tracker
- `submitQuickAdd(trackerType)` — submit to appropriate API
- `loadDevelopmentToday()` — fetch GET /daily/development?age=X
- `loadReminders()` — fetch GET /daily/reminders
- `openAIChat()` — open floating AI chat overlay

Also need to update:
- API client (api.js) with new daily endpoints
- Event listeners initialization

### 5. Frontend: Update style.css
Add styles for:
- Child profile card with avatar
- Daily tracker grid (5 cards)
- Tracker quick-add modal
- AI floating button + chat overlay
- Reminder widget
- Nutrition status badge

## Important Notes
- Do NOT break existing features (screening, stimulation, food, articles, chat, shop)
- The nav-bar should still work for all pages
- Event listeners use `onclick` property directly (not addEventListener) for reliability
- API_BASE_URL is at https://generos-apss-production.up.railway.app/api
- Token stored in localStorage.getItem('accessToken')
- Keep the SPA pattern: pages are hidden/shown via `page-` id + `.hidden` class
- DO NOT modify admin pages, screening, stimulation, food, articles, chat, shop — only home page + daily tracker
- CSS must be mobile-first (max-width 420px phone frame)
