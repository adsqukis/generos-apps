const express = require('express');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // 'unsafe-inline' diizinkan karena index.html memakai onclick="" inline.
        // TRADE-OFF: melemahkan proteksi XSS dibanding versi strict tanpa inline script.
        // Perbaikan ideal: refactor semua onclick="" jadi addEventListener di app.js,
        // baru hapus 'unsafe-inline' di sini.
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'], // perlu akses ke backend Railway (domain berbeda)
      },
    },
  })
);

app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback - semua route balik ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ Generos Care frontend running on port ${PORT}`);
});
