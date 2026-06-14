// src/components/layout/MobileBottomNav.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardEdit,
  FileSpreadsheet,
  Users,
  Settings
} from 'lucide-react';
import { SessionPayload } from '@/lib/auth';

interface MobileBottomNavProps {
  session: SessionPayload;
}

export function MobileBottomNav({ session }: MobileBottomNavProps) {
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
      label: 'Input',
      icon: ClipboardEdit,
      path: '/form-input',
      allowedRoles: ['admin', 'korlap', 'pml'],
    },
    {
      label: 'Rekap',
      icon: FileSpreadsheet,
      path: '/rekap',
      allowedRoles: ['admin', 'korlap', 'pml'],
    },
    {
      label: 'Users',
      icon: Users,
      path: '/admin/users',
      allowedRoles: ['admin'],
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/admin/settings',
      allowedRoles: ['admin'],
    },
  ];

  const filteredMenu = menuItems.filter((item) => item.allowedRoles.includes(role));

  return (
    <div
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 950,
        padding: '0 12px',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      {filteredMenu.map((item) => {
        const isActive = pathname.startsWith(item.path);
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            href={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: isActive ? 'var(--accent-cyan)' : '#94a3b8',
              textDecoration: 'none',
              flex: 1,
              height: '100%',
              fontSize: '11px',
              fontWeight: isActive ? 600 : 500,
              transition: 'all var(--transition-fast)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 12px',
                borderRadius: '16px',
                backgroundColor: isActive ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Icon size={20} style={{ color: isActive ? 'var(--accent-cyan)' : '#94a3b8' }} />
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
      
      <style jsx global>{`
        @media (min-width: 768px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
