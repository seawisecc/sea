'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Building2, Crown, ShieldAlert, Pencil, Power, X } from 'lucide-react'
import { useSubscriptionStore } from '@/store/useSubscriptionStore'

const ADMIN_EMAILS = ['seawise.cc@gmail.com']

interface Tenant {
  id: string
  name: string
  subscription_plan: string
  subscription_status: string
  subscription_ends_at: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const { fetchPlan } = useSubscriptionStore()

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [editPlan, setEditPlan] = useState<'free' | 'pro'>('free')
  const [editEndsAt, setEditEndsAt] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
        router.push('/dashboard')
        return
      }
      setAuthorized(true)
      await fetchTenants()
      setLoading(false)
    }
    init()
  }, [])

  const fetchTenants = async () => {
    const { data, error } = await supabase.rpc('admin_list_tenants')
    if (error) {
      alert('Gagal memuat tenant: ' + error.message)
      return
    }
    if (data) setTenants(data as Tenant[])
  }

  const openEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setEditPlan(tenant.subscription_plan === 'pro' ? 'pro' : 'free')
    setEditEndsAt(tenant.subscription_ends_at ? tenant.subscription_ends_at.slice(0, 10) : '')
  }

  const saveEdit = async () => {
    if (!editingTenant) return
    setBusyId(editingTenant.id)

    const endsAtValue = editPlan === 'pro' && editEndsAt 
      ? new Date(editEndsAt).toISOString() 
      : null

    const { error } = await supabase.rpc('admin_update_tenant_plan', {
      p_tenant_id: editingTenant.id,
      p_plan: editPlan,
      p_ends_at: endsAtValue
    })

    if (error) {
      alert('Gagal update: ' + error.message)
    } else {
      await fetchTenants()
      await fetchPlan()
      setEditingTenant(null)
    }
    setBusyId(null)
  }

  const toggleStatus = async (tenant: Tenant) => {
    setBusyId(tenant.id)
    const newStatus = tenant.subscription_status === 'inactive' ? 'active' : 'inactive'

    const { error } = await supabase.rpc('admin_set_tenant_status', {
      p_tenant_id: tenant.id,
      p_status: newStatus
    })

    if (error) {
      alert('Gagal update status: ' + error.message)
    } else {
      await fetchTenants()
    }
    setBusyId(null)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#2D5A41]" size={40} />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="p-6 space-y-6 text-[#183022]">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#183022] rounded-2xl text-white">
          <ShieldAlert size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kelola Tenant</h1>
          <p className="text-sm text-[#6B8275] mt-1">Atur status berlangganan (Free/Pro) untuk setiap bisnis pengguna.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#EAE5DA] overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-[#EAE5DA]">
          <thead className="bg-[#183022]/5 text-[#6B8275]">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Nama Bisnis</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Plan</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Berakhir</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE5DA]">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className={`hover:bg-[#FCFBF9] transition-colors ${tenant.subscription_status === 'inactive' ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-[#6B8275]" />
                    <span className="font-bold text-sm">{tenant.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold text-[#6B8275]">
                    {tenant.subscription_status === 'inactive' ? '⛔ Nonaktif' : tenant.subscription_status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                    tenant.subscription_plan === 'pro'
                      ? 'bg-[#E8F3ED] text-[#2D5A41] border border-[#2D5A41]/20'
                      : 'bg-[#F4EFE6] text-[#8C7A5B] border border-[#8C7A5B]/20'
                  }`}>
                    {tenant.subscription_plan === 'pro' && <Crown size={12} />}
                    {tenant.subscription_plan}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-[#6B8275] font-medium">
                  {tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at).toLocaleDateString('id-ID') : '—'}
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <button
                    onClick={() => openEdit(tenant)}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-[#183022] text-white hover:bg-[#234330] transition-colors flex items-center gap-1.5"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(tenant)}
                    disabled={busyId === tenant.id}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-[#F4EFE6] text-[#8C7A5B] hover:bg-[#EAE0CF] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Power size={12} /> {tenant.subscription_status === 'inactive' ? 'Aktifkan' : 'Nonaktifkan'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingTenant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setEditingTenant(null)} className="absolute right-5 top-5 text-[#6B8275]">
              <X size={18} />
            </button>
            <h3 className="font-bold text-lg mb-4">Edit: {editingTenant.name}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#6B8275] mb-1.5">Plan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditPlan('free')}
                    className={`py-2 rounded-xl text-xs font-bold ${editPlan === 'free' ? 'bg-[#8C7A5B] text-white' : 'bg-[#F4EFE6] text-[#6B8275]'}`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setEditPlan('pro')}
                    className={`py-2 rounded-xl text-xs font-bold ${editPlan === 'pro' ? 'bg-[#2D5A41] text-white' : 'bg-[#F4EFE6] text-[#6B8275]'}`}
                  >
                    Pro
                  </button>
                </div>
              </div>

              {editPlan === 'pro' && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#6B8275] mb-1.5">
                    Pro Berlaku Sampai
                  </label>
                  <input
                    type="date"
                    value={editEndsAt}
                    onChange={(e) => setEditEndsAt(e.target.value)}
                    className="w-full border border-[#EAE5DA] rounded-xl px-3 py-2 text-sm"
                  />
                  <p className="text-[10px] text-[#6B8275] mt-1">Setelah tanggal ini, otomatis kembali ke Free.</p>
                </div>
              )}

              <button
                onClick={saveEdit}
                disabled={busyId === editingTenant.id}
                className="w-full bg-[#183022] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#234330] disabled:opacity-50"
              >
                {busyId === editingTenant.id ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}