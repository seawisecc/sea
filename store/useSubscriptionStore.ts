import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export type SubPlan = 'free' | 'pro'

interface SubState {
  plan: SubPlan
  loading: boolean
  fetchPlan: () => Promise<void>
  canAccessPro: () => boolean
  canAddProduct: (currentCount: number) => boolean
}

export const useSubscriptionStore = create<SubState>((set, get) => ({
  plan: 'free',
  loading: true,
  fetchPlan: async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      set({ plan: 'free', loading: false })
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, tenants(subscription_plan, subscription_ends_at)')
      .eq('id', user.id)
      .single()

    const tenantData: any = profile?.tenants
    let effectivePlan: SubPlan = tenantData?.subscription_plan === 'pro' ? 'pro' : 'free'

    // Cek apakah masa Pro sudah habis
    if (effectivePlan === 'pro' && tenantData?.subscription_ends_at) {
      const endsAt = new Date(tenantData.subscription_ends_at)
      if (endsAt < new Date()) {
        effectivePlan = 'free'
        // Self-heal: update database supaya konsisten dengan tampilan admin
        await supabase
          .from('tenants')
          .update({ subscription_plan: 'free' })
          .eq('id', profile?.tenant_id)
      }
    }

    set({ plan: effectivePlan, loading: false })
  },
  canAccessPro: () => get().plan === 'pro',
  canAddProduct: (currentCount: number) => {
    if (get().plan === 'pro') return true
    return currentCount < 20
  }
}))