// backend/routes/desa.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

router.get('/', async (req, res) => {
  const kecamatanId = parseInt(req.query.kecamatanId);
  if (isNaN(kecamatanId)) return res.status(400).json({ error: 'Parameter kecamatanId wajib disertakan' });

  try {
    const desa = await prisma.desa.findMany({ where: { idKecamatan: kecamatanId }, orderBy: { kodeDesa: 'asc' } });
    const mapped = desa.map(d => ({ ...d, nama: d.namaDesa }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal memuat data desa' });
  }
});

module.exports = router;
