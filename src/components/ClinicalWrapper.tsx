'use client'
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePCMSStore } from '@/store/useStore';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import GlobalToast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from './LoadingSpinner';


export default function ClinicalWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, fetchInitialData, isLoading, isSyncing } = usePCMSStore();

  // -------------------------------------------------------------------
  // SECURITY | Persistent Clinical Session Synchronization
  // -------------------------------------------------------------------
  useEffect(() => {
    const syncSession = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token && pathname !== '/login') {
        router.push('/login');
        return;
      }

      if (token && !user) {
        await fetchInitialData();
      }
    };

    syncSession();

    // ── SECURITY | Disable Global Autocomplete ──
    const disableAutocomplete = () => {
      const inputs = document.querySelectorAll('input');
      const forms = document.querySelectorAll('form');
      inputs.forEach(input => {
        if (!input.getAttribute('autocomplete')) {
          input.setAttribute('autocomplete', 'off');
        }
      });
      forms.forEach(form => {
        if (!form.getAttribute('autocomplete')) {
          form.setAttribute('autocomplete', 'off');
        }
      });
    };

    disableAutocomplete();
    // Also run after a short delay to catch dynamically rendered fields
    const timer = setTimeout(disableAutocomplete, 500);
    return () => clearTimeout(timer);
  }, [pathname, user, fetchInitialData, router]);

  if (pathname === '/login') return <>{children}</>;

  if (isLoading) return <LoadingSpinner/>;



  return (
    <div className="main-wrapper">
      {isSyncing && (
        <div className="top-loader-container">
          <div className="top-loader-bar" />
        </div>
      )}
      <div className="no-print">
        <Sidebar />
      </div>
      <main className="content-area">
        <div className="no-print">
          <Header />
        </div>
        <div key={user?.id || 'global'} className="page-content animate-fade-in">
            {children}
        </div>

        {/* ── Global Footer ── */}
        <footer className="no-print" style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.25rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'white',
          marginTop: 'auto',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              © {new Date().getFullYear()} <strong style={{ color: 'var(--text-main)' }}>AKOD TECH</strong>. All rights reserved.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Clinical Management System
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              background: 'rgba(13, 148, 136, 0.08)',
              color: 'var(--primary)',
              letterSpacing: '0.05em'
            }}>
              v1.4
            </span>
          </div>
        </footer>
      </main>
      <GlobalToast />
      <ConfirmDialog />
    </div>
  );
}
