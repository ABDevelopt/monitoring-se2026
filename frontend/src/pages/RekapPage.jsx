// frontend/src/pages/RekapPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { 
  FileSpreadsheet, Download, Filter, Loader2, AlertCircle,
  Database, RefreshCw, BarChart3, TrendingUp, CheckCircle, Clock
} from 'lucide-react';

export default function RekapPage() {
  const { user } = useAuth();
  
  // States
  const [kecamatanList, setKecamatanList] = useState([]);
  const [selectedKec, setSelectedKec] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingKec, setLoadingKec] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadingLevel, setDownloadingLevel] = useState(null);

  // Fetch Kecamatan
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'korlap') {
      const fetchKecamatan = async () => {
        try {
          setLoadingKec(true);
          const res = await api.get('/api/kecamatan');
          setKecamatanList(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingKec(false);
        }
      };
      fetchKecamatan();
    }
  }, [user]);

  // Fetch Dashboard Summary Data
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      setErrorMsg('');
      const res = await api.get('/api/dashboard');
      setSummaryData(res.data.summary);
    } catch (err) {
      setErrorMsg('Gagal memuat ringkasan data.');
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Export excel handler
  const handleExport = async (level) => {
    setDownloadingLevel(level);
    try {
      let url = `/api/export?level=${level}`;
      if (selectedKec) {
        url += `&kecamatanId=${selectedKec}`;
      }
      
      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      // Create element link to trigger download
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `rekap-se2026-ppu-${level}-${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Gagal mendownload file export Excel. Coba lagi nanti.');
      console.error(err);
    } finally {
      setDownloadingLevel(null);
    }
  };

  const showKecFilter = user?.role === 'admin' || user?.role === 'korlap';

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in">
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileSpreadsheet size={28} style={{ color: '#6366f1' }} />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Rekap & Ekspor Data</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '2px 0 0 0' }}>Unduh lembar rekapitulasi data hasil lapangan terintegrasi</p>
          </div>
        </div>
        
        <button 
          onClick={fetchSummary} 
          disabled={loadingSummary}
          className="btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
        >
          <RefreshCw size={16} className={loadingSummary ? 'spin' : ''} />
          Perbarui Ringkasan
        </button>
      </div>

      {/* Summary Cards */}
      {loadingSummary ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
          <Loader2 size={32} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : errorMsg ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Card Progress */}
          <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #6366f1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Total Progres Usaha</span>
              <div style={{ backgroundColor: 'rgba(99,102,241,0.15)', padding: '8px', borderRadius: '8px' }}>
                <TrendingUp size={18} style={{ color: '#6366f1' }} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginTop: '8px' }}>
              {Math.round(summaryData?.progressPersen || 0)}%
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {summaryData?.usahaSelesai} / {summaryData?.totalUsaha} usaha selesai dicacah
            </div>
          </div>

          {/* Card SLS Selesai */}
          <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Sub-SLS Selesai</span>
              <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '8px', borderRadius: '8px' }}>
                <CheckCircle size={18} style={{ color: '#10b981' }} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginTop: '8px' }}>
              {summaryData?.subSlsStats?.selesai || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Dari total {summaryData?.subSlsStats?.total || 0} Sub-SLS
            </div>
          </div>

          {/* Card SLS Berjalan */}
          <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Sub-SLS Progres</span>
              <div style={{ backgroundColor: 'rgba(59,130,246,0.15)', padding: '8px', borderRadius: '8px' }}>
                <Clock size={18} style={{ color: '#3b82f6' }} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginTop: '8px' }}>
              {summaryData?.subSlsStats?.progres || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Sedang dalam proses pencacahan
            </div>
          </div>

          {/* Card Belum Lapor */}
          <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #ef4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Belum Lapor / Kendala</span>
              <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', padding: '8px', borderRadius: '8px' }}>
                <AlertCircle size={18} style={{ color: '#ef4444' }} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginTop: '8px' }}>
              {(summaryData?.subSlsStats?.belumLapor || 0) + (summaryData?.subSlsStats?.tidakSelesai || 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {summaryData?.subSlsStats?.belumLapor || 0} Belum lapor, {summaryData?.subSlsStats?.tidakSelesai || 0} Bermasalah
            </div>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={20} style={{ color: '#6366f1' }} />
          Unduh File Laporan Excel (.xlsx)
        </h3>

        {/* Filter Kecamatan if allowed */}
        {showKecFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', maxWidth: '400px' }}>
            <Filter size={18} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: '14px', color: '#94a3b8', minWidth: '110px' }}>Filter Wilayah:</span>
            <select 
              className="form-control" 
              value={selectedKec} 
              onChange={e => setSelectedKec(e.target.value)}
              disabled={loadingKec}
              style={{ padding: '8px 12px' }}
            >
              <option value="">Semua Kecamatan (Seluruh Kab. PPU)</option>
              {kecamatanList.map(kec => (
                <option key={kec.id} value={kec.id}>{kec.nama}</option>
              ))}
            </select>
          </div>
        )}

        {/* Export Buttons Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Card Export Sub-SLS */}
          <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Ekspor Level Sub-SLS</h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                Detail rekapitulasi data per unit Sub-SLS, lengkap dengan nama petugas PCL, PML, Korlap, target usaha, realisasi pencacahan, dan tanggal lapor terakhir.
              </p>
            </div>
            <button 
              onClick={() => handleExport('subsls')}
              disabled={downloadingLevel !== null}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', width: '100%', fontWeight: 600 }}
            >
              {downloadingLevel === 'subsls' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
              Unduh Rekap Sub-SLS
            </button>
          </div>

          {/* Card Export SLS */}
          <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Ekspor Level SLS</h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                Rekapitulasi data agregat per satuan SLS. Menampilkan jumlah Sub-SLS di dalamnya, total muatan usaha, jumlah selesai, dan status progres cakupan SLS.
              </p>
            </div>
            <button 
              onClick={() => handleExport('sls')}
              disabled={downloadingLevel !== null}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', width: '100%', fontWeight: 600 }}
            >
              {downloadingLevel === 'sls' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
              Unduh Rekap SLS
            </button>
          </div>

          {/* Card Export Kecamatan */}
          <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Ekspor Level Kecamatan</h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                Ringkasan performa per kecamatan di Kabupaten Penajam Paser Utara. Cocok untuk laporan manajerial atau presentasi kemajuan harian BPS.
              </p>
            </div>
            <button 
              onClick={() => handleExport('kecamatan')}
              disabled={downloadingLevel !== null}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', width: '100%', fontWeight: 600 }}
            >
              {downloadingLevel === 'kecamatan' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
              Unduh Rekap Kecamatan
            </button>
          </div>

          {/* Card Export Harian */}
          <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Ekspor Riwayat Laporan Harian</h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                Log audit lengkap yang berisi seluruh data baris laporan harian yang diinputkan oleh PML/User sepanjang periode kegiatan monitoring.
              </p>
            </div>
            <button 
              onClick={() => handleExport('harian')}
              disabled={downloadingLevel !== null}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', width: '100%', fontWeight: 600 }}
            >
              {downloadingLevel === 'harian' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
              Unduh Riwayat Harian
            </button>
          </div>

          {/* Card Export EWS Alerts */}
          <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Ekspor Early Warning System (EWS)</h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                Daftar otomatis SLS yang stagnan, tidak lapor selama beberapa hari terakhir, atau berisiko tidak selesai tepat waktu sebelum batas akhir jadwal pencacahan.
              </p>
            </div>
            <button 
              onClick={() => handleExport('ews')}
              disabled={downloadingLevel !== null}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', width: '100%', fontWeight: 600, backgroundColor: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              {downloadingLevel === 'ews' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
              Unduh EWS Alerts
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
