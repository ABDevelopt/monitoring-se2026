// frontend/src/pages/admin/AdminMasterPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  Database, ChevronDown, ChevronRight, MapPin, Search, 
  Loader2, AlertCircle, RefreshCw, BarChart2, BookOpen, Layers
} from 'lucide-react';

// Sub-component for Desa Node inside Kecamatan Accordion
function DesaNode({ desa }) {
  const [isOpen, setIsOpen] = useState(false);
  const slsCount = desa.sls?.length || 0;
  
  // Calculate total Sub-SLS count
  let totalSubSls = 0;
  let totalAssignment = 0;
  if (desa.sls) {
    desa.sls.forEach(s => {
      totalSubSls += s.subsls?.length || 0;
      if (s.subsls) {
        s.subsls.forEach(sub => {
          totalAssignment += sub.totalMuatanAssignment || 0;
        });
      }
    });
  }

  return (
    <div style={{ marginLeft: '12px', borderLeft: '1px solid rgba(255, 255, 255, 0.05)', paddingLeft: '12px', marginTop: '6px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', 
          backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', cursor: 'pointer',
          border: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background-color 0.15s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
      >
        {isOpen ? <ChevronDown size={16} style={{ color: '#818cf8' }} /> : <ChevronRight size={16} style={{ color: '#94a3b8' }} />}
        <MapPin size={15} style={{ color: '#10b981' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', flex: 1 }}>{desa.namaDesa} ({desa.kodeDesa})</span>
        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
          <span style={{ backgroundColor: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px' }}>{slsCount} SLS</span>
          <span style={{ backgroundColor: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: '4px' }}>{totalSubSls} Sub-SLS</span>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px', color: '#cbd5e1' }}>{totalAssignment} Target</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          {desa.sls && desa.sls.map(sls => (
            <SlsNode key={sls.id} sls={sls} />
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component for SLS Node inside Desa Node
function SlsNode({ sls }) {
  const [isOpen, setIsOpen] = useState(false);
  const subSlsCount = sls.subsls?.length || 0;
  
  let totalAssignment = 0;
  if (sls.subsls) {
    sls.subsls.forEach(sub => {
      totalAssignment += sub.totalMuatanAssignment || 0;
    });
  }

  return (
    <div style={{ marginLeft: '16px', borderLeft: '1px dashed rgba(255, 255, 255, 0.05)', paddingLeft: '12px', marginTop: '4px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', 
          backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '4px', cursor: 'pointer',
          border: '1px solid transparent'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
      >
        {isOpen ? <ChevronDown size={14} style={{ color: '#818cf8' }} /> : <ChevronRight size={14} style={{ color: '#94a3b8' }} />}
        <span style={{ fontSize: '13px', color: '#cbd5e1', flex: 1 }}>{sls.namaSls} ({sls.kodeSls})</span>
        <div style={{ display: 'flex', gap: '6px', fontSize: '10px' }}>
          <span style={{ color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.1)', padding: '1px 5px', borderRadius: '3px' }}>{subSlsCount} Sub-SLS</span>
          <span style={{ color: '#cbd5e1', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '3px' }}>{totalAssignment} Target</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
          {sls.subsls && sls.subsls.map(sub => (
            <div 
              key={sub.id} 
              style={{ 
                marginLeft: '20px', padding: '4px 8px', fontSize: '12px', color: '#94a3b8', 
                backgroundColor: 'rgba(255,255,255,0.005)', display: 'flex', justifyContent: 'space-between',
                borderLeft: '1px solid rgba(99, 102, 241, 0.2)'
              }}
            >
              <span>{sub.namaSubSls || sub.idSubsls} ({sub.kodeSubsls})</span>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                <span style={{ color: '#e2e8f0' }}>Target: <b>{sub.totalMuatanAssignment}</b></span>
                {sub.namaPcl && <span style={{ color: '#34d399' }}>PCL: {sub.namaPcl}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component for Kecamatan Node (Accordion)
function KecamatanAccordion({ kec }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Calculate aggregated stats
  const desaCount = kec.desa?.length || 0;
  let totalSls = 0;
  let totalSubSls = 0;
  let totalAssignment = 0;
  
  if (kec.desa) {
    kec.desa.forEach(d => {
      totalSls += d.sls?.length || 0;
      if (d.sls) {
        d.sls.forEach(s => {
          totalSubSls += s.subsls?.length || 0;
          if (s.subsls) {
            s.subsls.forEach(sub => {
              totalAssignment += sub.totalMuatanAssignment || 0;
            });
          }
        });
      }
    });
  }

  return (
    <div className="glass-card" style={{ padding: '0px', overflow: 'hidden', borderLeft: isOpen ? '4px solid #6366f1' : '1px solid rgba(255,255,255,0.05)' }}>
      {/* Header bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', 
          cursor: 'pointer', backgroundColor: isOpen ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.15s ease'
        }}
      >
        {isOpen ? <ChevronDown size={20} style={{ color: '#818cf8' }} /> : <ChevronRight size={20} style={{ color: '#94a3b8' }} />}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{kec.nama || kec.namaKec} ({kec.kodeKec})</h3>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            <span>{desaCount} Desa</span>
            <span>•</span>
            <span>{totalSls} SLS</span>
            <span>•</span>
            <span>{totalSubSls} Sub-SLS</span>
          </div>
        </div>
        
        {/* Right side stats badge */}
        <div style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', padding: '6px 12px', borderRadius: '8px', textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#a5b4fc', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Target</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#cbd5e1' }}>{totalAssignment}</div>
        </div>
      </div>

      {/* Accordion body */}
      {isOpen && (
        <div style={{ padding: '12px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {kec.desa && kec.desa.map(desa => (
            <DesaNode key={desa.id} desa={desa} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminMasterPage() {
  const [masterData, setMasterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/api/admin/master/kecamatan');
      setMasterData(res.data);
    } catch (err) {
      setErrorMsg('Gagal memuat master data wilayah.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Filter master data by query
  const filteredData = masterData.filter(kec => {
    const query = searchQuery.toLowerCase();
    
    // Match kecamatan nama
    const namaKec = kec.nama || kec.namaKec || '';
    if (namaKec.toLowerCase().includes(query)) return true;
    
    // Check desa, sls, and subsls inside kecamatan
    let matchesDesa = false;
    if (kec.desa) {
      kec.desa.forEach(d => {
        const namaDesa = d.nama || d.namaDesa || '';
        if (namaDesa.toLowerCase().includes(query)) matchesDesa = true;
        if (d.sls) {
          d.sls.forEach(s => {
            const namaSls = s.namaSls || '';
            const kodeSls = s.kodeSls || '';
            if (namaSls.toLowerCase().includes(query) || kodeSls.toLowerCase().includes(query)) matchesDesa = true;
            if (s.subsls) {
              s.subsls.forEach(sub => {
                const namaSubSls = sub.namaSubSls || sub.idSubsls || '';
                const kodeSubsls = sub.kodeSubsls || '';
                if (namaSubSls.toLowerCase().includes(query) || kodeSubsls.toLowerCase().includes(query)) matchesDesa = true;
              });
            }
          });
        }
      });
    }
    return matchesDesa;
  });

  // Calculate global stats
  let totalKec = masterData.length;
  let totalDesa = 0;
  let totalSls = 0;
  let totalSubSls = 0;
  let totalAssignment = 0;

  masterData.forEach(kec => {
    totalDesa += kec.desa?.length || 0;
    if (kec.desa) {
      kec.desa.forEach(d => {
        totalSls += d.sls?.length || 0;
        if (d.sls) {
          d.sls.forEach(s => {
            totalSubSls += s.subsls?.length || 0;
            if (s.subsls) {
              s.subsls.forEach(sub => {
                totalAssignment += sub.totalMuatanAssignment || 0;
              });
            }
          });
        }
      });
    }
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }} className="fade-in">
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={28} style={{ color: '#6366f1' }} />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Kelola Master Data</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '2px 0 0 0' }}>Struktur hirarki wilayah Kecamatan → Desa → SLS → Sub-SLS Kabupaten PPU</p>
          </div>
        </div>
        
        <button 
          onClick={fetchMasterData} 
          disabled={loading}
          className="btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Global Stat Cards */}
      {!loading && !errorMsg && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {/* Card Kecamatan */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(99,102,241,0.15)', padding: '8px', borderRadius: '8px' }}>
              <BookOpen size={18} style={{ color: '#6366f1' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Kecamatan</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>{totalKec}</div>
            </div>
          </div>
          {/* Card Desa */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '8px', borderRadius: '8px' }}>
              <MapPin size={18} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Desa / Kelurahan</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>{totalDesa}</div>
            </div>
          </div>
          {/* Card SLS */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(59,130,246,0.15)', padding: '8px', borderRadius: '8px' }}>
              <Layers size={18} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Satuan Lingkungan Setempat</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>{totalSls}</div>
            </div>
          </div>
          {/* Card Sub-SLS */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(139,92,246,0.15)', padding: '8px', borderRadius: '8px' }}>
              <Layers size={18} style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Sub-SLS</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>{totalSubSls}</div>
            </div>
          </div>
          {/* Card Target */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(245,158,11,0.15)', padding: '8px', borderRadius: '8px' }}>
              <BarChart2 size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Total Target Usaha</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>{totalAssignment}</div>
            </div>
          </div>
        </div>
      )}

      {/* Explorer Search */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '450px' }}>
          <Search size={18} style={{ color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Cari nama kecamatan, desa, SLS, atau kode..." 
            className="form-control"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Hierarchical Accordions */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
          <Loader2 size={32} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : errorMsg ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Tidak ada data wilayah yang cocok dengan pencarian Anda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredData.map(kec => (
            <KecamatanAccordion key={kec.id} kec={kec} />
          ))}
        </div>
      )}
      
    </div>
  );
}
