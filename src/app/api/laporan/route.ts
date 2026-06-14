// src/app/api/laporan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const tanggalStr = searchParams.get('tanggal');
  const kecamatanIdStr = searchParams.get('kecamatanId');
  const status = searchParams.get('status');

  const where: any = {};
  
  if (tanggalStr) {
    // Pastikan tanggal hanya membandingkan YYYY-MM-DD
    const date = new Date(tanggalStr);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    where.tanggal = {
      gte: date,
      lt: nextDate,
    };
  }

  if (status) {
    where.status = status;
  }

  // Filter wilayah berdasarkan role
  if (session.role === 'pcl') {
    // PCL hanya bisa melihat laporan miliknya sendiri
    where.idUser = session.userId;
  } else if (session.role === 'pml' && session.idKecamatan) {
    // PML hanya bisa melihat laporan di kecamatan pengawasannya
    where.subsls = {
      sls: {
        desa: {
          idKecamatan: session.idKecamatan,
        },
      },
    };
  }

  // Tambahan filter dari query params (khusus korlap / admin)
  if (kecamatanIdStr && (session.role === 'admin' || session.role === 'korlap')) {
    const kecamatanId = parseInt(kecamatanIdStr);
    if (!isNaN(kecamatanId)) {
      where.subsls = {
        sls: {
          desa: {
            idKecamatan: kecamatanId,
          },
        },
      };
    }
  }

  try {
    const laporan = await prisma.laporan.findMany({
      where,
      include: {
        subsls: {
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
          },
        },
        user: {
          select: {
            nama: true,
            role: true,
          },
        },
      },
      orderBy: { tanggal: 'desc' },
    });
    return NextResponse.json(laporan);
  } catch (error) {
    console.error('API get laporan error:', error);
    return NextResponse.json({ error: 'Gagal memuat data laporan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  if (session.role === 'pcl') {
    return NextResponse.json({ error: 'Akses ditolak: PCL tidak diizinkan untuk menginput/mengedit laporan' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id: idStr, tanggal: tanggalStr, idSubSls, jumlahSelesai, status, keterangan } = body;

    if (!tanggalStr || !idSubSls || jumlahSelesai === undefined || !status) {
      return NextResponse.json({ error: 'Input tidak lengkap' }, { status: 400 });
    }

    const id = idStr ? parseInt(idStr) : undefined;
    const subSlsId = parseInt(idSubSls);
    const selesaiCount = parseInt(jumlahSelesai);
    const parsedDate = new Date(tanggalStr);
    parsedDate.setHours(0, 0, 0, 0);

    if ((id !== undefined && isNaN(id)) || isNaN(subSlsId) || isNaN(selesaiCount)) {
      return NextResponse.json({ error: 'Data numerik tidak valid' }, { status: 400 });
    }

    // 1. Ambil info sub-SLS untuk validasi total muatan
    const subSls = await prisma.subSls.findUnique({
      where: { id: subSlsId },
    });

    if (!subSls) {
      return NextResponse.json({ error: 'Sub-SLS tidak ditemukan' }, { status: 404 });
    }

    // 2. Validasi Hak Akses input data / edit data
    if (id !== undefined) {
      const existingLaporan = await prisma.laporan.findUnique({
        where: { id },
        include: {
          subsls: {
            include: {
              sls: {
                include: {
                  desa: true,
                },
              },
            },
          },
        },
      });

      if (!existingLaporan) {
        return NextResponse.json({ error: 'Laporan yang ingin diedit tidak ditemukan' }, { status: 404 });
      }

      if (session.role === 'pml' && session.idKecamatan) {
        if (existingLaporan.subsls.sls.desa.idKecamatan !== session.idKecamatan) {
          return NextResponse.json({ error: 'Laporan berada di luar kecamatan pengawasan Anda' }, { status: 403 });
        }
      }
    } else {
      // Validasi input baru
      if (session.role === 'pml' && session.idKecamatan) {
        const subSlsKec = await prisma.subSls.findFirst({
          where: {
            id: subSlsId,
            sls: {
              desa: {
                idKecamatan: session.idKecamatan,
              },
            },
          },
        });
        if (!subSlsKec) {
          return NextResponse.json({ error: 'Wilayah sub-SLS berada di luar kecamatan pengawasan Anda' }, { status: 403 });
        }
      }
    }

    // 3. Save / Update data
    let result;
    if (id !== undefined) {
      // Check duplicate constraint (date + subsls)
      const duplicate = await prisma.laporan.findFirst({
        where: {
          tanggal: parsedDate,
          idSubsls: subSlsId,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Laporan untuk Sub-SLS pada tanggal tersebut sudah ada' }, { status: 400 });
      }

      result = await prisma.laporan.update({
        where: { id },
        data: {
          tanggal: parsedDate,
          idSubsls: subSlsId,
          jumlahAssignment: subSls.totalMuatanAssignment,
          jumlahSelesai: selesaiCount,
          status,
          keterangan: status === 'tidak_selesai' ? keterangan : null,
        },
      });
    } else {
      result = await prisma.laporan.upsert({
        where: {
          tanggal_idSubsls: {
            tanggal: parsedDate,
            idSubsls: subSlsId,
          },
        },
        update: {
          jumlahAssignment: subSls.totalMuatanAssignment,
          jumlahSelesai: selesaiCount,
          status,
          keterangan: status === 'tidak_selesai' ? keterangan : null,
          idUser: session.userId,
        },
        create: {
          tanggal: parsedDate,
          idSubsls: subSlsId,
          jumlahAssignment: subSls.totalMuatanAssignment,
          jumlahSelesai: selesaiCount,
          status,
          keterangan: status === 'tidak_selesai' ? keterangan : null,
          idUser: session.userId,
        },
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API post laporan error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan laporan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  if (session.role === 'pcl') {
    return NextResponse.json({ error: 'Akses ditolak: PCL tidak diizinkan untuk menghapus laporan' }, { status: 403 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json({ error: 'ID laporan tidak valid' }, { status: 400 });
    }

    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID laporan harus berupa angka' }, { status: 400 });
    }

    // 1. Fetch laporan to check authorization
    const laporan = await prisma.laporan.findUnique({
      where: { id },
      include: {
        subsls: {
          include: {
            sls: {
              include: {
                desa: true,
              },
            },
          },
        },
      },
    });

    if (!laporan) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    // 2. Validate authorization
    if (session.role === 'pml' && session.idKecamatan) {
      if (laporan.subsls.sls.desa.idKecamatan !== session.idKecamatan) {
        return NextResponse.json({ error: 'Laporan di luar wilayah pengawasan Anda' }, { status: 403 });
      }
    }

    // 3. Delete report
    await prisma.laporan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API delete laporan error:', error);
    return NextResponse.json({ error: 'Gagal menghapus laporan' }, { status: 500 });
  }
}
