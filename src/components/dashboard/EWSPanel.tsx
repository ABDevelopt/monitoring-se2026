// src/components/dashboard/EWSPanel.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EWSPanelProps {
  alerts: {
    subSlsId: number;
    idSubSls: string;
    namaPcl: string;
    namaPml: string;
    namaKorlap: string;
    totalMuatan: number;
    selesai: number;
    persentase: number;
    jenisAlert: 'tidak_aktif' | 'stagnan' | 'bermasalah' | 'risiko';
    tingkatKekritisan: 'kritis' | 'perhatian' | 'risiko';
    pesan: string;
    hariGap?: number;
    tanggalLaporTerakhir?: string | null;
    kecamatan: string;
    desa: string;
    sls: string;
  }[];
  onSelectSubSls: (id: number, name: string) => void;
  kecamatanList?: { id: number; nama: string }[];
}

export function EWSPanel({ alerts, onSelectSubSls, kecamatanList = [] }: EWSPanelProps) {
  const [filterKec, setFilterKec] = useState<string>('');

  const filteredAlerts = filterKec
    ? alerts.filter((a) => a.kecamatan === filterKec)
    : alerts;

  const getAlertHeaderStyle = (kekritisan: string) => {
    if (kekritisan === 'kritis') return { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', borderBottom: '1px solid rgba(231, 76, 60, 0.15)' };
    if (kekritisan === 'perhatian') return { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', borderBottom: '1px solid rgba(243, 156, 18, 0.15)' };
    return { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', borderBottom: '1px solid rgba(241, 196, 15, 0.15)' };
  };

  const getAlertBadgeLabel = (jenis: string) => {
    if (jenis === 'tidak_aktif') return 'Tidak Aktif';
    if (jenis === 'stagnan') return 'Stagnan';
    if (jenis === 'bermasalah') return 'Bermasalah (Laporan)';
    return 'Risiko Lambat';
  };

  const countKritis = filteredAlerts.filter(a => a.tingkatKekritisan === 'kritis').length;
  const countPerhatian = filteredAlerts.filter(a => a.tingkatKekritisan === 'perhatian').length;
  const countRisiko = filteredAlerts.filter(a => a.tingkatKekritisan === 'risiko').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Alert Header Summary & Filter */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: alerts.length > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
              color: alerts.length > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {alerts.length > 0 ? <ShieldAlert size={22} /> : <CheckCircle size={22} />}
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
              Sistem Deteksi Kendala Petugas
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {alerts.length > 0
                ? `Terdeteksi ${alerts.length} peringatan petugas terkendala secara keseluruhan.`
                : 'Semua petugas terdeteksi aktif, lancar, dan aman.'}
            </p>
          </div>
        </div>

        {/* Filters & Statistics Summary */}
        <div className="filters-container" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {alerts.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: 700 }}>
              <span style={{ color: 'var(--color-danger-text)', backgroundColor: 'var(--color-danger-bg)', padding: '4px 8px', borderRadius: '4px' }}>
                {countKritis} Kritis
              </span>
              <span style={{ color: 'var(--color-warning-text)', backgroundColor: 'var(--color-warning-bg)', padding: '4px 8px', borderRadius: '4px' }}>
                {countPerhatian} Perhatian
              </span>
              <span style={{ color: 'var(--color-warning-text)', backgroundColor: 'var(--color-warning-bg)', padding: '4px 8px', borderRadius: '4px' }}>
                {countRisiko} Risiko
              </span>
            </div>
          )}

          {kecamatanList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Filter Kecamatan:</span>
              <select
                className="form-control"
                value={filterKec}
                onChange={(e) => setFilterKec(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '13px', minWidth: '160px' }}
              >
                <option value="">Semua Kecamatan</option>
                {kecamatanList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid List of Alerts */}
      {filteredAlerts.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '60px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <CheckCircle size={48} style={{ color: 'var(--color-success-text)', strokeWidth: 1.5 }} />
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Aman Terkendali</h4>
          <p style={{ fontSize: '13px', margin: 0 }}>
            Tidak ada petugas yang terdeteksi stuck atau bermasalah di wilayah ini.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredAlerts.map((alert) => {
            const Icon = alert.tingkatKekritisan === 'kritis' ? AlertCircle : AlertTriangle;

            return (
              <div
                key={alert.subSlsId}
                className="card animate-fade-in"
                style={{
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: '1px solid var(--border-light)',
                }}
              >
                {/* Alert Card Header */}
                <div
                  style={{
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    ...getAlertHeaderStyle(alert.tingkatKekritisan),
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px' }}>
                    <Icon size={16} />
                    {getAlertBadgeLabel(alert.jenisAlert)}
                  </div>
                  <Badge variant={alert.tingkatKekritisan === 'kritis' ? 'danger' : 'warning'} size="sm">
                    {alert.tingkatKekritisan}
                  </Badge>
                </div>

                {/* Alert Card Body */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  {/* Location Context */}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{alert.kecamatan}</strong> &gt; {alert.desa}
                    <div style={{ fontWeight: 600, marginTop: '2px' }}>{alert.sls} (Sub-SLS {alert.idSubSls.slice(-2)})</div>
                  </div>

                  {/* Message Detail */}
                  <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-primary)', lineHeight: '1.4', fontWeight: 500 }}>
                    {alert.pesan}
                  </p>

                  {/* Workers Profile */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-light)',
                      borderBottom: '1px solid var(--border-light)',
                      padding: '10px 0',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div>
                      PCL: <strong style={{ color: 'var(--text-primary)' }}>{alert.namaPcl}</strong>
                    </div>
                    <div>
                      PML: <strong style={{ color: 'var(--text-primary)' }}>{alert.namaPml}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      Korlap: <strong style={{ color: 'var(--text-primary)' }}>{alert.namaKorlap}</strong>
                    </div>
                  </div>

                  {/* Progress Stats inside Alert Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <div>
                      Progress Usaha: <strong>{alert.selesai} / {alert.totalMuatan}</strong> ({alert.persentase.toFixed(1)}%)
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectSubSls(alert.subSlsId, `Sub-SLS ${alert.idSubSls.slice(-2)}`)}
                      style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}
                    >
                      Detail
                      <ArrowRight size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
