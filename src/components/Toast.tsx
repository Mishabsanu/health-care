'use client'
import React from 'react';
import { usePCMSStore } from '@/store/useStore';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function GlobalToast() {
  const { toast } = usePCMSStore();

  if (!toast.message) return null;

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return { 
          background: 'rgba(20, 184, 166, 0.95)', 
          icon: <CheckCircle2 size={18} />, 
          border: '1px solid #14b8a6' 
        };
      case 'error':
        return { 
          background: 'rgba(239, 68, 68, 0.95)', 
          icon: <AlertCircle size={18} />, 
          border: '1px solid #ef4444' 
        };
      case 'info':
        return { 
          background: 'rgba(59, 130, 246, 0.95)', 
          icon: <Info size={18} />, 
          border: '1px solid #3b82f6' 
        };
      default:
        return { background: 'rgba(15, 23, 42, 0.9)', icon: null, border: 'none' };
    }
  };

  const { background, icon, border } = getStyles();

  return (
    <div 
      className="global-toast-overlay animate-slide-up"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        background,
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        border,
        fontWeight: 600,
        fontSize: '0.9rem',
        minWidth: '300px'
      }}
    >
      <span style={{ display: 'flex' }}>{icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
    </div>
  );
}
