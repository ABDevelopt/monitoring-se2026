// src/app/api/dashboard/sls/[slsId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { detectAlert } from '@/lib/ews';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slsId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  const { slsId } = await params;
  const targetSlsId = parseInt(slsId);

  if (isNaN(targetSlsId)) {
    return NextResponse.json({ error: 'ID SLS tidak valid' }, { status: 400 });
  }

  try {
    // 1. Ambil detail SLS beserta letak administratifnya
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
      return NextResponse.json({ error: 'SLS tidak ditemukan' }, { status: 404 });
    }

    // Validasi Wilayah untuk PML
    if (session.role === 'pml' && session.idKecamatan !== sls.desa.idKecamatan) {
      return NextResponse.json({ error: 'Izin akses ditolak untuk wilayah SLS ini' }, { status: 403 });
    }

    // 2. Ambil semua sub-SLS di dalam SLS ini
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

    // Format detail per sub-SLS beserta status & alert EWS
    const subSlsDetails = subSlsList.map((sub) => {
      const totalMuatan = sub.totalMuatanAssignment;
      totalUsahaSls += totalMuatan;

      const latestReport = sub.laporan[0];
      const selesai = latestReport ? latestReport.jumlahSelesai : 0;
      usahaSelesaiSls += selesai;

      // Hitung persentase
      const persentase = latestReport
        ? (totalMuatan > 0 ? (selesai / totalMuatan) * 100 : 100)
        : 0;

      // Tentukan status
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

      // Deteksi EWS
      const alert = detectAlert(sub as any, currentDate);
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

    // 3. Return detail Level 3
    return NextResponse.json({
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
        progressPersen: totalUsahaSls > 0 ? (usahaSelesaiSls / totalUsahaSls) * 100 : 0,
        activeAlertsCount: countAlertSls,
      },
      subSlsList: subSlsDetails,
    });

  } catch (error) {
    console.error('API dashboard Level 3 error:', error);
    return NextResponse.json({ error: 'Gagal memuat data dashboard SLS' }, { status: 500 });
  }
}
