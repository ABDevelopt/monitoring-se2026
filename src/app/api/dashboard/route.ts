// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { detectAlert } from '@/lib/ews';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    // 1. Tentukan filter berdasarkan role
    const whereClause: any = {};
    if (session.role === 'pcl') {
      whereClause.tugasPcl = {
        some: {
          idUser: session.userId,
        },
      };
    } else if (session.role === 'pml' && session.idKecamatan) {
      whereClause.sls = {
        desa: {
          idKecamatan: session.idKecamatan,
        },
      };
    }

    // Ambil sub-SLS yang relevan beserta 3 laporan terakhir (untuk hitung progress & EWS)
    const subSlsList = await prisma.subSls.findMany({
      where: whereClause,
      include: {
        laporan: {
          orderBy: { tanggal: 'desc' },
          take: 3,
        },
        sls: {
          include: {
            desa: {
              include: {
                kecamatan: true,
              },
            },
          },
        },
      },
    });

    // 2. Hitung statistik dasar Kabupaten
    let totalUsahaKab = 0;
    let usahaSelesaiKab = 0;
    let countSelesaiSub = 0;
    let countProgresSub = 0;
    let countTidakSelesaiSub = 0;
    let countBelumLaporSub = 0;
    
    const alerts: any[] = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Map untuk group by Kecamatan dan Korlap
    const kecStats = new Map<string, {
      id: number;
      kode: string;
      nama: string;
      totalSubSls: number;
      totalMuatan: number;
      selesai: number;
      countSelesai: number;
      countProgres: number;
      countTidakSelesai: number;
      countBelumLapor: number;
      countAlert: number;
    }>();

    const korlapStats = new Map<string, {
      nama: string;
      kecamatanList: Set<string>;
      totalSubSls: number;
      totalMuatan: number;
      selesai: number;
      countAlert: number;
    }>();

    const pmlStats = new Map<string, {
      nama: string;
      korlap: string;
      totalSubSls: number;
      totalMuatan: number;
      selesai: number;
      countAlert: number;
    }>();

    // Loop data untuk agregasi
    for (const sub of subSlsList) {
      const totalMuatan = sub.totalMuatanAssignment;
      totalUsahaKab += totalMuatan;

      const latestReport = sub.laporan[0];
      const selesai = latestReport ? latestReport.jumlahSelesai : 0;
      usahaSelesaiKab += selesai;

      // Klasifikasi status sub-SLS
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
        statusSub = 'selesai';
        countSelesaiSub++;
      } else if (latestReport.status === 'tidak_selesai') {
        statusSub = 'tidak_selesai';
        countTidakSelesaiSub++;
      } else {
        statusSub = 'progres';
        countProgresSub++;
      }

      // Deteksi Alert EWS
      const alert = detectAlert(sub as any, currentDate);
      if (alert) {
        alerts.push({
          ...alert,
          kecamatan: sub.sls.desa.kecamatan.namaKec,
          desa: sub.sls.desa.namaDesa,
          sls: sub.sls.namaSls,
        });
      }

      // Agregasi per Kecamatan
      const kec = sub.sls.desa.kecamatan;
      if (!kecStats.has(kec.namaKec)) {
        kecStats.set(kec.namaKec, {
          id: kec.id,
          kode: kec.kodeKec,
          nama: kec.namaKec,
          totalSubSls: 0,
          totalMuatan: 0,
          selesai: 0,
          countSelesai: 0,
          countProgres: 0,
          countTidakSelesai: 0,
          countBelumLapor: 0,
          countAlert: 0,
        });
      }
      const kStat = kecStats.get(kec.namaKec)!;
      kStat.totalSubSls++;
      kStat.totalMuatan += totalMuatan;
      kStat.selesai += selesai;
      if (statusSub === 'selesai') kStat.countSelesai++;
      else if (statusSub === 'progres') kStat.countProgres++;
      else if (statusSub === 'tidak_selesai') kStat.countTidakSelesai++;
      else kStat.countBelumLapor++;
      if (alert) kStat.countAlert++;

      // Agregasi per Korlap
      const korlapName = sub.namaKorlap;
      if (korlapName) {
        if (!korlapStats.has(korlapName)) {
          korlapStats.set(korlapName, {
            nama: korlapName,
            kecamatanList: new Set(),
            totalSubSls: 0,
            totalMuatan: 0,
            selesai: 0,
            countAlert: 0,
          });
        }
        const korlap = korlapStats.get(korlapName)!;
        korlap.kecamatanList.add(kec.namaKec);
        korlap.totalSubSls++;
        korlap.totalMuatan += totalMuatan;
        korlap.selesai += selesai;
        if (alert) korlap.countAlert++;
      }

      // Agregasi per PML
      const pmlName = sub.namaPml;
      if (pmlName) {
        if (!pmlStats.has(pmlName)) {
          pmlStats.set(pmlName, {
            nama: pmlName,
            korlap: sub.namaKorlap || '-',
            totalSubSls: 0,
            totalMuatan: 0,
            selesai: 0,
            countAlert: 0,
          });
        }
        const pml = pmlStats.get(pmlName)!;
        pml.totalSubSls++;
        pml.totalMuatan += totalMuatan;
        pml.selesai += selesai;
        if (alert) pml.countAlert++;
      }
    }

    // Urutkan alerts berdasarkan kekritisan (kritis > perhatian > risiko)
    const severityWeight: Record<string, number> = { kritis: 3, perhatian: 2, risiko: 1 };
    alerts.sort((a, b) => (severityWeight[b.tingkatKekritisan] || 0) - (severityWeight[a.tingkatKekritisan] || 0));

    // Format output untuk list kecamatan & korlap
    const kecamatanList = Array.from(kecStats.values()).sort((a, b) => a.kode.localeCompare(b.kode));
    const korlapList = Array.from(korlapStats.values()).map(k => ({
      ...k,
      kecamatan: Array.from(k.kecamatanList).join(', '),
    })).sort((a, b) => a.nama.localeCompare(b.nama));
    const pmlList = Array.from(pmlStats.values()).sort((a, b) => a.nama.localeCompare(b.nama));

    // 3. Ambil data trend harian (7 hari terakhir)
    const trendDays: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - i);
      trendDays.push(d.toISOString().split('T')[0]);
    }

    const startTrend = new Date(trendDays[0]);
    const endTrend = new Date(trendDays[trendDays.length - 1]);
    endTrend.setDate(endTrend.getDate() + 1); // Tambah 1 hari untuk range query

    const reportsTrend = await prisma.laporan.findMany({
      where: {
        tanggal: {
          gte: startTrend,
          lt: endTrend,
        },
      },
      select: {
        tanggal: true,
        jumlahSelesai: true,
        status: true,
      },
    });

    // Agregasi trend harian
    const trendMap = new Map<string, { selesai: number; progres: number; tidakSelesai: number }>();
    trendDays.forEach(day => trendMap.set(day, { selesai: 0, progres: 0, tidakSelesai: 0 }));

    for (const r of reportsTrend) {
      const dateKey = r.tanggal.toISOString().split('T')[0];
      if (trendMap.has(dateKey)) {
        const counts = trendMap.get(dateKey)!;
        if (r.status === 'selesai') counts.selesai += r.jumlahSelesai;
        else if (r.status === 'progres') counts.progres += r.jumlahSelesai;
        else counts.tidakSelesai += r.jumlahSelesai;
      }
    }

    const trendData = trendDays.map(day => {
      const counts = trendMap.get(day)!;
      return {
        tanggal: day,
        ...counts,
        totalSelesai: counts.selesai + counts.progres + counts.tidakSelesai,
      };
    });

    // 4. Return data utuh Level 1
    return NextResponse.json({
      summary: {
        totalUsaha: totalUsahaKab,
        usahaSelesai: usahaSelesaiKab,
        progressPersen: totalUsahaKab > 0 
          ? (usahaSelesaiKab / totalUsahaKab) * 100 
          : (subSlsList.length > 0 
              ? ((countSelesaiSub * 100 + countProgresSub * 50) / subSlsList.length) 
              : 0),
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

        const persentase = latestReport
          ? (totalMuatan > 0 
              ? (selesai / totalMuatan) * 100 
              : (latestReport.status === 'selesai' ? 100 : (latestReport.status === 'tidak_selesai' ? 0 : 50)))
          : 0;

        return {
          id: sub.id,
          idSubsls: sub.idSubsls,
          idSubSls: sub.idSubsls,
          namaSls: sub.sls.namaSls,
          desaNama: sub.sls.desa.namaDesa,
          totalMuatan: totalMuatan,
          selesai: selesai,
          persentase: persentase,
          status: statusSub,
          namaPcl: sub.namaPcl,
          namaPml: sub.namaPml,
          namaKorlap: sub.namaKorlap,
        };
      }) : kecamatanList,
      korlapList,
      pmlList,
      trendData,
      topAlerts: alerts.slice(0, 5), // Kirim top 5 saja untuk ringkasan EWS
    });

  } catch (error) {
    console.error('API dashboard Level 1 error:', error);
    return NextResponse.json({ error: 'Gagal memuat data dashboard' }, { status: 500 });
  }
}
