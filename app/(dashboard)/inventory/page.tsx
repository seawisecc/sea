'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSubscriptionStore } from '@/store/useSubscriptionStore'
import { 
  Package, Plus, Loader2, Search, AlertCircle, 
  X, DollarSign, Layers, Tag 
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
  
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<'retail' | 'service'>('retail')
  const [formPrice, setFormPrice] = useState('')
  const [formStock, setFormStock] = useState('')

  const supabase = createClient()
  const { canAddProduct } = useSubscriptionStore()

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
    fetchProducts()
  }, [])

  const handleOpenModal = () => {
    setErrorMsg(null)
    if (!canAddProduct(products.length)) {
      alert('⚠️ Batas paket tercapai (Maksimal 20 item untuk akun Free). Silakan upgrade untuk menambah item tanpa batas.')
      return
    }
    setIsModalOpen(true)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
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

    try {
      // Ambil tenant_id untuk disuntikkan saat menyimpan
      const { data: { user } } = await supabase.auth.getUser()
      let currentTenantId = null

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single()
        currentTenantId = profile?.tenant_id
      }

      const payload: any = {
        name: formName,
        type: formType,
        price: priceNum,
        stock: stockNum,
      }

      if (currentTenantId) {
        payload.tenant_id = currentTenantId
      }

      const { error } = await supabase
        .from('products')
        .insert([payload])

      if (error) throw error

      setFormName('')
      setFormPrice('')
      setFormStock('')
      setIsModalOpen(false)
      
      fetchProducts()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan barang ke database.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 text-[#183022] font-sans relative">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#183022]">Inventaris</h1>
          <p className="text-xs text-[#6B8275] font-semibold mt-1">
            Kelola stok barang ritel dan layanan jasa operasional Anda.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="bg-[#183022] hover:bg-[#234330] active:scale-[0.98] text-[#F7F5F0] font-extrabold px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-xs uppercase tracking-wider self-start sm:self-auto border border-white/10"
        >
          <Plus size={18} strokeWidth={2.5} className="text-[#8C7A5B]" />
          <span>Tambah Item</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
        <Search size={18} className="text-[#6B8275] ml-2 flex-shrink-0" />
        <input 
          type="text"
          placeholder="Cari nama barang atau jasa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent w-full text-sm font-bold text-[#183022] placeholder:text-[#6B8275]/50 focus:outline-none"
        />
        <div className="px-3 py-1 bg-[#F0EBE1] rounded-xl text-[11px] font-black text-[#6B8275] uppercase tracking-wider">
          Total: {filteredProducts.length}
        </div>
      </div>

      {/* TABEL INVENTARIS */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#2D5A41]" />
            <span className="text-xs font-bold text-[#6B8275]">Memuat data inventaris...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Package size={48} className="mx-auto text-[#6B8275]/40 stroke-[1.5]" />
            <p className="text-sm font-bold text-[#6B8275]">Belum ada barang di dalam inventaris.</p>
            <p className="text-xs text-[#6B8275]/70">Klik tombol "+ Tambah Item" di atas untuk mulai memasukkan data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#EAE5DA]">
              <thead className="bg-[#183022]/5 text-[#6B8275]">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Nama Item</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Tipe</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Harga Jual</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Stok Saat Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DA] bg-transparent font-medium">
                {filteredProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-sm text-[#183022] block">{item.name}</span>
                      <span className="text-[10px] font-bold text-[#6B8275] uppercase tracking-wider">ID: {item.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.type === 'retail' 
                          ? 'bg-[#E8F3ED] text-[#2D5A41] border border-[#2D5A41]/20' 
                          : 'bg-[#FBECE6] text-[#C26D46] border border-[#C26D46]/20'
                      }`}>
                        {item.type === 'retail' ? '🛒 Ritel' : '✂️ Jasa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-sm text-[#183022]">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="px-6 py-4">
                      {item.type === 'service' ? (
                        <span className="text-xs font-black text-[#6B8275] italic">∞ (Unlimited)</span>
                      ) : (
                        <span className={`text-sm font-black ${item.stock <= 5 ? 'text-[#B54D46]' : 'text-[#183022]'}`}>
                          {item.stock} <span className="text-[10px] font-bold text-[#6B8275]">Unit</span>
                        </span>
                      )}
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
          <div className="bg-[#183022]/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-md text-[#F7F5F0] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#A8C3B3] hover:text-white transition-all"
            >
              <X size={18} strokeWidth={2} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-[#2D5A41] to-[#183022] rounded-2xl border border-white/20 text-white shadow-md">
                <Plus size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Tambah Item Baru</h3>
                <p className="text-xs text-[#A8C3B3] font-medium">Masukkan spesifikasi produk ke database.</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-[#B54D46]/20 border border-[#B54D46]/50 rounded-xl text-xs text-[#FDF2F1] font-bold flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#93B2A1] mb-1.5">
                  Nama Produk / Layanan
                </label>
                <div className="relative">
                  <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A9C88]" />
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
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#93B2A1] mb-1.5">
                  Tipe Item
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormType('retail')}
                    className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                      formType === 'retail' ? 'bg-[#2D5A41] text-white shadow-md' : 'text-[#A8C3B3] hover:text-white'
                    }`}
                  >
                    🛒 Produk Ritel
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('service')}
                    className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                      formType === 'service' ? 'bg-[#C26D46] text-white shadow-md' : 'text-[#A8C3B3] hover:text-white'
                    }`}
                  >
                    ✂️ Layanan Jasa
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#93B2A1] mb-1.5">
                    Harga Jual (Rp)
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A9C88]" />
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
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#93B2A1] mb-1.5">
                    Stok Awal
                  </label>
                  {formType === 'retail' ? (
                    <div className="relative">
                      <Layers size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A9C88]" />
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
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-[#A8C3B3] font-bold text-center italic flex items-center justify-center h-[42px]">
                      Stok Tidak Terbatas
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-3 rounded-xl bg-white/10 hover:bg-white/15 font-bold text-xs text-[#A8C3B3] transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 bg-gradient-to-r from-[#2D5A41] to-[#224230] hover:from-[#356B4D] hover:to-[#2D5A41] text-white font-extrabold py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 disabled:opacity-50 text-xs uppercase tracking-wider"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#8C7A5B]" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Item Sekarang</span>
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