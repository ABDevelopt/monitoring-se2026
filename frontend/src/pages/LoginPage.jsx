// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, User, KeyRound, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.target);
    try {
      await login(form.get('username'), form.get('password'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0a0e1a', padding: '20px',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(circle at 10% 20%, rgba(34,211,238,0.1) 0%, transparent 50%)',
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', animation: 'fadeIn 0.3s ease forwards' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,238,0.04))', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '32px 24px', textAlign: 'center', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 15px rgba(99,102,241,0.25)', padding: '12px', borderRadius: '12px' }}>
            <BarChart3 size={32} style={{ color: '#22d3ee' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.05em', margin: 0 }}>
              MONITORING <span style={{ color: '#818cf8' }}>SE2026</span>
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>
              Badan Pusat Statistik Kabupaten Penajam Paser Utara
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '32px 24px' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '12px 16px', color: '#ef4444', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                <User size={18} />
              </span>
              <input className="form-control" id="username" name="username" type="text" placeholder="Masukkan username Anda" required style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                <KeyRound size={18} />
              </span>
              <input className="form-control" id="password" name="password" type="password" placeholder="••••••••" required style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Memproses...</> : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}
