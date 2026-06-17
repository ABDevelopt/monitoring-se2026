// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  LayoutDashboard, AlertTriangle, TrendingUp, CheckCircle,
  Clock, XCircle, BarChart3, Loader2, RefreshCw
} from 'lucide-react';

function StatCard({ title, value, sub, color, icon: Icon }) {
  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{title}</span>
        <div style={{ backgroundColor: `${color}22`, padding: '8px', borderRadius: '8px' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#64748b' }}>{sub}</div>}
    </div>
  );
}

function AlertBadge({ level }) {
  const map = {
    kritis: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: '🔴 Kritis' },
    perhatian: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: '🟠 Perhatian' },
    risiko: { bg: 'rgba(234,179,8,0.15)', color: '#eab308', label: '🟡 Risiko' },
  };
  const s = map[level] || map.risiko;
  return <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: s.bg, color: s.color, fontWeight: 700 }}>{s.label}</span>;
}

function ProgressBar({ persen, color }) {
  return (
    <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(persen, 100)}%`, backgroundColor: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kecDetail, setKecDetail] = useState(null);
  const [loadingKec, setLoadingKec] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/dashboard');
      setData(res.data);
    } catch (err) {
      setError('Gagal memuat data dashboard. Silakan refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleKecClick = async (kec) => {
    if (kecDetail?.id === kec.id) { setKecDetail(null); return; }
    setLoadingKec(true);
    try {
      const res = await api.get(`/api/dashboard/kecamatan/${kec.id}`);
      setKecDetail({ ...res.data, id: kec.id, nama: kec.nama });
    } catch { } finally { setLoadingKec(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <Loader2 size={40} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#94a3b8' }}>Memuat data dashboard...</p>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <AlertTriangle size={40} style={{ color: '#ef4444' }} />
      <p style={{ color: '#94a3b8' }}>{error}</p>
      <button className="btn btn-primary" onClick={fetchData}>Coba Lagi</button>
    </div>
  );

  const s = data?.summary || {};
  const persen = s.progressPersen?.toFixed(1) || 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard size={22} style={{ color: '#6366f1' }} />
            Dashboard Monitoring
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>Sensus Ekonomi 2026 — Kabupaten Penajam Paser Utara</p>
        </div>
        <button className="btn btn-outline" onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[['dashboard', <BarChart3 size={15} />, 'Dashboard'], ['ews', <AlertTriangle size={15} />, `Peringatan Dini (${s.activeAlertsCount || 0})`]].map(([tab, icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.15s', backgroundColor: activeTab === tab ? '#6366f1' : 'transparent', color: activeTab === tab ? '#fff' : '#94a3b8' }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Progress Overview */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>Progress Keseluruhan</span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#6366f1' }}>{persen}%</span>
            </div>
            <ProgressBar persen={parseFloat(persen)} color="#6366f1" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
              <span>{s.usahaSelesai?.toLocaleString()} usaha selesai</span>
              <span>dari {s.totalUsaha?.toLocaleString()} total usaha</span>
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard title="Total Sub-SLS" value={s.subSlsStats?.total || 0} color="#6366f1" icon={LayoutDashboard} />
            <StatCard title="Selesai" value={s.subSlsStats?.selesai || 0} color="#10b981" icon={CheckCircle} sub={`${s.subSlsStats?.total ? ((s.subSlsStats.selesai / s.subSlsStats.total) * 100).toFixed(0) : 0}% dari total`} />
            <StatCard title="Progres" value={s.subSlsStats?.progres || 0} color="#f59e0b" icon={TrendingUp} />
            <StatCard title="Tidak Selesai" value={s.subSlsStats?.tidakSelesai || 0} color="#ef4444" icon={XCircle} />
            <StatCard title="Belum Lapor" value={s.subSlsStats?.belumLapor || 0} color="#64748b" icon={Clock} />
          </div>

          {/* Tabel Kecamatan (untuk admin & korlap) */}
          {data?.kecamatanList && user?.role !== 'pcl' && (
            <div className="glass-card" style={{ marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Rekapitulasi per Kecamatan</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      {['Kecamatan', 'Sub-SLS', 'Selesai', 'Progres', 'Tdk Selesai', 'Blm Lapor', 'Alert', 'Progress'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.kecamatanList.map((kec) => {
                      const p = kec.totalMuatan > 0 ? ((kec.selesai / kec.totalMuatan) * 100).toFixed(1) : 0;
                      return (
                        <tr key={kec.id} onClick={() => handleKecClick(kec)} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#6366f1', fontSize: '14px' }}>{kec.nama}</td>
                          <td style={{ padding: '12px 16px', color: '#f1f5f9' }}>{kec.totalSubSls}</td>
                          <td style={{ padding: '12px 16px', color: '#10b981' }}>{kec.countSelesai}</td>
                          <td style={{ padding: '12px 16px', color: '#f59e0b' }}>{kec.countProgres}</td>
                          <td style={{ padding: '12px 16px', color: '#ef4444' }}>{kec.countTidakSelesai}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{kec.countBelumLapor}</td>
                          <td style={{ padding: '12px 16px' }}>{kec.countAlert > 0 && <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠ {kec.countAlert}</span>}</td>
                          <td style={{ padding: '12px 16px', minWidth: '120px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1 }}><ProgressBar persen={parseFloat(p)} color="#6366f1" /></div>
                              <span style={{ fontSize: '12px', color: '#94a3b8', minWidth: '36px' }}>{p}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Kecamatan detail */}
              {loadingKec && <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}><Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite', display: 'inline' }} /> Memuat detail...</div>}
              {kecDetail && !loadingKec && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(99,102,241,0.05)' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#818cf8' }}>Detail: {kecDetail.nama}</h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                    Total SLS: {kecDetail.totalSls} | Sub-SLS: {kecDetail.totalSubSls} | Muatan: {kecDetail.totalMuatan?.toLocaleString()} | Selesai: {kecDetail.selesaiMuatan?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PCL: Tabel tugas sendiri */}
          {user?.role === 'pcl' && data?.kecamatanList && (
            <div className="glass-card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Daftar Tugas Saya</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    {['SLS', 'Desa', 'Muatan', 'Selesai', 'Progress', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {data.kecamatanList.map(sub => {
                      const statusColors = { selesai: '#10b981', progres: '#f59e0b', tidak_selesai: '#ef4444', belum_lapor: '#64748b' };
                      return (
                        <tr key={sub.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f1f5f9' }}>{sub.namaSls}</td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{sub.desaNama}</td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{sub.totalMuatan}</td>
                          <td style={{ padding: '12px 16px', color: '#10b981' }}>{sub.selesai}</td>
                          <td style={{ padding: '12px 16px', minWidth: '100px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1 }}><ProgressBar persen={sub.persentase} color="#6366f1" /></div>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{sub.persentase?.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: `${statusColors[sub.status]}22`, color: statusColors[sub.status], fontWeight: 700 }}>
                              {sub.status?.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'ews' && (
        <div className="glass-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} style={{ color: '#ef4444' }} />
              Peringatan Dini (EWS)
            </h3>
          </div>
          {data?.topAlerts?.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <CheckCircle size={40} style={{ color: '#10b981', marginBottom: '12px' }} />
              <p>Tidak ada peringatan aktif saat ini.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  {['Tingkat', 'PCL', 'PML', 'Kecamatan', 'SLS', 'Progress', 'Pesan'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data?.topAlerts?.map((alert, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 16px' }}><AlertBadge level={alert.tingkatKekritisan} /></td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap' }}>{alert.namaPcl}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{alert.namaPml}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{alert.kecamatan}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{alert.sls}</td>
                      <td style={{ padding: '12px 16px', minWidth: '100px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}><ProgressBar persen={alert.persentase} color="#ef4444" /></div>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{alert.persentase?.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', maxWidth: '250px' }}>{alert.pesan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
