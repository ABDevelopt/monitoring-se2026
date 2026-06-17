// backend/routes/laporan.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../lib/auth');

// GET /api/laporan
router.get('/', requireAuth, async (req, res) => {
  const session = req.session;
  const { tanggal: tanggalStr, kecamatanId: kecamatanIdStr, status } = req.query;

  const where = {};

  if (tanggalStr) {
    const date = new Date(tanggalStr);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    where.tanggal = { gte: date, lt: nextDate };
  }

  if (status) where.status = status;

  if (session.role === 'pcl') {
    where.idUser = session.userId;
  } else if (session.role === 'pml' && session.idKecamatan) {
    where.subsls = { sls: { desa: { idKecamatan: session.idKecamatan } } };
  }

  if (kecamatanIdStr && (session.role === 'admin' || session.role === 'korlap')) {
    const kecamatanId = parseInt(kecamatanIdStr);
    if (!isNaN(kecamatanId)) {
      where.subsls = { sls: { desa: { idKecamatan: kecamatanId } } };
    }
  }

  try {
    const laporan = await prisma.laporan.findMany({
      where,
      include: {
        subsls: { include: { sls: { include: { desa: { include: { kecamatan: true } } } } } },
        user: { select: { nama: true, role: true } },
      },
      orderBy: { tanggal: 'desc' },
    });
    return res.json(laporan);
  } catch (error) {
    console.error('API get laporan error:', error);
    return res.status(500).json({ error: 'Gagal memuat data laporan' });
  }
});

// POST /api/laporan
router.post('/', requireAuth, async (req, res) => {
  const session = req.session;

  if (session.role === 'pcl') {
    return res.status(403).json({ error: 'Akses ditolak: PCL tidak diizinkan untuk menginput/mengedit laporan' });
  }

  try {
    const { id: idStr, tanggal: tanggalStr, idSubSls, jumlahSelesai, status, keterangan } = req.body;

    if (!tanggalStr || !idSubSls || jumlahSelesai === undefined || !status) {
      return res.status(400).json({ error: 'Input tidak lengkap' });
    }

    const id = idStr ? parseInt(idStr) : undefined;
    const subSlsId = parseInt(idSubSls);
    const selesaiCount = parseInt(jumlahSelesai);
    const parsedDate = new Date(tanggalStr);
    parsedDate.setHours(0, 0, 0, 0);

    if ((id !== undefined && isNaN(id)) || isNaN(subSlsId) || isNaN(selesaiCount)) {
      return res.status(400).json({ error: 'Data numerik tidak valid' });
    }

    const subSls = await prisma.subSls.findUnique({ where: { id: subSlsId } });
    if (!subSls) return res.status(404).json({ error: 'Sub-SLS tidak ditemukan' });

    if (id !== undefined) {
      const existingLaporan = await prisma.laporan.findUnique({
        where: { id },
        include: { subsls: { include: { sls: { include: { desa: true } } } } },
      });
      if (!existingLaporan) return res.status(404).json({ error: 'Laporan yang ingin diedit tidak ditemukan' });

      if (session.role === 'pml' && session.idKecamatan) {
        if (existingLaporan.subsls.sls.desa.idKecamatan !== session.idKecamatan) {
          return res.status(403).json({ error: 'Laporan berada di luar kecamatan pengawasan Anda' });
        }
      }
    } else {
      if (session.role === 'pml' && session.idKecamatan) {
        const subSlsKec = await prisma.subSls.findFirst({
          where: { id: subSlsId, sls: { desa: { idKecamatan: session.idKecamatan } } },
        });
        if (!subSlsKec) return res.status(403).json({ error: 'Wilayah sub-SLS berada di luar kecamatan pengawasan Anda' });
      }
    }

    let result;
    if (id !== undefined) {
      const duplicate = await prisma.laporan.findFirst({
        where: { tanggal: parsedDate, idSubsls: subSlsId, id: { not: id } },
      });
      if (duplicate) return res.status(400).json({ error: 'Laporan untuk Sub-SLS pada tanggal tersebut sudah ada' });

      result = await prisma.laporan.update({
        where: { id },
        data: {
          tanggal: parsedDate, idSubsls: subSlsId,
          jumlahAssignment: subSls.totalMuatanAssignment,
          jumlahSelesai: selesaiCount, status,
          keterangan: status === 'tidak_selesai' ? keterangan : null,
        },
      });
    } else {
      result = await prisma.laporan.upsert({
        where: { tanggal_idSubsls: { tanggal: parsedDate, idSubsls: subSlsId } },
        update: {
          jumlahAssignment: subSls.totalMuatanAssignment,
          jumlahSelesai: selesaiCount, status,
          keterangan: status === 'tidak_selesai' ? keterangan : null,
          idUser: session.userId,
        },
        create: {
          tanggal: parsedDate, idSubsls: subSlsId,
          jumlahAssignment: subSls.totalMuatanAssignment,
          jumlahSelesai: selesaiCount, status,
          keterangan: status === 'tidak_selesai' ? keterangan : null,
          idUser: session.userId,
        },
      });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('API post laporan error:', error);
    return res.status(500).json({ error: 'Gagal menyimpan laporan' });
  }
});

// DELETE /api/laporan?id=...
router.delete('/', requireAuth, async (req, res) => {
  const session = req.session;

  if (session.role === 'pcl') {
    return res.status(403).json({ error: 'Akses ditolak: PCL tidak diizinkan untuk menghapus laporan' });
  }

  const id = parseInt(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID laporan harus berupa angka' });

  try {
    const laporan = await prisma.laporan.findUnique({
      where: { id },
      include: { subsls: { include: { sls: { include: { desa: true } } } } },
    });

    if (!laporan) return res.status(404).json({ error: 'Laporan tidak ditemukan' });

    if (session.role === 'pml' && session.idKecamatan) {
      if (laporan.subsls.sls.desa.idKecamatan !== session.idKecamatan) {
        return res.status(403).json({ error: 'Laporan di luar wilayah pengawasan Anda' });
      }
    }

    await prisma.laporan.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('API delete laporan error:', error);
    return res.status(500).json({ error: 'Gagal menghapus laporan' });
  }
});

module.exports = router;
