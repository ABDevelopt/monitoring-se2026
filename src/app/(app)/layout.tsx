// src/app/(app)/layout.tsx
import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Jika session tidak ditemukan, redirect ke login
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="app-container">
      {/* Sidebar - Fixed on desktop, hidden on mobile (< 768px) */}
      <Sidebar session={session} />
      
      {/* Main Content Area - Right of the sidebar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Navbar - Fixed at top */}
        <Navbar userName={session.nama} />
        
        {/* Page Content */}
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar - Visible only on mobile (< 768px) */}
      <MobileBottomNav session={session} />
    </div>
  );
}
