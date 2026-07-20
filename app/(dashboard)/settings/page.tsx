'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRoleStore } from '@/store/useRoleStore'
import { Store, Users, Plus, Loader2, X, Mail, Lock, User, Save } from 'lucide-react'

interface Member {
  id: string
  email: string
  role: string
  created_at: string
}

export default function SettingsPage() {
  const supabase = createClient()
  const { setTenantName } = useRoleStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [storeName, setStoreName] = useState('')
  const [members, setMembers] = useState<Member[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')

  const loadData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, tenants(name)')
      .eq('id', user.id)
      .single()

    const tenantData: any = profile?.tenants
    setStoreName(tenantData?.name || '')

    const { data: memberData } = await supabase.rpc('list_tenant_members')
    if (memberData) setMembers(memberData as Member[])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveStoreName = async () => {
    setSaving(true)
    const { error } = await supabase.rpc('update_own_tenant_name', { p_name: storeName })
    if (error) {
      alert('Gagal menyimpan: ' + error.message)
    } else {
      // Sidebar ikut berubah tanpa perlu memuat ulang halaman
      setTenantName(storeName)
    }
    setSaving(false)
  }

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setErrorMsg('Sesi tidak ditemukan. Silakan login ulang.')
      setSubmitting(false)
      return
    }

    const res = await fetch('/api/create-cashier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ name: formName, email: formEmail, password: formPassword })
    })

    const result = await res.json()

    if (!res.ok) {
      setErrorMsg(result.error || 'Gagal menambah kasir.')
    } else {
      setIsModalOpen(false)
      setFormName('')
      setFormEmail('')
      setFormPassword('')
      loadData()
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand" size={40} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 text-ink">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted mt-1">Kelola informasi toko dan akses tim Anda.</p>
      </div>

      {/* INFO TOKO */}
      <div className="bg-white rounded-3xl border border-line p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Store size={20} className="text-brand" />
          <h2 className="font-bold text-lg">Informasi Toko</h2>
        </div>
        <div className="flex gap-3 max-w-md">
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="flex-1 border border-line rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand"
            placeholder="Nama Toko"
          />
          <button
            onClick={handleSaveStoreName}
            disabled={saving}
            className="bg-ink text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-ink-hi disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan
          </button>
        </div>
      </div>

      {/* KELOLA TIM / KASIR */}
      <div className="bg-white rounded-3xl border border-line p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-brand" />
            <h2 className="font-bold text-lg">Tim & Akses Kasir</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-ink text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-ink-hi"
          >
            <Plus size={16} /> Tambah Kasir
          </button>
        </div>

        <div className="divide-y divide-line">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-sm">{m.email}</p>
                <p className="text-xs text-muted">{new Date(m.created_at).toLocaleDateString('id-ID')}</p>
              </div>
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                m.role === 'owner' ? 'bg-tint-accent text-accent-ink' : 'bg-tint text-brand'
              }`}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL TAMBAH KASIR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-line">
            <div className="flex justify-between items-center p-6 border-b border-line bg-paper-2">
              <h3 className="font-extrabold text-xl">Tambah Akun Kasir</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-faint hover:text-ink">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleAddCashier} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-tint-danger border border-danger/30 rounded-xl text-xs text-danger font-bold">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Nama Kasir</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    required type="text" value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand"
                    placeholder="Contoh: Siti Kasir"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    required type="email" value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand"
                    placeholder="kasir@tokosaya.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    required type="password" minLength={6} value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ink text-white rounded-xl py-3 font-bold hover:bg-ink-hi disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Buat Akun Kasir'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}