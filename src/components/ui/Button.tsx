// src/components/ui/Button.tsx
import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: '13px' },
    md: { padding: '10px 18px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' },
  };

  const selectedSize = sizes[size];
  const btnClass = `btn btn-${variant} ${isLoading ? 'btn-loading' : ''} ${className}`;

  return (
    <button
      className={btnClass}
      disabled={disabled || isLoading}
      style={{
        ...selectedSize,
        opacity: disabled || isLoading ? 0.6 : 1,
        pointerEvents: disabled || isLoading ? 'none' : 'auto',
        ...style,
      }}
      {...props}
    >
      {isLoading && <Spinner size="sm" color={variant === 'secondary' || variant === 'outline' ? 'primary' : 'white'} />}
      {children}
    </button>
  );
}
