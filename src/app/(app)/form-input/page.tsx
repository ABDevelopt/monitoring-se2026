// src/app/(app)/form-input/page.tsx
'use client';

import React, { useState, useEffect, use } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getSession, SessionPayload } from '@/lib/auth';
import { ClipboardEdit, Calendar, MapPin, Database, AlertCircle, ArrowLeft, CheckCircle2, Edit2, Trash2, XCircle, User, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface FormInputPageProps {
  searchParams: Promise<{ subSlsId?: string }>;
}

export default function FormInputPage({ searchParams }: FormInputPageProps) {
  const { subSlsId: querySubSlsId } = use(searchParams);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  // Form selections
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);
  const [slsList, setSlsList] = useState<any[]>([]);
  const [subSlsList, setSubSlsList] = useState<any[]>([]);
  const [pclAssignments, setPclAssignments] = useState<any[]>([]); // Khusus PCL

  const [selectedKec, setSelectedKec] = useState<string>('');
  const [selectedDesa, setSelectedDesa] = useState<string>('');
  const [selectedSls, setSelectedSls] = useState<string>('');
  const [selectedSubSls, setSelectedSubSls] = useState<string>('');

  // Auto-filled info
  const [subSlsInfo, setSubSlsInfo] = useState<any>(null);

  // Form inputs
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [jumlahSelesai, setJumlahSelesai] = useState<string>('');
  const [status, setStatus] = useState<string>('progres');
  const [keterangan, setKeterangan] = useState<string>('');

  // Edit/Delete States
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState<boolean>(false);

  // Status submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch session & load reports
  const fetchRecentReports = async () => {
    setIsLoadingRecent(true);
    try {
      const res = await fetch('/api/laporan');
      if (res.ok) {
        const data = await res.json();
        setRecentReports(data);
      }
    } catch (err) {
      console.error('Failed to fetch recent reports', err);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleEdit = (report: any) => {
    setEditMode(true);
    setEditId(report.id);
    
    // Set form fields based on report
    setTanggal(report.tanggal.split('T')[0]);
    if (report.subsls?.sls?.desa?.idKecamatan) {
      setSelectedKec(report.subsls.sls.desa.idKecamatan.toString());
      setSelectedDesa(report.subsls.sls.idDesa.toString());
      setSelectedSls(report.subsls.idSls.toString());
    }
    setSelectedSubSls(report.idSubsls.toString());
    setSubSlsInfo(report.subsls);
    setJumlahSelesai(report.jumlahSelesai.toString());
    setStatus(report.status);
    setKeterangan(report.keterangan || '');
    
    // Scroll form into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditId(null);
    
    // Reset form fields
    setSelectedSubSls('');
    setSubSlsInfo(null);
    setJumlahSelesai('');
    setKeterangan('');
    setStatus('progres');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    
    try {
      const res = await fetch(`/api/laporan?id=${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menghapus laporan.');
      }
      
      setMessage({ type: 'success', text: 'Laporan berhasil dihapus!' });
      
      if (editMode && editId === id) {
        handleCancelEdit();
      }
      
      fetchRecentReports();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menghapus laporan.' });
    }
  };

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/dashboard'); // API dashboard butuh auth
        const verifyRes = await fetch('/api/kecamatan'); // endpoint publik yang terproteksi middleware
        if (verifyRes.status === 401) {
          window.location.href = '/login';
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Ambil session
    async function getSessionFromAction() {
      try {
        const resSession = await fetch('/api/auth/session');
        if (resSession.ok) {
          const s = await resSession.json();
          if (s.role === 'pcl') {
            window.location.href = '/dashboard';
            return;
          }
          setSession(s);
          
          // Load recent reports for history section
          fetchRecentReports();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSession(false);
      }
    }

    getSessionFromAction();
  }, []);

  // Fetch Kecamatan jika admin/korlap
  useEffect(() => {
    if (!session) return;
    
    if (session.role === 'admin' || session.role === 'korlap') {
      fetch('/api/kecamatan')
        .then((res) => res.json())
        .then((data) => setKecamatanList(data))
        .catch((err) => console.error(err));
    } else if (session.role === 'pml' && session.idKecamatan) {
      // PML langsung dapat kecamatan miliknya
      fetch('/api/kecamatan')
        .then((res) => res.json())
        .then((data) => {
          const pmlKec = data.find((k: any) => k.id === session.idKecamatan);
          if (pmlKec) {
            setKecamatanList([pmlKec]);
            setSelectedKec(pmlKec.id.toString());
          }
        });
    } else if (session.role === 'pcl') {
      // PCL langsung muat semua tugas sub-SLS miliknya
      // Kita bisa load tugas PCL dengan query list laporan terakhir
      fetch('/api/laporan')
        .then((res) => res.json())
        .then((data) => {
          // Ekstrak sub-SLS unik dari data laporan/tugas
          const assignments: any[] = [];
          const seen = new Set();
          
          data.forEach((lap: any) => {
            if (lap.subsls && !seen.has(lap.subsls.id)) {
              seen.add(lap.subsls.id);
              assignments.push(lap.subsls);
            }
          });

          // Jika kosong (karena belum pernah lapor), fetch dari API ews (yang memfilter subsls PCL)
          if (assignments.length === 0) {
            fetch('/api/ews')
              .then((res) => res.json())
              .then((ewsData) => {
                const ewsAss = ewsData.alerts || [];
                // alerts memuat subSlsId, idSubSls, namaPcl, dll.
                // Kita buat fallback agar PML/PCL bisa pilih.
                // Namun seeding tugasPcl menjamin penugasan. Kita bisa fetch dari endpoint khusus assignments.
              });
          }
          
          // Agar 100% aman dan dinamis, mari kita sediakan endpoint list tugas di subsls
          // Tapi kita bisa fetch dari API dashboard kabupaten (yang sudah memfilter tugas PCL!)
          fetch('/api/dashboard')
            .then((res) => res.json())
            .then((dash) => {
              // Di Dashboard PCL, kecamatanList berisi daftar sub-SLS tugas PCL
              const tugas = dash.kecamatanList || [];
              setPclAssignments(tugas);
              
              if (querySubSlsId) {
                const querySub = tugas.find((t: any) => t.id === parseInt(querySubSlsId));
                if (querySub) {
                  setSelectedSubSls(querySub.id.toString());
                  setSubSlsInfo(querySub);
                }
              }
            });
        });
    }
  }, [session, querySubSlsId]);

  // Fetch Desa jika selectedKec berubah
  useEffect(() => {
    if (!selectedKec) {
      setDesaList([]);
      setSelectedDesa('');
      return;
    }
    fetch(`/api/desa?kecamatanId=${selectedKec}`)
      .then((res) => res.json())
      .then((data) => setDesaList(data))
      .catch((err) => console.error(err));
  }, [selectedKec]);

  // Fetch SLS jika selectedDesa berubah
  useEffect(() => {
    if (!selectedDesa) {
      setSlsList([]);
      setSelectedSls('');
      return;
    }
    fetch(`/api/sls?desaId=${selectedDesa}`)
      .then((res) => res.json())
      .then((data) => setSlsList(data))
      .catch((err) => console.error(err));
  }, [selectedDesa]);

  // Fetch Sub-SLS jika selectedSls berubah
  useEffect(() => {
    if (!selectedSls) {
      setSubSlsList([]);
      setSelectedSubSls('');
      return;
    }
    fetch(`/api/subsls?slsId=${selectedSls}`)
      .then((res) => res.json())
      .then((data) => setSubSlsList(data))
      .catch((err) => console.error(err));
  }, [selectedSls]);

  // Muat detail Sub-SLS jika terpilih
  useEffect(() => {
    if (!selectedSubSls) {
      setSubSlsInfo(null);
      setJumlahSelesai('');
      return;
    }

    if (session?.role === 'pcl') {
      const selected = pclAssignments.find((a) => a.id === parseInt(selectedSubSls));
      if (selected) {
        setSubSlsInfo(selected);
        // Load progress terakhir ke field
        setJumlahSelesai(selected.selesai.toString());
      }
    } else {
      const selected = subSlsList.find((s) => s.id === parseInt(selectedSubSls));
      if (selected) {
        setSubSlsInfo(selected);
        // Fetch progress terakhir dari database
        fetch(`/api/dashboard/subsls/${selected.id}`)
          .then((res) => res.json())
          .then((detail) => {
            if (detail.subsls) {
              setJumlahSelesai(detail.subsls.selesai.toString());
            }
          });
      }
    }
  }, [selectedSubSls, subSlsList, pclAssignments, session]);

  // Handle redirect querySubSlsId untuk Admin/PML
  useEffect(() => {
    if (querySubSlsId && session && session.role !== 'pcl' && subSlsList.length === 0) {
      // Fetch detail sub-sls untuk mengisi cascade dropdowns secara otomatis
      fetch(`/api/dashboard/subsls/${querySubSlsId}`)
        .then((res) => res.json())
        .then((detail) => {
          if (detail.subsls) {
            const sub = detail.subsls;
            // Kita harus set selectedKec, selectedDesa, selectedSls, lalu selectedSubSls.
            // Namun fetch-fetch di atas bergantung pada hook. Kita bisa set secara berurutan:
            // Tapi yang paling cepat adalah melompati cascade dropdown dan langsung mengeset subSlsInfo!
            setSubSlsInfo(sub);
            setSelectedSubSls(querySubSlsId);
            setJumlahSelesai(sub.selesai.toString());
          }
        });
    }
  }, [querySubSlsId, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSls || jumlahSelesai === '' || !status) return;

    const finishedCount = parseInt(jumlahSelesai);
    if (isNaN(finishedCount)) {
      setMessage({ type: 'error', text: 'Jumlah selesai dicacah harus berupa angka.' });
      return;
    }

    if (status === 'tidak_selesai' && !keterangan.trim()) {
      setMessage({ type: 'error', text: 'Keterangan kendala wajib diisi jika status tidak selesai.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload: any = {
        tanggal,
        idSubSls: selectedSubSls,
        jumlahSelesai: finishedCount,
        status,
        keterangan: status === 'tidak_selesai' ? keterangan : '',
      };
      if (editMode && editId) {
        payload.id = editId;
      }

      const res = await fetch('/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan laporan.');
      }

      setMessage({ type: 'success', text: editMode ? 'Laporan harian berhasil diperbarui!' : 'Laporan harian berhasil disimpan!' });
      
      // Reset edit states
      setEditMode(false);
      setEditId(null);

      // Refresh list
      fetchRecentReports();
      
      // Reset form fields
      setSelectedSubSls('');
      setSubSlsInfo(null);
      setJumlahSelesai('');
      setKeterangan('');
      setStatus('progres');
      
      // Jika PCL, update local assignments data
      if (session?.role === 'pcl') {
        setPclAssignments(prev =>
          prev.map(a => a.id === parseInt(selectedSubSls) ? { ...a, selesai: finishedCount } : a)
        );
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      <PageHeader
        title="Form Input Laporan Harian"
        description="Pencatatan progres harian pendataan usaha Sensus Ekonomi 2026 tingkat Sub-SLS."
      />

      {/* Form Card */}
      <div className="card animate-fade-in" style={{ padding: '32px' }}>
        
        {/* Banner Alert Feedback */}
        {message && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '8px',
              backgroundColor: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: message.type === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
              border: `1px solid ${message.type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'}`,
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Tanggal Laporan */}
          <div className="form-group">
            <label className="form-label" htmlFor="tanggal">
              Hari / Tanggal Pendataan
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                id="tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Cascade Dropdowns for Admin/Korlap/PML */}
          {session?.role !== 'pcl' && !querySubSlsId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
              {/* Kecamatan */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Kecamatan</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {kecamatanList.map((k) => (
                    <label
                      key={k.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: selectedKec === k.id.toString() ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                        backgroundColor: selectedKec === k.id.toString() ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: session?.role === 'pml' ? 'not-allowed' : 'pointer',
                        transition: 'all var(--transition-fast)',
                        color: selectedKec === k.id.toString() ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        opacity: session?.role === 'pml' && selectedKec !== k.id.toString() ? 0.5 : 1,
                      }}
                    >
                      <input
                        type="radio"
                        name="kecamatan"
                        value={k.id}
                        checked={selectedKec === k.id.toString()}
                        onChange={(e) => setSelectedKec(e.target.value)}
                        disabled={session?.role === 'pml'}
                        style={{
                          accentColor: 'var(--primary)',
                          cursor: session?.role === 'pml' ? 'not-allowed' : 'pointer',
                        }}
                      />
                      {k.namaKec}
                    </label>
                  ))}
                </div>
              </div>

              {/* Desa, SLS, Sub-SLS Grid */}
              <div className="grid grid-cols-3" style={{ gap: '16px' }}>
                {/* Desa */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="desa">Desa / Kelurahan</label>
                  <select
                    className="form-control"
                    id="desa"
                    value={selectedDesa}
                    onChange={(e) => setSelectedDesa(e.target.value)}
                    required
                    disabled={!selectedKec}
                  >
                    <option value="">-- Pilih Desa/Kel --</option>
                    {desaList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.namaDesa}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SLS */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="sls">SLS / RT</label>
                  <select
                    className="form-control"
                    id="sls"
                    value={selectedSls}
                    onChange={(e) => setSelectedSls(e.target.value)}
                    required
                    disabled={!selectedDesa}
                  >
                    <option value="">-- Pilih SLS/RT --</option>
                    {slsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.namaSls}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-SLS */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="subsls">Sub-SLS</label>
                  <select
                    className="form-control"
                    id="subsls"
                    value={selectedSubSls}
                    onChange={(e) => setSelectedSubSls(e.target.value)}
                    required
                    disabled={!selectedSls}
                  >
                    <option value="">-- Pilih Sub-SLS --</option>
                    {subSlsList.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        Sub-SLS {sub.kodeSubsls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Simple Dropdown for PCL (Optimized UX) */}
          {session?.role === 'pcl' && (
            <div className="form-group">
              <label className="form-label" htmlFor="pcl-subsls">
                Pilih Sub-SLS Tugas Anda
              </label>
              <select
                className="form-control"
                id="pcl-subsls"
                value={selectedSubSls}
                onChange={(e) => setSelectedSubSls(e.target.value)}
                required
                style={{ width: '100%' }}
              >
                <option value="">-- Pilih Sub-SLS --</option>
                {pclAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    Sub-SLS {a.idSubSls.slice(-2)} - {a.namaSls} ({a.desaNama})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Context header jika querySubSlsId aktif */}
          {querySubSlsId && subSlsInfo && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                marginBottom: '20px',
                fontSize: '13px',
              }}
            >
              <strong style={{ color: 'var(--primary-base)' }}>Sub-SLS Terpilih: </strong>
              {subSlsInfo.idSubSls} - {subSlsInfo.sls || subSlsInfo.namaSls} ({subSlsInfo.desa || subSlsInfo.desaNama})
            </div>
          )}

          {/* Auto-filled Info Panel */}
          {subSlsInfo && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '28px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                animation: 'fadeIn var(--transition-fast) forwards',
              }}
            >
              {/* PCL Pencacah */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PCL Pencacah
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {subSlsInfo.namaPcl || subSlsInfo.pcl || '-'}
                  </div>
                </div>
              </div>

              {/* PML Pengawas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: 'var(--color-info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PML Pengawas
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {subSlsInfo.namaPml || subSlsInfo.pml || '-'}
                  </div>
                </div>
              </div>

              {/* Korlap */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: 'var(--color-warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Korlap
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {subSlsInfo.namaKorlap || subSlsInfo.korlap || '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Laporan Details */}
          {subSlsInfo && (
            <>
              {/* Muatan Target (Read Only) & Jumlah Selesai */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Total Muatan Target (Usaha)</label>
                  <div
                    className="form-control"
                    style={{
                      backgroundColor: 'var(--bg-app)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Database size={16} />
                    {subSlsInfo.totalMuatanAssignment || subSlsInfo.totalMuatan}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="selesai">Jumlah Selesai Dicacah</label>
                  <input
                    className="form-control"
                    id="selesai"
                    type="number"
                    min="0"
                    value={jumlahSelesai}
                    onChange={(e) => setJumlahSelesai(e.target.value)}
                    placeholder="Masukkan jumlah usaha selesai"
                    required
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                    💡 <em>Isian ini adalah total seluruh usaha yang sudah selesai didata di lapangan sampai hari tersebut, meskipun datanya belum dikirim secara resmi.</em>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">Status Penyelesaian</label>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="status"
                      value="selesai"
                      checked={status === 'selesai'}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-success)' }}
                    />
                    Selesai 100%
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="status"
                      value="progres"
                      checked={status === 'progres'}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-warning)' }}
                    />
                    Selesai Sebagian
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="status"
                      value="tidak_selesai"
                      checked={status === 'tidak_selesai'}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-danger)' }}
                    />
                    Tidak Selesai (Kendala)
                  </label>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  📌 <strong>Selesai 100%</strong>: Target Sub-SLS rampung seluruhnya. | 
                  <strong> Selesai Sebagian</strong>: Masih berjalan. | 
                  <strong> Tidak Selesai (Kendala)</strong>: Terhambat kendala lapangan (wajib isi keterangan).
                </div>
              </div>

              {/* Keterangan Kendala */}
              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label className="form-label" htmlFor="keterangan">
                  Keterangan Kendala {status === 'tidak_selesai' && <span style={{ color: 'var(--color-danger)' }}>*</span>}
                </label>
                <textarea
                  className="form-control"
                  id="keterangan"
                  rows={4}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder={
                    status === 'tidak_selesai'
                      ? 'Wajib diisi! Jelaskan kendala/masalah yang dihadapi petugas di lapangan...'
                      : 'Opsional. Tambahkan catatan jika ada...'
                  }
                  required={status === 'tidak_selesai'}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                {querySubSlsId && !editMode && (
                  <Link href={`/dashboard`}>
                    <Button variant="secondary" type="button">
                      <ArrowLeft size={16} />
                      Kembali ke Dashboard
                    </Button>
                  </Link>
                )}
                
                {editMode && (
                  <Button variant="secondary" type="button" onClick={handleCancelEdit}>
                    <XCircle size={16} />
                    Batal Edit
                  </Button>
                )}
                
                <Button type="submit" isLoading={isSubmitting} style={{ padding: '10px 24px' }}>
                  {editMode ? 'Perbarui Laporan' : 'Simpan Laporan'}
                </Button>
              </div>
            </>
          )}

          {!selectedSubSls && (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '8px',
                border: '1px dotted var(--border-light)',
              }}
            >
              <ClipboardEdit size={32} style={{ margin: '0 auto 12px auto', strokeWidth: 1.5 }} />
              <div>Silakan pilih Sub-SLS terlebih dahulu untuk mengisi laporan harian.</div>
            </div>
          )}

        </form>

      </div>

      {/* Riwayat Laporan Harian */}
      <div className="card animate-fade-in" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardEdit size={18} style={{ color: 'var(--primary-base)' }} />
          Riwayat Laporan Harian Anda
        </h3>

        {isLoadingRecent ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <Spinner />
          </div>
        ) : recentReports.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
            Belum ada laporan harian yang diinput.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Tanggal</th>
                  <th style={{ padding: '10px 8px' }}>Wilayah</th>
                  <th style={{ padding: '10px 8px' }}>Sub-SLS ID</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Selesai</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Keterangan</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {row.tanggal ? row.tanggal.split('T')[0].split('-').reverse().join('/') : '-'}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.subsls?.sls?.desa?.namaDesa}</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.subsls?.sls?.namaSls}</div>
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.subsls?.idSubsls}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>
                      {row.jumlahSelesai}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <span className={`badge badge-${row.status}`} style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: row.status === 'selesai' ? 'var(--color-success-bg)' : row.status === 'progres' ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)',
                        color: row.status === 'selesai' ? 'var(--color-success-text)' : row.status === 'progres' ? 'var(--color-warning-text)' : 'var(--color-danger-text)',
                      }}>
                        {row.status === 'selesai' ? 'Selesai' : row.status === 'progres' ? 'Selesai Sebagian' : 'Kendala'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                      {row.keterangan || '-'}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-base)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color var(--transition-fast)',
                          }}
                          title="Edit Laporan"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color var(--transition-fast)',
                          }}
                          title="Hapus Laporan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
