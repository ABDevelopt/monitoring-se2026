// frontend/src/pages/admin/AdminUsersPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  Users, UserPlus, Edit2, Trash2, Shield, ToggleLeft, 
  ToggleRight, Search, AlertCircle, Loader2, X, Plus, Check
} from 'lucide-react';

export default function AdminUsersPage() {
  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('pcl');
  const [idKecamatan, setIdKecamatan] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [assignedSubSls, setAssignedSubSls] = useState([]); // Array of SubSLS objects

  // Dropdown options
  const [kecamatanList, setKecamatanList] = useState([]);
  const [desaList, setDesaList] = useState([]);
  const [slsList, setSlsList] = useState([]);
  const [subSlsList, setSubSlsList] = useState([]);
  
  const [selKec, setSelKec] = useState('');
  const [selDesa, setSelDesa] = useState('');
  const [selSls, setSelSls] = useState('');
  const [selSubSls, setSelSubSls] = useState('');

  const [loadingModalDropdowns, setLoadingModalDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch users & options
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      setErrorMsg('Gagal memuat daftar user.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Load Kecamatan for reference
    api.get('/api/kecamatan')
      .then(res => setKecamatanList(res.data))
      .catch(err => console.error(err));
  }, []);

  // Cascading dropdowns inside User Modal
  useEffect(() => {
    if (!selKec) {
      setDesaList([]);
      setSelDesa('');
      return;
    }
    const fetchDesa = async () => {
      try {
        setLoadingModalDropdowns(true);
        const res = await api.get(`/api/desa?kecamatanId=${selKec}`);
        setDesaList(res.data);
        setSelDesa('');
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingModalDropdowns(false);
      }
    };
    fetchDesa();
  }, [selKec]);

  useEffect(() => {
    if (!selDesa) {
      setSlsList([]);
      setSelSls('');
      return;
    }
    const fetchSls = async () => {
      try {
        setLoadingModalDropdowns(true);
        const res = await api.get(`/api/sls?desaId=${selDesa}`);
        setSlsList(res.data);
        setSelSls('');
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingModalDropdowns(false);
      }
    };
    fetchSls();
  }, [selDesa]);

  useEffect(() => {
    if (!selSls) {
      setSubSlsList([]);
      setSelSubSls('');
      return;
    }
    const fetchSubSls = async () => {
      try {
        setLoadingModalDropdowns(true);
        const res = await api.get(`/api/subsls?slsId=${selSls}`);
        setSubSlsList(res.data);
        setSelSubSls('');
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingModalDropdowns(false);
      }
    };
    fetchSubSls();
  }, [selSls]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setNama('');
    setUsername('');
    setPassword('');
    setRole('pcl');
    setIdKecamatan('');
    setIsActive(true);
    setAssignedSubSls([]);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setEditId(user.id);
    setNama(user.nama);
    setUsername(user.username);
    setPassword(''); // biarkan kosong untuk abaikan ganti password
    setRole(user.role);
    setIdKecamatan(user.idKecamatan || '');
    setIsActive(user.isActive);
    
    // Parse existing assigned sub SLS from user.tugasPcl
    const subsls = (user.tugasPcl || []).map(t => t.subsls).filter(Boolean);
    setAssignedSubSls(subsls);
    setFormError('');
    setShowModal(true);
  };

  const handleAddSubSlsAssignment = () => {
    if (!selSubSls) return;
    const subObj = subSlsList.find(s => s.id === parseInt(selSubSls));
    if (!subObj) return;
    
    // Check if already in list
    if (assignedSubSls.some(s => s.id === subObj.id)) return;
    
    setAssignedSubSls(prev => [...prev, subObj]);
    setSelSubSls('');
  };

  const handleRemoveSubSlsAssignment = (id) => {
    setAssignedSubSls(prev => prev.filter(s => s.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama || !username || (!isEditing && !password)) {
      setFormError('Harap isi field wajib.');
      return;
    }
    
    setSubmitting(true);
    setFormError('');
    
    const payload = {
      nama,
      username,
      role,
      idKecamatan: role === 'pml' ? parseInt(idKecamatan) : null,
      subSlsIds: role === 'pcl' ? assignedSubSls.map(s => s.id) : [],
    };

    if (password && password.trim() !== '') {
      payload.password = password;
    }

    if (isEditing) {
      payload.isActive = isActive;
    }

    try {
      if (isEditing) {
        await api.put(`/api/admin/users/${editId}`, payload);
      } else {
        await api.post('/api/admin/users', payload);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Gagal menyimpan user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${name}"?`)) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus user.');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Admin</span>;
      case 'korlap': return <span style={{ color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Korlap</span>;
      case 'pml': return <span style={{ color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>PML</span>;
      default: return <span style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>PCL</span>;
    }
  };

  const filteredUsers = users.filter(u => 
    u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in">
      
      {/* Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={28} style={{ color: '#6366f1' }} />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Manajemen User</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '2px 0 0 0' }}>Kelola hak akses akun petugas lapangan dan administratif</p>
          </div>
        </div>
        
        <button 
          onClick={handleOpenAdd} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
        >
          <UserPlus size={18} />
          Tambah User Baru
        </button>
      </div>

      {/* Filter and Table Container */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '400px', marginBottom: '20px' }}>
          <Search size={18} style={{ color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Cari user berdasarkan nama, username, atau role..." 
            className="form-control"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Nama Lengkap</th>
                <th style={{ textAlign: 'left' }}>Username</th>
                <th style={{ textAlign: 'center' }}>Role</th>
                <th style={{ textAlign: 'left' }}>Wilayah Tugas / Deskripsi</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 size={24} style={{ color: '#6366f1', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>Memuat data user...</p>
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <AlertCircle size={18} />
                      <span>{errorMsg}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    Tidak ada user yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 600, color: '#f1f5f9' }}>{u.nama}</td>
                    <td style={{ padding: '14px 8px', color: '#94a3b8' }}>@{u.username}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>{getRoleBadge(u.role)}</td>
                    <td style={{ padding: '14px 8px', fontSize: '13px' }}>
                      {u.role === 'pml' && u.kecamatan ? (
                        <span style={{ color: '#38bdf8' }}>Pengawas Kecamatan: <b>{u.kecamatan.nama}</b></span>
                      ) : u.role === 'pcl' && u.tugasPcl && u.tugasPcl.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ color: '#a7f3d0' }}>Assigned ({u.tugasPcl.length} Sub-SLS):</span>
                          {u.tugasPcl.map(t => (
                            <span key={t.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px', color: '#cbd5e1' }}>
                              {t.subsls?.namaSubSls || `ID:${t.idSubsls}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#64748b' }}>Akses Administratif Global</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      {u.isActive ? (
                        <span style={{ color: '#34d399', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} /> Aktif
                        </span>
                      ) : (
                        <span style={{ color: '#f87171', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <X size={14} /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(56,189,248,0.1)' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.nama)}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(248,113,113,0.1)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} style={{ color: '#6366f1' }} />
              {isEditing ? 'Edit Profil User' : 'Buat User Baru'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '14px' }}>
                  <AlertCircle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="form-label">Nama Lengkap *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  placeholder="Nama Lengkap Petugas"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Username *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Contoh: pmlpenajam"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Password {isEditing ? '(Kosongkan jika tidak diganti)' : '*'}</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isEditing ? "••••••••" : "Masukkan password"}
                    required={!isEditing}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr 1fr' : '1fr', gap: '16px', alignItems: 'center' }}>
                <div>
                  <label className="form-label">Role Akses</label>
                  <select 
                    className="form-control" 
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="pcl">PCL (Pencacah Lapangan)</option>
                    <option value="pml">PML (Pengawas Lapangan)</option>
                    <option value="korlap">Koordinator Lapangan</option>
                    <option value="admin">Administrator Sistem</option>
                  </select>
                </div>
                
                {isEditing && (
                  <div>
                    <label className="form-label">Status Akun</label>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      style={{ 
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', color: isActive ? '#34d399' : '#f87171' 
                      }}
                    >
                      {isActive ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{isActive ? 'Akun Aktif' : 'Akun Dinonaktifkan'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Conditional Form fields based on role selection */}
              {role === 'pml' && (
                <div style={{ border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '16px', backgroundColor: 'rgba(59,130,246,0.02)' }}>
                  <label className="form-label" style={{ color: '#3b82f6' }}>Kecamatan Pengawasan *</label>
                  <select 
                    className="form-control"
                    value={idKecamatan}
                    onChange={e => setIdKecamatan(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {kecamatanList.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>PML hanya dapat melihat/mengontrol progres SLS di dalam kecamatan ini.</p>
                </div>
              )}

              {role === 'pcl' && (
                <div style={{ border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '16px', backgroundColor: 'rgba(16,185,129,0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', margin: 0 }}>Pemetaan Wilayah Tugas SLS PCL</h4>
                  
                  {/* Assigned SLS list */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {assignedSubSls.length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Belum ada penugasan SLS.</span>
                    ) : (
                      assignedSubSls.map(s => (
                        <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', color: '#a7f3d0' }}>
                          {s.namaSubSls}
                          <button type="button" onClick={() => handleRemoveSubSlsAssignment(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', padding: 0, display: 'flex', cursor: 'pointer' }}>
                            <X size={14} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />
                  
                  {/* Select cascading selector to add assignment */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <select className="form-control" style={{ fontSize: '12px', padding: '6px' }} value={selKec} onChange={e => setSelKec(e.target.value)}>
                        <option value="">-- Pilih Kec --</option>
                        {kecamatanList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                      </select>
                    </div>
                    <div>
                      <select className="form-control" style={{ fontSize: '12px', padding: '6px' }} value={selDesa} onChange={e => setSelDesa(e.target.value)} disabled={!selKec}>
                        <option value="">-- Pilih Desa --</option>
                        {desaList.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <select className="form-control" style={{ fontSize: '12px', padding: '6px' }} value={selSls} onChange={e => setSelSls(e.target.value)} disabled={!selDesa}>
                        <option value="">-- Pilih SLS --</option>
                        {slsList.map(s => <option key={s.id} value={s.id}>{s.namaSls}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select className="form-control" style={{ fontSize: '12px', padding: '6px', flex: 1 }} value={selSubSls} onChange={e => setSelSubSls(e.target.value)} disabled={!selSls}>
                        <option value="">-- Pilih Sub-SLS --</option>
                        {subSlsList.map(s => <option key={s.id} value={s.id}>{s.namaSubSls}</option>)}
                      </select>
                      <button 
                        type="button" 
                        onClick={handleAddSubSlsAssignment}
                        className="btn btn-primary"
                        style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={!selSubSls}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit button bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', cursor: 'pointer', borderRadius: '8px' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={16} className="spin" /> : null}
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
