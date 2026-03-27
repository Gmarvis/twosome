import { create } from "zustand";
import type { AuthUser } from "@twosome/application";

const DISPLAY_NAME_KEY = "twosome:displayName";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  displayName: string;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setDisplayName: (name: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  displayName: localStorage.getItem(DISPLAY_NAME_KEY) || "",
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setDisplayName: (displayName) => {
    localStorage.setItem(DISPLAY_NAME_KEY, displayName);
    set({ displayName });
  },
}));
