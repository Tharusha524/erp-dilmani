import { create } from "zustand";
import type { User } from "../api/userApi";

type AuthState = {
  user: User | null;
  permissionIds: number[];
  initializing: boolean;
  setUser: (user: User | null) => void;
  setPermissionIds: (permissionIds: number[]) => void;
  setInitializing: (initializing: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  permissionIds: [],
  initializing: true,
  setUser: (user) => set({ user }),
  setPermissionIds: (permissionIds) => set({ permissionIds }),
  setInitializing: (initializing) => set({ initializing }),
  clearAuth: () => set({ user: null, permissionIds: [] }),
}));

