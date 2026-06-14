import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function verifyAdmin() {
  const session = await getSession();
  return session && session.role === 'admin';
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const idSlsStr = searchParams.get('idSls');
    const search = searchParams.get('search');
    const getUsers = searchParams.get('getUsers');

    if (getUsers === 'true') {
      const activeUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          nama: true,
          username: true,
          role: true,
        },
        orderBy: { nama: 'asc' },
      });
      
      const pcls = activeUsers.filter((u) => u.role === 'pcl');
      const pmls = activeUsers.filter((u) => u.role === 'pml');
      const korlaps = activeUsers.filter((u) => u.role === 'korlap');

      return NextResponse.json({ pcls, pmls, korlaps });
    }

    const where: any = {};
    if (idSlsStr) {
      const parsedSlsId = parseInt(idSlsStr);
      if (!isNaN(parsedSlsId)) {
        where.idSls = parsedSlsId;
      }
    }
    if (search) {
      where.OR = [
        { kodeSubsls: { contains: search } },
        { idSubsls: { contains: search } },
        { idSubsls2025: { contains: search } },
        { namaPcl: { contains: search } },
        { namaPml: { contains: search } },
        { namaKorlap: { contains: search } },
      ];
    }

    const subSlsList = await prisma.subSls.findMany({
      where,
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
        tugasPcl: {
          select: {
            idUser: true,
          },
        },
      },
      orderBy: { idSubsls: 'asc' },
      take: 200, // batasi hasil agar tidak lemot jika database sangat besar
    });
    return NextResponse.json(subSlsList);
  } catch (error) {
    console.error('GET Sub-SLS error:', error);
    return NextResponse.json({ error: 'Gagal memuat data Sub-SLS' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      idSls,
      kodeSubsls,
      idSubsls,
      idSubsls2025,
      namaKorlap,
      namaPml,
      namaPcl,
      totalMuatanAssignment,
      idPcl,
      idPml,
      idKorlap,
    } = body;

    if (!idSls || !kodeSubsls || !idSubsls || totalMuatanAssignment === undefined) {
      return NextResponse.json({ error: 'Input tidak lengkap' }, { status: 400 });
    }

    const slsId = parseInt(idSls);
    const muatan = parseInt(totalMuatanAssignment);

    if (isNaN(slsId) || isNaN(muatan)) {
      return NextResponse.json({ error: 'Data numerik tidak valid' }, { status: 400 });
    }

    // Cek duplikasi idSubsls BPS
    const existing = await prisma.subSls.findUnique({
      where: { idSubsls },
    });

    if (existing) {
      return NextResponse.json({ error: 'Sub-SLS dengan ID tersebut sudah terdaftar' }, { status: 400 });
    }

    let finalNamaPcl = namaPcl || '';
    let finalNamaPml = namaPml || '';
    let finalNamaKorlap = namaKorlap || '';

    // If ID values are passed, fetch real names
    if (idPcl) {
      const u = await prisma.user.findFirst({ where: { id: parseInt(idPcl), role: 'pcl' } });
      if (u) finalNamaPcl = u.nama;
    }
    if (idPml) {
      const u = await prisma.user.findFirst({ where: { id: parseInt(idPml), role: 'pml' } });
      if (u) finalNamaPml = u.nama;
    }
    if (idKorlap) {
      const u = await prisma.user.findFirst({ where: { id: parseInt(idKorlap), role: 'korlap' } });
      if (u) finalNamaKorlap = u.nama;
    }

    const result = await prisma.subSls.create({
      data: {
        idSls: slsId,
        kodeSubsls,
        idSubsls,
        idSubsls2025: idSubsls2025 || null,
        namaKorlap: finalNamaKorlap,
        namaPml: finalNamaPml,
        namaPcl: finalNamaPcl,
        totalMuatanAssignment: muatan,
      },
    });

    // Create TugasPcl mapping if PCL user is allocated
    if (idPcl) {
      const parsedPclId = parseInt(idPcl);
      if (!isNaN(parsedPclId)) {
        await prisma.tugasPcl.create({
          data: {
            idUser: parsedPclId,
            idSubsls: result.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('POST Sub-SLS error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan Sub-SLS' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      idSls,
      kodeSubsls,
      idSubsls,
      idSubsls2025,
      namaKorlap,
      namaPml,
      namaPcl,
      totalMuatanAssignment,
      idPcl,
      idPml,
      idKorlap,
      isAllocationOnly,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const subSlsId = parseInt(id);
    if (isNaN(subSlsId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    if (isAllocationOnly) {
      const existingSubSls = await prisma.subSls.findUnique({
        where: { id: subSlsId },
      });

      if (!existingSubSls) {
        return NextResponse.json({ error: 'Sub-SLS tidak ditemukan' }, { status: 404 });
      }

      let finalNamaPcl = '';
      let finalNamaPml = '';
      let finalNamaKorlap = '';

      if (idPcl) {
        const u = await prisma.user.findFirst({ where: { id: parseInt(idPcl), role: 'pcl' } });
        if (u) finalNamaPcl = u.nama;
      }
      
      if (idPml) {
        const u = await prisma.user.findFirst({ where: { id: parseInt(idPml), role: 'pml' } });
        if (u) finalNamaPml = u.nama;
      }

      if (idKorlap) {
        const u = await prisma.user.findFirst({ where: { id: parseInt(idKorlap), role: 'korlap' } });
        if (u) finalNamaKorlap = u.nama;
      }

      const result = await prisma.subSls.update({
        where: { id: subSlsId },
        data: {
          namaPcl: finalNamaPcl,
          namaPml: finalNamaPml,
          namaKorlap: finalNamaKorlap,
        },
      });

      // Synchronize TugasPcl: clear and rebuild mapping
      await prisma.tugasPcl.deleteMany({
        where: { idSubsls: subSlsId },
      });

      if (idPcl) {
        const parsedPclId = parseInt(idPcl);
        if (!isNaN(parsedPclId)) {
          await prisma.tugasPcl.create({
            data: {
              idUser: parsedPclId,
              idSubsls: subSlsId,
            },
          });
        }
      }

      return NextResponse.json({ success: true, data: result });
    }

    // Normal full update
    if (!idSls || !kodeSubsls || !idSubsls || totalMuatanAssignment === undefined) {
      return NextResponse.json({ error: 'Input tidak lengkap' }, { status: 400 });
    }

    const slsId = parseInt(idSls);
    const muatan = parseInt(totalMuatanAssignment);

    if (isNaN(slsId) || isNaN(muatan)) {
      return NextResponse.json({ error: 'Data numerik tidak valid' }, { status: 400 });
    }

    // Cek duplikasi idSubsls pada ID lain
    const duplicate = await prisma.subSls.findFirst({
      where: {
        idSubsls,
        id: { not: subSlsId },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: 'ID Sub-SLS sudah digunakan oleh wilayah lain' }, { status: 400 });
    }

    let finalNamaPcl = namaPcl || '';
    let finalNamaPml = namaPml || '';
    let finalNamaKorlap = namaKorlap || '';

    // If IDs are passed, resolve them
    if (idPcl) {
      const u = await prisma.user.findFirst({ where: { id: parseInt(idPcl), role: 'pcl' } });
      if (u) finalNamaPcl = u.nama;
    }
    if (idPml) {
      const u = await prisma.user.findFirst({ where: { id: parseInt(idPml), role: 'pml' } });
      if (u) finalNamaPml = u.nama;
    }
    if (idKorlap) {
      const u = await prisma.user.findFirst({ where: { id: parseInt(idKorlap), role: 'korlap' } });
      if (u) finalNamaKorlap = u.nama;
    }

    const result = await prisma.subSls.update({
      where: { id: subSlsId },
      data: {
        idSls: slsId,
        kodeSubsls,
        idSubsls,
        idSubsls2025: idSubsls2025 || null,
        namaKorlap: finalNamaKorlap,
        namaPml: finalNamaPml,
        namaPcl: finalNamaPcl,
        totalMuatanAssignment: muatan,
      },
    });

    // Sync TugasPcl
    await prisma.tugasPcl.deleteMany({
      where: { idSubsls: subSlsId },
    });

    if (idPcl) {
      const parsedPclId = parseInt(idPcl);
      if (!isNaN(parsedPclId)) {
        await prisma.tugasPcl.create({
          data: {
            idUser: parsedPclId,
            idSubsls: subSlsId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('PUT Sub-SLS error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui Sub-SLS' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID harus berupa angka' }, { status: 400 });
    }

    await prisma.subSls.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Sub-SLS error:', error);
    return NextResponse.json({ error: 'Gagal menghapus Sub-SLS' }, { status: 500 });
  }
}
