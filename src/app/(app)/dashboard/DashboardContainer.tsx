// src/app/(app)/dashboard/DashboardContainer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SessionPayload } from '@/lib/auth';
import { Breadcrumb, BreadcrumbItem } from '@/components/dashboard/Breadcrumb';
import { PageHeader } from '@/components/layout/PageHeader';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { ProgressBarGanda } from '@/components/dashboard/ProgressBarGanda';
import { ProgressChart } from '@/components/dashboard/ProgressChart';
import { KecamatanTable } from '@/components/dashboard/KecamatanTable';
import { SlsTable } from '@/components/dashboard/SlsTable';
import { PmlTable } from '@/components/dashboard/PmlTable';
import { SubslsTable } from '@/components/dashboard/SubslsTable';
import { SubslsDetail } from '@/components/dashboard/SubslsDetail';
import { EWSPanel } from '@/components/dashboard/EWSPanel';
import { Spinner } from '@/components/ui/Spinner';
import { AlertTriangle, LayoutDashboard, Database, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DashboardContainerProps {
  session: SessionPayload;
}

export function DashboardContainer({ session }: DashboardContainerProps) {
  const role = session.role;

  // Tentukan level awal berdasarkan role
  const getInitialLevel = () => {
    if (role === 'pcl') return 3; // PCL langsung ke Level 3 (daftar tugasnya) atau Level 4
    if (role === 'pml') return 2; // PML langsung ke Level 2 (kecamatannya)
    return 1; // Admin & Korlap mulai dari Level 1
  };

  // State untuk navigasi drill-down
  const [level, setLevel] = useState<number>(getInitialLevel());
  const [kecId, setKecId] = useState<number | null>(role === 'pml' ? session.idKecamatan : null);
  const [kecNama, setKecNama] = useState<string>('');
  const [slsId, setSlsId] = useState<number | null>(null);
  const [slsNama, setSlsNama] = useState<string>('');
  const [subSlsId, setSubSlsId] = useState<number | null>(null);
  const [subSlsNama, setSubSlsNama] = useState<string>('');

  // Tab di Level 1 & Level 2: 'dashboard' atau 'ews'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ews'>('dashboard');

  // State Data & Loading
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data berdasarkan level & parameter aktif
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        let url = '/api/dashboard';

        if (level === 2 && kecId !== null) {
          url = `/api/dashboard/kecamatan/${kecId}`;
        } else if (level === 3 && slsId !== null) {
          url = `/api/dashboard/sls/${slsId}`;
        } else if (level === 4 && subSlsId !== null) {
          url = `/api/dashboard/subsls/${subSlsId}`;
        } else if (level === 3 && role === 'pcl') {
          // PCL Level 3 load data tugas (menggunakan api dashboard kabupaten yang difilter server)
          url = '/api/dashboard';
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Gagal memuat data dari server');
        }
        const result = await res.json();
        
        // Simpan nama wilayah jika level berubah
        if (level === 2 && result.kecamatan) {
          setKecNama(result.kecamatan.nama);
        } else if (level === 3 && result.sls) {
          setSlsNama(result.sls.nama);
          setKecNama(result.sls.desa + ' (' + result.sls.kecamatan + ')');
          setKecId(result.sls.kecamatanId);
        } else if (level === 4 && result.subsls) {
          setSubSlsNama(`Sub-SLS ${result.subsls.kodeSubsls}`);
          setSlsNama(result.subsls.sls);
          setKecNama(result.subsls.desa + ' (' + result.subsls.kecamatan + ')');
          setKecId(result.subsls.kecamatanId);
        }

        setData(result);

        // Jika PCL hanya punya 1 tugas, langsung arahkan ke Level 4
        if (level === 3 && role === 'pcl' && result.summary?.subSlsStats?.total === 1) {
          // Arahkan langsung ke sub-SLS pertama
          const firstSub = result.kecamatanList?.[0] || result.korlapList?.[0]; // placeholder jika data kosong
          // Ambil detail riwayat dari API laporan untuk cari sub-SLS id
          const resLaporan = await fetch('/api/laporan');
          if (resLaporan.ok) {
            const lapData = await resLaporan.json();
            if (lapData.length > 0 && lapData[0].subsls) {
              const assignedId = lapData[0].subsls.id;
              setSubSlsId(assignedId);
              setLevel(4);
            }
          }
        }
      } catch (err: any) {
        console.error('Fetch dashboard error:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [level, kecId, slsId, subSlsId, role]);

  // Handler Navigasi Breadcrumbs
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    // Jika level 1 (atau pml level 2), klik PPU/Home akan reset ke level awal
    const handleHomeClick = () => {
      if (role !== 'pcl' && role !== 'pml') {
        setLevel(1);
        setKecId(null);
        setSlsId(null);
        setSubSlsId(null);
      } else if (role === 'pml') {
        setLevel(2);
        setSlsId(null);
        setSubSlsId(null);
      } else if (role === 'pcl') {
        setLevel(3);
        setSubSlsId(null);
      }
    };

    items.push({ label: 'Kabupaten PPU', onClick: handleHomeClick });

    if (level >= 2 && kecId !== null) {
      items.push({
        label: kecNama || `Kecamatan`,
        onClick: role !== 'pml' ? () => {
          setLevel(2);
          setSlsId(null);
          setSubSlsId(null);
        } : undefined,
      });
    }

    if (level >= 3 && slsId !== null) {
      items.push({
        label: slsNama || `SLS`,
        onClick: () => {
          setLevel(3);
          setSubSlsId(null);
        },
      });
    }

    if (level === 4 && subSlsId !== null) {
      items.push({
        label: subSlsNama || `Sub-SLS`,
      });
    }

    // Buang item pertama "Kabupaten PPU" dari array karena breadcrumb rendering sudah memilikinya secara default di paling kiri
    return items.slice(1);
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal) forwards' }}>
      
      {/* Page Header */}
      <PageHeader
        title={
          level === 1
            ? 'Dashboard Kabupaten Penajam Paser Utara'
            : level === 2
            ? `Dashboard Kecamatan ${kecNama}`
            : level === 3
            ? `Progres SLS ${slsNama}`
            : `Detail Sub-SLS ${subSlsNama}`
        }
        description={
          level === 1
            ? 'Ringkasan progres harian pendataan Sensus Ekonomi 2026 tingkat kabupaten.'
            : level === 2
            ? `Pemantauan progres per RT/SLS dan PML di wilayah Kecamatan ${kecNama}.`
            : level === 3
            ? `Status pencacahan usaha per sub-SLS di RT/SLS ${slsNama}.`
            : `Rincian status target usaha, kendala, dan riwayat laporan harian.`
        }
      />

      {/* Breadcrumbs Navigation */}
      {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

      {/* Loading state */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Spinner size="lg" />
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Memuat data dashboard...
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div
          className="card"
          style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--color-danger-text)',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid rgba(231, 76, 60, 0.2)',
          }}
        >
          <AlertTriangle size={48} style={{ margin: '0 auto 16px auto', strokeWidth: 1.5 }} />
          <h4 style={{ fontWeight: 700, fontSize: '16px', margin: '0 0 8px 0' }}>Gagal Memuat Data</h4>
          <p style={{ fontSize: '14px', margin: '0 0 16px 0' }}>{error}</p>
          <Button variant="danger" onClick={() => setLevel(level)}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Main Content Area based on level */}
      {!isLoading && !error && data && (
        <>
          {/* LEVEL 1: KABUPATEN (Admin / Korlap) */}
          {level === 1 && data.kecamatanList && (
            <>
              {/* 6 Summary Cards */}
              <SummaryCards stats={data.summary} />

              {/* Progress Bars & Trend Chart */}
              <div className="dashboard-grid">
                <ProgressBarGanda subSlsStats={data.summary.subSlsStats} usahastats={data.summary} />
                <ProgressChart trendData={data.trendData} />
              </div>

              {/* Tab Navigation (Dashboard vs EWS) */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border-light)',
                  marginBottom: '20px',
                  gap: '24px',
                }}
              >
                <button
                  onClick={() => setActiveTab('dashboard')}
                  style={{
                    padding: '12px 8px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: activeTab === 'dashboard' ? 'var(--primary-base)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'dashboard' ? '3px solid var(--primary-base)' : '3px solid transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  Tabel Kecamatan & Korlap
                </button>
                <button
                  onClick={() => setActiveTab('ews')}
                  style={{
                    padding: '12px 8px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: activeTab === 'ews' ? 'var(--color-danger-text)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'ews' ? '3px solid var(--color-danger)' : '3px solid transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Peringatan Kendala Aktif
                  {data.summary.activeAlertsCount > 0 && (
                    <span
                      style={{
                        backgroundColor: 'var(--color-danger)',
                        color: '#ffffff',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: 800,
                      }}
                    >
                      {data.summary.activeAlertsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'dashboard' ? (
                <>
                  <KecamatanTable
                    kecamatanList={data.kecamatanList}
                    onSelectKecamatan={(id) => {
                      setKecId(id);
                      setLevel(2);
                    }}
                  />
                  <PmlTable pmlList={data.pmlList} />
                </>
              ) : (
                <EWSPanel
                  alerts={data.topAlerts}
                  kecamatanList={data.kecamatanList}
                  onSelectSubSls={(id) => {
                    setSubSlsId(id);
                    setLevel(4);
                  }}
                />
              )}
            </>
          )}

          {/* LEVEL 2: KECAMATAN (Admin / Korlap / PML) */}
          {level === 2 && data.slsList && (
            <>
              {/* Summary Cards */}
              <SummaryCards stats={data.summary} />

              {/* Progress Bars & Tab */}
              <ProgressBarGanda subSlsStats={data.summary.subSlsStats} usahastats={data.summary} />

              {/* Tab Navigation (Dashboard vs EWS) */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border-light)',
                  marginBottom: '20px',
                  gap: '24px',
                }}
              >
                <button
                  onClick={() => setActiveTab('dashboard')}
                  style={{
                    padding: '12px 8px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: activeTab === 'dashboard' ? 'var(--primary-base)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'dashboard' ? '3px solid var(--primary-base)' : '3px solid transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  Tabel RT/SLS & PML
                </button>
                <button
                  onClick={() => setActiveTab('ews')}
                  style={{
                    padding: '12px 8px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: activeTab === 'ews' ? 'var(--color-danger-text)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'ews' ? '3px solid var(--color-danger)' : '3px solid transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Peringatan Kendala Kecamatan
                  {data.summary.activeAlertsCount > 0 && (
                    <span
                      style={{
                        backgroundColor: 'var(--color-danger)',
                        color: '#ffffff',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: 800,
                      }}
                    >
                      {data.summary.activeAlertsCount}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === 'dashboard' ? (
                <>
                  <SlsTable
                    slsList={data.slsList}
                    onSelectSls={(id) => {
                      setSlsId(id);
                      setLevel(3);
                    }}
                  />
                  <PmlTable pmlList={data.pmlList} />
                </>
              ) : (
                <EWSPanel
                  alerts={data.alerts}
                  onSelectSubSls={(id) => {
                    setSubSlsId(id);
                    setLevel(4);
                  }}
                />
              )}
            </>
          )}

          {/* LEVEL 3: SLS / LIST OF SUB-SLS (Admin / Korlap / PML / PCL) */}
          {level === 3 && (data.subSlsList || data.kecamatanList) && (
            <>
              {role !== 'pcl' ? (
                <>
                  {/* Summary Cards */}
                  <SummaryCards stats={data.summary} />
                  
                  {/* Sub-SLS List Table */}
                  <SubslsTable
                    subSlsList={data.subSlsList}
                    onSelectSubSls={(id) => {
                      setSubSlsId(id);
                      setLevel(4);
                    }}
                  />
                </>
              ) : (
                /* PCL view: List of assigned sub-SLSs only */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                      Tugas Pendataan Sub-SLS Anda
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Silakan pilih Sub-SLS berikut untuk melihat rincian progres pendataan.
                    </p>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)', fontWeight: 700 }}>
                            <th style={{ padding: '10px 8px' }}>Sub-SLS</th>
                            <th style={{ padding: '10px 8px' }}>Desa</th>
                            <th style={{ padding: '10px 8px' }}>SLS</th>
                            <th style={{ padding: '10px 8px', textAlign: 'right' }}>Target Muatan</th>
                            <th style={{ padding: '10px 8px', textAlign: 'right' }}>Selesai</th>
                            <th style={{ padding: '10px 8px', textAlign: 'right' }}>% Progress</th>
                            <th style={{ padding: '10px 8px', textAlign: 'center' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.kecamatanList?.map((sub: any) => {
                            // client handles formatting dynamically
                            return (
                              <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={{ padding: '12px 8px', fontWeight: 700 }}>{sub.idSubSls}</td>
                                <td style={{ padding: '12px 8px' }}>{sub.desaNama}</td>
                                <td style={{ padding: '12px 8px' }}>{sub.namaSls}</td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{sub.totalMuatan}</td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--color-success-text)' }}>{sub.selesai}</td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>
                                  {sub.persentase !== undefined ? sub.persentase.toFixed(1) : (sub.totalMuatan > 0 ? ((sub.selesai / sub.totalMuatan) * 100).toFixed(1) : 100)}%
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSubSlsId(sub.id);
                                      setLevel(4);
                                    }}
                                  >
                                    Detail
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* LEVEL 4: DETAIL SUB-SLS */}
          {level === 4 && data.subsls && (
            <SubslsDetail data={data} userRole={role} />
          )}
        </>
      )}
    </div>
  );
}
