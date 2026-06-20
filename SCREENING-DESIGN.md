# Generos Care — Screening & Tracking Re-design

## Metode Screening: KPSP (Kuesioner Pra Skrining Perkembangan)

Standar Kementerian Kesehatan RI. Setiap usia punya **9-10 pertanyaan** Yes/No.

## 4 Domain Fokus

| Domain | Kode | Fokus |
|---|---|---|
| Kecerdasan | cognitive | Problem solving, cause-effect, object permanence, pretend play |
| Bicara | speech | Mengoceh, kata pertama, kalimat, perintah |
| Imunitas | immunity | Frekuensi sakit, BB, nafsu makan, recovery |
| Motorik | motor | Duduk, merangkak, jalan, lari, memegang |

## 3 Jalur Stimulasi

1. **Stimulasi Umum** — aktivitas sesuai usia untuk semua anak (optimalisasi)
2. **Dari Hasil Screening** — kalau skor Meragukan/Menyimpang → rekomendasi spesifik
3. **Dari Tracking/Kendala** — user input masalah → sistem rekomendasi aktivitas

## Flow

```
Parent dashboard
  ├── Screening (berkala, 1x/bln)
  │   ├── Pilih domain (bisa >1)
  │   ├── Jawab pertanyaan Yes/No per usia
  │   └── Hasil: Sesuai 🟢 / Meragukan 🟡 / Menyimpang 🔴
  │       └── → Rekomendasi stimulasi
  │
  ├── Tracking Bank (harian)
  │   ├── Catat per domain
  │   └── Dari kendala → rekomendasi stimulasi
  │
  └── Stimulasi
      ├── Umum (berdasarkan usia)
      ├── Dari screening (rekomendasi)
      └── Dari tracking/kendala
```
