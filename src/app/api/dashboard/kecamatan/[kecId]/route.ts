// src/app/api/dashboard/kecamatan/[kecId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { detectAlert } from '@/lib/ews';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kecId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  const { kecId } = await params;
  const targetKecId = parseInt(kecId);

  if (isNaN(targetKecId)) {
    return NextResponse.json({ error: 'ID Kecamatan tidak valid' }, { status: 400 });
  }

  // Validasi Wilayah untuk PML
  if (session.role === 'pml' && session.idKecamatan !== targetKecId) {
    return NextResponse.json({ error: 'Izin akses ditolak untuk wilayah kecamatan ini' }, { status: 403 });
  }

  try {
    // 1. Ambil detail Kecamatan
    const kecamatan = await prisma.kecamatan.findUnique({
      where: { id: targetKecId },
    });

    if (!kecamatan) {
      return NextResponse.json({ error: 'Kecamatan tidak ditemukan' }, { status: 404 });
    }

    // 2. Ambil semua sub-SLS di kecamatan ini beserta laporan terakhir
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

    // 3. Agregasi data per SLS
    // Key: idSls (number)
    const slsStatsMap = new Map<number, {
      id: number;
      kodeSls: string;
      namaSls: string;
      desaNama: string;
      jumlahSubSls: number;
      totalMuatan: number;
      selesai: number;
      countSelesai: number;
      countProgres: number;
      countTidakSelesai: number;
      countBelumLapor: number;
      countAlert: number;
    }>();

    // Agregasi data per PML
    // Key: namaPml (string)
    const pmlStatsMap = new Map<string, {
      nama: string;
      korlap: string;
      totalSubSls: number;
      totalMuatan: number;
      selesai: number;
      countAlert: number;
    }>();

    let totalUsahaKec = 0;
    let usahaSelesaiKec = 0;
    let countSelesaiKecSub = 0;
    let countProgresKecSub = 0;
    let countTidakSelesaiKecSub = 0;
    let countBelumLaporKecSub = 0;
    
    const alerts: any[] = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const sub of subSlsList) {
      const totalMuatan = sub.totalMuatanAssignment;
      totalUsahaKec += totalMuatan;

      const latestReport = sub.laporan[0];
      const selesai = latestReport ? latestReport.jumlahSelesai : 0;
      usahaSelesaiKec += selesai;

      // Klasifikasi status sub-SLS
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

      // Deteksi Alert EWS
      const alert = detectAlert(sub as any, currentDate);
      if (alert) {
        alerts.push({
          ...alert,
          kecamatan: kecamatan.namaKec,
          desa: sub.sls.desa.namaDesa,
          sls: sub.sls.namaSls,
        });
      }

      // Agregasi per SLS
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
      const sStat = slsStatsMap.get(slsId)!;
      sStat.jumlahSubSls++;
      sStat.totalMuatan += totalMuatan;
      sStat.selesai += selesai;
      if (statusSub === 'selesai') sStat.countSelesai++;
      else if (statusSub === 'progres') sStat.countProgres++;
      else if (statusSub === 'tidak_selesai') sStat.countTidakSelesai++;
      else sStat.countBelumLapor++;
      if (alert) sStat.countAlert++;

      // Agregasi per PML
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
        const pml = pmlStatsMap.get(pmlName)!;
        pml.totalSubSls++;
        pml.totalMuatan += totalMuatan;
        pml.selesai += selesai;
        if (alert) pml.countAlert++;
      }
    }

    const slsList = Array.from(slsStatsMap.values()).sort((a, b) => a.kodeSls.localeCompare(b.kodeSls));
    const pmlList = Array.from(pmlStatsMap.values()).sort((a, b) => a.nama.localeCompare(b.nama));

    // Urutkan alerts
    const severityWeight: Record<string, number> = { kritis: 3, perhatian: 2, risiko: 1 };
    alerts.sort((a, b) => (severityWeight[b.tingkatKekritisan] || 0) - (severityWeight[a.tingkatKekritisan] || 0));

    return NextResponse.json({
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
    return NextResponse.json({ error: 'Gagal memuat data dashboard kecamatan' }, { status: 500 });
  }
}
