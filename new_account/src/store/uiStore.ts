import { create } from "zustand";

type UIState = {
  sidebarOpen: boolean;
  profileDrawerOpen: boolean;
  activeMainItem: string | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setProfileDrawerOpen: (open: boolean) => void;
  setActiveMainItem: (item: string | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  profileDrawerOpen: false,
  activeMainItem: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setProfileDrawerOpen: (open) => set({ profileDrawerOpen: open }),
  setActiveMainItem: (item) => set({ activeMainItem: item }),
}));

