// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settings';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const settings = getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membaca settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { appName, ewsThresholdHari, periodeMulai, periodeSelesai } = body;

    if (!appName || ewsThresholdHari === undefined || !periodeMulai || !periodeSelesai) {
      return NextResponse.json({ error: 'Input tidak lengkap' }, { status: 400 });
    }

    const threshold = parseInt(ewsThresholdHari);
    if (isNaN(threshold) || threshold <= 0) {
      return NextResponse.json({ error: 'Batas hari peringatan kendala harus angka positif' }, { status: 400 });
    }

    const updated = saveSettings({
      appName,
      ewsThresholdHari: threshold,
      periodeMulai,
      periodeSelesai,
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('API post settings error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan settings' }, { status: 500 });
  }
}
