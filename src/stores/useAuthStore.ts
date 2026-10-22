import { create } from 'zustand';
import { UserProfile } from '../types/user';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  setSession: (user: UserProfile) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setSession: (user: UserProfile) => set({ isAuthenticated: true, user, isLoading: false }),
  clearSession: () => set({ isAuthenticated: false, user: null, isLoading: false }),
}));
