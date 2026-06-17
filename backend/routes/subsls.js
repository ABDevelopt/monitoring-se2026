// backend/routes/subsls.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

router.get('/', async (req, res) => {
  const slsId = parseInt(req.query.slsId);
  if (isNaN(slsId)) return res.status(400).json({ error: 'Parameter slsId wajib disertakan' });

  try {
    const subsls = await prisma.subSls.findMany({ where: { idSls: slsId }, orderBy: { kodeSubsls: 'asc' } });
    return res.json(subsls);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal memuat data sub-SLS' });
  }
});

module.exports = router;
