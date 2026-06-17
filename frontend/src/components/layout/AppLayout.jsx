// frontend/src/components/layout/AppLayout.jsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ClipboardEdit, FileSpreadsheet,
  Users, Settings, LogOut, BarChart3, Database, Menu, X
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin','korlap','pml','pcl'] },
  { label: 'Input Laporan', icon: ClipboardEdit, path: '/form-input', roles: ['admin','korlap','pml'] },
  { label: 'Rekap Data', icon: FileSpreadsheet, path: '/rekap', roles: ['admin','korlap','pml'] },
  { label: 'Manajemen User', icon: Users, path: '/admin/users', roles: ['admin'] },
  { label: 'Kelola Master', icon: Database, path: '/admin/master', roles: ['admin'] },
  { label: 'Pengaturan', icon: Settings, path: '/admin/settings', roles: ['admin'] },
];

const roleLabels = { admin: 'Admin BPS', korlap: 'Korlap', pml: 'PML (Pengawas)', pcl: 'PCL / PPL' };
const roleColors = { admin: '#ef4444', korlap: '#f59e0b', pml: '#3b82f6', pcl: '#10b981' };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
          <BarChart3 size={24} style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.05em', color: '#fff', margin: 0 }}>MONITORING SE2026</h2>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>KABUPATEN PPU</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
        {filteredMenu.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '11px 16px', borderRadius: '8px',
                color: isActive ? '#fff' : '#94a3b8',
                backgroundColor: isActive ? '#6366f1' : 'transparent',
                fontWeight: isActive ? 600 : 500, fontSize: '14px',
                textDecoration: 'none', transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile & Logout */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.15)' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nama}</div>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: `${roleColors[user?.role]}22`, color: roleColors[user?.role], border: `1px solid ${roleColors[user?.role]}44`, fontWeight: 600 }}>
            {roleLabels[user?.role]}
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(231,76,60,0.15)', color: '#f87171', border: '1px solid rgba(231,76,60,0.2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
      {/* Desktop Sidebar */}
      <aside style={{ width: '260px', backgroundColor: '#0a0e1a', color: '#fff', position: 'fixed', top: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column', zIndex: 900, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        className="desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 }} onClick={() => setMobileOpen(false)}>
          <aside style={{ width: '260px', height: '100%', backgroundColor: '#0a0e1a', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '260px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{ display: 'none', padding: '12px 16px', backgroundColor: '#111827', borderBottom: '1px solid rgba(255,255,255,0.08)', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 800 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
            <Menu size={24} />
          </button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Monitoring SE2026</span>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          main { margin-left: 0 !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
