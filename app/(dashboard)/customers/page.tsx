'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRoleStore } from '@/store/useRoleStore'
import { Users, Plus, Search, Loader2, Phone, Mail, X, Pencil, Trash2 } from 'lucide-react'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Null berarti mode tambah; berisi data berarti mode ubah.
  const [editing, setEditing] = useState<Customer | null>(null)

  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')

  const supabase = createClient()
  const { role, tenantId, loaded: sessionLoaded, fetchSession } = useRoleStore()

  const fetchCustomers = async () => {
    if (!tenantId) {
      setCustomers([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    setCustomers((data as Customer[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (sessionLoaded) fetchCustomers()
  }, [sessionLoaded, tenantId])

  const resetForm = () => {
    setFormName('')
    setFormPhone('')
    setFormEmail('')
    setEditing(null)
  }

  const openAdd = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditing(c)
    setFormName(c.name)
    setFormPhone(c.phone ?? '')
    setFormEmail(c.email ?? '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!tenantId) {
      alert('Akun Anda belum terhubung ke toko mana pun. Silakan login ulang.')
      setIsSubmitting(false)
      return
    }

    const payload = {
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim()
    }

    const { error } = editing
      ? await supabase
          .from('customers')
          .update(payload)
          .eq('id', editing.id)
          .eq('tenant_id', tenantId)
      : await supabase
          .from('customers')
          .insert({ ...payload, tenant_id: tenantId })

    setIsSubmitting(false)

    if (error) {
      alert('Gagal menyimpan pelanggan: ' + error.message)
      return
    }

    closeModal()
    fetchCustomers()
  }

  const handleDelete = async (c: Customer) => {
    if (role !== 'owner') {
      alert('Hanya Pemilik (Owner) yang dapat menghapus pelanggan.')
      return
    }

    if (!confirm(`Hapus "${c.name}" dari daftar pelanggan?\n\nRiwayat transaksinya tidak ikut terhapus.`)) return

    setDeletingId(c.id)
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', c.id)
      .eq('tenant_id', tenantId)
    setDeletingId(null)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }
    fetchCustomers()
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q)
    )
  }, [customers, search])

  return (
    <div className="p-6 h-full flex flex-col text-ink">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Database Pelanggan</h1>
          <p className="text-sm text-muted mt-1">Kelola informasi kontak dan profil pelanggan Anda</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-ink hover:bg-ink-hi text-on-dark px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition shadow-md hover:shadow-lg text-sm self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      <div className="bg-white border border-line rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-line bg-paper-2 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, nomor HP, atau email..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-line rounded-xl focus:outline-none focus:border-brand text-sm text-ink font-medium transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Hapus pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <span className="hidden sm:flex items-center text-xs font-bold text-muted whitespace-nowrap">
            {filtered.length} pelanggan
          </span>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-brand" size={36} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-faint border-2 border-dashed border-line rounded-2xl bg-paper-2/50 space-y-3">
              <Users size={48} className="text-muted opacity-40" />
              <p className="font-bold text-ink text-base">
                {customers.length === 0 ? 'Belum ada data pelanggan.' : 'Tidak ada yang cocok.'}
              </p>
              <p className="text-xs text-muted">
                {customers.length === 0
                  ? 'Klik "Tambah Pelanggan" untuk mulai mencatat.'
                  : 'Coba kata kunci lain.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((customer) => (
                <div
                  key={customer.id}
                  className="border border-line rounded-2xl p-5 flex flex-col hover:border-brand transition-all bg-paper-2 hover:bg-white shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-tint flex items-center justify-center text-brand font-extrabold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-ink text-base line-clamp-1">{customer.name}</h3>
                      <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
                        Pelanggan Aktif
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(customer)}
                        aria-label={`Ubah ${customer.name}`}
                        title="Ubah"
                        className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-tint transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      {role === 'owner' && (
                        <button
                          onClick={() => handleDelete(customer)}
                          disabled={deletingId === customer.id}
                          aria-label={`Hapus ${customer.name}`}
                          title="Hapus"
                          className="p-1.5 rounded-lg text-danger-2 hover:text-danger hover:bg-tint-danger transition-colors disabled:opacity-40"
                        >
                          {deletingId === customer.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-2 border-t border-line/60 pt-3">
                    <div className="flex items-center gap-2.5">
                      <Phone size={15} className="text-accent-ink flex-shrink-0" />
                      <span className="font-medium">{customer.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail size={15} className="text-accent-ink flex-shrink-0" />
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-line flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-line bg-paper-2">
              <h3 className="font-extrabold text-xl text-ink">
                {editing ? 'Ubah Pelanggan' : 'Tambah Pelanggan'}
              </h3>
              <button onClick={closeModal} aria-label="Tutup" className="text-faint hover:text-ink transition-colors">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Nama Lengkap</label>
                <input
                  required
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white border border-line rounded-xl px-4 py-2.5 text-sm text-ink font-medium focus:outline-none focus:border-brand"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-white border border-line rounded-xl px-4 py-2.5 text-sm text-ink font-medium focus:outline-none focus:border-brand"
                  placeholder="Contoh: 08123456789"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Email (Opsional)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-white border border-line rounded-xl px-4 py-2.5 text-sm text-ink font-medium focus:outline-none focus:border-brand"
                  placeholder="Contoh: budi@gmail.com"
                />
              </div>

              <div className="pt-4 border-t border-line mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-1/3 rounded-2xl py-3.5 font-bold text-sm text-muted bg-paper hover:bg-line transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 bg-ink text-on-dark rounded-2xl py-3.5 font-bold hover:bg-ink-hi disabled:opacity-50 flex items-center justify-center shadow-lg transition-all text-sm"
                >
                  {isSubmitting
                    ? <Loader2 className="animate-spin" size={20} />
                    : editing ? 'Simpan Perubahan' : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
