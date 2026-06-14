// src/app/(app)/rekap/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SessionPayload } from '@/lib/auth';
import { FileDown, Calendar, Search, MapPin, AlertCircle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function RekapPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  // Active level tab: 'subsls' | 'sls' | 'kecamatan' | 'harian' | 'ews'
  const [activeTab, setActiveTab] = useState<'subsls' | 'sls' | 'kecamatan' | 'harian' | 'ews'>('subsls');
  
  // Filters
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [selectedKec, setSelectedKec] = useState<string>('');

  // Table preview states
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Fetch session & kecamatan
  useEffect(() => {
    async function loadSessionAndKecamatan() {
      try {
        const resSession = await fetch('/api/auth/session');
        if (resSession.ok) {
          const s = await resSession.json();
          setSession(s);

          // Fetch kecamatan list
          const resKec = await fetch('/api/kecamatan');
          if (resKec.ok) {
            const data = await resKec.json();
            setKecamatanList(data);

            if (s.role === 'pml' && s.idKecamatan) {
              // Lock kecamatan filter for PML
              setSelectedKec(s.idKecamatan.toString());
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSession(false);
      }
    }

    loadSessionAndKecamatan();
  }, []);

  // Fetch Preview Data when activeTab or selectedKec changes
  useEffect(() => {
    if (isLoadingSession || !session) return;

    async function fetchPreview() {
      setIsLoadingPreview(true);
      setPreviewData([]);
      try {
        let url = '';
        
        // Map tab to correct endpoints
        if (activeTab === 'subsls') {
          url = '/api/dashboard'; // Level 1 endpoint contains kecamatanList and korlapList
        } else if (activeTab === 'sls') {
          // fetch from kecamatan or sls api
          // Kita bisa fetch dari dashboard kecamatan jika selectedKec diisi, jika tidak kita fetch dari dashboard kabupaten
          url = selectedKec ? `/api/dashboard/kecamatan/${selectedKec}` : '/api/dashboard';
        } else if (activeTab === 'kecamatan') {
          url = '/api/dashboard';
        } else if (activeTab === 'harian') {
          url = selectedKec ? `/api/laporan?kecamatanId=${selectedKec}` : '/api/laporan';
        } else if (activeTab === 'ews') {
          url = selectedKec ? `/api/ews?kecamatanId=${selectedKec}` : '/api/ews';
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Gagal memuat preview data');
        const result = await res.json();
        
        // Format preview data depending on activeTab
        let formattedList: any[] = [];
        
        if (activeTab === 'subsls') {
          // Preview all sub-SLS
          // Kita load list sub-SLS dari /api/dashboard jika ada
          // Sebenarnya cara paling tepat adalah query API list laporan, atau panggil API ekspor dengan preview mode.
          // Tapi kita bisa gunakan reports list atau statistics list dari /api/dashboard.
          // Untuk simple preview, mari panggil API laporan
          const resAllSub = await fetch(selectedKec ? `/api/laporan?kecamatanId=${selectedKec}` : '/api/laporan');
          if (resAllSub.ok) {
            formattedList = await resAllSub.json();
          }
        } else if (activeTab === 'sls') {
          formattedList = result.slsList || [];
        } else if (activeTab === 'kecamatan') {
          formattedList = result.kecamatanList || [];
        } else if (activeTab === 'harian') {
          formattedList = result || []; // laporan returns direct array
        } else if (activeTab === 'ews') {
          formattedList = result.alerts || [];
        }

        setPreviewData(formattedList.slice(0, 10)); // Tampilkan 10 record pertama saja untuk preview
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingPreview(false);
      }
    }

    fetchPreview();
  }, [activeTab, selectedKec, session, isLoadingSession]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Build download query
      const params = new URLSearchParams();
      params.append('level', activeTab);
      if (selectedKec) {
        params.append('kecamatanId', selectedKec);
      }

      const url = `/api/export?${params.toString()}`;
      
      // Trigger download
      const response = await fetch(url);
      if (!response.ok) throw new Error('Unduh Excel gagal.');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `rekap-se2026-ppu-${activeTab}-${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mengunduh file.');
    } finally {
      setIsDownloading(false);
    }
  };

  const tabs = [
    { id: 'subsls', label: 'Rekap per Sub-SLS' },
    { id: 'sls', label: 'Rekap per SLS / RT' },
    { id: 'kecamatan', label: 'Rekap per Kecamatan' },
    { id: 'harian', label: 'Rekap Laporan Harian' },
    { id: 'ews', label: 'Peringatan Kendala Petugas' },
  ] as const;

  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Rekap Data & Ekspor Excel"
        description="Pusat unduhan berkas laporan dan monitoring pendataan Sensus Ekonomi 2026 dalam format Microsoft Excel (.xlsx)."
        actions={
          <Button onClick={handleDownload} isLoading={isDownloading} style={{ padding: '10px 24px' }}>
            <FileDown size={18} />
            Unduh Berkas Excel (.xlsx)
          </Button>
        }
      />

      {/* Tabbed Menu & Filters */}
      <div
        className="card"
        style={{
          padding: '24px',
          marginBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Level Tabs selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            gap: '20px',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
            const isTabActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 6px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: isTabActive
                    ? tab.id === 'ews'
                      ? 'var(--color-danger-text)'
                      : 'var(--primary-base)'
                    : 'var(--text-muted)',
                  borderBottom: isTabActive
                    ? `3px solid ${tab.id === 'ews' ? 'var(--color-danger)' : 'var(--primary-base)'}`
                    : '3px solid transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="filters-container" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Kecamatan Dropdown (Locked for PML) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Wilayah Kecamatan:</span>
            <select
              className="form-control"
              value={selectedKec}
              onChange={(e) => setSelectedKec(e.target.value)}
              disabled={session?.role === 'pml'}
              style={{ padding: '6px 12px', fontSize: '13px', minWidth: '180px' }}
            >
              {session?.role !== 'pml' && <option value="">Semua Kecamatan</option>}
              {kecamatanList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Preview */}
      <div className="card" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Preview 10 Data Pertama</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            *Tabel di bawah ini hanya preview ringkas. Data lengkap silakan unduh via berkas Excel.
          </span>
        </div>

        {isLoadingPreview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
            <Spinner />
          </div>
        ) : previewData.length === 0 ? (
          <div
            style={{
              height: '240px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              gap: '12px',
            }}
          >
            <Search size={40} style={{ strokeWidth: 1 }} />
            <div>Tidak ada data untuk preview di filter ini.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {/* 1. Preview Table: Sub-SLS */}
            {activeTab === 'subsls' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Tanggal</th>
                    <th style={{ padding: '10px 8px' }}>Sub-SLS ID</th>
                    <th style={{ padding: '10px 8px' }}>Desa</th>
                    <th style={{ padding: '10px 8px' }}>SLS</th>
                    <th style={{ padding: '10px 8px' }}>PCL</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Selesai</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{row.tanggal ? row.tanggal.split('T')[0].split('-').reverse().join('/') : '-'}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.subsls?.idSubsls}</td>
                      <td style={{ padding: '10px 8px' }}>{row.subsls?.sls?.desa?.namaDesa}</td>
                      <td style={{ padding: '10px 8px' }}>{row.subsls?.sls?.namaSls}</td>
                      <td style={{ padding: '10px 8px' }}>{row.subsls?.namaPcl}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>{row.jumlahSelesai}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <Badge variant={row.status === 'selesai' ? 'success' : row.status === 'progres' ? 'warning' : 'danger'}>
                          {row.status === 'selesai' ? 'Selesai' : row.status === 'progres' ? 'Selesai Sebagian' : 'Kendala'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. Preview Table: SLS */}
            {activeTab === 'sls' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 8px' }}>SLS / RT Name</th>
                    <th style={{ padding: '10px 8px' }}>Desa</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Sub-SLS Count</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Total Muatan</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Selesai</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>% Usaha</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.namaSls}</td>
                      <td style={{ padding: '10px 8px' }}>{row.desaNama || row.desa?.namaDesa}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{row.jumlahSubSls || row.subsls?.length}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>{row.totalMuatan}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--color-success-text)' }}>{row.selesai}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-base)' }}>
                        {row.totalMuatan > 0 ? ((row.selesai / row.totalMuatan) * 100).toFixed(1) : 100}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. Preview Table: Kecamatan */}
            {activeTab === 'kecamatan' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 8px' }}>Kecamatan</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Total Sub-SLS</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Total Muatan</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Selesai</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>% Usaha</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Alert Count</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.nama}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{row.totalSubSls}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>{row.totalMuatan}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--color-success-text)' }}>{row.selesai}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-base)' }}>
                        {row.totalMuatan > 0 ? ((row.selesai / row.totalMuatan) * 100).toFixed(1) : 100}%
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        {row.countAlert > 0 ? (
                          <span style={{ color: 'var(--color-danger-text)', fontWeight: 700 }}>{row.countAlert} Alert</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. Preview Table: Harian */}
            {activeTab === 'harian' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Tanggal</th>
                    <th style={{ padding: '10px 8px' }}>Sub-SLS ID</th>
                    <th style={{ padding: '10px 8px' }}>PCL</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Selesai</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 8px' }}>Kendala/Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{row.tanggal ? row.tanggal.split('T')[0].split('-').reverse().join('/') : '-'}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.subsls?.idSubsls}</td>
                      <td style={{ padding: '10px 8px' }}>{row.subsls?.namaPcl}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>{row.jumlahSelesai}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <Badge variant={row.status === 'selesai' ? 'success' : row.status === 'progres' ? 'warning' : 'danger'}>
                          {row.status === 'selesai' ? 'Selesai' : row.status === 'progres' ? 'Selesai Sebagian' : 'Kendala'}
                        </Badge>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{row.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. Preview Table: EWS Status */}
            {activeTab === 'ews' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 8px' }}>Nama PCL</th>
                    <th style={{ padding: '10px 8px' }}>Sub-SLS ID</th>
                    <th style={{ padding: '10px 8px' }}>Kecamatan</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Muatan</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Selesai</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Jenis Alert</th>
                    <th style={{ padding: '10px 8px' }}>Pesan Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.namaPcl}</td>
                      <td style={{ padding: '10px 8px' }}>{row.idSubSls}</td>
                      <td style={{ padding: '10px 8px' }}>{row.kecamatan}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{row.totalMuatan}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{row.selesai}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <Badge variant={row.tingkatKekritisan === 'kritis' ? 'danger' : 'warning'}>
                          {row.jenisAlert === 'tidak_aktif' ? 'Tidak Aktif' : row.jenisAlert === 'stagnan' ? 'Stagnan' : row.jenisAlert === 'bermasalah' ? 'Kendala' : 'Lambat'}
                        </Badge>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)', fontSize: '12px' }}>{row.pesan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
