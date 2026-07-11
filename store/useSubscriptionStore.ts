import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SubPlan = 'free' | 'pro'

interface SubState {
  plan: SubPlan
  setPlan: (plan: SubPlan) => void
  canAccessPro: () => boolean
  canAddProduct: (currentCount: number) => boolean
}

export const useSubscriptionStore = create<SubState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      setPlan: (plan) => set({ plan }),
      canAccessPro: () => get().plan === 'pro',
      canAddProduct: (currentCount: number) => {
        if (get().plan === 'pro') return true
        return currentCount < 20
      }
    }),
    { name: 'sea-erp-sub-storage' }
  )
)