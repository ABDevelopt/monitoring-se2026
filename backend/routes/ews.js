// backend/routes/ews.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../lib/auth');
const { detectAlert } = require('../lib/ews');

router.get('/', requireAuth, async (req, res) => {
  const session = req.session;
  const kecamatanIdStr = req.query.kecamatanId;

  const where = {};
  if (session.role === 'pcl') {
    where.tugasPcl = { some: { idUser: session.userId } };
  } else if (session.role === 'pml' && session.idKecamatan) {
    where.sls = { desa: { idKecamatan: session.idKecamatan } };
  } else if (kecamatanIdStr) {
    const kecamatanId = parseInt(kecamatanIdStr);
    if (!isNaN(kecamatanId)) where.sls = { desa: { idKecamatan: kecamatanId } };
  }

  try {
    const subSlsList = await prisma.subSls.findMany({
      where,
      include: {
        laporan: { orderBy: { tanggal: 'desc' }, take: 3 },
        sls: { include: { desa: { include: { kecamatan: true } } } },
      },
    });

    const alerts = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const sub of subSlsList) {
      const alert = detectAlert(sub, currentDate);
      if (alert) {
        alerts.push({ ...alert, kecamatan: sub.sls.desa.kecamatan.namaKec, desa: sub.sls.desa.namaDesa, sls: sub.sls.namaSls });
      }
    }

    const severityWeight = { kritis: 3, perhatian: 2, risiko: 1 };
    alerts.sort((a, b) => (severityWeight[b.tingkatKekritisan] || 0) - (severityWeight[a.tingkatKekritisan] || 0));

    return res.json({ alerts });
  } catch (error) {
    console.error('API EWS error:', error);
    return res.status(500).json({ error: 'Gagal memuat data peringatan kendala' });
  }
});

module.exports = router;
