// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../lib/auth');
const { detectAlert } = require('../lib/ews');

// GET /api/dashboard
router.get('/', requireAuth, async (req, res) => {
  const session = req.session;

  try {
    const whereClause = {};
    if (session.role === 'pcl') {
      whereClause.tugasPcl = { some: { idUser: session.userId } };
    } else if (session.role === 'pml' && session.idKecamatan) {
      whereClause.sls = { desa: { idKecamatan: session.idKecamatan } };
    }

    const subSlsList = await prisma.subSls.findMany({
      where: whereClause,
      include: {
        laporan: { orderBy: { tanggal: 'desc' }, take: 3 },
        sls: { include: { desa: { include: { kecamatan: true } } } },
      },
    });

    let totalUsahaKab = 0, usahaSelesaiKab = 0;
    let countSelesaiSub = 0, countProgresSub = 0, countTidakSelesaiSub = 0, countBelumLaporSub = 0;
    const alerts = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const kecStats = new Map();
    const korlapStats = new Map();
    const pmlStats = new Map();

    for (const sub of subSlsList) {
      const totalMuatan = sub.totalMuatanAssignment;
      totalUsahaKab += totalMuatan;

      const latestReport = sub.laporan[0];
      const selesai = latestReport ? latestReport.jumlahSelesai : 0;
      usahaSelesaiKab += selesai;

      let statusSub = 'belum_lapor';
      if (!latestReport) {
        statusSub = 'belum_lapor';
        countBelumLaporSub++;
      } else if (totalMuatan === 0) {
        statusSub = latestReport.status;
        if (statusSub === 'selesai') countSelesaiSub++;
        else if (statusSub === 'tidak_selesai') countTidakSelesaiSub++;
        else countProgresSub++;
      } else if (selesai >= totalMuatan) {
        statusSub = 'selesai'; countSelesaiSub++;
      } else if (latestReport.status === 'tidak_selesai') {
        statusSub = 'tidak_selesai'; countTidakSelesaiSub++;
      } else {
        statusSub = 'progres'; countProgresSub++;
      }

      const alert = detectAlert(sub, currentDate);
      if (alert) {
        alerts.push({
          ...alert,
          kecamatan: sub.sls.desa.kecamatan.namaKec,
          desa: sub.sls.desa.namaDesa,
          sls: sub.sls.namaSls,
        });
      }

      const kec = sub.sls.desa.kecamatan;
      if (!kecStats.has(kec.namaKec)) {
        kecStats.set(kec.namaKec, {
          id: kec.id, kode: kec.kodeKec, nama: kec.namaKec,
          totalSubSls: 0, totalMuatan: 0, selesai: 0,
          countSelesai: 0, countProgres: 0, countTidakSelesai: 0, countBelumLapor: 0, countAlert: 0,
        });
      }
      const kStat = kecStats.get(kec.namaKec);
      kStat.totalSubSls++; kStat.totalMuatan += totalMuatan; kStat.selesai += selesai;
      if (statusSub === 'selesai') kStat.countSelesai++;
      else if (statusSub === 'progres') kStat.countProgres++;
      else if (statusSub === 'tidak_selesai') kStat.countTidakSelesai++;
      else kStat.countBelumLapor++;
      if (alert) kStat.countAlert++;

      const korlapName = sub.namaKorlap;
      if (korlapName) {
        if (!korlapStats.has(korlapName)) {
          korlapStats.set(korlapName, { nama: korlapName, kecamatanList: new Set(), totalSubSls: 0, totalMuatan: 0, selesai: 0, countAlert: 0 });
        }
        const korlap = korlapStats.get(korlapName);
        korlap.kecamatanList.add(kec.namaKec);
        korlap.totalSubSls++; korlap.totalMuatan += totalMuatan; korlap.selesai += selesai;
        if (alert) korlap.countAlert++;
      }

      const pmlName = sub.namaPml;
      if (pmlName) {
        if (!pmlStats.has(pmlName)) {
          pmlStats.set(pmlName, { nama: pmlName, korlap: sub.namaKorlap || '-', totalSubSls: 0, totalMuatan: 0, selesai: 0, countAlert: 0 });
        }
        const pml = pmlStats.get(pmlName);
        pml.totalSubSls++; pml.totalMuatan += totalMuatan; pml.selesai += selesai;
        if (alert) pml.countAlert++;
      }
    }

    const severityWeight = { kritis: 3, perhatian: 2, risiko: 1 };
    alerts.sort((a, b) => (severityWeight[b.tingkatKekritisan] || 0) - (severityWeight[a.tingkatKekritisan] || 0));

    const kecamatanList = Array.from(kecStats.values()).sort((a, b) => a.kode.localeCompare(b.kode));
    const korlapList = Array.from(korlapStats.values()).map(k => ({
      ...k, kecamatan: Array.from(k.kecamatanList).join(', '),
    })).sort((a, b) => a.nama.localeCompare(b.nama));
    const pmlList = Array.from(pmlStats.values()).sort((a, b) => a.nama.localeCompare(b.nama));

    // Trend harian 7 hari
    const trendDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - i);
      trendDays.push(d.toISOString().split('T')[0]);
    }

    const startTrend = new Date(trendDays[0]);
    const endTrend = new Date(trendDays[trendDays.length - 1]);
    endTrend.setDate(endTrend.getDate() + 1);

    const reportsTrend = await prisma.laporan.findMany({
      where: { tanggal: { gte: startTrend, lt: endTrend } },
      select: { tanggal: true, jumlahSelesai: true, status: true },
    });

    const trendMap = new Map();
    trendDays.forEach(day => trendMap.set(day, { selesai: 0, progres: 0, tidakSelesai: 0 }));
    for (const r of reportsTrend) {
      const dateKey = new Date(r.tanggal).toISOString().split('T')[0];
      if (trendMap.has(dateKey)) {
        const counts = trendMap.get(dateKey);
        if (r.status === 'selesai') counts.selesai += r.jumlahSelesai;
        else if (r.status === 'progres') counts.progres += r.jumlahSelesai;
        else counts.tidakSelesai += r.jumlahSelesai;
      }
    }

    const trendData = trendDays.map(day => {
      const counts = trendMap.get(day);
      return { tanggal: day, ...counts, totalSelesai: counts.selesai + counts.progres + counts.tidakSelesai };
    });

    return res.json({
      summary: {
        totalUsaha: totalUsahaKab,
        usahaSelesai: usahaSelesaiKab,
        progressPersen: totalUsahaKab > 0
          ? (usahaSelesaiKab / totalUsahaKab) * 100
          : (subSlsList.length > 0 ? ((countSelesaiSub * 100 + countProgresSub * 50) / subSlsList.length) : 0),
        subSlsStats: {
          total: subSlsList.length,
          selesai: countSelesaiSub,
          progres: countProgresSub,
          tidakSelesai: countTidakSelesaiSub,
          belumLapor: countBelumLaporSub,
        },
        activeAlertsCount: alerts.length,
      },
      kecamatanList: session.role === 'pcl' ? subSlsList.map(sub => {
        const latestReport = sub.laporan[0];
        const selesai = latestReport ? latestReport.jumlahSelesai : 0;
        const totalMuatan = sub.totalMuatanAssignment;
        let statusSub = 'belum_lapor';
        if (!latestReport) statusSub = 'belum_lapor';
        else if (totalMuatan === 0) statusSub = latestReport.status;
        else if (selesai >= totalMuatan) statusSub = 'selesai';
        else if (latestReport.status === 'tidak_selesai') statusSub = 'tidak_selesai';
        else statusSub = 'progres';
        const persentase = latestReport
          ? (totalMuatan > 0 ? (selesai / totalMuatan) * 100 : (latestReport.status === 'selesai' ? 100 : latestReport.status === 'tidak_selesai' ? 0 : 50))
          : 0;
        return {
          id: sub.id, idSubsls: sub.idSubsls, idSubSls: sub.idSubsls,
          namaSls: sub.sls.namaSls, desaNama: sub.sls.desa.namaDesa,
          totalMuatan, selesai, persentase, status: statusSub,
          namaPcl: sub.namaPcl, namaPml: sub.namaPml, namaKorlap: sub.namaKorlap,
        };
      }) : kecamatanList,
      korlapList,
      pmlList,
      trendData,
      topAlerts: alerts.slice(0, 5),
    });
  } catch (error) {
    console.error('API dashboard error:', error);
    return res.status(500).json({ error: 'Gagal memuat data dashboard' });
  }
});

module.exports = router;
