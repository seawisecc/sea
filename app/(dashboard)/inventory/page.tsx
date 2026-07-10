'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Package, 
  Scissors, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  X
} from 'lucide-react'

// Fungsi format rupiah
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number)
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
  
  // State Form Tambah Produk
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<'retail' | 'service'>('retail')
  const [formPrice, setFormPrice] = useState('')
  const [formStock, setFormStock] = useState('')

  const supabase = createClient()

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, type, price, stock')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) setProducts(data as Product[])
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Ambil tenant_id dari user yang sedang login
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Karena RLS ketat, kita perlu mengambil tenant_id milik user ini dari user_profiles
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

    // Insert ke database
    const { error } = await supabase
      .from('products')
      .insert({
        tenant_id: profile.tenant_id,
        name: formName,
        type: formType,
        price: Number(formPrice),
        cost_price: 0, // Disederhanakan untuk MVP
        stock: formType === 'retail' ? Number(formStock) : 0,
        variants: '[]'
      })

    setIsSubmitting(false)

    if (error) {
      alert(`Gagal menyimpan: ${error.message}`)
    } else {
      // Reset form dan tutup modal
      setFormName('')
      setFormPrice('')
      setFormStock('')
      setFormType('retail')
      setIsModalOpen(false)
      fetchProducts() // Refresh tabel
    }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventaris & Katalog</h1>
          <p className="text-sm text-gray-500">Kelola master data barang dan layanan jasa</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition shadow-sm"
        >
          <Plus size={20} />
          <span>Tambah Data</span>
        </button>
      </div>

      {/* Area Tabel Data */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama barang atau jasa..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Jual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sisa Stok</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                      Katalog kosong. Silakan tambah data baru.
                    </td>
                  </tr>
                ) : (
                  products.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.type === 'retail' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            <Package size={14} /> Barang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            <Scissors size={14} /> Jasa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">{formatRupiah(item.price)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.type === 'retail' ? (
                          <span className={`font-medium ${item.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.stock} Unit
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Unlimited</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-blue-600 p-1 mr-2"><Edit size={18} /></button>
                        <button className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Tambah Data */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-900">Tambah Data Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Item</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value="retail" checked={formType === 'retail'} onChange={() => setFormType('retail')} className="text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm">Barang Fisik (Retail)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value="service" checked={formType === 'service'} onChange={() => setFormType('service')} className="text-orange-500 focus:ring-orange-500" />
                    <span className="text-sm">Jasa / Layanan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item</label>
                <input required type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Contoh: Kopi Susu / Potong Rambut" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Rp)</label>
                <input required type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Contoh: 15000" />
              </div>

              {formType === 'retail' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
                  <input required type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Contoh: 100" />
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white rounded-md py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}