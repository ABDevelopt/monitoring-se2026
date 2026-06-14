// src/app/(app)/admin/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle2, AlertCircle, Save, Settings, Info } from 'lucide-react';

export default function AdminSettingsPage() {
  const [appName, setAppName] = useState<string>('');
  const [ewsThresholdHari, setEwsThresholdHari] = useState<string>('');
  const [periodeMulai, setPeriodeMulai] = useState<string>('');
  const [periodeSelesai, setPeriodeSelesai] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load current settings
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setAppName(data.appName);
        setEwsThresholdHari(data.ewsThresholdHari.toString());
        setPeriodeMulai(data.periodeMulai);
        setPeriodeSelesai(data.periodeSelesai);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName,
          ewsThresholdHari,
          periodeMulai,
          periodeSelesai,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menyimpan konfigurasi.');

      setFeedback({ type: 'success', text: 'Konfigurasi sistem berhasil diperbarui!' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      
      <PageHeader
        title="Pengaturan Sistem (System Settings)"
        description="Konfigurasi parameter deteksi kendala harian, judul aplikasi, dan periode sensus aktif Kabupaten PPU."
      />

      {/* Card Form */}
      <div className="card animate-fade-in" style={{ padding: '32px' }}>
        
        {feedback && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '8px',
              backgroundColor: feedback.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: feedback.type === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'}`,
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* App Name */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="app-name">Nama Aplikasi</label>
            <input
              className="form-control"
              id="app-name"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          {/* EWS Days Threshold */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="ews-threshold">Batas Hari Tanpa Laporan (Peringatan Kendala)</label>
            <input
              className="form-control"
              id="ews-threshold"
              type="number"
              min="1"
              value={ewsThresholdHari}
              onChange={(e) => setEwsThresholdHari(e.target.value)}
              required
              style={{ width: '100%' }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '6px',
                lineHeight: '1.4',
              }}
            >
              <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-base)' }} />
              <span>
                Jumlah hari berturut-turut di mana seorang PCL tidak mengirimkan laporan harian sebelum sistem memicu status peringatan kendala 🔴 <strong>"Tidak Aktif"</strong>.
              </span>
            </div>
          </div>

          {/* Periode Sensus */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Periode Mulai */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="periode-mulai">Tanggal Mulai Sensus</label>
              <input
                className="form-control"
                id="periode-mulai"
                type="date"
                value={periodeMulai}
                onChange={(e) => setPeriodeMulai(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>

            {/* Periode Selesai */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="periode-selesai">Tanggal Selesai Sensus</label>
              <input
                className="form-control"
                id="periode-selesai"
                type="date"
                value={periodeSelesai}
                onChange={(e) => setPeriodeSelesai(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: '1.4',
            }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-base)' }} />
            <span>
              Periode ini digunakan oleh algoritma deteksi kendala untuk memicu peringatan 🟡 <strong>"Risiko Tidak Selesai"</strong> (ketika sisa waktu sudah &lt;50% namun progress unit usaha &lt;30%).
            </span>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button type="submit" isLoading={isSaving} style={{ padding: '10px 24px' }}>
              <Save size={16} />
              Simpan Pengaturan
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}
