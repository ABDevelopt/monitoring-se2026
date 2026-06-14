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
    const kecamatan = await prisma.kecamatan.findMany({
      orderBy: { kodeKec: 'asc' },
    });
    return NextResponse.json(kecamatan);
  } catch (error) {
    console.error('GET Kecamatan error:', error);
    return NextResponse.json({ error: 'Gagal memuat data kecamatan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { kodeKec, namaKec } = body;

    if (!kodeKec || !namaKec) {
      return NextResponse.json({ error: 'Kode dan nama kecamatan wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.kecamatan.findUnique({
      where: { kodeKec },
    });

    if (existing) {
      return NextResponse.json({ error: 'Kecamatan dengan kode tersebut sudah terdaftar' }, { status: 400 });
    }

    const result = await prisma.kecamatan.create({
      data: {
        kodeKec,
        namaKec,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('POST Kecamatan error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan kecamatan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, kodeKec, namaKec } = body;

    if (!id || !kodeKec || !namaKec) {
      return NextResponse.json({ error: 'Input tidak lengkap' }, { status: 400 });
    }

    const duplicate = await prisma.kecamatan.findFirst({
      where: {
        kodeKec,
        id: { not: id },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: 'Kode kecamatan sudah digunakan oleh kecamatan lain' }, { status: 400 });
    }

    const result = await prisma.kecamatan.update({
      where: { id: parseInt(id) },
      data: {
        kodeKec,
        namaKec,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('PUT Kecamatan error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kecamatan' }, { status: 500 });
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

    await prisma.kecamatan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Kecamatan error:', error);
    return NextResponse.json({ error: 'Gagal menghapus kecamatan' }, { status: 500 });
  }
}
