import { create } from 'zustand';
import api from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  roleName: string;
  permissions: string[];
  allAccess: boolean;
}

interface PCMSState {
  user: User | null;
  isLoading: boolean;
  isSyncing: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' | null };
  confirmDialog: { isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean };
  
  
  setUser: (user: User | null) => void;
  fetchInitialData: () => Promise<void>;
  setIsLoading: (loading: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, isDanger?: boolean) => void;
  closeConfirm: () => void;
  logout: () => Promise<void>;
}

export const usePCMSStore = create<PCMSState>((set, get) => ({
  user: null,
  isLoading: false,
  isSyncing: false,
  toast: { message: '', type: null },
  confirmDialog: { isOpen: false, title: '', message: '', onConfirm: () => {}, isDanger: false },

  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: { message: '', type: null } }), 4000);
  },
  showConfirm: (title, message, onConfirm, isDanger = true) => {
    set({ confirmDialog: { isOpen: true, title, message, onConfirm, isDanger } });
  },
  closeConfirm: () => {
    set((state) => ({ confirmDialog: { ...state.confirmDialog, isOpen: false } }));
  },

  setUser: (user) => {
    set({ user });
  },

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const userRes = await api.get('/auth/me');

      if (userRes.data.user) {
        set({ user: userRes.data.user });
      }
    } catch (err) {
      console.error('🚫 Clinical State Error | Failed to synchronize profile:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('accessToken');
      set({ user: null });
      window.location.href = '/login';
    } catch (err) {
      console.error('🚫 Logout Error:', err);
    }
  }
}));
