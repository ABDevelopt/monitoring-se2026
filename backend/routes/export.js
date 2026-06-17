// backend/routes/export.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../lib/auth');
const { detectAlert } = require('../lib/ews');
const { exportToExcel } = require('../lib/excel');

router.get('/', requireAuth, async (req, res) => {
  const session = req.session;
  if (session.role === 'pcl') return res.status(403).send('Izin ditolak');

  const { level, kecamatanId: kecamatanIdStr } = req.query;
  if (!level || !['subsls', 'sls', 'kecamatan', 'harian', 'ews'].includes(level)) {
    return res.status(400).send('Parameter level tidak valid');
  }

  const filterKecId = kecamatanIdStr ? parseInt(kecamatanIdStr) : null;
  let activeKecId = filterKecId;
  if (session.role === 'pml' && session.idKecamatan) activeKecId = session.idKecamatan;

  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const dateStr = currentDate.toISOString().split('T')[0];
    const filename = `rekap-se2026-ppu-${level}-${dateStr}.xlsx`;

    let excelBuffer;

    if (level === 'subsls') {
      const subSlsList = await prisma.subSls.findMany({
        where: activeKecId ? { sls: { desa: { idKecamatan: activeKecId } } } : {},
        include: { laporan: { orderBy: { tanggal: 'desc' }, take: 1 }, sls: { include: { desa: { include: { kecamatan: true } } } } },
      });

      const formattedData = subSlsList.map((sub, idx) => {
        const latestReport = sub.laporan[0];
        const selesai = latestReport ? latestReport.jumlahSelesai : 0;
        const total = sub.totalMuatanAssignment;
        const persentase = total > 0 ? (selesai / total) * 100 : 100;
        let statusSub = 'Belum Lapor';
        if (total === 0) statusSub = 'Selesai';
        else if (latestReport) {
          if (selesai === total) statusSub = 'Selesai';
          else if (latestReport.status === 'tidak_selesai') statusSub = 'Tidak Selesai';
          else statusSub = 'Selesai Sebagian';
        }
        return {
          no: idx + 1, kecamatan: sub.sls.desa.kecamatan.namaKec,
          desa: sub.sls.desa.namaDesa, sls: sub.sls.namaSls,
          idSubSls: sub.idSubsls, korlap: sub.namaKorlap || '-',
          pml: sub.namaPml || '-', pcl: sub.namaPcl || '-',
          totalMuatan: total, selesai, persentase, statusTerakhir: statusSub,
          tglLaporTerakhir: latestReport ? new Date(latestReport.tanggal).toISOString().split('T')[0] : '-',
          keterangan: latestReport?.keterangan || '-',
        };
      });
      excelBuffer = await exportToExcel('subsls', formattedData);
    }
    else if (level === 'sls') {
      const slsList = await prisma.sls.findMany({
        where: activeKecId ? { desa: { idKecamatan: activeKecId } } : {},
        include: { desa: { include: { kecamatan: true } }, subsls: { include: { laporan: { orderBy: { tanggal: 'desc' }, take: 1 } } } },
      });
      const formattedData = slsList.map((sls, idx) => {
        let totalMuatan = 0, selesai = 0, countSelesai = 0, countProgres = 0, countTidakSelesai = 0, countBelumLapor = 0;
        for (const sub of sls.subsls) {
          const muatan = sub.totalMuatanAssignment;
          totalMuatan += muatan;
          const latestReport = sub.laporan[0];
          const subSelesai = latestReport ? latestReport.jumlahSelesai : 0;
          selesai += subSelesai;
          if (!latestReport) countBelumLapor++;
          else if (muatan === 0) { if (latestReport.status === 'selesai') countSelesai++; else if (latestReport.status === 'tidak_selesai') countTidakSelesai++; else countProgres++; }
          else if (subSelesai === muatan) countSelesai++;
          else if (latestReport.status === 'tidak_selesai') countTidakSelesai++;
          else countProgres++;
        }
        return {
          no: idx + 1, kecamatan: sls.desa.kecamatan.namaKec, desa: sls.desa.namaDesa, sls: sls.namaSls,
          jumlahSubSls: sls.subsls.length, totalMuatan, selesai, progres: countProgres,
          tidakSelesai: countTidakSelesai, belumLapor: countBelumLapor,
          persentaseSubSls: sls.subsls.length > 0 ? (countSelesai / sls.subsls.length) * 100 : 0,
          persentaseUsaha: totalMuatan > 0 ? (selesai / totalMuatan) * 100 : 100,
        };
      });
      excelBuffer = await exportToExcel('sls', formattedData);
    }
    else if (level === 'kecamatan') {
      const kecList = await prisma.kecamatan.findMany({
        where: activeKecId ? { id: activeKecId } : {},
        include: { desa: { include: { sls: { include: { subsls: { include: { laporan: { orderBy: { tanggal: 'desc' }, take: 1 } } } } } } } },
      });
      const formattedData = [];
      let idx = 1;
      for (const kec of kecList) {
        let totalSls = 0, totalSubSls = 0, totalMuatan = 0, totalSelesai = 0;
        let countSelesai = 0, countProgres = 0, countTidakSelesai = 0, countBelumLapor = 0;
        const korlaps = new Set(), pmls = new Set(), pcls = new Set();
        for (const desa of kec.desa) {
          totalSls += desa.sls.length;
          for (const sls of desa.sls) {
            totalSubSls += sls.subsls.length;
            for (const sub of sls.subsls) {
              const muatan = sub.totalMuatanAssignment;
              totalMuatan += muatan;
              if (sub.namaKorlap) korlaps.add(sub.namaKorlap);
              if (sub.namaPml) pmls.add(sub.namaPml);
              if (sub.namaPcl) pcls.add(sub.namaPcl);
              const latestReport = sub.laporan[0];
              const subSelesai = latestReport ? latestReport.jumlahSelesai : 0;
              totalSelesai += subSelesai;
              if (!latestReport) countBelumLapor++;
              else if (muatan === 0) { if (latestReport.status === 'selesai') countSelesai++; else if (latestReport.status === 'tidak_selesai') countTidakSelesai++; else countProgres++; }
              else if (subSelesai === muatan) countSelesai++;
              else if (latestReport.status === 'tidak_selesai') countTidakSelesai++;
              else countProgres++;
            }
          }
        }
        formattedData.push({
          no: idx++, kecamatan: kec.namaKec, totalSls, totalSubSls, totalMuatan,
          subSlsSelesai: countSelesai, subSlsProgres: countProgres, subSlsTdkSelesai: countTidakSelesai,
          belumLapor: countBelumLapor, usahaSelesai: totalSelesai,
          persentaseUsaha: totalMuatan > 0 ? (totalSelesai / totalMuatan) * 100 : 100,
          jumlahKorlap: korlaps.size, jumlahPml: pmls.size, jumlahPcl: pcls.size,
        });
      }
      excelBuffer = await exportToExcel('kecamatan', formattedData);
    }
    else if (level === 'harian') {
      const reports = await prisma.laporan.findMany({
        where: activeKecId ? { subsls: { sls: { desa: { idKecamatan: activeKecId } } } } : {},
        include: { subsls: { include: { sls: { include: { desa: { include: { kecamatan: true } } } } } } },
        orderBy: { tanggal: 'desc' },
      });
      const formattedData = reports.map((r, idx) => ({
        no: idx + 1, tanggal: new Date(r.tanggal).toISOString().split('T')[0],
        kecamatan: r.subsls.sls.desa.kecamatan.namaKec, desa: r.subsls.sls.desa.namaDesa,
        sls: r.subsls.sls.namaSls, subSls: r.subsls.idSubsls,
        korlap: r.subsls.namaKorlap || '-', pml: r.subsls.namaPml || '-', pcl: r.subsls.namaPcl || '-',
        totalMuatan: r.subsls.totalMuatanAssignment, selesai: r.jumlahSelesai,
        status: r.status === 'selesai' ? 'Selesai' : r.status === 'progres' ? 'Selesai Sebagian' : 'Tidak Selesai',
        keterangan: r.keterangan || '-',
      }));
      excelBuffer = await exportToExcel('harian', formattedData);
    }
    else {
      const subSlsList = await prisma.subSls.findMany({
        where: activeKecId ? { sls: { desa: { idKecamatan: activeKecId } } } : {},
        include: { laporan: { orderBy: { tanggal: 'desc' }, take: 3 }, sls: { include: { desa: { include: { kecamatan: true } } } } },
      });
      const alertsData = [];
      let idx = 1;
      for (const sub of subSlsList) {
        const alert = detectAlert(sub, currentDate);
        if (alert) {
          alertsData.push({
            no: idx++, namaPcl: sub.namaPcl || '-', namaPml: sub.namaPml || '-',
            namaKorlap: sub.namaKorlap || '-', kecamatan: sub.sls.desa.kecamatan.namaKec,
            subSls: sub.idSubsls, totalMuatan: sub.totalMuatanAssignment, selesai: alert.selesai,
            persentase: alert.persentase,
            tglLaporTerakhir: alert.tanggalLaporTerakhir ? new Date(alert.tanggalLaporTerakhir).toISOString().split('T')[0] : 'Belum Pernah',
            hariGap: alert.hariGap || 0,
            jenisAlert: alert.jenisAlert === 'tidak_aktif' ? 'Tidak Aktif' : alert.jenisAlert === 'stagnan' ? 'Stagnan' : alert.jenisAlert === 'bermasalah' ? 'Bermasalah' : 'Risiko Tidak Selesai',
          });
        }
      }
      excelBuffer = await exportToExcel('ews', alertsData);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(excelBuffer);
  } catch (error) {
    console.error('API export error:', error);
    return res.status(500).send('Gagal melakukan ekspor data');
  }
});

module.exports = router;
