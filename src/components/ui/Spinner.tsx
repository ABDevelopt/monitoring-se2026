// src/components/ui/Spinner.tsx
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
}

export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  const sizes = {
    sm: '16px',
    md: '24px',
    lg: '40px',
  };

  const colors = {
    primary: 'var(--primary-base)',
    white: '#ffffff',
    gray: 'var(--text-muted)',
  };

  const strokeWidths = {
    sm: 2,
    md: 3,
    lg: 4,
  };

  const dimension = sizes[size];
  const stroke = colors[color];
  const strokeWidth = strokeWidths[size];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        className="animate-spin"
        style={{
          animation: 'spin 0.8s linear infinite',
          width: dimension,
          height: dimension,
        }}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          style={{ opacity: 0.25 }}
          cx="12"
          cy="12"
          r="10"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <path
          style={{ opacity: 0.85 }}
          fill={stroke}
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
