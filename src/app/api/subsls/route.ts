// src/app/api/subsls/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slsIdStr = searchParams.get('slsId');

  if (!slsIdStr) {
    return NextResponse.json({ error: 'Parameter slsId wajib disertakan' }, { status: 400 });
  }

  const slsId = parseInt(slsIdStr);
  if (isNaN(slsId)) {
    return NextResponse.json({ error: 'Parameter slsId tidak valid' }, { status: 400 });
  }

  try {
    const subsls = await prisma.subSls.findMany({
      where: { idSls: slsId },
      orderBy: { kodeSubsls: 'asc' },
    });
    return NextResponse.json(subsls);
  } catch (error) {
    console.error('API subsls error:', error);
    return NextResponse.json({ error: 'Gagal memuat data sub-SLS' }, { status: 500 });
  }
}
