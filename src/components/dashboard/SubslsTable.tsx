// src/components/dashboard/SubslsTable.tsx
import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface SubslsTableProps {
  subSlsList: {
    id: number;
    kodeSubsls: string;
    idSubsls: string;
    namaKorlap: string;
    namaPml: string;
    namaPcl: string;
    totalMuatan: number;
    selesai: number;
    persentase: number;
    status: string;
    tanggalLapor: string | null;
    keterangan: string | null;
    alert: {
      jenisAlert: string;
      tingkatKekritisan: 'kritis' | 'perhatian' | 'risiko';
      pesan: string;
    } | null;
  }[];
  onSelectSubSls: (id: number, name: string) => void;
}

export function SubslsTable({ subSlsList, onSelectSubSls }: SubslsTableProps) {
  const getRowStyle = (sub: any) => {
    const defaultStyle = {
      cursor: 'pointer',
      transition: 'background-color var(--transition-fast)',
      borderBottom: '1px solid var(--border-light)',
    };

    if (sub.alert) {
      if (sub.alert.tingkatKekritisan === 'kritis') {
        return {
          ...defaultStyle,
          backgroundColor: 'rgba(231, 76, 60, 0.05)',
        };
      }
      if (sub.alert.tingkatKekritisan === 'perhatian') {
        return {
          ...defaultStyle,
          backgroundColor: 'rgba(243, 156, 18, 0.05)',
        };
      }
      if (sub.alert.tingkatKekritisan === 'risiko') {
        return {
          ...defaultStyle,
          backgroundColor: 'rgba(241, 196, 15, 0.05)',
        };
      }
    }

    if (sub.status === 'belum_lapor') {
      return {
        ...defaultStyle,
        backgroundColor: 'rgba(241, 245, 249, 0.4)',
      };
    }

    return defaultStyle;
  };

  const getAlertBadge = (alert: any) => {
    if (!alert) return null;

    const variants = {
      kritis: 'danger',
      perhatian: 'warning',
      risiko: 'warning',
    } as const;

    const Icon = alert.tingkatKekritisan === 'kritis' ? AlertCircle : AlertTriangle;

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: alert.tingkatKekritisan === 'kritis' ? 'var(--color-danger-text)' : 'var(--color-warning-text)',
          fontWeight: 600,
          fontSize: '12px',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: alert.tingkatKekritisan === 'kritis' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
          border: `1px solid ${alert.tingkatKekritisan === 'kritis' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(243, 156, 18, 0.15)'}`,
        }}
        title={alert.pesan}
      >
        <Icon size={14} />
        {alert.jenisAlert === 'tidak_aktif' ? 'Tidak Aktif' : alert.jenisAlert === 'stagnan' ? 'Stagnan' : alert.jenisAlert === 'bermasalah' ? 'Bermasalah' : 'Risiko Lambat'}
      </div>
    );
  };

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

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        marginBottom: '28px',
        overflowX: 'auto',
      }}
    >
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
        Daftar Rincian Sub-SLS
      </h3>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          textAlign: 'left',
          minWidth: '1000px',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '2px solid var(--border-light)',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            <th style={{ padding: '12px 8px' }}>Sub-SLS</th>
            <th style={{ padding: '12px 8px' }}>PCL (Pencacah)</th>
            <th style={{ padding: '12px 8px' }}>PML (Pengawas)</th>
            <th style={{ padding: '12px 8px' }}>Korlap</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Muatan</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Selesai</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>%</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Status</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Tgl Lapor</th>
            <th style={{ padding: '12px 8px', maxWidth: '180px' }}>Keterangan Kendala</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Peringatan</th>
          </tr>
        </thead>
        <tbody>
          {subSlsList.map((sub) => (
            <tr
              key={sub.id}
              onClick={() => onSelectSubSls(sub.id, `Sub-SLS ${sub.kodeSubsls}`)}
              style={getRowStyle(sub)}
              onMouseOver={(e) => {
                // Keep the color clean on hover
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.12)';
              }}
              onMouseOut={(e) => {
                // Restore original row color
                const originalStyle = getRowStyle(sub) as any;
                e.currentTarget.style.backgroundColor = originalStyle.backgroundColor || 'transparent';
              }}
            >
              <td style={{ padding: '14px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {sub.kodeSubsls}
              </td>
              <td style={{ padding: '14px 8px', fontWeight: 500 }}>{sub.namaPcl}</td>
              <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>{sub.namaPml}</td>
              <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>{sub.namaKorlap}</td>
              <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 600 }}>{sub.totalMuatan}</td>
              <td style={{ padding: '14px 8px', textAlign: 'right', color: 'var(--color-success-text)', fontWeight: 600 }}>
                {sub.selesai}
              </td>
              <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-base)' }}>
                {sub.persentase.toFixed(1)}%
              </td>
              <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                <Badge variant={statusVariants[sub.status]}>
                  {statusLabels[sub.status]}
                </Badge>
              </td>
              <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                {sub.tanggalLapor ? sub.tanggalLapor.split('-').reverse().join('/') : '-'}
              </td>
              <td
                style={{
                  padding: '14px 8px',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  maxWidth: '180px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={sub.keterangan || ''}
              >
                {sub.keterangan || '-'}
              </td>
              <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                {getAlertBadge(sub.alert) || <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
