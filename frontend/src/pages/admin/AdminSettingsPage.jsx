// frontend/src/pages/admin/AdminSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Settings, Save, AlertCircle, CheckCircle2, Loader2, Calendar, ShieldAlert } from 'lucide-react';

export default function AdminSettingsPage() {
  // States
  const [appName, setAppName] = useState('');
  const [ewsThresholdHari, setEwsThresholdHari] = useState(3);
  const [periodeMulai, setPeriodeMulai] = useState('');
  const [periodeSelesai, setPeriodeSelesai] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await api.get('/api/admin/settings');
        const data = res.data;
        
        setAppName(data.appName || 'Monitoring SE2026 PPU');
        setEwsThresholdHari(data.ewsThresholdHari !== undefined ? data.ewsThresholdHari : 3);
        
        // Format date to YYYY-MM-DD
        if (data.periodeMulai) {
          setPeriodeMulai(new Date(data.periodeMulai).toISOString().split('T')[0]);
        }
        if (data.periodeSelesai) {
          setPeriodeSelesai(new Date(data.periodeSelesai).toISOString().split('T')[0]);
        }
      } catch (err) {
        setErrorMsg('Gagal memuat konfigurasi pengaturan.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appName || ewsThresholdHari === '' || !periodeMulai || !periodeSelesai) {
      setErrorMsg('Harap lengkapi semua field formulir.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/api/admin/settings', {
        appName,
        ewsThresholdHari: parseInt(ewsThresholdHari),
        periodeMulai,
        periodeSelesai
      });
      setSuccessMsg('Pengaturan berhasil disimpan!');
      const updated = res.data.settings;
      setAppName(updated.appName);
      setEwsThresholdHari(updated.ewsThresholdHari);
      if (updated.periodeMulai) setPeriodeMulai(new Date(updated.periodeMulai).toISOString().split('T')[0]);
      if (updated.periodeSelesai) setPeriodeSelesai(new Date(updated.periodeSelesai).toISOString().split('T')[0]);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Gagal menyimpan pengaturan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }} className="fade-in">
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Settings size={28} style={{ color: '#6366f1' }} />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Pengaturan Aplikasi</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '2px 0 0 0' }}>Kelola variabel global, durasi peringatan EWS, dan periode pencacahan</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <Loader2 size={32} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '14px' }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '14px' }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* App Name Section */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Nama Aplikasi (Judul Dashboard)</label>
              <input 
                type="text" 
                className="form-control" 
                value={appName}
                onChange={e => setAppName(e.target.value)}
                placeholder="Contoh: Monitoring Sensus Ekonomi 2026"
                required
              />
            </div>

            {/* EWS Section */}
            <div style={{ border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '20px', backgroundColor: 'rgba(245,158,11,0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '14px' }}>
                <ShieldAlert size={18} />
                <span>Konfigurasi Early Warning System (EWS)</span>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                Masukkan batas maksimum hari sejak laporan terakhir. Jika PML/PCL tidak mengirimkan laporan harian melebihi batas ini, SLS terkait akan ditandai dengan peringatan <b>"Tidak Aktif"</b> atau <b>"Stagnan"</b>.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Batas Peringatan:</span>
                <input 
                  type="number" 
                  className="form-control" 
                  style={{ width: '80px', textAlign: 'center', padding: '8px' }}
                  value={ewsThresholdHari}
                  onChange={e => setEwsThresholdHari(e.target.value)}
                  min="1"
                  required
                />
                <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Hari</span>
              </div>
            </div>

            {/* Timeline Period Section */}
            <div style={{ border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '20px', backgroundColor: 'rgba(99,102,241,0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 700, fontSize: '14px' }}>
                <Calendar size={18} />
                <span>Periode Aktif Kegiatan Pencacahan</span>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 4px 0', lineHeight: 1.4 }}>
                Batas waktu mulai dan berakhirnya kegiatan lapangan untuk menghitung sisa waktu pengerjaan.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Tanggal Mulai</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={periodeMulai}
                    onChange={e => setPeriodeMulai(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Tanggal Selesai</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={periodeSelesai}
                    onChange={e => setPeriodeSelesai(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontWeight: 600 }}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                Simpan Pengaturan
              </button>
            </div>
            
          </form>
        </div>
      )}
      
    </div>
  );
}
