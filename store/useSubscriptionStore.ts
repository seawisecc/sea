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

    const tenantData: any = Array.isArray(profile?.tenants)
      ? profile?.tenants[0]
      : profile?.tenants
    let effectivePlan: SubPlan = tenantData?.subscription_plan === 'pro' ? 'pro' : 'free'

    // Cek apakah masa Pro sudah habis. Ini murni penilaian di sisi klien —
    // JANGAN menulis balik ke database. Fungsi baca yang mengubah data itu
    // berbahaya: dengan perbandingan tengah-malam-UTC, satu kali buka dashboard
    // di hari terakhir bisa menurunkan akun Pro yang seharusnya masih aktif,
    // dan admin pun ikut melihatnya sebagai free.
    //
    // Berakhirnya langganan dihitung sampai AKHIR hari tanggal tersebut, bukan
    // tengah malamnya, supaya "berlaku sampai 1 Agustus" berarti sepanjang
    // tanggal 1, bukan berhenti saat 1 Agustus pukul 00:00.
    if (effectivePlan === 'pro' && tenantData?.subscription_ends_at) {
      const endsAt = new Date(tenantData.subscription_ends_at)
      endsAt.setHours(23, 59, 59, 999)
      if (endsAt < new Date()) {
        effectivePlan = 'free'
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