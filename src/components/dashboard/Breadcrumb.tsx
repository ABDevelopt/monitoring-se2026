// src/components/dashboard/Breadcrumb.tsx
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={items[0]?.onClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: items[0]?.onClick ? 'pointer' : 'default',
          color: items.length > 1 ? 'var(--accent-base)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          fontWeight: 600,
          padding: '4px 6px',
          borderRadius: '4px',
          transition: 'all var(--transition-fast)',
        }}
        onMouseOver={(e) => {
          if (items.length > 1) e.currentTarget.style.backgroundColor = 'var(--primary-glow)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Home size={14} />
        PPU
      </button>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        return (
          <React.Fragment key={idx}>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            
            <button
              onClick={item.onClick}
              disabled={isLast || !item.onClick}
              style={{
                background: 'none',
                border: 'none',
                cursor: !isLast && item.onClick ? 'pointer' : 'default',
                color: isLast ? 'var(--text-primary)' : 'var(--accent-base)',
                fontSize: '13px',
                fontWeight: isLast ? 700 : 600,
                padding: '4px 6px',
                borderRadius: '4px',
                transition: 'all var(--transition-fast)',
              }}
              onMouseOver={(e) => {
                if (!isLast && item.onClick) e.currentTarget.style.backgroundColor = 'var(--primary-glow)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.label}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
