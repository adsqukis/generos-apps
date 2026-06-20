# Generos Care - Backend API

Backend API untuk aplikasi Generos Care (tracking tumbuh kembang anak, knowledge base, AI chat, menu makanan, shop).

## Tech Stack
- Node.js + Express
- PostgreSQL
- JWT Authentication (phone/email login)
- DeepSeek AI (chat & insight)

---

## 🚀 DEPLOYMENT KE RAILWAY (Step by Step)

### 1. Push ke GitHub

```bash
cd generos-backend
git init
git add .
git commit -m "Initial commit - Generos Care backend"
git branch -M main
git remote add origin https://github.com/USERNAME/generos-backend.git
git push -u origin main
```

### 2. Setup Railway

1. Buka [railway.app](https://railway.app), login dengan GitHub
2. Klik **New Project** → **Deploy from GitHub repo**
3. Pilih repo `generos-backend`
4. Railway akan auto-detect Node.js dan mulai build

### 3. Tambahkan PostgreSQL Database

1. Di project Railway, klik **New** → **Database** → **Add PostgreSQL**
2. Railway otomatis generate `DATABASE_URL` dan inject ke service Anda

### 4. Setup Environment Variables

Di Railway dashboard → service Anda → tab **Variables**, tambahkan:

```
JWT_SECRET=<generate random 32+ char string>
JWT_REFRESH_SECRET=<generate random 32+ char string, berbeda dari JWT_SECRET>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
DEEPSEEK_API_KEY=<API key dari platform.deepseek.com>
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
NODE_ENV=production
FRONTEND_URL=<URL frontend Anda, atau * untuk development>
ADMIN_EMAIL=admin@generos.co.id
ADMIN_PASSWORD=<password aman untuk admin pertama>
```

**Catatan:** `DATABASE_URL` dan `PORT` sudah otomatis di-set oleh Railway, tidak perlu ditambahkan manual.

**Generate random secret** (jalankan di terminal lokal):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Run Migration & Seed (sekali saja, setelah deploy pertama)

Di Railway dashboard, buka tab **Settings** service Anda, cari **Deploy** section, atau gunakan Railway CLI:

```bash
npm install -g @railway/cli
railway login
railway link
railway run npm run migrate
railway run npm run seed
```

Atau jika tidak pakai CLI, tambahkan sementara di `package.json` script `start`:
```json
"start": "npm run migrate && npm run seed && node server.js"
```
Lalu setelah berhasil jalan sekali, balikin ke `"start": "node server.js"` saja (supaya tidak re-seed terus tiap restart).

### 6. Dapatkan Public URL

Railway dashboard → service → tab **Settings** → **Networking** → klik **Generate Domain**

URL ini yang dipakai sebagai base URL API, misal: `https://generos-backend.up.railway.app`

---

## 📁 STRUKTUR PROJECT

```
generos-backend/
├── config/
│   ├── db.js          # Database connection
│   ├── migrate.js     # Create tables
│   └── seed.js        # Seed admin + sample data
├── middleware/
│   └── auth.js        # JWT verify + admin check
├── routes/
│   ├── auth.js         # Register, login, refresh, logout
│   ├── tracking.js     # Tracking CRUD + AI insight
│   ├── knowledge.js    # Articles CRUD
│   ├── food.js         # Food menu CRUD
│   ├── chat.js         # DeepSeek chat
│   ├── shop.js         # Products + Shopee redirect
│   └── user.js         # Profile
├── server.js           # Main entry point
├── package.json
├── railway.json
└── .env.example
```

---

## 🔑 API ENDPOINTS

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | /api/auth/register | No | Daftar (email/phone + child info) |
| POST | /api/auth/login | No | Login (email atau phone) |
| POST | /api/auth/refresh | No | Refresh access token |
| POST | /api/auth/logout | No | Logout |

### Tracking
| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | /api/tracking | User | List entries |
| POST | /api/tracking | User | Create entry |
| GET | /api/tracking/:id | User | Get entry |
| PUT | /api/tracking/:id | User | Update entry |
| DELETE | /api/tracking/:id | User | Delete entry |
| GET | /api/tracking/dashboard/summary | User | Dashboard stats |
| POST | /api/tracking/:id/ai-insight | User | Get AI insight (DeepSeek) |

### Knowledge Base
| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | /api/knowledge | No | List articles |
| GET | /api/knowledge/search?q= | No | Search articles |
| GET | /api/knowledge/:id | No | Get article |
| POST | /api/knowledge | Admin | Create article |
| PUT | /api/knowledge/:id | Admin | Update article |
| DELETE | /api/knowledge/:id | Admin | Delete article |

### Food Menu
| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | /api/food | No | List food menu |
| GET | /api/food/:id | No | Get food detail |
| POST | /api/food | Admin | Create food menu |
| PUT | /api/food/:id | Admin | Update food menu |
| DELETE | /api/food/:id | Admin | Delete food menu |

### Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | /api/chat/message | User | Send message to AI |
| GET | /api/chat/history | User | Get chat history |
| DELETE | /api/chat/history | User | Clear history |

### Shop
| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | /api/shop/products | No | List products |
| GET | /api/shop/products/:id | No | Get product |
| POST | /api/shop/products/:id/click | No | Track click + get Shopee URL |
| POST | /api/shop/products | Admin | Create product |
| PUT | /api/shop/products/:id | Admin | Update product |
| DELETE | /api/shop/products/:id | Admin | Delete product |
| GET | /api/shop/analytics/clicks | Admin | Click analytics |

### User
| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | /api/user/profile | User | Get profile |
| PUT | /api/user/profile | User | Update profile |

---

## 🧪 TESTING LOKAL

```bash
npm install
cp .env.example .env
# Edit .env dengan kredensial Anda (perlu PostgreSQL lokal atau Railway DB URL)
npm run migrate
npm run seed
npm run dev
```

Server jalan di `http://localhost:3000`

Test dengan curl:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"identifier":"081234567890","password":"test123","full_name":"Sarah","child_name":"Naya","child_dob":"2024-12-22"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"081234567890","password":"test123"}'
```

---

## ⚠️ CATATAN PENTING

1. **Ganti password admin** setelah seed pertama kali (login dengan ADMIN_EMAIL/ADMIN_PASSWORD lalu update).
2. **JWT secrets** harus random dan disimpan rahasia — jangan commit ke GitHub.
3. **AI Chat scope terbatas** — hanya jawab soal produk & tips umum, tidak diagnosis medis (lihat system prompt di `routes/chat.js`).
4. **Artikel knowledge base** sudah di-seed dengan referensi WHO/IDAI tapi sebaiknya tetap di-review oleh dokter anak partner sebelum go-live penuh.

---

## 🔒 SECURITY HARDENING — Apa yang sudah dan belum

### Sudah diterapkan
- **Password**: bcrypt 12 rounds, minimal 8 karakter + wajib ada angka
- **Account lockout**: 5x gagal login → akun dikunci 15 menit (anti brute-force per akun, bukan cuma per-IP)
- **Rate limiting bertingkat**: 100 req/15min general, 10 req/15min untuk login/register, 10 req/menit untuk endpoint AI (chat & insight) karena itu biaya per-call ke DeepSeek
- **`trust proxy` di-set** — wajib di Railway/PaaS, tanpa ini rate limiter salah baca IP (semua traffic kebaca 1 IP)
- **Validasi env saat startup**: server **refuse to start** kalau JWT_SECRET pendek/placeholder, ADMIN_PASSWORD lemah, atau FRONTEND_URL belum di-set di production
- **CORS strict** di production — tidak fallback ke `*`, harus set domain spesifik
- **SQL injection**: semua query parameterized (tidak ada string concat ke query)
- **Search wildcard escaping**: karakter `%` dan `_` di-escape supaya tidak bisa dipakai untuk query abuse
- **Input length limits**: title, content, description, chat message semua dibatasi (cegah payload besar / DoS)
- **HPP protection**: cegah HTTP Parameter Pollution
- **Generic error message** di login — tidak bocorkan apakah akun ada atau password yang salah
- **Helmet** di kedua server (backend: default headers; frontend: + CSP karena serve HTML)
- **XSS output escaping**: semua data dari API di-escape via `escapeHtml()` sebelum dirender ke DOM (lihat `app.js`)

### ⚠️ Trade-off yang disengaja (perlu Anda tahu)
- **CSP `unsafe-inline` di frontend** — `index.html` pakai `onclick=""` inline di banyak tempat. CSP strict akan mematahkan ini. Saya izinkan `unsafe-inline` untuk script supaya app tetap jalan, tapi ini melemahkan proteksi terhadap XSS dibanding versi ideal. **Perbaikan lanjutan**: refactor semua `onclick=""` jadi `addEventListener` di `app.js`, baru hapus `unsafe-inline`.

### ❌ Belum diterapkan (gap yang masih ada, prioritaskan sesuai resiko nyata)
- **Tidak ada 2FA** — kalau password bocor, akun tetap bisa diakses
- **Tidak ada refresh token revocation list yang dibersihkan otomatis** — token expired tetap nyangkut di tabel `refresh_tokens` (bukan resiko keamanan langsung, tapi perlu cleanup job)
- **Tidak ada WAF / DDoS protection di layer network** — Railway punya proteksi dasar, tapi untuk traffic tinggi pertimbangkan Cloudflare di depan
- **Admin panel tidak punya audit log** — tidak tercatat siapa admin yang ubah/hapus artikel/produk apa dan kapan
- **Tidak ada virus/malware scan** untuk upload file — saat ini app belum punya fitur upload file jadi belum relevan, tapi kalau nanti ditambah (foto produk, dst), wajib di-scan
- **Secret rotation** — JWT_SECRET sekali di-set tidak ada mekanisme rotasi otomatis

Kalau mau prioritaskan salah satu dari gap di atas untuk fase berikutnya, audit log admin dan refactor CSP adalah dua yang paling cost-effective untuk dikerjakan duluan.
