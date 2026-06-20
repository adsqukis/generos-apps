# Generos Care - Frontend

Frontend aplikasi Generos Care. Vanilla JS + HTML + CSS, terhubung ke backend API.

## ⚠️ WAJIB SEBELUM DEPLOY

Edit `public/config.js`, ganti URL backend dengan URL Railway backend Anda yang sudah deploy:

```js
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://NAMA-BACKEND-ANDA.up.railway.app/api';  // <- GANTI INI
```

---

## 🚀 DEPLOY KE RAILWAY

### 1. Push ke GitHub

```bash
cd generos-frontend
git init
git add .
git commit -m "Initial commit - Generos Care frontend"
git branch -M main
git remote add origin https://github.com/USERNAME/generos-frontend.git
git push -u origin main
```

### 2. Setup Railway

1. Railway dashboard → **New Project** → **Deploy from GitHub repo**
2. Pilih repo `generos-frontend`
3. Railway auto-detect Node.js, build otomatis
4. Settings → Networking → **Generate Domain**

### 3. Update CORS di Backend

Setelah frontend punya domain, update environment variable `FRONTEND_URL` di Railway **backend** service Anda dengan domain frontend ini (supaya CORS tidak block).

---

## 🧪 TEST LOKAL

```bash
npm install
npm start
```

Buka `http://localhost:8080`

Pastikan backend juga jalan di `http://localhost:3000` (lihat README backend).

---

## 📁 STRUKTUR

```
generos-frontend/
├── public/
│   ├── index.html    # Semua halaman (login, home, tracking, dll)
│   ├── style.css      # Styling biru putih Generos
│   ├── config.js      # API base URL config
│   ├── api.js          # API client (semua fungsi call backend)
│   └── app.js          # App logic, navigasi, render
├── server.js           # Express static server
├── package.json
└── railway.json
```

## ✅ FITUR YANG SUDAH JALAN

- Login & Register (phone/email)
- Tracking perkembangan (create, list) + AI insight (klik card untuk minta insight)
- Knowledge base (browse + detail artikel dengan red flags & kapan ke dokter)
- Food menu (browse + detail resep)
- Chat AI (terhubung ke DeepSeek via backend, scope terbatas)
- Shop (list produk + redirect ke Shopee dengan tracking klik)
- Admin panel (tambah artikel, menu makanan, produk, lihat analytics klik)

## 🔲 BELUM ADA (next iteration)

- Edit/delete dari sisi UI (backend API sudah support, tinggal tambah tombol)
- Upload gambar untuk artikel/produk/food (saat ini text only)
- Pagination UI (backend sudah support, infinite scroll belum)
