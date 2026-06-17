// backend/server.js
// Express.js API Server untuk Monitoring SE2026
// Kompatibel dengan cPanel/Dewaweb shared hosting

'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS: izinkan frontend mengakses API
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (misal dari cURL, Postman, atau same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Penting: izinkan cookie lintas origin
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/laporan',   require('./routes/laporan'));
app.use('/api/kecamatan', require('./routes/kecamatan'));
app.use('/api/sls',       require('./routes/sls'));
app.use('/api/subsls',    require('./routes/subsls'));
app.use('/api/desa',      require('./routes/desa'));
app.use('/api/ews',       require('./routes/ews'));
app.use('/api/export',    require('./routes/export'));
app.use('/api/admin',     require('./routes/admin'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan internal server' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend API berjalan di port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
