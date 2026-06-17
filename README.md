# Monitoring SE2026 — Kabupaten Penajam Paser Utara

Aplikasi web monitoring harian pendataan **Sensus Ekonomi 2026** di Kabupaten Penajam Paser Utara (PPU), dilengkapi Early Warning System (EWS) dan ekspor rekap Excel.

---

## 🏗️ Tech Stack & Arsitektur (Opsi B)

Aplikasi telah direbuild menggunakan arsitektur **Express.js (Backend API)** + **React SPA (Frontend)** untuk kemudahan dan keandalan tinggi saat dideploy ke Shared Hosting cPanel (Dewaweb).

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React SPA (Vite, React Router, Tailwind/CSS variables) |
| **Backend** | Express.js (Node.js API Server) |
| **ORM & DB** | Prisma (SQLite untuk lokal, MySQL untuk produksi) |
| **Excel & Charts** | ExcelJS & Lucide Icons |

---

## 👥 Role Pengguna

| Role | Akses |
|------|-------|
| **Admin** | Akses penuh, kelola user, konfigurasi EWS |
| **Korlap** | Dashboard semua kecamatan, ekspor Excel |
| **PML** | Dashboard kecamatan yang diawasi |
| **PCL / PPL** | Input laporan harian sub-SLS yang ditugaskan |

---

## 📊 Cakupan Data

- **4 Kecamatan**: BABULU, WARU, PENAJAM, SEPAKU
- **1.042 Sub-SLS** dengan total **114.387 usaha** yang harus dicacah
- **17 Korlap**, **23 PML**, **165 PCL**

---

## 🗂️ Struktur Proyek

```
monitoring-se2026/
├── frontend/          # Aplikasi React Client (Vite)
│   ├── src/
│   │   ├── pages/     # Login, Dashboard, FormInput, Rekap, Admin pages
│   │   ├── components/# Sidebar, Layout, ProtectedRoute
│   │   └── context/   # Auth Context & Session Management
│   └── package.json
│
└── backend/           # API Express Server
    ├── prisma/        # Schema database (SQLite/MySQL) & seed script
    ├── routes/        # Router untuk auth, dashboard, laporan, export, admin
    ├── lib/           # JWT Helper, EWS logic, Excel export helpers
    └── server.js      # Entry point Express App
```

---

## 🚀 Setup Development (Lokal)

### 1. Jalankan Backend API
```bash
cd backend
npm install

# Setup environtment lokal
# Buat file .env di dalam folder backend/ dan isi:
# PORT=3000
# JWT_SECRET="rahasia-jwt-lokal-dev-12345"
# NODE_ENV=development

# Sinkronkan skema database SQLite dev.db lokal
Copy-Item -Path "../prisma/dev.db" -Destination "prisma/dev.db" -Force # Salin DB yang sudah ada
npx prisma generate

# Jalankan server API backend
npm run dev
```
Backend API akan berjalan di [http://localhost:3000](http://localhost:3000)

### 2. Jalankan Frontend React
```bash
cd frontend
npm install
npm run dev
```
Frontend akan berjalan di [http://localhost:5173](http://localhost:5173). Semua request ke `/api/*` secara otomatis diproxy ke backend port 3000 melalui konfigurasi proxy Vite.

---

## 🌐 Deploy ke Dewaweb (Shared Hosting)

Untuk langkah deployment terperinci ke hosting cPanel Dewaweb, silakan merujuk pada file [dewaweb_deployment_guide.md](file:///C:/Users/ajian/.gemini/antigravity/brain/ea5a5b9e-a833-475c-86fe-56ba25e6f817/dewaweb_deployment_guide.md).

---

## 📋 Fitur Utama

- **Form Input Harian** — Cascade dropdown kecamatan → desa → SLS → sub-SLS, dengan pengisian data target muatan otomatis.
- **Dashboard Drill-Down** — 4 level cakupan: Kabupaten → Kecamatan → SLS/RT → Sub-SLS detail pencacahan.
- **Early Warning System (EWS)** — Deteksi petugas tidak aktif, progres stagnan, dan status kritis risiko tidak selesai.
- **Rekap & Ekspor Excel** — Download file Excel untuk 5 level rekapitulasi: per sub-SLS, per SLS/RT, per kecamatan, harian, dan EWS.

---

## 📄 Lisensi

BPS Kabupaten Penajam Paser Utara — 2026
