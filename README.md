# Monitoring SE2026 — Kabupaten Penajam Paser Utara

Aplikasi web monitoring harian pendataan **Sensus Ekonomi 2026** di Kabupaten Penajam Paser Utara (PPU), dilengkapi Early Warning System (EWS) dan ekspor rekap Excel.

---

## 🏗️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Runtime | Node.js 20 LTS |
| Database | MySQL 8.x |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| Excel | ExcelJS |
| Charts | Chart.js |
| Deploy | Dewaweb Shared Hosting (cPanel + Phusion Passenger) |

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

## 🚀 Setup Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local dengan kredensial database Anda

# 3. Generate Prisma client
npx prisma generate

# 4. Buat database dan jalankan migrations
npx prisma migrate dev --name init

# 5. Seed data dari JSON master
npx prisma db seed

# 6. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Struktur Proyek

```
monitoring-se2026/
├── prisma/             # Schema DB & seed script
├── src/
│   ├── app/            # Next.js App Router (pages + API routes)
│   ├── components/     # React components
│   ├── lib/            # Prisma client, auth, EWS, Excel helper
│   └── styles/         # CSS modules
└── scripts/            # Import JSON data
```

---

## 🌐 Deploy ke Dewaweb (Shared Hosting)

1. Buka cPanel → **Setup Node.js App** → Create Application
2. Node.js Version: `20.x`, Startup File: `server.js`
3. Upload semua file (kecuali `node_modules/`)
4. Klik **Run npm install** di cPanel
5. Buat database MySQL via cPanel → MySQL Databases
6. Set environment variables di `.env`
7. Buka Terminal cPanel → `npx prisma migrate deploy && npx prisma db seed`
8. Klik **Start App**

---

## 📋 Fitur Utama

- **Form Input Harian** — Cascade dropdown kecamatan → desa → SLS → sub-SLS, dengan auto-fill PML/PCL/Korlap dan total muatan
- **Dashboard Drill-Down** — 4 level: Kabupaten → Kecamatan → SLS/RT → Sub-SLS detail
- **Early Warning System** — Deteksi PCL tidak aktif, stagnan, dan risiko tidak selesai
- **Rekap & Ekspor Excel** — 5 level rekap: per sub-SLS, per SLS/RT, per kecamatan, harian, dan EWS

---

## 📄 Lisensi

BPS Kabupaten Penajam Paser Utara — 2026
