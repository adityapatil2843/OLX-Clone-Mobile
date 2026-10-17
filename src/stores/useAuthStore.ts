import { create } from 'zustand';
import { UserProfile } from '../types/user';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  setSession: (user: UserProfile) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  setSession: (user: UserProfile) => set({ isAuthenticated: true, user }),
  clearSession: () => set({ isAuthenticated: false, user: null }),
}));
