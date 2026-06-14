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
    const idDesaStr = searchParams.get('idDesa');
    const search = searchParams.get('search');

    const where: any = {};
    if (idDesaStr) {
      const parsedDesaId = parseInt(idDesaStr);
      if (!isNaN(parsedDesaId)) {
        where.idDesa = parsedDesaId;
      }
    }
    if (search) {
      where.OR = [
        { kodeSls: { contains: search } },
        { namaSls: { contains: search } },
      ];
    }

    const slsList = await prisma.sls.findMany({
      where,
      include: {
        desa: {
          include: {
            kecamatan: true,
          },
        },
      },
      orderBy: { kodeSls: 'asc' },
      take: 200, // batasi jumlah agar performa optimal jika pencarian sangat umum
    });
    return NextResponse.json(slsList);
  } catch (error) {
    console.error('GET SLS error:', error);
    return NextResponse.json({ error: 'Gagal memuat data SLS' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { idDesa, kodeSls, namaSls } = body;

    if (!idDesa || !kodeSls || !namaSls) {
      return NextResponse.json({ error: 'Input tidak lengkap' }, { status: 400 });
    }

    const desaId = parseInt(idDesa);
    if (isNaN(desaId)) {
      return NextResponse.json({ error: 'Desa tidak valid' }, { status: 400 });
    }

    const result = await prisma.sls.create({
      data: {
        idDesa: desaId,
        kodeSls,
        namaSls,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('POST SLS error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan SLS' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, idDesa, kodeSls, namaSls } = body;

    if (!id || !idDesa || !kodeSls || !namaSls) {
      return NextResponse.json({ error: 'Input tidak lengkap' }, { status: 400 });
    }

    const desaId = parseInt(idDesa);
    if (isNaN(desaId)) {
      return NextResponse.json({ error: 'Desa tidak valid' }, { status: 400 });
    }

    const result = await prisma.sls.update({
      where: { id: parseInt(id) },
      data: {
        idDesa: desaId,
        kodeSls,
        namaSls,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('PUT SLS error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui SLS' }, { status: 500 });
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

    await prisma.sls.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE SLS error:', error);
    return NextResponse.json({ error: 'Gagal menghapus SLS' }, { status: 500 });
  }
}
