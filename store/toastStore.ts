import { create } from 'zustand';

type ToastType = 'error' | 'success' | 'info';

interface ToastStore {
  message: string | null;
  type: ToastType;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  message: null,
  type: 'info',
  showToast: (message, type) => set({ message, type }),
  hideToast: () => set({ message: null }),
}));
