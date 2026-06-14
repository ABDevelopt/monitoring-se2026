// src/app/api/dashboard/subsls/[subslsId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { detectAlert } from '@/lib/ews';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subslsId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  const { subslsId } = await params;
  const targetSubSlsId = parseInt(subslsId);

  if (isNaN(targetSubSlsId)) {
    return NextResponse.json({ error: 'ID Sub-SLS tidak valid' }, { status: 400 });
  }

  try {
    // 1. Ambil detail Sub-SLS lengkap dengan SLS, Desa, Kecamatan
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
      return NextResponse.json({ error: 'Sub-SLS tidak ditemukan' }, { status: 404 });
    }

    const kecId = subsls.sls.desa.idKecamatan;

    // Validasi Wilayah untuk PML
    if (session.role === 'pml' && session.idKecamatan !== kecId) {
      return NextResponse.json({ error: 'Izin akses ditolak untuk wilayah Sub-SLS ini' }, { status: 403 });
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
        return NextResponse.json({ error: 'Izin akses ditolak. Anda tidak ditugaskan di Sub-SLS ini' }, { status: 403 });
      }
    }

    // 2. Deteksi Alert EWS
    // Dapatkan historical 3 reports untuk detectAlert (subsls.laporan sudah memuat semua laporan)
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const alert = detectAlert(subsls as any, currentDate);

    // 3. Format riwayat laporan harian
    const riwayat = subsls.laporan.map(r => ({
      id: r.id,
      tanggal: r.tanggal.toISOString().split('T')[0],
      jumlahSelesai: r.jumlahSelesai,
      status: r.status,
      keterangan: r.keterangan || '-',
      diinputOleh: r.user.nama,
    }));

    // 4. Hitung persentase progress saat ini
    const totalMuatan = subsls.totalMuatanAssignment;
    const latestReport = subsls.laporan[0];
    const selesai = latestReport ? latestReport.jumlahSelesai : 0;
    const persentase = latestReport
      ? (totalMuatan > 0 ? (selesai / totalMuatan) * 100 : 100)
      : 0;

    // Tentukan status saat ini
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

    return NextResponse.json({
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
    return NextResponse.json({ error: 'Gagal memuat data rincian sub-SLS' }, { status: 500 });
  }
}
