// src/app/api/ews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { detectAlert } from '@/lib/ews';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const kecamatanIdStr = searchParams.get('kecamatanId');

  const where: any = {};
  
  // PCL tidak butuh memantau alert global, tapi jika PCL mengakses, dia hanya boleh melihat sub-SLS miliknya
  if (session.role === 'pcl') {
    where.tugasPcl = {
      some: {
        idUser: session.userId,
      },
    };
  } else if (session.role === 'pml' && session.idKecamatan) {
    // PML hanya bisa melihat alert di kecamatan miliknya
    where.sls = {
      desa: {
        idKecamatan: session.idKecamatan,
      },
    };
  } else if (kecamatanIdStr) {
    // Admin dan Korlap bisa memfilter berdasarkan kecamatanId query param
    const kecamatanId = parseInt(kecamatanIdStr);
    if (!isNaN(kecamatanId)) {
      where.sls = {
        desa: {
          idKecamatan: kecamatanId,
        },
      };
    }
  }

  try {
    const subSlsList = await prisma.subSls.findMany({
      where,
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

    const alerts: any[] = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const sub of subSlsList) {
      const alert = detectAlert(sub as any, currentDate);
      if (alert) {
        alerts.push({
          ...alert,
          kecamatan: sub.sls.desa.kecamatan.namaKec,
          desa: sub.sls.desa.namaDesa,
          sls: sub.sls.namaSls,
        });
      }
    }

    // Urutkan alerts berdasarkan kekritisan (kritis > perhatian > risiko)
    const severityWeight: Record<string, number> = { kritis: 3, perhatian: 2, risiko: 1 };
    alerts.sort((a, b) => (severityWeight[b.tingkatKekritisan] || 0) - (severityWeight[a.tingkatKekritisan] || 0));

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('API get EWS alerts error:', error);
    return NextResponse.json({ error: 'Gagal memuat data peringatan kendala' }, { status: 500 });
  }
}
