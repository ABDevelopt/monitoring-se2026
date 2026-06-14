// src/components/layout/Navbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';

interface NavbarProps {
  userName: string;
}

export function Navbar({ userName }: NavbarProps) {
  const [alertCount, setAlertCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch EWS alert count
  useEffect(() => {
    async function fetchAlertCount() {
      try {
        const res = await fetch('/api/ews');
        if (res.ok) {
          const data = await res.json();
          setAlertCount(data.alerts?.length || 0);
        }
      } catch (error) {
        console.error('Failed to fetch EWS alert count:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAlertCount();
    // Poll every 60 seconds
    const interval = setInterval(fetchAlertCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'rgba(10, 14, 26, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-light)',
        position: 'fixed',
        top: 0,
        right: 0,
        left: 'var(--sidebar-width)', // Dynamic depending on screen width
        zIndex: 800,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'left var(--transition-normal)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Brand / Title Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
          className="brand-text"
        >
          Sensus Ekonomi 2026 Kabupaten Penajam Paser Utara
        </span>
      </div>

      {/* Right Side Icons & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Early Warning Alert Icon */}
        <Link
          href="/dashboard?tab=ews"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '50%',
            backgroundColor: alertCount > 0 ? 'var(--color-danger-bg)' : 'rgba(255, 255, 255, 0.05)',
            color: alertCount > 0 ? 'var(--color-danger-text)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          title={alertCount > 0 ? `${alertCount} Peringatan Kendala Aktif` : 'Tidak ada Peringatan Kendala'}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = alertCount > 0 ? 'var(--color-danger-bg)' : 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = alertCount > 0 ? 'var(--color-danger-bg)' : 'rgba(255, 255, 255, 0.05)';
          }}
        >
          {alertCount > 0 ? <AlertTriangle size={20} className="animate-pulse" /> : <Bell size={20} />}
          
          {!isLoading && alertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--color-danger)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px var(--bg-card)',
              }}
            >
              {alertCount}
            </span>
          )}
        </Link>

        {/* Separator */}
        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-light)' }} />

        {/* User Info & Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-base)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }} className="user-text">
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {userName}
            </span>
          </div>
        </div>

        {/* Mobile Logout Button (Form action) */}
        <form action={logoutAction} className="mobile-logout-btn" style={{ display: 'none' }}>
          <button
            type="submit"
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Keluar"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (max-width: 768px) {
          header {
            padding: 0 16px;
          }
          .brand-text {
            max-width: 180px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .user-text {
            display: none !important;
          }
          .mobile-logout-btn {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
