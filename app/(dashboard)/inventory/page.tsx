'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSubscriptionStore } from '@/store/useSubscriptionStore'
import { useRoleStore } from '@/store/useRoleStore'
import {
  Package, Plus, Loader2, Search, AlertCircle,
  X, DollarSign, Layers, Tag, Pencil, Trash2
} from 'lucide-react'

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(number).replace(/\s+/g, '')
}

interface Product {
  id: string
  name: string
  type: 'retail' | 'service'
  price: number
  stock: number
  created_at: string
  tenant_id?: string
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Null berarti mode tambah; berisi produk berarti mode edit.
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<'retail' | 'service'>('retail')
  const [formPrice, setFormPrice] = useState('')
  const [formStock, setFormStock] = useState('')

  const supabase = createClient()
  const { canAddProduct } = useSubscriptionStore()
  const { role, tenantId, fetchSession } = useRoleStore()

  const fetchProducts = async () => {
  setLoading(true)
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setProducts([])
      setLoading(false)
      return
    }

    // Ambil tenant_id dari profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    // Kalau user tidak punya tenant_id, jangan tarik data apapun
    if (!profile?.tenant_id) {
      setProducts([])
      setLoading(false)
      return
    }

    // Tarik produk HANYA milik tenant ini. Titik. Tidak ada fallback.
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    setProducts((data as Product[]) || [])
  } catch (err) {
    console.error("Gagal memuat inventaris:", err)
    setProducts([])
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    fetchSession()
    fetchProducts()
  }, [])

  const resetForm = () => {
    setFormName('')
    setFormType('retail')
    setFormPrice('')
    setFormStock('')
    setEditingProduct(null)
  }

  const handleOpenModal = () => {
    setErrorMsg(null)
    resetForm()
    if (!canAddProduct(products.length)) {
      alert('⚠️ Batas paket tercapai (Maksimal 20 item untuk akun Free). Silakan upgrade untuk menambah item tanpa batas.')
      return
    }
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: Product) => {
    setErrorMsg(null)
    setEditingProduct(item)
    setFormName(item.name)
    setFormType(item.type)
    setFormPrice(String(item.price))
    setFormStock(String(item.stock))
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    const priceNum = Number(formPrice)
    const stockNum = formType === 'service' ? 99999 : Number(formStock)

    if (!formName.trim() || priceNum <= 0) {
      setErrorMsg('Nama barang wajib diisi dan harga harus lebih dari 0.')
      setSubmitting(false)
      return
    }

    if (formType === 'retail' && (Number.isNaN(stockNum) || stockNum < 0)) {
      setErrorMsg('Stok tidak boleh kosong atau bernilai negatif.')
      setSubmitting(false)
      return
    }

    try {
      // Tanpa tenant_id, baris akan jadi yatim dan bisa terlihat lintas toko.
      // Lebih baik gagal terang-terangan daripada menyimpan data tanpa pemilik.
      if (!tenantId) {
        setErrorMsg('Akun Anda belum terhubung ke toko mana pun. Silakan login ulang.')
        setSubmitting(false)
        return
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: formName,
            type: formType,
            price: priceNum,
            stock: stockNum
          })
          .eq('id', editingProduct.id)
          .eq('tenant_id', tenantId)

        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert([{
          name: formName,
          type: formType,
          price: priceNum,
          stock: stockNum,
          tenant_id: tenantId
        }])

        if (error) throw error
      }

      handleCloseModal()
      fetchProducts()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan barang ke database.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduct = async (item: Product) => {
    if (role !== 'owner') {
      alert('Hanya Pemilik (Owner) yang dapat menghapus item.')
      return
    }

    const ok = confirm(
      `Hapus "${item.name}" dari inventaris?\n\n` +
      'Riwayat transaksi yang sudah ada tidak ikut terhapus, tapi item ini ' +
      'tidak akan muncul lagi di kasir.'
    )
    if (!ok) return

    setDeletingId(item.id)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', item.id)
      .eq('tenant_id', tenantId)

    setDeletingId(null)

    if (error) {
      // Biasanya karena foreign key: item sudah pernah terjual.
      alert(
        'Gagal menghapus: ' + error.message +
        '\n\nKalau item ini sudah pernah terjual, sebaiknya ubah stoknya jadi 0 ' +
        'daripada dihapus, supaya riwayat penjualan tetap utuh.'
      )
      return
    }

    fetchProducts()
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 text-ink font-sans relative">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink">Inventaris</h1>
          <p className="text-xs text-muted font-semibold mt-1">
            Kelola stok barang ritel dan layanan jasa operasional Anda.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="bg-ink hover:bg-ink-hi active:scale-[0.98] text-on-dark font-extrabold px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-xs uppercase tracking-wider self-start sm:self-auto border border-white/10"
        >
          <Plus size={18} strokeWidth={2.5} className="text-accent" />
          <span>Tambah Item</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
        <Search size={18} className="text-muted ml-2 flex-shrink-0" />
        <input 
          type="text"
          placeholder="Cari nama barang atau jasa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent w-full text-sm font-bold text-ink placeholder:text-muted/50 focus:outline-none"
        />
        <div className="px-3 py-1 bg-paper rounded-xl text-[11px] font-black text-muted uppercase tracking-wider">
          Total: {filteredProducts.length}
        </div>
      </div>

      {/* TABEL INVENTARIS */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-brand" />
            <span className="text-xs font-bold text-muted">Memuat data inventaris...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Package size={48} className="mx-auto text-muted/40 stroke-[1.5]" />
            <p className="text-sm font-bold text-muted">Belum ada barang di dalam inventaris.</p>
            <p className="text-xs text-muted/70">Klik tombol "+ Tambah Item" di atas untuk mulai memasukkan data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-ink/5 text-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Nama Item</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Tipe</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Harga Jual</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Stok Saat Ini</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-transparent font-medium">
                {filteredProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-sm text-ink block">{item.name}</span>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider">ID: {item.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.type === 'retail' 
                          ? 'bg-tint text-brand border border-brand/20' 
                          : 'bg-tint-expense text-expense border border-expense/20'
                      }`}>
                        {item.type === 'retail' ? '🛒 Ritel' : '✂️ Jasa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-sm text-ink">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="px-6 py-4">
                      {item.type === 'service' ? (
                        <span className="text-xs font-black text-muted italic">∞ (Unlimited)</span>
                      ) : (
                        <span className={`text-sm font-black ${item.stock <= 5 ? 'text-danger' : 'text-ink'}`}>
                          {item.stock} <span className="text-[10px] font-bold text-muted">Unit</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          aria-label={`Ubah ${item.name}`}
                          title="Ubah item"
                          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-tint transition-colors"
                        >
                          <Pencil size={15} strokeWidth={2} />
                        </button>
                        {role === 'owner' && (
                          <button
                            onClick={() => handleDeleteProduct(item)}
                            disabled={deletingId === item.id}
                            aria-label={`Hapus ${item.name}`}
                            title="Hapus item"
                            className="p-2 rounded-lg text-danger-2 hover:text-danger hover:bg-tint-danger transition-colors disabled:opacity-40"
                          >
                            {deletingId === item.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Trash2 size={15} strokeWidth={2} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL POP-UP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-ink/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-md text-on-dark shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
            
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-on-dark-2 hover:text-white transition-all"
            >
              <X size={18} strokeWidth={2} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-brand to-ink rounded-2xl border border-white/20 text-white shadow-md">
                {editingProduct
                  ? <Pencil size={22} strokeWidth={2.5} />
                  : <Plus size={22} strokeWidth={2.5} />}
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">
                  {editingProduct ? 'Ubah Item' : 'Tambah Item Baru'}
                </h3>
                <p className="text-xs text-on-dark-2 font-medium">
                  {editingProduct
                    ? 'Perubahan harga hanya berlaku untuk transaksi berikutnya.'
                    : 'Masukkan spesifikasi produk ke database.'}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-danger/20 border border-danger/50 rounded-xl text-xs text-tint-danger font-bold flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-dark-3 mb-1.5">
                  Nama Produk / Layanan
                </label>
                <div className="relative">
                  <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-dark-4" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Kopi Susu Aren / Jasa Potong Rambut"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-10 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-dark-3 mb-1.5">
                  Tipe Item
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormType('retail')}
                    className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                      formType === 'retail' ? 'bg-brand text-white shadow-md' : 'text-on-dark-2 hover:text-white'
                    }`}
                  >
                    🛒 Produk Ritel
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('service')}
                    className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                      formType === 'service' ? 'bg-expense text-white shadow-md' : 'text-on-dark-2 hover:text-white'
                    }`}
                  >
                    ✂️ Layanan Jasa
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-dark-3 mb-1.5">
                    Harga Jual (Rp)
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-dark-4" />
                    <input
                      type="number"
                      required
                      min={0}
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white/10 border border-white/15 rounded-xl px-10 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-dark-3 mb-1.5">
                    Stok Awal
                  </label>
                  {formType === 'retail' ? (
                    <div className="relative">
                      <Layers size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-dark-4" />
                      <input
                        type="number"
                        required
                        min={0}
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        placeholder="0"
                        className="w-full bg-white/10 border border-white/15 rounded-xl px-10 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all font-bold"
                      />
                    </div>
                  ) : (
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-on-dark-2 font-bold text-center italic flex items-center justify-center h-[42px]">
                      Stok Tidak Terbatas
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleCloseModal()}
                  className="w-1/3 py-3 rounded-xl bg-white/10 hover:bg-white/15 font-bold text-xs text-on-dark-2 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 bg-gradient-to-r from-brand to-ink-hi hover:from-brand-soft hover:to-brand text-white font-extrabold py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 disabled:opacity-50 text-xs uppercase tracking-wider"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-accent" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? "Simpan Perubahan" : "Simpan Item Sekarang"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}