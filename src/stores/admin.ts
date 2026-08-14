import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminView } from '@/lib/types'

interface AdminStore {
  me: AdminView | null
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  setMe: (me: AdminView | null) => void
  clear: () => void
  toggleTheme: () => void
  toggleSidebar: () => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      me: null,
      theme: 'light',
      sidebarCollapsed: false,
      setMe: (me) => set({ me }),
      clear: () => set({ me: null }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'wriven-admin',
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
)
