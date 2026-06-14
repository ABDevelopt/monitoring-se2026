// src/components/dashboard/KorlapTable.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface KorlapTableProps {
  korlapList: {
    nama: string;
    kecamatan: string;
    totalSubSls: number;
    totalMuatan: number;
    selesai: number;
    countAlert: number;
  }[];
}

export function KorlapTable({ korlapList }: KorlapTableProps) {
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
        Progres Pendataan per Koordinator Lapangan (Korlap)
      </h3>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          textAlign: 'left',
          minWidth: '800px',
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
            <th style={{ padding: '12px 8px' }}>Nama Korlap</th>
            <th style={{ padding: '12px 8px' }}>Wilayah Kerja (Kecamatan)</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Total Sub-SLS</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Muatan</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Selesai</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>% Progress</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Peringatan</th>
          </tr>
        </thead>
        <tbody>
          {korlapList.map((korlap, idx) => {
            const progressPersen = korlap.totalMuatan > 0 ? (korlap.selesai / korlap.totalMuatan) * 100 : 100;

            return (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid var(--border-light)',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '14px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {korlap.nama}
                </td>
                <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>
                  {korlap.kecamatan}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>{korlap.totalSubSls}</td>
                <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 600 }}>
                  {korlap.totalMuatan.toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'right', color: 'var(--color-success-text)', fontWeight: 600 }}>
                  {korlap.selesai.toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-base)' }}>
                  {progressPersen.toFixed(2)}%
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {korlap.countAlert > 0 ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--color-danger-text)',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-danger-bg)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(231, 76, 60, 0.2)',
                        fontSize: '12px',
                      }}
                    >
                      <AlertTriangle size={14} />
                      {korlap.countAlert}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
