'use client'
import React from 'react';
import { usePCMSStore } from '@/store/useStore';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog() {
  const { confirmDialog, closeConfirm } = usePCMSStore();

  if (!confirmDialog.isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, animation: 'fadeIn 0.2s ease' }}>
      <div className="card-premium animate-fade-in" style={{ width: '95%', maxWidth: '450px', padding: '2.5rem', background: 'white', border: '1px solid var(--border-subtle)', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)', position: 'relative' }}>
        
        <button 
          onClick={closeConfirm}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: confirmDialog.isDanger ? '#fee2e2' : 'rgba(15, 118, 110, 0.1)', 
            color: confirmDialog.isDanger ? '#ef4444' : 'var(--primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' 
          }}>
            <AlertTriangle size={32} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 950, letterSpacing: '-0.02em', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            {confirmDialog.title}
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.6, marginBottom: '2.5rem' }}>
            {confirmDialog.message}
          </p>

          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button 
              onClick={closeConfirm} 
              style={{ flex: 1, padding: '0.85rem', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', border: '2px solid var(--border-subtle)', background: 'white' }}
            >
              CANCEL
            </button>
            <button 
              onClick={() => {
                confirmDialog.onConfirm();
                closeConfirm();
              }} 
              style={{ 
                flex: 1, padding: '0.85rem', borderRadius: 'var(--radius-md)', fontWeight: 900, fontSize: '0.9rem', color: 'white', 
                background: confirmDialog.isDanger ? '#ef4444' : 'var(--primary)',
                boxShadow: confirmDialog.isDanger ? '0 10px 20px -5px rgba(239, 68, 68, 0.4)' : '0 10px 20px -5px rgba(15, 118, 110, 0.4)'
              }}
            >
              CONFIRM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
