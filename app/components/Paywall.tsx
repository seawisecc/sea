'use client'

import { useSubscriptionStore } from '@/store/useSubscriptionStore'
import { Crown } from 'lucide-react'

export function Paywall({ children }: { children: React.ReactNode }) {
  const { plan } = useSubscriptionStore()

  if (plan !== 'pro') {
    return (
      <div className="p-10 border-2 border-dashed border-line rounded-3xl text-center bg-paper-2 my-6">
        <Crown size={40} className="mx-auto text-accent-ink mb-4" />
        <h2 className="text-lg font-bold text-ink">Fitur Pro Diperlukan</h2>
        <p className="text-sm text-muted mb-4">Upgrade ke paket Pro untuk mengakses analitik mendalam.</p>
        <button 
          onClick={() => alert("Arahkan ke link pembayaran/WhatsApp Anda")}
          className="bg-ink text-on-dark px-6 py-2 rounded-xl font-bold text-sm hover:bg-ink-hi transition-colors"
        >
          Upgrade Sekarang
        </button>
      </div>
    )
  }

  return <>{children}</>
}