// src/components/layout/PageHeader.tsx
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px',
        animation: 'fadeIn var(--transition-normal) forwards',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: description ? '6px' : '0',
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
