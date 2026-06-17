// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const { createSession, getSession, deleteSession } = require('../lib/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Username tidak terdaftar atau akun tidak aktif.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Password salah.' });
    }

    await createSession(res, {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      idKecamatan: user.idKecamatan,
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        idKecamatan: user.idKecamatan,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem. Silakan coba lagi.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  deleteSession(res);
  return res.json({ success: true });
});

// GET /api/auth/session
router.get('/session', async (req, res) => {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Tidak terautorisasi' });
  }
  return res.json(session);
});

module.exports = router;
