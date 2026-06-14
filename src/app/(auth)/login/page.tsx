// src/app/(auth)/login/page.tsx
'use client';

import React, { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { KeyRound, User, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, undefined);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0e1a',
        padding: '20px',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 60%), radial-gradient(circle at 10% 20%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          animation: 'fadeIn var(--transition-normal) forwards',
        }}
      >
        {/* Banner Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(34, 211, 238, 0.04) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '32px 24px',
            textAlign: 'center',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
              padding: '12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart3 size={32} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.05em', margin: 0 }}>
              MONITORING <span style={{ color: 'var(--primary-light)' }}>SE2026</span>
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 500 }}>
              Badan Pusat Statistik Kabupaten Penajam Paser Utara
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form action={action} style={{ padding: '32px 24px' }}>
          {state?.error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'var(--danger)',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
                lineHeight: '1.4',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)',
              }}
            >
              {state.error}
            </div>
          )}

          {/* Username Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <User size={18} />
              </span>
              <input
                className="form-control"
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan username Anda"
                required
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <KeyRound size={18} />
              </span>
              <input
                className="form-control"
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            isLoading={isPending}
            variant="primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          >
            Masuk ke Sistem
          </Button>
        </form>
      </div>
    </div>
  );
}
