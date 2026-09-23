import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  activeDrawer: string | null;
  soundAlerts: boolean;
  reducedMotion: boolean;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  openDrawer: (drawerId: string) => void;
  closeDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  activeDrawer: null,
  soundAlerts: false,
  reducedMotion: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  openDrawer: (drawerId) => set({ activeDrawer: drawerId }),
  closeDrawer: () => set({ activeDrawer: null }),
}));
