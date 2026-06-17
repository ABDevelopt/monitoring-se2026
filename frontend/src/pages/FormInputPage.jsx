// frontend/src/pages/FormInputPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { ClipboardEdit, Calendar, Map, Trash2, PlusCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function FormInputPage() {
  const { user } = useAuth();
  
  // Form States
  const [kecamatanList, setKecamatanList] = useState([]);
  const [desaList, setDesaList] = useState([]);
  const [slsList, setSlsList] = useState([]);
  const [subSlsList, setSubSlsList] = useState([]);
  
  const [selectedKec, setSelectedKec] = useState('');
  const [selectedDesa, setSelectedDesa] = useState('');
  const [selectedSls, setSelectedSls] = useState('');
  const [selectedSubSls, setSelectedSubSls] = useState('');
  
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jumlahSelesai, setJumlahSelesai] = useState('');
  const [status, setStatus] = useState('progres');
  const [keterangan, setKeterangan] = useState('');
  
  // Loading & Error States
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingError, setSubmittingError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Laporan List States
  const [laporanList, setLaporanList] = useState([]);
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [loadingLaporan, setLoadingLaporan] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Load Kecamatan on mount
  useEffect(() => {
    const fetchKecamatan = async () => {
      try {
        setLoadingDropdowns(true);
        const res = await api.get('/api/kecamatan');
        setKecamatanList(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDropdowns(false);
      }
    };
    fetchKecamatan();
  }, []);

  // Load Desa when Kecamatan changes
  useEffect(() => {
    if (!selectedKec) {
      setDesaList([]);
      setSelectedDesa('');
      return;
    }
    const fetchDesa = async () => {
      try {
        setLoadingDropdowns(true);
        const res = await api.get(`/api/desa?kecamatanId=${selectedKec}`);
        setDesaList(res.data);
        setSelectedDesa('');
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDropdowns(false);
      }
    };
    fetchDesa();
  }, [selectedKec]);

  // Load SLS when Desa changes
  useEffect(() => {
    if (!selectedDesa) {
      setSlsList([]);
      setSelectedSls('');
      return;
    }
    const fetchSls = async () => {
      try {
        setLoadingDropdowns(true);
        const res = await api.get(`/api/sls?desaId=${selectedDesa}`);
        setSlsList(res.data);
        setSelectedSls('');
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDropdowns(false);
      }
    };
    fetchSls();
  }, [selectedDesa]);

  // Load Sub-SLS when SLS changes
  useEffect(() => {
    if (!selectedSls) {
      setSubSlsList([]);
      setSelectedSubSls('');
      return;
    }
    const fetchSubSls = async () => {
      try {
        setLoadingDropdowns(true);
        const res = await api.get(`/api/subsls?slsId=${selectedSls}`);
        setSubSlsList(res.data);
        setSelectedSubSls('');
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDropdowns(false);
      }
    };
    fetchSubSls();
  }, [selectedSls]);

  // Load Laporan
  const fetchLaporan = async () => {
    try {
      setLoadingLaporan(true);
      const res = await api.get(`/api/laporan?tanggal=${filterTanggal}`);
      setLaporanList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLaporan(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [filterTanggal]);

  // Submit Laporan
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubSls || !tanggal || jumlahSelesai === '' || !status) {
      setSubmittingError('Harap lengkapi semua field utama form.');
      return;
    }
    if (status === 'tidak_selesai' && !keterangan.trim()) {
      setSubmittingError('Keterangan wajib diisi apabila status tidak selesai.');
      return;
    }

    setSubmitting(true);
    setSubmittingError('');
    setSuccessMsg('');

    try {
      await api.post('/api/laporan', {
        tanggal,
        idSubSls: parseInt(selectedSubSls),
        jumlahSelesai: parseInt(jumlahSelesai),
        status,
        keterangan: status === 'tidak_selesai' ? keterangan : ''
      });
      setSuccessMsg('Laporan berhasil disimpan!');
      setJumlahSelesai('');
      setKeterangan('');
      // Refresh list if the date matches
      if (tanggal === filterTanggal) {
        fetchLaporan();
      } else {
        setFilterTanggal(tanggal);
      }
    } catch (err) {
      setSubmittingError(err.response?.data?.error || 'Gagal menyimpan laporan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Laporan
  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/laporan?id=${id}`);
      setLaporanList(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus laporan.');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'selesai': return <span style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Selesai</span>;
      case 'tidak_selesai': return <span style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Tidak Selesai</span>;
      default: return <span style={{ color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Progres</span>;
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in">
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ClipboardEdit size={28} style={{ color: '#6366f1' }} />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Input Laporan Harian</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '2px 0 0 0' }}>Kirim dan pantau progres pencacahan harian</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }}>
        {/* Input Form Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} style={{ color: '#6366f1' }} />
            Form Input Progres
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {submittingError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '14px' }}>
                <AlertCircle size={18} />
                <span>{submittingError}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '14px' }}>
                <AlertCircle size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">Kecamatan</label>
                <select 
                  className="form-control" 
                  value={selectedKec} 
                  onChange={e => setSelectedKec(e.target.value)}
                  disabled={loadingDropdowns}
                >
                  <option value="">-- Pilih Kecamatan --</option>
                  {kecamatanList.map(kec => (
                    <option key={kec.id} value={kec.id}>{kec.nama || kec.namaKec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Desa / Kelurahan</label>
                <select 
                  className="form-control" 
                  value={selectedDesa} 
                  onChange={e => setSelectedDesa(e.target.value)}
                  disabled={loadingDropdowns || !selectedKec}
                >
                  <option value="">-- Pilih Desa --</option>
                  {desaList.map(desa => (
                    <option key={desa.id} value={desa.id}>{desa.nama || desa.namaDesa}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">SLS</label>
                <select 
                  className="form-control" 
                  value={selectedSls} 
                  onChange={e => setSelectedSls(e.target.value)}
                  disabled={loadingDropdowns || !selectedDesa}
                >
                  <option value="">-- Pilih SLS --</option>
                  {slsList.map(sls => (
                    <option key={sls.id} value={sls.id}>{sls.namaSls} ({sls.kodeSls})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Sub-SLS</label>
                <select 
                  className="form-control" 
                  value={selectedSubSls} 
                  onChange={e => setSelectedSubSls(e.target.value)}
                  disabled={loadingDropdowns || !selectedSls}
                >
                  <option value="">-- Pilih Sub-SLS --</option>
                  {subSlsList.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.namaSubSls || sub.idSubsls} ({sub.kodeSubsls})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">Tanggal Laporan</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={tanggal} 
                  onChange={e => setTanggal(e.target.value)} 
                />
              </div>

              <div>
                <label className="form-label">Jumlah Selesai (Muatan)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Contoh: 15" 
                  value={jumlahSelesai}
                  onChange={e => setJumlahSelesai(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Status Pencacahan</label>
                <select 
                  className="form-control" 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="progres">Progres</option>
                  <option value="selesai">Selesai</option>
                  <option value="tidak_selesai">Tidak Selesai (Ada Kendala)</option>
                </select>
              </div>
            </div>

            {status === 'tidak_selesai' && (
              <div>
                <label className="form-label">Keterangan Kendala</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Tuliskan kendala yang dihadapi di lapangan..."
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                ></textarea>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: 600 }}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={16} className="spin" /> : null}
                Simpan Laporan
              </button>
            </div>
          </form>
        </div>

        {/* Laporan List Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} style={{ color: '#6366f1' }} />
              Daftar Laporan Harian
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Filter Tanggal:</span>
              <input 
                type="date" 
                className="form-control" 
                style={{ padding: '6px 12px', width: 'auto' }} 
                value={filterTanggal} 
                onChange={e => setFilterTanggal(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Wilayah (Kec & Desa)</th>
                  <th style={{ textAlign: 'left' }}>SLS & Sub-SLS</th>
                  <th style={{ textAlign: 'center' }}>Target</th>
                  <th style={{ textAlign: 'center' }}>Selesai</th>
                  <th style={{ textAlign: 'center' }}>Progres (%)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'left' }}>Keterangan</th>
                  <th style={{ textAlign: 'left' }}>Oleh</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingLaporan ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                      <Loader2 size={24} style={{ color: '#6366f1', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
                      <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px', marginBottom: 0 }}>Memuat data laporan...</p>
                    </td>
                  </tr>
                ) : laporanList.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '14px' }}>
                      Tidak ada laporan yang diinputkan untuk tanggal ini.
                    </td>
                  </tr>
                ) : (
                  laporanList.map(item => {
                    const subSlsObj = item.subsls || {};
                    const slsObj = subSlsObj.sls || {};
                    const desaObj = slsObj.desa || {};
                    const kecObj = desaObj.kecamatan || {};
                    
                    const target = item.jumlahAssignment || 0;
                    const selesai = item.jumlahSelesai || 0;
                    const persen = target > 0 ? Math.round((selesai / target) * 100) : 0;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '14px' }}>{kecObj.nama || kecObj.namaKec || '-'}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{desaObj.nama || desaObj.namaDesa || '-'}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '14px' }}>{slsObj.namaSls || '-'}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Sub: {subSlsObj.namaSubSls || subSlsObj.idSubsls || '-'} ({subSlsObj.kodeSubsls || '-'})</div>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600 }}>{target}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', color: '#34d399', fontWeight: 600 }}>{selesai}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{persen}%</span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>{getStatusBadge(item.status)}</td>
                        <td style={{ padding: '12px 8px', fontSize: '13px', color: '#94a3b8', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.keterangan || ''}>
                          {item.keterangan || '-'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontSize: '13px', color: '#f1f5f9' }}>{item.user?.nama || '-'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{item.user?.role || ''}</div>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#ef4444', 
                              cursor: 'pointer', 
                              padding: '6px', 
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(239,68,68,0.1)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {deletingId === item.id ? (
                              <Loader2 size={14} className="spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
