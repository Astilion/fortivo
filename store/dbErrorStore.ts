import { DatabaseMigrationError } from '@/database/database';
import { create } from 'zustand';

interface DbErrorStore {
  dbError: DatabaseMigrationError | null;
  // Bumped per recovery attempt; AppProvider re-runs full bootstrap on change.
  reinitNonce: number;
  setDbError: (error: DatabaseMigrationError) => void;
  clearDbError: () => void;
  requestReinit: () => void;
}

export const useDbErrorStore = create<DbErrorStore>((set) => ({
  dbError: null,
  reinitNonce: 0,
  setDbError: (error) => set({ dbError: error }),
  clearDbError: () => set({ dbError: null }),
  // Keep dbError set so the recovery screen stays mounted while AppProvider
  // re-bootstraps; it clears the error on success or replaces it on failure.
  requestReinit: () => set((state) => ({ reinitNonce: state.reinitNonce + 1 })),
}));
