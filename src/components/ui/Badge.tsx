// src/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'info', size = 'sm' }: BadgeProps) {
  const styles = {
    success: {
      backgroundColor: 'var(--color-success-bg)',
      color: 'var(--color-success-text)',
      border: '1px solid rgba(46, 204, 113, 0.2)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-bg)',
      color: 'var(--color-warning-text)',
      border: '1px solid rgba(243, 156, 18, 0.2)',
    },
    danger: {
      backgroundColor: 'var(--color-danger-bg)',
      color: 'var(--color-danger-text)',
      border: '1px solid rgba(231, 76, 60, 0.2)',
    },
    info: {
      backgroundColor: 'var(--color-info-bg)',
      color: 'var(--color-info-text)',
      border: '1px solid rgba(52, 73, 94, 0.2)',
    },
    gray: {
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border-light)',
    },
  };

  const sizes = {
    sm: {
      padding: '2px 8px',
      fontSize: '11px',
    },
    md: {
      padding: '4px 12px',
      fontSize: '12px',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderRadius: '50px',
        whiteSpace: 'nowrap',
        ...styles[variant],
        ...sizes[size],
      }}
    >
      {children}
    </span>
  );
}
