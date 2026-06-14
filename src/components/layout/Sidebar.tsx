// src/components/layout/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardEdit,
  FileSpreadsheet,
  Users,
  Settings,
  LogOut,
  BarChart3,
  Database
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { SessionPayload } from '@/lib/auth';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  session: SessionPayload;
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const role = session.role;

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      allowedRoles: ['admin', 'korlap', 'pml', 'pcl'],
    },
    {
      label: 'Input Laporan',
      icon: ClipboardEdit,
      path: '/form-input',
      allowedRoles: ['admin', 'korlap', 'pml'],
    },
    {
      label: 'Rekap Data',
      icon: FileSpreadsheet,
      path: '/rekap',
      allowedRoles: ['admin', 'korlap', 'pml'], // PCL cannot see Rekap
    },
    {
      label: 'Manajemen User',
      icon: Users,
      path: '/admin/users',
      allowedRoles: ['admin'],
    },
    {
      label: 'Kelola Master Data',
      icon: Database,
      path: '/admin/master',
      allowedRoles: ['admin'],
    },
    {
      label: 'Pengaturan',
      icon: Settings,
      path: '/admin/settings',
      allowedRoles: ['admin'],
    },
  ];

  const filteredMenu = menuItems.filter((item) => item.allowedRoles.includes(role));

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
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-sidebar)',
        color: '#ffffff',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 900,
        boxShadow: 'var(--shadow-lg)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BarChart3 size={24} className="text-blue-400" style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.05em', color: '#ffffff', margin: 0 }}>
            MONITORING SE2026
          </h2>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            KABUPATEN PPU
          </span>
        </div>
      </div>

      {/* Menu Links */}
      <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredMenu.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? 'var(--primary-base)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                transition: 'all var(--transition-fast)',
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon size={18} style={{ opacity: isActive ? 1 : 0.8 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profile & Logout Section */}
      <div
        style={{
          padding: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {session.nama}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Badge variant={roleColors[role]} size="sm">
              {roleLabels[role]}
            </Badge>
          </div>
        </div>

        <form action={logoutAction} style={{ width: '100%' }}>
          <button
            type="submit"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(231, 76, 60, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(231, 76, 60, 0.2)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-danger)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.15)';
              e.currentTarget.style.color = '#f87171';
            }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
