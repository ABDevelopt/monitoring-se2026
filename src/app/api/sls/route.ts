// src/app/api/sls/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const desaIdStr = searchParams.get('desaId');

  if (!desaIdStr) {
    return NextResponse.json({ error: 'Parameter desaId wajib disertakan' }, { status: 400 });
  }

  const desaId = parseInt(desaIdStr);
  if (isNaN(desaId)) {
    return NextResponse.json({ error: 'Parameter desaId tidak valid' }, { status: 400 });
  }

  try {
    const sls = await prisma.sls.findMany({
      where: { idDesa: desaId },
      orderBy: { kodeSls: 'asc' },
    });
    return NextResponse.json(sls);
  } catch (error) {
    console.error('API sls error:', error);
    return NextResponse.json({ error: 'Gagal memuat data SLS' }, { status: 500 });
  }
}
