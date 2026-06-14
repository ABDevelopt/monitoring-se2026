// src/components/dashboard/ProgressChart.tsx
'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProgressChartProps {
  trendData: {
    tanggal: string;
    selesai: number;
    progres: number;
    tidakSelesai: number;
    totalSelesai: number;
  }[];
}

export function ProgressChart({ trendData }: ProgressChartProps) {
  // Format labels: Ubah YYYY-MM-DD menjadi format DD/MM
  const labels = trendData.map((d) => {
    const parts = d.tanggal.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  const selesaiData = trendData.map((d) => d.selesai);
  const progresData = trendData.map((d) => d.progres);
  const totalData = trendData.map((d) => d.totalSelesai);

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Tercacah',
        data: totalData,
        borderColor: '#22d3ee', // Neon Cyan
        backgroundColor: 'rgba(34, 211, 238, 0.12)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#22d3ee',
        pointBorderColor: '#0a0e1a',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
      {
        label: 'Selesai 100%',
        data: selesaiData,
        borderColor: '#10b981', // Emerald Green
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        tension: 0.3,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#0a0e1a',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 7,
        borderDash: [5, 5],
      },
      {
        label: 'Progres',
        data: progresData,
        borderColor: '#f59e0b', // Vibrant Amber
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        tension: 0.3,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#0a0e1a',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 7,
      }
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: 'Inter, sans-serif',
            size: 11,
            weight: 'bold',
          },
          boxWidth: 6,
        },
      },
      tooltip: {
        padding: 12,
        titleFont: {
          family: 'Inter, sans-serif',
          size: 13,
          weight: 'bold',
        },
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 12,
        },
        backgroundColor: 'rgba(30, 35, 64, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            family: 'Inter, sans-serif',
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            family: 'Inter, sans-serif',
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        marginBottom: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
        Tren Harian Hasil Pencacahan (7 Hari Terakhir)
      </h3>
      <div style={{ height: '320px', position: 'relative', width: '100%' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
