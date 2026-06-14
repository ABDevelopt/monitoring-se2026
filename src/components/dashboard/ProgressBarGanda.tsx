// src/components/dashboard/ProgressBarGanda.tsx
import React from 'react';

interface ProgressBarGandaProps {
  subSlsStats: {
    total: number;
    selesai: number;
  };
  usahaStats: {
    total: number;
    selesai: number;
  };
}

export function ProgressBarGanda({ subSlsStats, usahastats: usahaStatsRaw }: any) {
  // Safe extraction of props because parameter casing might vary slightly
  const subSlsTotal = subSlsStats?.total || 0;
  const subSlsSelesai = subSlsStats?.selesai || 0;
  
  // Find which key was passed for usahaStats
  const uStats = usahaStatsRaw || subSlsStats; // fallback
  const usahaTotal = uStats?.totalUsaha || uStats?.total || 0;
  const usahaSelesai = uStats?.usahaSelesai || uStats?.selesai || 0;

  const subSlsPersen = subSlsTotal > 0 ? (subSlsSelesai / subSlsTotal) * 100 : 100;
  const usahaPersen = usahaTotal > 0 ? (usahaSelesai / usahaTotal) * 100 : 100;

  return (
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
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
        Perbandingan Progress Pendataan
      </h3>

      {/* Progress Sub-SLS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-primary)' }}>Progress Sub-SLS Selesai 100%</span>
          <span style={{ color: 'var(--color-success-text)' }}>
            {subSlsSelesai} / {subSlsTotal} SLS ({subSlsPersen.toFixed(2)}%)
          </span>
        </div>
        <div
          style={{
            height: '14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: '50px',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(subSlsPersen, 100)}%`,
              backgroundColor: 'var(--color-success)',
              borderRadius: '50px',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      </div>

      {/* Progress Volume Usaha */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-primary)' }}>Progress Volume Usaha Tercacah</span>
          <span style={{ color: 'var(--accent-base)' }}>
            {usahaSelesai.toLocaleString('id-ID')} / {usahaTotal.toLocaleString('id-ID')} Usaha ({usahaPersen.toFixed(2)}%)
          </span>
        </div>
        <div
          style={{
            height: '14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: '50px',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(usahaPersen, 100)}%`,
              backgroundColor: 'var(--accent-base)',
              borderRadius: '50px',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
