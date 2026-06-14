// src/app/(app)/admin/master/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Database,
  Map,
  Home,
  Layers,
  MapPin,
  AlertCircle,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

type TabType = 'kecamatan' | 'desa' | 'sls' | 'subsls' | 'alokasi';

export default function AdminMasterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('kecamatan');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Master Lists
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);
  const [slsList, setSlsList] = useState<any[]>([]);
  const [subSlsList, setSubSlsList] = useState<any[]>([]);

  // Officer dropdown options for allocation
  const [pclOptions, setPclOptions] = useState<any[]>([]);
  const [pmlOptions, setPmlOptions] = useState<any[]>([]);
  const [korlapOptions, setKorlapOptions] = useState<any[]>([]);

  // Allocation Modal State
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState<boolean>(false);
  const [selectedSubSls, setSelectedSubSls] = useState<any>(null);
  const [allocatedPclId, setAllocatedPclId] = useState<string>('');
  const [allocatedPmlId, setAllocatedPmlId] = useState<string>('');
  const [allocatedKorlapId, setAllocatedKorlapId] = useState<string>('');

  // Filter Cascade Selection (for SLS & Sub-SLS tables)
  const [filterKec, setFilterKec] = useState<string>('');
  const [filterDesa, setFilterDesa] = useState<string>('');
  const [filterSls, setFilterSls] = useState<string>('');

  // Cascade Options inside modals
  const [modalDesaOptions, setModalDesaOptions] = useState<any[]>([]);
  const [modalSlsOptions, setModalSlsOptions] = useState<any[]>([]);

  // Modals visibility
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states
  // 1. Kecamatan form
  const [kodeKec, setKodeKec] = useState<string>('');
  const [namaKec, setNamaKec] = useState<string>('');
  // 2. Desa form
  const [idKecamatan, setIdKecamatan] = useState<string>('');
  const [idDesa, setIdDesa] = useState<string>('');
  const [kodeDesa, setKodeDesa] = useState<string>('');
  const [namaDesa, setNamaDesa] = useState<string>('');
  // 3. SLS form
  const [idDesaFK, setIdDesaFK] = useState<string>('');
  const [kodeSls, setKodeSls] = useState<string>('');
  const [namaSls, setNamaSls] = useState<string>('');
  // 4. Sub-SLS form
  const [idSlsFK, setIdSlsFK] = useState<string>('');
  const [kodeSubsls, setKodeSubsls] = useState<string>('');
  const [idSubsls, setIdSubsls] = useState<string>('');
  const [idSubsls2025, setIdSubsls2025] = useState<string>('');
  const [namaPcl, setNamaPcl] = useState<string>('');
  const [namaPml, setNamaPml] = useState<string>('');
  const [namaKorlap, setNamaKorlap] = useState<string>('');
  const [totalMuatanAssignment, setTotalMuatanAssignment] = useState<string>('0');

  // Load basic data
  const loadKecamatan = async () => {
    try {
      const res = await fetch('/api/admin/master/kecamatan');
      if (res.ok) setKecamatanList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadDesa = async () => {
    try {
      const res = await fetch('/api/admin/master/desa');
      if (res.ok) setDesaList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadSlsList = async (desaId?: string, search?: string) => {
    try {
      let url = '/api/admin/master/sls';
      const params = new URLSearchParams();
      if (desaId) params.append('idDesa', desaId);
      if (search) params.append('search', search);
      
      const res = await fetch(`${url}?${params.toString()}`);
      if (res.ok) setSlsList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubSlsList = async (slsId?: string, search?: string) => {
    try {
      let url = '/api/admin/master/subsls';
      const params = new URLSearchParams();
      if (slsId) params.append('idSls', slsId);
      if (search) params.append('search', search);

      const res = await fetch(`${url}?${params.toString()}`);
      if (res.ok) setSubSlsList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadUserOptions = async () => {
    try {
      const res = await fetch('/api/admin/master/subsls?getUsers=true');
      if (res.ok) {
        const data = await res.json();
        setPclOptions(data.pcls || []);
        setPmlOptions(data.pmls || []);
        setKorlapOptions(data.korlaps || []);
      }
    } catch (err) {
      console.error('Failed to load user options:', err);
    }
  };

  // Trigger loading based on active tab
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setSearchQuery('');
      setFeedback(null);
      
      if (activeTab === 'kecamatan') {
        await loadKecamatan();
      } else if (activeTab === 'desa') {
        await Promise.all([loadKecamatan(), loadDesa()]);
      } else if (activeTab === 'sls') {
        await Promise.all([loadKecamatan(), loadSlsList(filterDesa)]);
      } else if (activeTab === 'subsls') {
        await Promise.all([loadKecamatan(), loadSubSlsList(filterSls)]);
      } else if (activeTab === 'alokasi') {
        await Promise.all([loadKecamatan(), loadSubSlsList(filterSls), loadUserOptions()]);
      }
      setIsLoading(false);
    }
    loadData();
  }, [activeTab]);

  // Handle cascaded filter selections in SLS & Sub-SLS lists
  const [filteredDesaOptions, setFilteredDesaOptions] = useState<any[]>([]);
  const [filteredSlsOptions, setFilteredSlsOptions] = useState<any[]>([]);

  useEffect(() => {
    if (!filterKec) {
      setFilteredDesaOptions([]);
      setFilterDesa('');
      return;
    }
    fetch(`/api/desa?kecamatanId=${filterKec}`)
      .then(res => res.json())
      .then(data => setFilteredDesaOptions(data))
      .catch(err => console.error(err));
  }, [filterKec]);

  useEffect(() => {
    if (!filterDesa) {
      setFilteredSlsOptions([]);
      setFilterSls('');
      if (activeTab === 'sls') {
        loadSlsList('', searchQuery);
      }
      return;
    }
    
    if (activeTab === 'sls') {
      loadSlsList(filterDesa, searchQuery);
    } else if (activeTab === 'subsls' || activeTab === 'alokasi') {
      fetch(`/api/sls?desaId=${filterDesa}`)
        .then(res => res.json())
        .then(data => setFilteredSlsOptions(data))
        .catch(err => console.error(err));
    }
  }, [filterDesa, activeTab]);

  useEffect(() => {
    if (activeTab === 'subsls' || activeTab === 'alokasi') {
      loadSubSlsList(filterSls, searchQuery);
    }
  }, [filterSls, activeTab]);

  // Debounced/Triggered Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'sls') {
      loadSlsList(filterDesa, searchQuery);
    } else if (activeTab === 'subsls' || activeTab === 'alokasi') {
      loadSubSlsList(filterSls, searchQuery);
    }
  };

  // Cascading options inside Modal Forms
  const [modalKecId, setModalKecId] = useState<string>('');

  useEffect(() => {
    if (!modalKecId) {
      setModalDesaOptions([]);
      return;
    }
    fetch(`/api/desa?kecamatanId=${modalKecId}`)
      .then(res => res.json())
      .then(data => setModalDesaOptions(data))
      .catch(err => console.error(err));
  }, [modalKecId]);

  const [modalDesaId, setModalDesaId] = useState<string>('');

  useEffect(() => {
    if (!modalDesaId) {
      setModalSlsOptions([]);
      return;
    }
    fetch(`/api/sls?desaId=${modalDesaId}`)
      .then(res => res.json())
      .then(data => setModalSlsOptions(data))
      .catch(err => console.error(err));
  }, [modalDesaId]);

  // Modal open handlers
  const handleOpenAdd = () => {
    setModalMode('add');
    setFeedback(null);
    setSelectedItem(null);
    
    // Clear forms
    setKodeKec('');
    setNamaKec('');
    setIdKecamatan('');
    setIdDesa('');
    setKodeDesa('');
    setNamaDesa('');
    setIdDesaFK('');
    setKodeSls('');
    setNamaSls('');
    setIdSlsFK('');
    setKodeSubsls('');
    setIdSubsls('');
    setIdSubsls2025('');
    setNamaPcl('');
    setNamaPml('');
    setNamaKorlap('');
    setTotalMuatanAssignment('0');
    setModalKecId('');
    setModalDesaId('');
    
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setFeedback(null);
    setSelectedItem(item);

    if (activeTab === 'kecamatan') {
      setKodeKec(item.kodeKec);
      setNamaKec(item.namaKec);
    } else if (activeTab === 'desa') {
      setIdKecamatan(item.idKecamatan.toString());
      setIdDesa(item.idDesa);
      setKodeDesa(item.kodeDesa);
      setNamaDesa(item.namaDesa);
    } else if (activeTab === 'sls') {
      setModalKecId(item.desa?.idKecamatan?.toString() || '');
      setIdDesaFK(item.idDesa.toString());
      setKodeSls(item.kodeSls);
      setNamaSls(item.namaSls);
    } else if (activeTab === 'subsls') {
      setModalKecId(item.sls?.desa?.idKecamatan?.toString() || '');
      setModalDesaId(item.sls?.idDesa?.toString() || '');
      setIdSlsFK(item.idSls.toString());
      setKodeSubsls(item.kodeSubsls);
      setIdSubsls(item.idSubsls);
      setIdSubsls2025(item.idSubsls2025 || '');
      setNamaPcl(item.namaPcl);
      setNamaPml(item.namaPml);
      setNamaKorlap(item.namaKorlap);
      setTotalMuatanAssignment(item.totalMuatanAssignment.toString());
    }

    setIsModalOpen(true);
  };

  const handleOpenDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // Allocation handlers
  const handleOpenAllocation = (sub: any) => {
    setSelectedSubSls(sub);
    setFeedback(null);
    
    // Find matching PCL ID from tugasPcl relation
    const currentPclId = sub.tugasPcl && sub.tugasPcl.length > 0 
      ? sub.tugasPcl[0].idUser.toString() 
      : '';
    setAllocatedPclId(currentPclId);

    // Find matching PML ID by name matching
    const currentPml = pmlOptions.find(p => p.nama === sub.namaPml);
    setAllocatedPmlId(currentPml ? currentPml.id.toString() : '');

    // Find matching Korlap ID by name matching
    const currentKorlap = korlapOptions.find(k => k.nama === sub.namaKorlap);
    setAllocatedKorlapId(currentKorlap ? currentKorlap.id.toString() : '');

    setIsAllocationModalOpen(true);
  };

  const handleAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSls) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/master/subsls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSubSls.id,
          idPcl: allocatedPclId ? parseInt(allocatedPclId) : null,
          idPml: allocatedPmlId ? parseInt(allocatedPmlId) : null,
          idKorlap: allocatedKorlapId ? parseInt(allocatedKorlapId) : null,
          isAllocationOnly: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan alokasi petugas.');

      setFeedback({ type: 'success', text: 'Alokasi petugas berhasil diperbarui!' });
      
      // Reload Sub-SLS list
      await loadSubSlsList(filterSls, searchQuery);

      // Close modal after short delay
      setTimeout(() => setIsAllocationModalOpen(false), 1000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menyimpan alokasi petugas.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    let url = `/api/admin/master/${activeTab}`;
    let method = modalMode === 'add' ? 'POST' : 'PUT';
    let payload: any = {};

    if (activeTab === 'kecamatan') {
      payload = { kodeKec, namaKec };
    } else if (activeTab === 'desa') {
      payload = { idKecamatan, idDesa, kodeDesa, namaDesa };
    } else if (activeTab === 'sls') {
      payload = { idDesa: idDesaFK, kodeSls, namaSls };
    } else if (activeTab === 'subsls') {
      payload = {
        idSls: idSlsFK,
        kodeSubsls,
        idSubsls,
        idSubsls2025: idSubsls2025 || null,
        namaPcl,
        namaPml,
        namaKorlap,
        totalMuatanAssignment: parseInt(totalMuatanAssignment) || 0,
      };
    }

    if (modalMode === 'edit' && selectedItem) {
      payload.id = selectedItem.id;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan saat menyimpan data.');

      setFeedback({ type: 'success', text: `Data master ${activeTab} berhasil disimpan!` });
      
      // Reload lists
      if (activeTab === 'kecamatan') await loadKecamatan();
      else if (activeTab === 'desa') await loadDesa();
      else if (activeTab === 'sls') await loadSlsList(filterDesa, searchQuery);
      else if (activeTab === 'subsls') await loadSubSlsList(filterSls, searchQuery);

      setTimeout(() => setIsModalOpen(false), 1000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menyimpan data.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/master/${activeTab}?id=${selectedItem.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus data.');

      // Reload lists
      if (activeTab === 'kecamatan') await loadKecamatan();
      else if (activeTab === 'desa') await loadDesa();
      else if (activeTab === 'sls') await loadSlsList(filterDesa, searchQuery);
      else if (activeTab === 'subsls') await loadSubSlsList(filterSls, searchQuery);

      setIsDeleteModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem saat menghapus data.');
    } finally {
      setIsSubmitting(false);
      setSelectedItem(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <PageHeader
        title="Pengelolaan Master Data BPS"
        description="Kelola seluruh data master kewilayahan (Kecamatan, Desa, SLS, Sub-SLS) beserta muatan target usaha dan petugas bertugas."
      />

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'kecamatan', label: 'Kecamatan', icon: MapPin },
          { id: 'desa', label: 'Desa / Kelurahan', icon: Map },
          { id: 'sls', label: 'SLS / RT', icon: Home },
          { id: 'subsls', label: 'Sub-SLS & Muatan', icon: Layers },
          { id: 'alokasi', label: 'Alokasi Petugas', icon: UserCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'primary' : 'secondary'}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            >
              <Icon size={16} />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Main Container Card */}
      <div className="card animate-fade-in" style={{ padding: '28px' }}>
        {/* Actions bar (Search & Filters) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          {/* Filters area */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {/* Filter Kecamatan (for SLS, Sub-SLS, Alokasi) */}
            {(activeTab === 'sls' || activeTab === 'subsls' || activeTab === 'alokasi') && (
              <select
                className="form-control"
                style={{ width: '180px', padding: '8px 12px' }}
                value={filterKec}
                onChange={(e) => setFilterKec(e.target.value)}
              >
                <option value="">-- Semua Kec --</option>
                {kecamatanList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.namaKec}
                  </option>
                ))}
              </select>
            )}

            {/* Filter Desa (for SLS, Sub-SLS, Alokasi) */}
            {(activeTab === 'sls' || activeTab === 'subsls' || activeTab === 'alokasi') && (
              <select
                className="form-control"
                style={{ width: '180px', padding: '8px 12px' }}
                value={filterDesa}
                onChange={(e) => setFilterDesa(e.target.value)}
                disabled={!filterKec}
              >
                <option value="">-- Semua Desa --</option>
                {filteredDesaOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.namaDesa}
                  </option>
                ))}
              </select>
            )}

            {/* Filter SLS (only for Sub-SLS, Alokasi) */}
            {(activeTab === 'subsls' || activeTab === 'alokasi') && (
              <select
                className="form-control"
                style={{ width: '180px', padding: '8px 12px' }}
                value={filterSls}
                onChange={(e) => setFilterSls(e.target.value)}
                disabled={!filterDesa}
              >
                <option value="">-- Semua SLS --</option>
                {filteredSlsOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaSls}
                  </option>
                ))}
              </select>
            )}

            {/* Search Input (For SLS, Sub-SLS, Alokasi) */}
            {(activeTab === 'sls' || activeTab === 'subsls' || activeTab === 'alokasi') && (
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '300px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari kode/nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '8px 12px' }}
                />
                <Button type="submit" variant="secondary" style={{ padding: '8px 12px' }}>
                  <Search size={16} />
                </Button>
              </form>
            )}
          </div>

          {activeTab !== 'alokasi' && (
            <Button onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} />
              Tambah Data
            </Button>
          )}
        </div>

        {/* Loader */}
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {/* KECAMATAN TABLE */}
            {activeTab === 'kecamatan' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>ID</th>
                    <th style={{ padding: '12px 8px' }}>Kode Kecamatan (BPS)</th>
                    <th style={{ padding: '12px 8px' }}>Nama Kecamatan</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '150px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {kecamatanList.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        Belum ada data kecamatan.
                      </td>
                    </tr>
                  ) : (
                    kecamatanList.map((k) => (
                      <tr key={k.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{k.id}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700 }}>{k.kodeKec}</td>
                        <td style={{ padding: '12px 8px' }}>{k.namaKec}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(k)}>
                              <Edit size={14} />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleOpenDelete(k)}>
                              <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* DESA TABLE */}
            {activeTab === 'desa' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>ID</th>
                    <th style={{ padding: '12px 8px' }}>Kecamatan</th>
                    <th style={{ padding: '12px 8px' }}>ID Desa (BPS)</th>
                    <th style={{ padding: '12px 8px' }}>Kode Desa</th>
                    <th style={{ padding: '12px 8px' }}>Nama Desa</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '150px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {desaList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        Belum ada data desa.
                      </td>
                    </tr>
                  ) : (
                    desaList.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{d.id}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{d.kecamatan?.namaKec}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700 }}>{d.idDesa}</td>
                        <td style={{ padding: '12px 8px' }}>{d.kodeDesa}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{d.namaDesa}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(d)}>
                              <Edit size={14} />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleOpenDelete(d)}>
                              <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* SLS TABLE */}
            {activeTab === 'sls' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>ID</th>
                    <th style={{ padding: '12px 8px' }}>Kecamatan & Desa</th>
                    <th style={{ padding: '12px 8px' }}>Kode SLS (RT)</th>
                    <th style={{ padding: '12px 8px' }}>Nama SLS / RT</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '150px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {slsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        Tidak ada data SLS yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    slsList.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{s.id}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                          {s.desa?.kecamatan?.namaKec} &gt; {s.desa?.namaDesa}
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: 700 }}>{s.kodeSls}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{s.namaSls}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(s)}>
                              <Edit size={14} />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleOpenDelete(s)}>
                              <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* SUB-SLS TABLE */}
            {activeTab === 'subsls' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>ID Sub-SLS BPS</th>
                    <th style={{ padding: '12px 8px' }}>RT/SLS (Desa)</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Target Muatan</th>
                    <th style={{ padding: '12px 8px' }}>PCL Pencacah</th>
                    <th style={{ padding: '12px 8px' }}>PML Pengawas</th>
                    <th style={{ padding: '12px 8px' }}>Korlap</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '120px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {subSlsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        Tidak ada data Sub-SLS yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    subSlsList.map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 700 }}>{sub.idSubsls}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                          {sub.sls?.namaSls} ({sub.sls?.desa?.namaDesa})
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--color-info-text)' }}>
                          {sub.totalMuatanAssignment}
                        </td>
                        <td style={{ padding: '12px 8px' }}>{sub.namaPcl || '-'}</td>
                        <td style={{ padding: '12px 8px' }}>{sub.namaPml || '-'}</td>
                        <td style={{ padding: '12px 8px' }}>{sub.namaKorlap || '-'}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(sub)}>
                              <Edit size={14} />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleOpenDelete(sub)}>
                              <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* ALOKASI TABLE */}
            {activeTab === 'alokasi' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>ID Sub-SLS BPS</th>
                    <th style={{ padding: '12px 8px' }}>RT/SLS (Desa)</th>
                    <th style={{ padding: '12px 8px' }}>PCL Pencacah</th>
                    <th style={{ padding: '12px 8px' }}>PML Pengawas</th>
                    <th style={{ padding: '12px 8px' }}>Korlap</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '150px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {subSlsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        Tidak ada data Sub-SLS yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    subSlsList.map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 700 }}>{sub.idSubsls}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                          {sub.sls?.namaSls} ({sub.sls?.desa?.namaDesa})
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {sub.namaPcl ? (
                            <Badge variant="success">{sub.namaPcl}</Badge>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum Dialokasikan</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {sub.namaPml ? (
                            <Badge variant="info">{sub.namaPml}</Badge>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum Dialokasikan</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {sub.namaKorlap ? (
                            <Badge variant="gray">{sub.namaKorlap}</Badge>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum Dialokasikan</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <Button
                            size="sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleOpenAllocation(sub)}
                          >
                            <UserCheck size={14} />
                            Alokasikan
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* FORM INPUT MODAL */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalMode === 'add' ? `Tambah Data ${activeTab.toUpperCase()}` : `Edit Data ${activeTab.toUpperCase()}`}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {feedback && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  backgroundColor: feedback.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: feedback.type === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {feedback.text}
              </div>
            )}

            {/* KECAMATAN FORM FIELDS */}
            {activeTab === 'kecamatan' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="kodeKec">Kode Kecamatan (BPS)</label>
                  <input
                    type="text"
                    id="kodeKec"
                    className="form-control"
                    placeholder="Contoh: 010"
                    value={kodeKec}
                    onChange={(e) => setKodeKec(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="namaKec">Nama Kecamatan</label>
                  <input
                    type="text"
                    id="namaKec"
                    className="form-control"
                    placeholder="Contoh: PENAJAM"
                    value={namaKec}
                    onChange={(e) => setNamaKec(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* DESA FORM FIELDS */}
            {activeTab === 'desa' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="idKec">Kecamatan Induk</label>
                  <select
                    id="idKec"
                    className="form-control"
                    value={idKecamatan}
                    onChange={(e) => setIdKecamatan(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {kecamatanList.map((k) => (
                      <option key={k.id} value={k.id}>{k.namaKec}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="idDesa">ID Desa BPS (10 Digit)</label>
                  <input
                    type="text"
                    id="idDesa"
                    className="form-control"
                    placeholder="Contoh: 6409010001"
                    value={idDesa}
                    onChange={(e) => setIdDesa(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="kodeDesa">Kode Desa (3 Digit)</label>
                  <input
                    type="text"
                    id="kodeDesa"
                    className="form-control"
                    placeholder="Contoh: 001"
                    value={kodeDesa}
                    onChange={(e) => setKodeDesa(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="namaDesa">Nama Desa / Kelurahan</label>
                  <input
                    type="text"
                    id="namaDesa"
                    className="form-control"
                    placeholder="Contoh: PENAJAM"
                    value={namaDesa}
                    onChange={(e) => setNamaDesa(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* SLS FORM FIELDS */}
            {activeTab === 'sls' && (
              <>
                <div className="form-group">
                  <label className="form-label">Kecamatan</label>
                  <select
                    className="form-control"
                    value={modalKecId}
                    onChange={(e) => setModalKecId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {kecamatanList.map((k) => (
                      <option key={k.id} value={k.id}>{k.namaKec}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="idDesaFK">Desa / Kelurahan</label>
                  <select
                    id="idDesaFK"
                    className="form-control"
                    value={idDesaFK}
                    onChange={(e) => setIdDesaFK(e.target.value)}
                    required
                    disabled={!modalKecId}
                  >
                    <option value="">-- Pilih Desa --</option>
                    {modalDesaOptions.map((d) => (
                      <option key={d.id} value={d.id}>{d.namaDesa}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="kodeSls">Kode SLS (RT) (4 Digit)</label>
                  <input
                    type="text"
                    id="kodeSls"
                    className="form-control"
                    placeholder="Contoh: 0001"
                    value={kodeSls}
                    onChange={(e) => setKodeSls(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="namaSls">Nama SLS / RT</label>
                  <input
                    type="text"
                    id="namaSls"
                    className="form-control"
                    placeholder="Contoh: RT 01 DUSUN I"
                    value={namaSls}
                    onChange={(e) => setNamaSls(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* SUB-SLS & MUATAN FORM FIELDS */}
            {activeTab === 'subsls' && (
              <>
                {/* Cascade selects to locate parent SLS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Kecamatan</label>
                    <select
                      className="form-control"
                      value={modalKecId}
                      onChange={(e) => setModalKecId(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih --</option>
                      {kecamatanList.map((k) => (
                        <option key={k.id} value={k.id}>{k.namaKec}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Desa</label>
                    <select
                      className="form-control"
                      value={modalDesaId}
                      onChange={(e) => setModalDesaId(e.target.value)}
                      required
                      disabled={!modalKecId}
                    >
                      <option value="">-- Pilih --</option>
                      {modalDesaOptions.map((d) => (
                        <option key={d.id} value={d.id}>{d.namaDesa}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="idSlsFK">SLS / RT Induk</label>
                  <select
                    id="idSlsFK"
                    className="form-control"
                    value={idSlsFK}
                    onChange={(e) => setIdSlsFK(e.target.value)}
                    required
                    disabled={!modalDesaId}
                  >
                    <option value="">-- Pilih SLS --</option>
                    {modalSlsOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.namaSls} ({s.kodeSls})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="kodeSubsls">Kode Sub (2 Digit)</label>
                    <input
                      type="text"
                      id="kodeSubsls"
                      className="form-control"
                      placeholder="01"
                      value={kodeSubsls}
                      onChange={(e) => setKodeSubsls(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="idSubsls">ID Sub-SLS BPS (16 Digit)</label>
                    <input
                      type="text"
                      id="idSubsls"
                      className="form-control"
                      placeholder="Contoh: 6409010001000101"
                      value={idSubsls}
                      onChange={(e) => setIdSubsls(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="idSubsls2025">ID Sub-SLS 2025 (Opsional)</label>
                    <input
                      type="text"
                      id="idSubsls2025"
                      className="form-control"
                      placeholder="ID 2025"
                      value={idSubsls2025}
                      onChange={(e) => setIdSubsls2025(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="totalMuatan">Target Muatan (Usaha)</label>
                    <input
                      type="number"
                      id="totalMuatan"
                      className="form-control"
                      min="0"
                      value={totalMuatanAssignment}
                      onChange={(e) => setTotalMuatanAssignment(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="namaPcl">Nama PCL Pencacah</label>
                  <input
                    type="text"
                    id="namaPcl"
                    className="form-control"
                    placeholder="Nama Petugas PCL"
                    value={namaPcl}
                    onChange={(e) => setNamaPcl(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="namaPml">Nama PML Pengawas</label>
                    <input
                      type="text"
                      id="namaPml"
                      className="form-control"
                      placeholder="Nama Pengawas PML"
                      value={namaPml}
                      onChange={(e) => setNamaPml(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="namaKorlap">Nama Korlap</label>
                    <input
                      type="text"
                      id="namaKorlap"
                      className="form-control"
                      placeholder="Nama Korlap"
                      value={namaKorlap}
                      onChange={(e) => setNamaKorlap(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* SUBMIT ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Simpan Data
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Konfirmasi Hapus Data"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <AlertCircle size={28} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700 }}>Apakah Anda yakin ingin menghapus data master ini?</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Tindakan ini tidak dapat dibatalkan. Menghapus data ini akan menghapus semua data anak/turunan yang terkait dengannya secara otomatis (misalnya menghapus Kecamatan juga akan menghapus Desa, SLS, dan Sub-SLS di bawahnya).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Batal
              </Button>
              <Button variant="danger" onClick={handleDelete} isLoading={isSubmitting}>
                Hapus Permanen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ALLOCATION MODAL */}
      {isAllocationModalOpen && (
        <Modal
          isOpen={isAllocationModalOpen}
          onClose={() => setIsAllocationModalOpen(false)}
          title="Alokasi Petugas Wilayah Tugas"
        >
          <form onSubmit={handleAllocationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {feedback && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  backgroundColor: feedback.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: feedback.type === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {feedback.text}
              </div>
            )}

            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700 }}>
                Sub-SLS: {selectedSubSls?.idSubsls}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Wilayah: {selectedSubSls?.sls?.namaSls} ({selectedSubSls?.sls?.desa?.namaDesa})
              </p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '0' }} />

            <div className="form-group">
              <label className="form-label" htmlFor="allocPcl">PCL Pencacah (PPL)</label>
              <select
                id="allocPcl"
                className="form-control"
                value={allocatedPclId}
                onChange={(e) => setAllocatedPclId(e.target.value)}
              >
                <option value="">-- Pilih PCL Pencacah --</option>
                {pclOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama} ({u.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="allocPml">PML Pengawas</label>
              <select
                id="allocPml"
                className="form-control"
                value={allocatedPmlId}
                onChange={(e) => setAllocatedPmlId(e.target.value)}
              >
                <option value="">-- Pilih PML Pengawas --</option>
                {pmlOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama} ({u.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="allocKorlap">Koordinator Lapangan</label>
              <select
                id="allocKorlap"
                className="form-control"
                value={allocatedKorlapId}
                onChange={(e) => setAllocatedKorlapId(e.target.value)}
              >
                <option value="">-- Pilih Korlap --</option>
                {korlapOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama} ({u.username})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <Button type="button" variant="secondary" onClick={() => setIsAllocationModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Simpan Alokasi
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
