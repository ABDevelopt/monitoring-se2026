// backend/routes/admin.js
// Admin routes: users, settings, master data

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const { requireAdmin } = require('../lib/auth');
const { getSettings, saveSettings } = require('../lib/settings');

// ─── USERS ────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { kecamatan: true, tugasPcl: { include: { subsls: true } } },
      orderBy: { id: 'asc' },
    });
    const sanitized = users.map(({ passwordHash, ...rest }) => rest);
    return res.json(sanitized);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal memuat data user' });
  }
});

// POST /api/admin/users
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { nama, username, password, role, idKecamatan, subSlsIds } = req.body;
    if (!nama || !username || !password || !role) {
      return res.status(400).json({ error: 'Input tidak lengkap' });
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existingUser = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existingUser) return res.status(400).json({ error: 'Username sudah terdaftar' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        nama, username: cleanUsername, passwordHash, role,
        idKecamatan: role === 'pml' && idKecamatan ? parseInt(idKecamatan) : null,
      },
    });

    if (role === 'pcl' && Array.isArray(subSlsIds) && subSlsIds.length > 0) {
      await Promise.all(subSlsIds.map(subId => prisma.tugasPcl.create({ data: { idUser: user.id, idSubsls: subId } })));
    }

    const { passwordHash: _, ...sanitized } = user;
    return res.json({ success: true, user: sanitized });
  } catch (error) {
    console.error('API post user error:', error);
    return res.status(500).json({ error: 'Gagal menambahkan user' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: 'ID user tidak valid' });

  try {
    const { nama, username, password, role, idKecamatan, isActive, subSlsIds } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const cleanUsername = username?.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanUsername && cleanUsername !== user.username) {
      const dupe = await prisma.user.findUnique({ where: { username: cleanUsername } });
      if (dupe) return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    const updateData = {};
    if (nama) updateData.nama = nama;
    if (cleanUsername) updateData.username = cleanUsername;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.idKecamatan = role === 'pml' && idKecamatan ? parseInt(idKecamatan) : null;
    if (password && password.trim() !== '') updateData.passwordHash = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({ where: { id: userId }, data: updateData });

    if (role === 'pcl' && Array.isArray(subSlsIds)) {
      await prisma.tugasPcl.deleteMany({ where: { idUser: userId } });
      if (subSlsIds.length > 0) {
        await Promise.all(subSlsIds.map(subId => prisma.tugasPcl.create({ data: { idUser: userId, idSubsls: subId } })));
      }
    }

    const { passwordHash: _, ...sanitized } = updatedUser;
    return res.json({ success: true, user: sanitized });
  } catch (error) {
    console.error('API update user error:', error);
    return res.status(500).json({ error: 'Gagal memperbarui user' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: 'ID user tidak valid' });
  if (req.session.userId === userId) return res.status(400).json({ error: 'Tidak dapat menghapus akun admin Anda sendiri' });

  try {
    await prisma.tugasPcl.deleteMany({ where: { idUser: userId } });
    await prisma.user.delete({ where: { id: userId } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Gagal menghapus user' });
  }
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

// GET /api/admin/settings
router.get('/settings', requireAdmin, (req, res) => {
  try {
    const settings = getSettings();
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal membaca settings' });
  }
});

// POST /api/admin/settings
router.post('/settings', requireAdmin, (req, res) => {
  const { appName, ewsThresholdHari, periodeMulai, periodeSelesai } = req.body;
  if (!appName || ewsThresholdHari === undefined || !periodeMulai || !periodeSelesai) {
    return res.status(400).json({ error: 'Input tidak lengkap' });
  }
  const threshold = parseInt(ewsThresholdHari);
  if (isNaN(threshold) || threshold <= 0) {
    return res.status(400).json({ error: 'Batas hari peringatan kendala harus angka positif' });
  }
  try {
    const updated = saveSettings({ appName, ewsThresholdHari: threshold, periodeMulai, periodeSelesai });
    return res.json({ success: true, settings: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Gagal menyimpan settings' });
  }
});

// ─── MASTER DATA ──────────────────────────────────────────────────────────────

// GET /api/admin/master/kecamatan
router.get('/master/kecamatan', requireAdmin, async (req, res) => {
  try {
    const data = await prisma.kecamatan.findMany({
      include: { desa: { include: { sls: { include: { subsls: true } } } } },
      orderBy: { kodeKec: 'asc' },
    });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal memuat data master' });
  }
});

module.exports = router;
