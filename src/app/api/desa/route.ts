// src/app/api/desa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const kecamatanIdStr = searchParams.get('kecamatanId');

  if (!kecamatanIdStr) {
    return NextResponse.json({ error: 'Parameter kecamatanId wajib disertakan' }, { status: 400 });
  }

  const kecamatanId = parseInt(kecamatanIdStr);
  if (isNaN(kecamatanId)) {
    return NextResponse.json({ error: 'Parameter kecamatanId tidak valid' }, { status: 400 });
  }

  try {
    const desa = await prisma.desa.findMany({
      where: { idKecamatan: kecamatanId },
      orderBy: { kodeDesa: 'asc' },
    });
    return NextResponse.json(desa);
  } catch (error) {
    console.error('API desa error:', error);
    return NextResponse.json({ error: 'Gagal memuat data desa' }, { status: 500 });
  }
}
