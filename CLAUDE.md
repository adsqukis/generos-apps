# Generos Care — Growth Tracker Redesign

## Project Context
Node.js + Express + PostgreSQL app deployed on Railway.
Dual-server: backend on port 3000, frontend serves static files from `generos-frontend/generos-frontend/public/`.
All CSS/JS is vanilla — no framework.

## Key Paths
- Backend: `generos-backend/generos-backend/`
- Frontend HTML: `generos-frontend/generos-frontend/public/index.html`
- Frontend JS: `generos-frontend/generos-frontend/public/app.js`
- Frontend API client: `generos-frontend/generos-frontend/public/api.js`
- Frontend CSS: `generos-frontend/generos-frontend/public/style.css`
- DB migrations: `generos-backend/generos-backend/config/migrate.js`
- Backend routes: `generos-backend/generos-backend/routes/`
- Backend server: `generos-backend/generos-backend/server.js`
- Existing tracking route: `generos-backend/generos-backend/routes/tracking.js`

## The Task
Replace the old "Tracking" menu (freeform daily journal) with a **Growth & Development Tracker** benchmarked against Tentang Anak app.

## Detailed Requirements

### 1. Database — add new tables via migrate.js

Add these tables to the migrations string:

```sql
-- Growth records (BB/TB/LK)
CREATE TABLE IF NOT EXISTS growth_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2),       -- Berat Badan (kg)
  height_cm DECIMAL(5,2),       -- Tinggi Badan (cm)
  head_circumference_cm DECIMAL(5,2), -- Lingkar Kepala (cm)
  record_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_growth_user_date ON growth_records(user_id, record_date DESC);

-- Immunization records
CREATE TABLE IF NOT EXISTS immunization_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vaccine_name VARCHAR(255) NOT NULL,
  immunization_date DATE NOT NULL,
  age_in_months INTEGER,        -- usia anak saat imunisasi
  given_by VARCHAR(255),        -- nama dokter/nakes
  location VARCHAR(255),        -- tempat imunisasi
  notes TEXT,
  next_schedule DATE,           -- jadwal imunisasi berikutnya
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_immunization_user ON immunization_records(user_id, immunization_date DESC);
```

### 2. Backend — routes/tracking.js
KEEP existing old routes (GET /, POST /, DELETE / etc.) for backward compatibility with home page.
ADD these new endpoints:

```
GET  /tracking/growth              — get all growth records for user (ordered by date DESC)
POST /tracking/growth              — save new growth record
  Body: { weight_kg, height_cm, head_circumference_cm, record_date, notes }

GET  /tracking/immunization        — get all immunization records
POST /tracking/immunization        — save new immunization record
  Body: { vaccine_name, immunization_date, age_in_months, given_by, location, notes, next_schedule }

GET  /tracking/screening-progress  — get aggregated screening history per domain (for progress display)
  Returns: [{ domain, sessions_count, latest_score, latest_result, latest_date, scores: [{date, score_percentage}] }]
```

### 3. Frontend — api.js
ADD new API methods:
```js
async getGrowthRecords() { return this.request('/tracking/growth'); }
async createGrowthRecord(payload) { return this.request('/tracking/growth', { method: 'POST', body: JSON.stringify(payload) }); }
async getImmunizationRecords() { return this.request('/tracking/immunization'); }
async createImmunizationRecord(payload) { return this.request('/tracking/immunization', { method: 'POST', body: JSON.stringify(payload) }); }
async getScreeningProgress() { return this.request('/tracking/screening-progress'); }
```

### 4. Frontend — index.html
a) Nav bar: change "📊 Tracking" to "📈 Tumbuh Kembang" and data-page="tracking" stays same
b) Tracking page: REPLACE current tracking page content with:
   - Tab navigation: Pertumbuhan | Imunisasi | Screening
   - "Pertumbuhan" tab:
     - Form: Berat Badan (kg), Tinggi Badan (cm), Lingkar Kepala (cm), Tanggal
     - Growth history list (BB/TB/LK per date)
   - "Imunisasi" tab:
     - Form: Nama Vaksin, Tanggal, Usia (otomatis dari DOB), Pemberi, Tempat, Catatan, Jadwal Berikutnya
     - Immunization history list
   - "Screening" tab:
     - Summary per domain: cognitive, speech, immunity, motor
     - Show latest score, result, date
     - List of all screening sessions
c) Home page: update recent tracking to show growth summary instead
   - Show latest weight/height if available
   - Show screening progress summary

### 5. Frontend — app.js
a) Rename/update `loadTrackingList()` → `loadGrowthPage()` with tab switching logic
b) Keep tracking.js event listeners but update the content
c) Add functions:
   - `loadGrowthTab()` — load growth form + history
   - `submitGrowthRecord()` — save growth record via API
   - `loadImmunizationTab()` — load immunization form + history
   - `submitImmunizationRecord()` — save immunization record via API
   - `loadScreeningProgressTab()` — load screening history per domain
d) Update home page: change `loadHomeData()` to show growth/screening summary instead of journal entries
e) Remove or keep old journal functions (can keep them unused but don't break anything)

### 6. Frontend — style.css
Add minimal styles for the new tracking page:
- Tab styling (active/inactive)
- Growth card layout
- Immunization card layout
- Responsive forms

## Code Conventions
- Vanilla JS (no frameworks)
- Template literals for HTML rendering
- All API calls use existing `Api.request()` pattern
- CSS variables already defined in `:root`
- PostgreSQL (not MySQL)
- Indonesian language for all UI text
- Use `addEventListener` or `onclick` properties (not inline onclick attributes)
- All elements need IDs for safeAddListener

## Don't Break!
- Login/register flow
- Screening pages
- Stimulation pages
- Other menu items (Food, Articles, Chat, Shop)
- Home page should still work (update it to show growth data instead of tracking entries)
- Backward compatibility: old tracking routes remain for any legacy references

## Deployment
After changes: `git add -A && git commit -m "feat: ganti tracking jd tumbuh kembang" && git push origin main`
Railway auto-deploys from GitHub main branch.
