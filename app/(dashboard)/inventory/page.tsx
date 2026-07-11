'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRoleStore } from '@/store/useRoleStore'
import { useSubscriptionStore } from '@/store/useSubscriptionStore'
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
  const { role } = useRoleStore()
  const { canAddProduct } = useSubscriptionStore()

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
    
    // GATEKEEPER: Cek Subscription
    if (!canAddProduct(products.length)) {
      alert('Batas maksimal produk untuk Free Plan adalah 20 item. Upgrade ke Pro untuk menambah lagi.')
      return
    }

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

    const { error } = await supabase
      .from('products')
      .insert({
        tenant_id: profile?.tenant_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: formName,
        type: formType,
        price: Number(formPrice),
        stock: formType === 'retail' ? Number(formStock) : 0,
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
      {role === 'cashier' && (
        <div className="mb-6 bg-[#F4EFE6] border border-[#8C7A5B]/40 rounded-2xl p-4 flex items-center gap-3 text-[#6A5A3C] shadow-sm">
          <ShieldAlert size={20} className="flex-shrink-0" />
          <p className="text-xs font-bold">Mode Kasir: Hanya dapat melihat stok.</p>
        </div>
      )}

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#183022]">Inventaris</h1>
        </div>
        {role === 'owner' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#183022] hover:bg-[#234330] text-[#F7F5F0] px-5 py-3 rounded-2xl font-bold text-sm"
          >
            <Plus size={18} /> Tambah Item
          </button>
        )}
      </div>

      <div className="bg-[#FFFFFF] border border-[#EAE5DA] rounded-3xl shadow-sm flex-1 overflow-auto">
        {loading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div> : (
          <table className="min-w-full divide-y divide-[#EAE5DA]">
  <thead className="bg-[#FCFBF9]">
    <tr>
      <th className="px-6 py-4 text-left text-xs font-bold text-[#6B8275] uppercase">Nama</th>
      <th className="px-6 py-4 text-left text-xs font-bold text-[#6B8275] uppercase">Tipe</th>
      <th className="px-6 py-4 text-left text-xs font-bold text-[#6B8275] uppercase">Harga</th>
      <th className="px-6 py-4 text-left text-xs font-bold text-[#6B8275] uppercase">Stok</th>
    </tr>
  </thead>
  
  {/* TAMBAHKAN TBODY DI SINI */}
  <tbody className="bg-white divide-y divide-[#EAE5DA]">
    {products.map((item) => (
      <tr key={item.id} className="hover:bg-[#FCFBF9]">
        <td className="px-6 py-4 font-bold">{item.name}</td>
        <td className="px-6 py-4">{item.type}</td>
        <td className="px-6 py-4 font-extrabold">{formatRupiah(item.price)}</td>
        <td className="px-6 py-4 font-bold">{item.stock}</td>
      </tr>
    ))}
  </tbody>
  {/* TUTUP TBODY DI SINI */}
  
</table>
        )}
      </div>

      {/* Modal Tambah Item... (tetap sama) */}
    </div>
  )
}