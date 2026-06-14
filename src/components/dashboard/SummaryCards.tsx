// src/components/dashboard/SummaryCards.tsx
import React from 'react';
import { Database, CheckCircle2, TrendingUp, HelpCircle, AlertTriangle, PlayCircle } from 'lucide-react';

interface SummaryCardsProps {
  stats: {
    totalUsaha: number;
    usahaSelesai: number;
    progressPersen: number;
    subSlsStats: {
      total: number;
      selesai: number;
      progres: number;
      tidakSelesai: number;
      belumLapor: number;
    };
    activeAlertsCount: number;
  };
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Usaha Target',
      value: stats.totalUsaha.toLocaleString('id-ID'),
      icon: Database,
      color: 'var(--primary-base)',
      bgColor: 'var(--primary-glow)',
      desc: 'Beban target Kabupaten PPU',
    },
    {
      title: 'Usaha Selesai Dicacah',
      value: stats.usahaSelesai.toLocaleString('id-ID'),
      icon: CheckCircle2,
      color: 'var(--color-success-text)',
      bgColor: 'var(--color-success-bg)',
      desc: `${stats.usahaSelesai.toLocaleString('id-ID')} dari ${stats.totalUsaha.toLocaleString('id-ID')} usaha`,
    },
    {
      title: 'Progres Usaha Selesai',
      value: `${stats.progressPersen.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'var(--accent-base)',
      bgColor: 'var(--primary-glow)',
      desc: 'Persentase pencacahan usaha',
    },
    {
      title: 'Sub-SLS Selesai 100%',
      value: `${stats.subSlsStats.selesai} SLS`,
      icon: CheckCircle2,
      color: 'var(--color-success-text)',
      bgColor: 'var(--color-success-bg)',
      desc: `${((stats.subSlsStats.selesai / stats.subSlsStats.total) * 100).toFixed(1)}% dari total sub-SLS`,
    },
    {
      title: 'Sub-SLS Aktif (Progres/Kendala)',
      value: `${stats.subSlsStats.progres + stats.subSlsStats.tidakSelesai} SLS`,
      icon: PlayCircle,
      color: 'var(--color-warning-text)',
      bgColor: 'var(--color-warning-bg)',
      desc: `${stats.subSlsStats.progres} Progres | ${stats.subSlsStats.tidakSelesai} Kendala`,
    },
    {
      title: 'Peringatan Kendala',
      value: `${stats.activeAlertsCount} Peringatan`,
      icon: AlertTriangle,
      color: stats.activeAlertsCount > 0 ? 'var(--color-danger-text)' : 'var(--text-muted)',
      bgColor: stats.activeAlertsCount > 0 ? 'var(--color-danger-bg)' : 'var(--bg-app)',
      desc: stats.activeAlertsCount > 0 ? 'Petugas terdeteksi terkendala' : 'Tidak ada kendala aktif',
      highlight: stats.activeAlertsCount > 0,
    },
  ];

  return (
    <div className="summary-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <div
            key={idx}
            className={`card summary-card ${card.highlight ? 'highlight' : ''}`}
          >
            <div className="summary-card-content">
              <span className="summary-card-title">
                {card.title}
              </span>
              <span className="summary-card-value">
                {card.value}
              </span>
              <span className="summary-card-desc">
                {card.desc}
              </span>
            </div>

            <div
              className="summary-card-icon-wrapper"
              style={{
                backgroundColor: card.bgColor,
                color: card.color,
              }}
            >
              <Icon size={24} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
