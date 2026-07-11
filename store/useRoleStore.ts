import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'owner' | 'cashier'

interface RoleState {
  role: UserRole
  setRole: (role: UserRole) => void
  toggleRole: () => void
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      role: 'owner', // Default sebagai Pemilik Bisnis
      setRole: (newRole) => set({ role: newRole }),
      toggleRole: () => {
        const current = get().role
        set({ role: current === 'owner' ? 'cashier' : 'owner' })
      }
    }),
    { 
      name: 'sea-erp-role-storage',
      partialize: (state) => ({ role: state.role })
    }
  )
)