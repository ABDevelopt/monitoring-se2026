// src/components/dashboard/KecamatanTable.tsx
import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface KecamatanTableProps {
  kecamatanList: {
    id: number;
    kode: string;
    nama: string;
    totalSubSls: number;
    totalMuatan: number;
    selesai: number;
    countSelesai: number;
    countProgres: number;
    countTidakSelesai: number;
    countBelumLapor: number;
    countAlert: number;
  }[];
  onSelectKecamatan: (id: number, name: string) => void;
}

export function KecamatanTable({ kecamatanList, onSelectKecamatan }: KecamatanTableProps) {
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
        Progres Pendataan per Kecamatan
      </h3>
      
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          textAlign: 'left',
          minWidth: '900px',
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
            <th style={{ padding: '12px 8px' }}>Kecamatan</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Total Sub-SLS</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Muatan</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Selesai</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Progres</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Kendala</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Belum Lapor</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>% Usaha</th>
            <th style={{ padding: '12px 16px', width: '150px' }}>Progress Bar</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Peringatan</th>
            <th style={{ padding: '12px 8px', width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {kecamatanList.map((kec) => {
            const usahaPersen = kec.totalMuatan > 0 
              ? (kec.selesai / kec.totalMuatan) * 100 
              : (kec.totalSubSls > 0 
                  ? ((kec.countSelesai * 100 + kec.countProgres * 50) / kec.totalSubSls) 
                  : 0);
            
            return (
              <tr
                key={kec.id}
                onClick={() => onSelectKecamatan(kec.id, kec.nama)}
                style={{
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '14px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {kec.nama}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>{kec.totalSubSls}</td>
                <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 600 }}>
                  {kec.totalMuatan.toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <Badge variant="success">{kec.countSelesai}</Badge>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <Badge variant="warning">{kec.countProgres}</Badge>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <Badge variant={kec.countTidakSelesai > 0 ? 'danger' : 'gray'}>
                    {kec.countTidakSelesai}
                  </Badge>
                </td>
                <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <Badge variant={kec.countBelumLapor > 0 ? 'info' : 'gray'}>
                    {kec.countBelumLapor}
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
                  {kec.countAlert > 0 ? (
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
                      {kec.countAlert}
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
