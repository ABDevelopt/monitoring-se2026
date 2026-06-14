// src/components/dashboard/SubslsDetail.tsx
import React from 'react';
import { ClipboardEdit, AlertCircle, Calendar, User, Eye, UserCheck, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import Link from 'next/link';

interface SubslsDetailProps {
  data: {
    subsls: {
      id: number;
      kodeSubsls: string;
      idSubsls: string;
      idSubsls2025: string | null;
      namaKorlap: string;
      namaPml: string;
      namaPcl: string;
      totalMuatan: number;
      selesai: number;
      persentase: number;
      status: string;
      sls: string;
      desa: string;
      kecamatan: string;
      kecamatanId: number;
    };
    alert: {
      jenisAlert: string;
      tingkatKekritisan: 'kritis' | 'perhatian' | 'risiko';
      pesan: string;
      hariGap?: number;
      tanggalLaporTerakhir?: string | null;
    } | null;
    riwayat: {
      id: number;
      tanggal: string;
      jumlahSelesai: number;
      status: string;
      keterangan: string;
      diinputOleh: string;
    }[];
  };
  userRole: string;
}

export function SubslsDetail({ data, userRole }: SubslsDetailProps) {
  const { subsls, alert, riwayat } = data;

  const showEditButton = ['admin', 'korlap', 'pml'].includes(userRole);

  const statusLabels: Record<string, string> = {
    selesai: 'Selesai',
    progres: 'Selesai Sebagian',
    tidak_selesai: 'Kendala',
    belum_lapor: 'Belum Lapor',
  };

  const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
    selesai: 'success',
    progres: 'warning',
    tidak_selesai: 'danger',
    belum_lapor: 'gray',
  };

  const alertColors = {
    kritis: {
      bg: 'var(--color-danger-bg)',
      text: 'var(--color-danger-text)',
      border: 'rgba(231, 76, 60, 0.2)',
    },
    perhatian: {
      bg: 'var(--color-warning-bg)',
      text: 'var(--color-warning-text)',
      border: 'rgba(243, 156, 18, 0.2)',
    },
    risiko: {
      bg: 'var(--color-warning-bg)',
      text: 'var(--color-warning-text)',
      border: 'rgba(241, 196, 15, 0.2)',
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Alert EWS Box jika ada */}
      {alert && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--border-radius)',
            backgroundColor: alertColors[alert.tingkatKekritisan].bg,
            color: alertColors[alert.tingkatKekritisan].text,
            border: `1px solid ${alertColors[alert.tingkatKekritisan].border}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            animation: 'fadeIn var(--transition-normal) forwards',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: '15px' }}>
              PERINGATAN KENDALA: {alert.jenisAlert === 'tidak_aktif' ? 'TIDAK AKTIF' : alert.jenisAlert === 'stagnan' ? 'PROGRESS STAGNAN' : alert.jenisAlert === 'bermasalah' ? 'LAPORAN KENDALA' : 'RISIKO TERKENDALA'}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.95, lineHeight: '1.4' }}>
              {alert.pesan}
            </p>
          </div>
        </div>
      )}

      {/* Grid Utama Layout Split */}
      <div className="dashboard-grid">
        {/* Left Side: Profile Card & Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Profil Sub-SLS</h3>
              <Badge variant={statusVariants[subsls.status]}>{statusLabels[subsls.status]}</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontSize: '13px' }}>
                  <div style={{ fontWeight: 700 }}>{subsls.kecamatan} &gt; {subsls.desa}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{subsls.sls}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Eye size={16} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontSize: '13px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Kode Sub-SLS</div>
                  <div style={{ fontWeight: 700 }}>{subsls.idSubsls}</div>
                  {subsls.idSubsls2025 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kode 2025: {subsls.idSubsls2025}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <User size={16} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontSize: '13px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>PCL Pencacah</div>
                  <div style={{ fontWeight: 700 }}>{subsls.namaPcl}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <UserCheck size={16} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontSize: '13px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>PML Pengawas</div>
                  <div style={{ fontWeight: 700 }}>{subsls.namaPml}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <UserCheck size={16} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontSize: '13px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Koordinator Lapangan</div>
                  <div style={{ fontWeight: 700 }}>{subsls.namaKorlap}</div>
                </div>
              </div>
            </div>

            {showEditButton && (
              <Link href={`/form-input?subSlsId=${subsls.id}`} style={{ width: '100%' }}>
                <Button variant="primary" style={{ width: '100%', padding: '10px' }}>
                  <ClipboardEdit size={16} />
                  Input Laporan Hari Ini
                </Button>
              </Link>
            )}
          </div>

          {/* Gauge Card */}
          <div
            className="card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              textAlign: 'center',
            }}
          >
            <h4 style={{ fontSize: '14px', fontWeight: 700, alignSelf: 'flex-start' }}>Progress Volume Usaha</h4>
            
            {/* Circular Progress Gauge */}
            <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle cx="75" cy="75" r="65" stroke="var(--border-light)" strokeWidth="12" fill="transparent" />
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  stroke={subsls.status === 'tidak_selesai' ? 'var(--color-danger)' : 'var(--color-success)'}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 65}`}
                  strokeDashoffset={`${2 * Math.PI * 65 * (1 - subsls.persentase / 100)}`}
                  strokeLinecap="round"
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                    transition: 'stroke-dashoffset 0.8s ease',
                  }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 800 }}>{subsls.persentase.toFixed(1)}%</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Tercacah</span>
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {subsls.selesai} selesai dari {subsls.totalMuatan} target usaha
            </div>
          </div>
        </div>

        {/* Right Side: Report History */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Riwayat Laporan Harian</h3>

          {riwayat.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                textAlign: 'center',
                gap: '12px',
              }}
            >
              <Calendar size={48} style={{ strokeWidth: 1 }} />
              <div>Belum ada laporan harian yang masuk untuk Sub-SLS ini.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)', fontWeight: 700 }}>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Tanggal</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Selesai</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 8px' }}>Kendala/Keterangan</th>
                    <th style={{ padding: '10px 8px' }}>Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600 }}>
                        {row.tanggal.split('-').reverse().join('/')}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>
                        {row.jumlahSelesai}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <Badge variant={statusVariants[row.status]}>{statusLabels[row.status]}</Badge>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {row.keterangan}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                        {row.diinputOleh}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
