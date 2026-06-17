// backend/routes/kecamatan.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

router.get('/', async (req, res) => {
  try {
    const kecamatan = await prisma.kecamatan.findMany({ orderBy: { kodeKec: 'asc' } });
    return res.json(kecamatan);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal memuat data kecamatan' });
  }
});

module.exports = router;
