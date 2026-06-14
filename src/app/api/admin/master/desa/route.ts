import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function verifyAdmin() {
  const session = await getSession();
  return session && session.role === 'admin';
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const desaList = await prisma.desa.findMany({
      include: {
        kecamatan: true,
      },
      orderBy: { idDesa: 'asc' },
    });
    return NextResponse.json(desaList);
  } catch (error) {
    console.error('GET Desa error:', error);
    return NextResponse.json({ error: 'Gagal memuat data desa' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { idKecamatan, idDesa, kodeDesa, namaDesa } = body;

    if (!idKecamatan || !idDesa || !kodeDesa || !namaDesa) {
      return NextResponse.json({ error: 'Input tidak lengkap' }, { status: 400 });
    }

    const kecId = parseInt(idKecamatan);
    if (isNaN(kecId)) {
      return NextResponse.json({ error: 'Kecamatan tidak valid' }, { status: 400 });
    }

    // Cek duplikasi idDesa (kode unik bps)
    const existing = await prisma.desa.findUnique({
      where: { idDesa },
    });

    if (existing) {
      return NextResponse.json({ error: 'Desa dengan ID tersebut sudah terdaftar' }, { status: 400 });
    }

    const result = await prisma.desa.create({
      data: {
        idKecamatan: kecId,
        idDesa,
        kodeDesa,
        namaDesa,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('POST Desa error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan desa' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, idKecamatan, idDesa, kodeDesa, namaDesa } = body;

    if (!id || !idKecamatan || !idDesa || !kodeDesa || !namaDesa) {
      return NextResponse.json({ error: 'Input tidak lengkap' }, { status: 400 });
    }

    const kecId = parseInt(idKecamatan);
    if (isNaN(kecId)) {
      return NextResponse.json({ error: 'Kecamatan tidak valid' }, { status: 400 });
    }

    // Cek duplikasi idDesa pada ID lain
    const duplicate = await prisma.desa.findFirst({
      where: {
        idDesa,
        id: { not: id },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: 'ID Desa sudah digunakan oleh desa lain' }, { status: 400 });
    }

    const result = await prisma.desa.update({
      where: { id: parseInt(id) },
      data: {
        idKecamatan: kecId,
        idDesa,
        kodeDesa,
        namaDesa,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('PUT Desa error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui desa' }, { status: 500 });
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

    await prisma.desa.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Desa error:', error);
    return NextResponse.json({ error: 'Gagal menghapus desa' }, { status: 500 });
  }
}
