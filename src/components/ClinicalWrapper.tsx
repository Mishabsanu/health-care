'use client'
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePCMSStore } from '@/store/useStore';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import GlobalToast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

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
  }, [pathname, user, fetchInitialData, router]);

  if (pathname === '/login') return <>{children}</>;



  return (
    <div className="main-wrapper">
      {isSyncing && (
        <div className="top-loader-container">
          <div className="top-loader-bar" />
        </div>
      )}
      <Sidebar />
      <main className="content-area">
        <Header />
        <div key={user?.id || 'global'} className="page-content animate-fade-in">
            {children}
        </div>
      </main>
      <GlobalToast />
      <ConfirmDialog />
    </div>
  );
}
