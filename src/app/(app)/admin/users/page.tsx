// src/app/(app)/admin/users/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { UserPlus, Edit, Trash2, KeyRound, Search, ShieldAlert, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [allSubSlsList, setAllSubSlsList] = useState<any[]>([]); // Untuk PCL assignment

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  
  // Active selected user for edit/delete
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states (Add / Edit)
  const [nama, setNama] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'admin' | 'korlap' | 'pml' | 'pcl'>('pcl');
  const [idKecamatan, setIdKecamatan] = useState<string>('');
  const [selectedSubSlsIds, setSelectedSubSlsIds] = useState<number[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Status submission feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [resUsers, resKec] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/kecamatan')
        ]);
        
        if (resUsers.ok && resKec.ok) {
          setUsers(await resUsers.json());
          setKecamatanList(await resKec.json());
        }

        // Fetch all sub-SLS for PCL assignments
        const resSub = await fetch('/api/laporan'); // reports has assignments
        // Kita juga bisa fetch dari API dashboard kabupaten untuk list semua sub-SLS
        const resDash = await fetch('/api/dashboard');
        if (resDash.ok) {
          const dashData = await resDash.json();
          // Kita butuh list semua sub-SLS. Untuk mempermudah, kita fetch dari API reports atau kita bisa load
          // sub-SLS yang tersedia. Di database, kita punya 1042 sub-SLS.
          // Untuk performa, modal input assignment bisa menggunakan text search atau fetch per SLS.
          // Mari kita fetch dari API reports untuk dapatkan mapping sub-SLS yang sering diakses.
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter users based on query
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.nama.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    );
  });

  const handleOpenAddModal = () => {
    setNama('');
    setUsername('');
    setPassword('');
    setRole('pcl');
    setIdKecamatan('');
    setSelectedSubSlsIds([]);
    setIsActive(true);
    setFeedback(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setNama(user.nama);
    setUsername(user.username);
    setPassword(''); // Biarkan kosong jika tidak ingin ganti password
    setRole(user.role);
    setIdKecamatan(user.idKecamatan ? user.idKecamatan.toString() : '');
    setIsActive(user.isActive);
    
    // Set penugasan sub-SLS lama
    const oldSubIds = user.tugasPcl ? user.tugasPcl.map((t: any) => t.idSubsls) : [];
    setSelectedSubSlsIds(oldSubIds);

    setFeedback(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (user: any) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          username,
          password,
          role,
          idKecamatan: role === 'pml' ? idKecamatan : null,
          subSlsIds: role === 'pcl' ? selectedSubSlsIds : [],
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menambahkan user.');

      setFeedback({ type: 'success', text: 'User baru berhasil ditambahkan!' });
      
      // Reload user list
      const resUsers = await fetch('/api/admin/users');
      if (resUsers.ok) setUsers(await resUsers.json());

      setTimeout(() => setIsAddModalOpen(false), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          username,
          password: password.trim() ? password : null,
          role,
          idKecamatan: role === 'pml' ? idKecamatan : null,
          isActive,
          subSlsIds: role === 'pcl' ? selectedSubSlsIds : [],
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal memperbarui user.');

      setFeedback({ type: 'success', text: 'Data user berhasil diperbarui!' });
      
      // Reload user list
      const resUsers = await fetch('/api/admin/users');
      if (resUsers.ok) setUsers(await resUsers.json());

      setTimeout(() => setIsEditModalOpen(false), 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menghapus user.');

      // Reload user list
      const resUsers = await fetch('/api/admin/users');
      if (resUsers.ok) setUsers(await resUsers.json());

      setIsDeleteModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabels = {
    admin: 'Admin BPS',
    korlap: 'Korlap',
    pml: 'PML (Pengawas)',
    pcl: 'PCL / PPL',
  };

  const roleColors = {
    admin: 'danger',
    korlap: 'warning',
    pml: 'info',
    pcl: 'success',
  } as const;

  return (
    <div>
      <PageHeader
        title="Manajemen Pengguna (User Management)"
        description="Kelola akun Operator PCL, Pengawas PML, Koordinator Korlap, dan Admin BPS Kabupaten PPU."
        actions={
          <Button onClick={handleOpenAddModal}>
            <UserPlus size={16} />
            Tambah User Baru
          </Button>
        }
      />

      {/* Filter and Table Card */}
      <div className="card" style={{ padding: '24px' }}>
        
        {/* Search Input bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '360px', marginBottom: '20px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            type="text"
            placeholder="Cari user berdasarkan nama/username/role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
          />
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', height: '200px' }}>
            <Spinner />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)', fontWeight: 700 }}>
                  <th style={{ padding: '10px 8px' }}>Nama Lengkap</th>
                  <th style={{ padding: '10px 8px' }}>Username</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Role</th>
                  <th style={{ padding: '10px 8px' }}>Wilayah / Tugas</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: '120px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>{user.nama}</td>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{user.username}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <Badge variant={roleColors[user.role as 'admin' | 'korlap' | 'pml' | 'pcl']}>
                        {roleLabels[user.role as 'admin' | 'korlap' | 'pml' | 'pcl']}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {user.role === 'pml' && user.kecamatan
                        ? `Kecamatan: ${user.kecamatan.namaKec}`
                        : user.role === 'pcl' && user.tugasPcl?.length > 0
                        ? `${user.tugasPcl.length} Sub-SLS ditugaskan`
                        : '-'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <Badge variant={user.isActive ? 'success' : 'gray'}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEditModal(user)}
                          style={{ padding: '6px' }}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenDeleteModal(user)}
                          style={{ padding: '6px' }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL ADD USER */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Pengguna Baru">
        {feedback && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: feedback.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: feedback.type === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="add-nama">Nama Lengkap</label>
            <input className="form-control" id="add-nama" type="text" value={nama} onChange={(e) => setNama(e.target.value)} required />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="add-username">Username</label>
            <input className="form-control" id="add-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="add-password">Password</label>
            <input className="form-control" id="add-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="add-role">Role Sistem</label>
            <select
              className="form-control"
              id="add-role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              required
            >
              <option value="admin">Admin BPS</option>
              <option value="korlap">Koordinator Lapangan (Korlap)</option>
              <option value="pml">PML (Pengawas Mitra Lapangan)</option>
              <option value="pcl">PCL / PPL (Pencacah Lapangan)</option>
            </select>
          </div>

          {/* Conditional Input Kecamatan jika PML */}
          {role === 'pml' && (
            <div className="form-group animate-fade-in" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="add-kecamatan">Kecamatan Pengawasan</label>
              <select
                className="form-control"
                id="add-kecamatan"
                value={idKecamatan}
                onChange={(e) => setIdKecamatan(e.target.value)}
                required
              >
                <option value="">-- Pilih Kecamatan --</option>
                {kecamatanList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.namaKec}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Simpan User
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL EDIT USER */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Data Pengguna">
        {feedback && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: feedback.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: feedback.type === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="edit-nama">Nama Lengkap</label>
            <input className="form-control" id="edit-nama" type="text" value={nama} onChange={(e) => setNama(e.target.value)} required />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="edit-username">Username</label>
            <input className="form-control" id="edit-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="edit-password">Reset Password (Opsional)</label>
            <input
              className="form-control"
              id="edit-password"
              type="password"
              placeholder="Masukkan password baru jika ingin mereset"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="edit-role">Role Sistem</label>
            <select
              className="form-control"
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              required
            >
              <option value="admin">Admin BPS</option>
              <option value="korlap">Koordinator Lapangan (Korlap)</option>
              <option value="pml">PML (Pengawas Mitra Lapangan)</option>
              <option value="pcl">PCL / PPL (Pencacah Lapangan)</option>
            </select>
          </div>

          {/* Conditional Input Kecamatan jika PML */}
          {role === 'pml' && (
            <div className="form-group animate-fade-in" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="edit-kecamatan">Kecamatan Pengawasan</label>
              <select
                className="form-control"
                id="edit-kecamatan"
                value={idKecamatan}
                onChange={(e) => setIdKecamatan(e.target.value)}
                required
              >
                <option value="">-- Pilih Kecamatan --</option>
                {kecamatanList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.namaKec}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active status */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-base)' }}
              />
              User Aktif (Dapat Login)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Hapus Pengguna">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'center', padding: '10px 0' }}>
          <ShieldAlert size={48} style={{ color: 'var(--color-danger)', margin: '0 auto' }} />
          <div>
            Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.nama}</strong> ({selectedUser?.username}) secara permanen?
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              *Tindakan ini tidak dapat dibatalkan. Relasi penugasan PCL ke Sub-SLS akan ikut terhapus.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDeleteSubmit} isLoading={isSubmitting}>
              Hapus User
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
