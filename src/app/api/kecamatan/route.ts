// src/app/api/kecamatan/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const kecamatan = await prisma.kecamatan.findMany({
      orderBy: { kodeKec: 'asc' },
    });
    return NextResponse.json(kecamatan);
  } catch (error) {
    console.error('API kecamatan error:', error);
    return NextResponse.json({ error: 'Gagal memuat data kecamatan' }, { status: 500 });
  }
}
