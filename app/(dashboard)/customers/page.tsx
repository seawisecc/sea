'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, Plus, Search, Loader2, Phone, Mail, X } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')

  const supabase = createClient()

  const fetchCustomers = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setCustomers([])
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      setCustomers([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })

    if (data) setCustomers(data as Customer[])
    setLoading(false)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSubmitting(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (profile?.tenant_id) {
      const { error } = await supabase.from('customers').insert({
        tenant_id: profile.tenant_id,
        name: formName,
        phone: formPhone,
        email: formEmail
      })

      if (error) {
        alert('Gagal menyimpan pelanggan: ' + error.message)
      } else {
        setIsModalOpen(false)
        setFormName('')
        setFormPhone('')
        setFormEmail('')
        fetchCustomers()
      }
    } else {
      alert('Tenant tidak ditemukan. Silakan login ulang.')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="p-6 h-full flex flex-col text-[#183022]">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#183022]">Database Pelanggan</h1>
          <p className="text-sm text-[#6B8275] mt-1">Kelola informasi kontak dan profil pelanggan Anda</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#183022] hover:bg-[#234330] text-[#F7F5F0] px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition shadow-md hover:shadow-lg text-sm"
        >
          <Plus size={18} />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      <div className="bg-[#FFFFFF] border border-[#EAE5DA] rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-[#EAE5DA] bg-[#FCFBF9] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4B5AC]" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama pelanggan..." 
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl focus:outline-none focus:border-[#2D5A41] focus:ring-1 focus:ring-[#2D5A41] text-sm text-[#183022] font-medium transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#2D5A41]" size={36} />
            </div>
          ) : customers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-[#A4B5AC] border-2 border-dashed border-[#EAE5DA] rounded-2xl bg-[#FCFBF9]/50 space-y-3">
              <Users size={48} className="text-[#6B8275] opacity-40" />
              <p className="font-bold text-[#183022] text-base">Belum ada data pelanggan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {customers.map((customer) => (
                <div key={customer.id} className="border border-[#EAE5DA] rounded-2xl p-5 flex flex-col hover:border-[#2D5A41] transition-all bg-[#FCFBF9] hover:bg-white shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-[#E8F3ED] flex items-center justify-center text-[#2D5A41] font-extrabold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#183022] text-base line-clamp-1">{customer.name}</h3>
                      <span className="text-[11px] text-[#6B8275] font-semibold uppercase tracking-wider">Pelanggan Aktif</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-[#5A6D62] border-t border-[#EAE5DA]/60 pt-3">
                    <div className="flex items-center gap-2.5">
                      <Phone size={15} className="text-[#8C7A5B]" />
                      <span className="font-medium">{customer.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail size={15} className="text-[#8C7A5B]" />
                      <span className="truncate font-medium">{customer.email || '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#EAE5DA] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#EAE5DA] bg-[#FCFBF9]">
              <h3 className="font-extrabold text-xl text-[#183022]">Tambah Pelanggan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#A4B5AC] hover:text-[#183022] transition-colors"><X size={22} /></button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">Nama Lengkap</label>
                <input required type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl px-4 py-2.5 text-sm text-[#183022] font-medium focus:outline-none focus:border-[#2D5A41] focus:ring-1 focus:ring-[#2D5A41]" placeholder="Contoh: Budi Santoso" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">Nomor WhatsApp / HP</label>
                <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl px-4 py-2.5 text-sm text-[#183022] font-medium focus:outline-none focus:border-[#2D5A41] focus:ring-1 focus:ring-[#2D5A41]" placeholder="Contoh: 08123456789" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">Email (Opsional)</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl px-4 py-2.5 text-sm text-[#183022] font-medium focus:outline-none focus:border-[#2D5A41] focus:ring-1 focus:ring-[#2D5A41]" placeholder="Contoh: budi@gmail.com" />
              </div>

              <div className="pt-4 border-t border-[#EAE5DA] mt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-[#183022] text-[#F7F5F0] rounded-2xl py-3.5 font-bold hover:bg-[#234330] disabled:opacity-50 flex items-center justify-center shadow-lg transition-all text-sm">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}