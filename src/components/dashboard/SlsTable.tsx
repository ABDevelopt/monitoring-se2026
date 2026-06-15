// src/components/dashboard/SlsTable.tsx
import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface SlsTableProps {
  slsList: {
    id: number;
    kodeSls: string;
    namaSls: string;
    desaNama: string;
    jumlahSubSls: number;
    totalMuatan: number;
    selesai: number;
    countSelesai: number;
    countProgres: number;
    countTidakSelesai: number;
    countBelumLapor: number;
    countAlert: number;
  }[];
  onSelectSls: (id: number, name: string) => void;
}

export function SlsTable({ slsList, onSelectSls }: SlsTableProps) {
  if (!slsList) return null;
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
        Daftar SLS / RT di Kecamatan ini
      </h3>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          textAlign: 'left',
          minWidth: '950px',
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
            <th style={{ padding: '12px 8px' }}>Nama SLS / RT</th>
            <th style={{ padding: '12px 8px' }}>Desa/Kelurahan</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Sub-SLS</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Muatan</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Selesai</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Progres</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Kendala</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Belum Lapor</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>% Usaha</th>
            <th style={{ padding: '12px 16px', width: '140px' }}>Progress Bar</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Peringatan</th>
            <th style={{ padding: '12px 8px', width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {slsList.map((sls) => {
            const usahaPersen = sls.totalMuatan > 0 
              ? (sls.selesai / sls.totalMuatan) * 100 
              : (sls.jumlahSubSls > 0 
                  ? ((sls.countSelesai * 100 + sls.countProgres * 50) / sls.jumlahSubSls) 
                  : 0);

            return (
              <tr
                key={sls.id}
                onClick={() => onSelectSls(sls.id, sls.namaSls)}
                style={{
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '14px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {sls.namaSls}
                </td>
                <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>
                  {sls.desaNama}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>{sls.jumlahSubSls}</td>
                <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 600 }}>
                  {sls.totalMuatan.toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <Badge variant="success">{sls.countSelesai}</Badge>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <Badge variant="warning">{sls.countProgres}</Badge>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <Badge variant={sls.countTidakSelesai > 0 ? 'danger' : 'gray'}>
                    {sls.countTidakSelesai}
                  </Badge>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <Badge variant={sls.countBelumLapor > 0 ? 'info' : 'gray'}>
                    {sls.countBelumLapor}
                  </Badge>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-base)' }}>
                  {usahaPersen.toFixed(2)}%
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: 'var(--border-light)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(usahaPersen, 100)}%`,
                        backgroundColor: 'var(--primary-base)',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  {sls.countAlert > 0 ? (
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
                      <AlertCircle size={14} />
                      {sls.countAlert}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>
                  <ChevronRight size={18} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
