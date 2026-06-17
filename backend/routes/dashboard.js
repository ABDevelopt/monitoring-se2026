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

// GET /api/dashboard/kecamatan/:kecId
router.get('/kecamatan/:kecId', requireAuth, async (req, res) => {
  const session = req.session;
  const targetKecId = parseInt(req.params.kecId);

  if (isNaN(targetKecId)) {
    return res.status(400).json({ error: 'ID Kecamatan tidak valid' });
  }

  // Validasi Wilayah untuk PML
  if (session.role === 'pml' && session.idKecamatan !== targetKecId) {
    return res.status(403).json({ error: 'Izin akses ditolak untuk wilayah kecamatan ini' });
  }

  try {
    const kecamatan = await prisma.kecamatan.findUnique({
      where: { id: targetKecId },
    });

    if (!kecamatan) {
      return res.status(404).json({ error: 'Kecamatan tidak ditemukan' });
    }

    const subSlsList = await prisma.subSls.findMany({
      where: {
        sls: {
          desa: {
            idKecamatan: targetKecId,
          },
        },
      },
      include: {
        laporan: {
          orderBy: { tanggal: 'desc' },
          take: 3,
        },
        sls: {
          include: {
            desa: true,
          },
        },
      },
    });

    const slsStatsMap = new Map();
    const pmlStatsMap = new Map();

    let totalUsahaKec = 0;
    let usahaSelesaiKec = 0;
    let countSelesaiKecSub = 0;
    let countProgresKecSub = 0;
    let countTidakSelesaiKecSub = 0;
    let countBelumLaporKecSub = 0;
    
    const alerts = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const sub of subSlsList) {
      const totalMuatan = sub.totalMuatanAssignment;
      totalUsahaKec += totalMuatan;

      const latestReport = sub.laporan[0];
      const selesai = latestReport ? latestReport.jumlahSelesai : 0;
      usahaSelesaiKec += selesai;

      let statusSub = 'belum_lapor';
      if (!latestReport) {
        statusSub = 'belum_lapor';
        countBelumLaporKecSub++;
      } else if (totalMuatan === 0) {
        statusSub = latestReport.status;
        if (statusSub === 'selesai') countSelesaiKecSub++;
        else if (statusSub === 'tidak_selesai') countTidakSelesaiKecSub++;
        else countProgresKecSub++;
      } else if (selesai >= totalMuatan) {
        statusSub = 'selesai';
        countSelesaiKecSub++;
      } else if (latestReport.status === 'tidak_selesai') {
        statusSub = 'tidak_selesai';
        countTidakSelesaiKecSub++;
      } else {
        statusSub = 'progres';
        countProgresKecSub++;
      }

      const alert = detectAlert(sub, currentDate);
      if (alert) {
        alerts.push({
          ...alert,
          kecamatan: kecamatan.namaKec,
          desa: sub.sls.desa.namaDesa,
          sls: sub.sls.namaSls,
        });
      }

      const slsId = sub.sls.id;
      if (!slsStatsMap.has(slsId)) {
        slsStatsMap.set(slsId, {
          id: slsId,
          kodeSls: sub.sls.kodeSls,
          namaSls: sub.sls.namaSls,
          desaNama: sub.sls.desa.namaDesa,
          jumlahSubSls: 0,
          totalMuatan: 0,
          selesai: 0,
          countSelesai: 0,
          countProgres: 0,
          countTidakSelesai: 0,
          countBelumLapor: 0,
          countAlert: 0,
        });
      }
      const sStat = slsStatsMap.get(slsId);
      sStat.jumlahSubSls++;
      sStat.totalMuatan += totalMuatan;
      sStat.selesai += selesai;
      if (statusSub === 'selesai') sStat.countSelesai++;
      else if (statusSub === 'progres') sStat.countProgres++;
      else if (statusSub === 'tidak_selesai') sStat.countTidakSelesai++;
      else sStat.countBelumLapor++;
      if (alert) sStat.countAlert++;

      const pmlName = sub.namaPml;
      if (pmlName) {
        if (!pmlStatsMap.has(pmlName)) {
          pmlStatsMap.set(pmlName, {
            nama: pmlName,
            korlap: sub.namaKorlap,
            totalSubSls: 0,
            totalMuatan: 0,
            selesai: 0,
            countAlert: 0,
          });
        }
        const pml = pmlStatsMap.get(pmlName);
        pml.totalSubSls++;
        pml.totalMuatan += totalMuatan;
        pml.selesai += selesai;
        if (alert) pml.countAlert++;
      }
    }

    const slsList = Array.from(slsStatsMap.values()).sort((a, b) => a.kodeSls.localeCompare(b.kodeSls));
    const pmlList = Array.from(pmlStatsMap.values()).sort((a, b) => a.nama.localeCompare(b.nama));

    const severityWeight = { kritis: 3, perhatian: 2, risiko: 1 };
    alerts.sort((a, b) => (severityWeight[b.tingkatKekritisan] || 0) - (severityWeight[a.tingkatKekritisan] || 0));

    return res.json({
      kecamatan: {
        id: kecamatan.id,
        kode: kecamatan.kodeKec,
        nama: kecamatan.namaKec,
      },
      summary: {
        totalUsaha: totalUsahaKec,
        usahaSelesai: usahaSelesaiKec,
        progressPersen: totalUsahaKec > 0 
          ? (usahaSelesaiKec / totalUsahaKec) * 100 
          : (subSlsList.length > 0 
              ? ((countSelesaiKecSub * 100 + countProgresKecSub * 50) / subSlsList.length) 
              : 0),
        subSlsStats: {
          total: subSlsList.length,
          selesai: countSelesaiKecSub,
          progres: countProgresKecSub,
          tidakSelesai: countTidakSelesaiKecSub,
          belumLapor: countBelumLaporKecSub,
        },
        activeAlertsCount: alerts.length,
      },
      slsList,
      pmlList,
      alerts,
    });

  } catch (error) {
    console.error('API dashboard Level 2 error:', error);
    return res.status(500).json({ error: 'Gagal memuat data dashboard kecamatan' });
  }
});

// GET /api/dashboard/sls/:slsId
router.get('/sls/:slsId', requireAuth, async (req, res) => {
  const session = req.session;
  const targetSlsId = parseInt(req.params.slsId);

  if (isNaN(targetSlsId)) {
    return res.status(400).json({ error: 'ID SLS tidak valid' });
  }

  try {
    const sls = await prisma.sls.findUnique({
      where: { id: targetSlsId },
      include: {
        desa: {
          include: {
            kecamatan: true,
          },
        },
      },
    });

    if (!sls) {
      return res.status(404).json({ error: 'SLS tidak ditemukan' });
    }

    // Validasi Wilayah untuk PML
    if (session.role === 'pml' && session.idKecamatan !== sls.desa.idKecamatan) {
      return res.status(403).json({ error: 'Izin akses ditolak untuk wilayah SLS ini' });
    }

    const subSlsList = await prisma.subSls.findMany({
      where: { idSls: targetSlsId },
      include: {
        laporan: {
          orderBy: { tanggal: 'desc' },
          take: 3,
        },
      },
      orderBy: { kodeSubsls: 'asc' },
    });

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    let totalUsahaSls = 0;
    let usahaSelesaiSls = 0;
    let countAlertSls = 0;

    const subSlsDetails = subSlsList.map((sub) => {
      const totalMuatan = sub.totalMuatanAssignment;
      totalUsahaSls += totalMuatan;

      const latestReport = sub.laporan[0];
      const selesai = latestReport ? latestReport.jumlahSelesai : 0;
      usahaSelesaiSls += selesai;

      const persentase = latestReport
        ? (totalMuatan > 0 
            ? (selesai / totalMuatan) * 100 
            : (latestReport.status === 'selesai' ? 100 : (latestReport.status === 'tidak_selesai' ? 0 : 50)))
        : 0;

      let statusSub = 'belum_lapor';
      if (!latestReport) {
        statusSub = 'belum_lapor';
      } else if (totalMuatan === 0) {
        statusSub = latestReport.status;
      } else if (selesai >= totalMuatan) {
        statusSub = 'selesai';
      } else if (latestReport.status === 'tidak_selesai') {
        statusSub = 'tidak_selesai';
      } else {
        statusSub = 'progres';
      }

      const alert = detectAlert(sub, currentDate);
      if (alert) {
        countAlertSls++;
      }

      return {
        id: sub.id,
        kodeSubsls: sub.kodeSubsls,
        idSubsls: sub.idSubsls,
        namaKorlap: sub.namaKorlap,
        namaPml: sub.namaPml,
        namaPcl: sub.namaPcl,
        totalMuatan,
        selesai,
        persentase,
        status: statusSub,
        tanggalLapor: latestReport ? latestReport.tanggal.toISOString().split('T')[0] : null,
        keterangan: latestReport?.keterangan || null,
        alert: alert ? {
          jenisAlert: alert.jenisAlert,
          tingkatKekritisan: alert.tingkatKekritisan,
          pesan: alert.pesan,
        } : null,
      };
    });

    return res.json({
      sls: {
        id: sls.id,
        kode: sls.kodeSls,
        nama: sls.namaSls,
        desa: sls.desa.namaDesa,
        kecamatan: sls.desa.kecamatan.namaKec,
        kecamatanId: sls.desa.idKecamatan,
      },
      summary: {
        totalUsaha: totalUsahaSls,
        usahaSelesai: usahaSelesaiSls,
        progressPersen: totalUsahaSls > 0 
          ? (usahaSelesaiSls / totalUsahaSls) * 100 
          : (subSlsDetails.length > 0 
              ? ((subSlsDetails.filter(s => s.status === 'selesai').length * 100 + 
                  subSlsDetails.filter(s => s.status === 'progres').length * 50) / subSlsDetails.length)
              : 0),
        activeAlertsCount: countAlertSls,
      },
      subSlsList: subSlsDetails,
    });

  } catch (error) {
    console.error('API dashboard Level 3 error:', error);
    return res.status(500).json({ error: 'Gagal memuat data dashboard SLS' });
  }
});

// GET /api/dashboard/subsls/:subslsId
router.get('/subsls/:subslsId', requireAuth, async (req, res) => {
  const session = req.session;
  const targetSubSlsId = parseInt(req.params.subslsId);

  if (isNaN(targetSubSlsId)) {
    return res.status(400).json({ error: 'ID Sub-SLS tidak valid' });
  }

  try {
    const subsls = await prisma.subSls.findUnique({
      where: { id: targetSubSlsId },
      include: {
        sls: {
          include: {
            desa: {
              include: {
                kecamatan: true,
              },
            },
          },
        },
        laporan: {
          orderBy: { tanggal: 'desc' },
          include: {
            user: {
              select: {
                nama: true,
              },
            },
          },
        },
      },
    });

    if (!subsls) {
      return res.status(404).json({ error: 'Sub-SLS tidak ditemukan' });
    }

    const kecId = subsls.sls.desa.idKecamatan;

    // Validasi Wilayah untuk PML
    if (session.role === 'pml' && session.idKecamatan !== kecId) {
      return res.status(403).json({ error: 'Izin akses ditolak untuk wilayah Sub-SLS ini' });
    }

    // Validasi Wilayah untuk PCL (hanya boleh melihat sub-SLS miliknya)
    if (session.role === 'pcl') {
      const tugas = await prisma.tugasPcl.findFirst({
        where: {
          idUser: session.userId,
          idSubsls: targetSubSlsId,
        },
      });
      if (!tugas) {
        return res.status(403).json({ error: 'Izin akses ditolak. Anda tidak ditugaskan di Sub-SLS ini' });
      }
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const alert = detectAlert(subsls, currentDate);

    const riwayat = subsls.laporan.map(r => ({
      id: r.id,
      tanggal: r.tanggal.toISOString().split('T')[0],
      jumlahSelesai: r.jumlahSelesai,
      status: r.status,
      keterangan: r.keterangan || '-',
      diinputOleh: r.user.nama,
    }));

    const totalMuatan = subsls.totalMuatanAssignment;
    const latestReport = subsls.laporan[0];
    const selesai = latestReport ? latestReport.jumlahSelesai : 0;
    const persentase = latestReport
      ? (totalMuatan > 0 ? (selesai / totalMuatan) * 100 : 100)
      : 0;

    let statusSub = 'belum_lapor';
    if (!latestReport) {
      statusSub = 'belum_lapor';
    } else if (totalMuatan === 0) {
      statusSub = latestReport.status;
    } else if (selesai >= totalMuatan) {
      statusSub = 'selesai';
    } else if (latestReport.status === 'tidak_selesai') {
      statusSub = 'tidak_selesai';
    } else {
      statusSub = 'progres';
    }

    return res.json({
      subsls: {
        id: subsls.id,
        kodeSubsls: subsls.kodeSubsls,
        idSubsls: subsls.idSubsls,
        idSubsls2025: subsls.idSubsls2025,
        namaKorlap: subsls.namaKorlap,
        namaPml: subsls.namaPml,
        namaPcl: subsls.namaPcl,
        totalMuatan,
        selesai,
        persentase,
        status: statusSub,
        sls: subsls.sls.namaSls,
        desa: subsls.sls.desa.namaDesa,
        kecamatan: subsls.sls.desa.kecamatan.namaKec,
        kecamatanId: kecId,
      },
      alert: alert ? {
        jenisAlert: alert.jenisAlert,
        tingkatKekritisan: alert.tingkatKekritisan,
        pesan: alert.pesan,
        hariGap: alert.hariGap,
        tanggalLaporTerakhir: alert.tanggalLaporTerakhir ? alert.tanggalLaporTerakhir.toISOString().split('T')[0] : null,
      } : null,
      riwayat,
    });

  } catch (error) {
    console.error('API dashboard Level 4 error:', error);
    return res.status(500).json({ error: 'Gagal memuat data rincian sub-SLS' });
  }
});

module.exports = router;
