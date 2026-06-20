// GANTI dengan URL backend Railway Anda setelah deploy
// Contoh: https://generos-backend.up.railway.app
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://YOUR-BACKEND-URL.up.railway.app/api';
