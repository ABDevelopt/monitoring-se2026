// src/components/ui/Modal.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: '400px',
    md: '600px',
    lg: '800px',
    xl: '1000px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 14, 26, 0.75)',
          backdropFilter: 'blur(6px)',
          transition: 'all 0.2s ease',
        }}
      />

      {/* Modal Dialog */}
      <div
        className="animate-fade-in"
        style={{
          position: 'relative',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
          width: '100%',
          maxWidth: sizes[size],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            color: 'var(--text-primary)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
