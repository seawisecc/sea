'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRoleStore } from '@/store/useRoleStore'
import { Package, Scissors, Plus, Search, Edit, Trash2, Loader2, X, ShieldAlert } from 'lucide-react'

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number).replace(/\s+/g, '')
}

interface Product {
  id: string
  name: string
  type: 'retail' | 'service'
  price: number
  stock: number
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<'retail' | 'service'>('retail')
  const [formPrice, setFormPrice] = useState('')
  const [formStock, setFormStock] = useState('')

  const supabase = createClient()
  const { role } = useRoleStore() // Panggil status role saat ini

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, type, price, stock')
      .order('name', { ascending: true })

    if (data) setProducts(data as Product[])
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (role !== 'owner') {
      alert('Akses Ditolak: Hanya Pemilik (Owner) yang dapat menambah barang baru.')
      return
    }
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      alert('Gagal memverifikasi profil perusahaan Anda.')
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase
      .from('products')
      .insert({
        tenant_id: profile.tenant_id,
        name: formName,
        type: formType,
        price: Number(formPrice),
        cost_price: 0,
        stock: formType === 'retail' ? Number(formStock) : 0,
        variants: '[]',
        is_active: true
      })

    setIsSubmitting(false)

    if (error) {
      alert(`Gagal menyimpan: ${error.message}`)
    } else {
      setFormName('')
      setFormPrice('')
      setFormStock('')
      setFormType('retail')
      setIsModalOpen(false)
      fetchProducts()
    }
  }

  return (
    <div className="p-6 h-full flex flex-col text-[#183022]">
      
      {/* Banner Peringatan untuk Kasir */}
      {role === 'cashier' && (
        <div className="mb-6 bg-[#F4EFE6] border border-[#8C7A5B]/40 rounded-2xl p-4 flex items-center gap-3 text-[#6A5A3C] shadow-sm animate-fade-in">
          <div className="p-2 bg-[#8C7A5B] rounded-xl text-white flex-shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div className="text-xs leading-relaxed">
            <span className="font-bold block text-sm text-[#183022]">Mode Hanya Baca (Staf Kasir)</span>
            Anda dapat melihat daftar katalog dan mengecek sisa stok barang, namun penambahan, pengubahan harga, atau penghapusan item dikunci khusus untuk <strong>Pemilik (Owner)</strong>.
          </div>
        </div>
      )}

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#183022]">Inventaris & Katalog</h1>
          <p className="text-sm text-[#6B8275] mt-1">Kelola master data barang dan layanan jasa</p>
        </div>
        
        {/* Tombol Tambah Item HANYA MUNCUL JIKA ROLE === 'OWNER' */}
        {role === 'owner' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#183022] hover:bg-[#234330] text-[#F7F5F0] px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition shadow-md hover:shadow-lg text-sm"
          >
            <Plus size={18} />
            <span>Tambah Item</span>
          </button>
        )}
      </div>

      <div className="bg-[#FFFFFF] border border-[#EAE5DA] rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-[#EAE5DA] bg-[#FCFBF9] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4B5AC]" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama barang atau jasa..." 
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl focus:outline-none focus:border-[#2D5A41] focus:ring-1 focus:ring-[#2D5A41] text-sm text-[#183022] font-medium transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#2D5A41]" size={36} />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-[#EAE5DA]">
              <thead className="bg-[#FCFBF9] sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-[#6B8275] uppercase tracking-wider">Nama Item</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-[#6B8275] uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-[#6B8275] uppercase tracking-wider">Harga Jual</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-[#6B8275] uppercase tracking-wider">Sisa Stok</th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-[#6B8275] uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-[#FFFFFF] divide-y divide-[#EAE5DA]/60">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-[#A4B5AC] text-sm font-medium">
                      Katalog kosong.
                    </td>
                  </tr>
                ) : (
                  products.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FCFBF9] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-[#183022]">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.type === 'retail' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F3ED] text-[#2D5A41]">
                            <Package size={14} /> Barang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FBECE6] text-[#C26D46]">
                            <Scissors size={14} /> Jasa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-extrabold text-[#183022]">{formatRupiah(item.price)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.type === 'retail' ? (
                          <span className={`font-bold ${item.stock <= 5 ? 'text-[#D37A74]' : 'text-[#183022]'}`}>
                            {item.stock} Unit
                          </span>
                        ) : (
                          <span className="text-[#A4B5AC] italic font-medium">Unlimited</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* KUNCI AKSI JIKA ROLE BUKAN OWNER */}
                        {role === 'owner' ? (
                          <>
                            <button className="text-[#A4B5AC] hover:text-[#2D5A41] p-1 mr-2 transition-colors"><Edit size={18} /></button>
                            <button className="text-[#A4B5AC] hover:text-[#D37A74] p-1 transition-colors"><Trash2 size={18} /></button>
                          </>
                        ) : (
                          <span className="text-xs text-[#A4B5AC] font-semibold italic">Terkunci</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Form Tambah Data (Hanya Owner) */}
      {isModalOpen && role === 'owner' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#EAE5DA] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#EAE5DA] bg-[#FCFBF9]">
              <h3 className="font-extrabold text-xl text-[#183022]">Tambah Item Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#A4B5AC] hover:text-[#183022] transition-colors"><X size={22} /></button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-2">Tipe Item</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 cursor-pointer py-3 px-4 rounded-xl border font-bold text-sm transition-all ${formType === 'retail' ? 'bg-[#E8F3ED] border-[#2D5A41] text-[#2D5A41]' : 'border-[#EAE5DA] text-[#6B8275] hover:bg-[#FCFBF9]'}`}>
                    <input type="radio" name="type" value="retail" checked={formType === 'retail'} onChange={() => setFormType('retail')} className="hidden" />
                    <Package size={16} /> Barang Fisik
                  </label>
                  <label className={`flex items-center justify-center gap-2 cursor-pointer py-3 px-4 rounded-xl border font-bold text-sm transition-all ${formType === 'service' ? 'bg-[#FBECE6] border-[#C26D46] text-[#C26D46]' : 'border-[#EAE5DA] text-[#6B8275] hover:bg-[#FCFBF9]'}`}>
                    <input type="radio" name="type" value="service" checked={formType === 'service'} onChange={() => setFormType('service')} className="hidden" />
                    <Scissors size={16} /> Layanan Jasa
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">Nama Item</label>
                <input required type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl px-4 py-2.5 text-sm text-[#183022] font-medium focus:outline-none focus:border-[#2D5A41] focus:ring-1 focus:ring-[#2D5A41]" placeholder="Contoh: Kopi Susu / Potong Rambut" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">Harga Jual (Rp)</label>
                <input required type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="w-full bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl px-4 py-2.5 text-sm text-[#183022] font-medium focus:outline-none focus:border-[#2D5A41] focus:ring-1 focus:ring-[#2D5A41]" placeholder="Contoh: 15000" />
              </div>

              {formType === 'retail' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">Stok Awal</label>
                  <input required type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} className="w-full bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl px-4 py-2.5 text-sm text-[#183022] font-medium focus:outline-none focus:border-[#2D5A41] focus:ring-1 focus:ring-[#2D5A41]" placeholder="Contoh: 100" />
                </div>
              )}

              <div className="pt-4 border-t border-[#EAE5DA] mt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-[#183022] text-[#F7F5F0] rounded-2xl py-3.5 font-bold hover:bg-[#234330] disabled:opacity-50 flex items-center justify-center shadow-lg transition-all text-sm">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Simpan ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}