// backend/routes/sls.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

router.get('/', async (req, res) => {
  const desaId = parseInt(req.query.desaId);
  if (isNaN(desaId)) return res.status(400).json({ error: 'Parameter desaId wajib disertakan' });

  try {
    const sls = await prisma.sls.findMany({ where: { idDesa: desaId }, orderBy: { kodeSls: 'asc' } });
    return res.json(sls);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal memuat data SLS' });
  }
});

module.exports = router;
