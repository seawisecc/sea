'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useCartStore, Product } from '@/store/useCartStore'
import { Loader2, Plus, Trash2, Package, Scissors, CheckCircle2, ShoppingBag } from 'lucide-react'

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  })
    .format(number)
    .replace(/\s+/g, '')
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [successInfo, setSuccessInfo] = useState<{ inv: string } | null>(null)
  
  const supabase = createClient()
  const { items, addToCart, removeFromCart, total, clearCart } = useCartStore()

  const fetchProducts = async () => {
    // Menarik semua produk tanpa filter is_active agar barang baru tidak hilang
    const { data } = await supabase
      .from('products')
      .select('id, name, price, type')
      .order('name', { ascending: true })
      
    if (data) setProducts(data as Product[])
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handlePay = async () => {
    if (items.length === 0) return
    setCheckoutLoading(true)
    setSuccessInfo(null)

    // Menggunakan (item: any) untuk mencegah error TypeScript ketat
    const formattedItems = items.map((item: any) => ({
      product_id: item.id || item.cartItemId,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
      type: item.type || 'retail',
      metadata: item.type === 'service' ? { staff_name: 'Staf Ahli' } : {}
    }))

    const { data, error } = await supabase.rpc('handle_checkout', {
      p_customer_name: customerName,
      p_total_amount: total(),
      p_discount_amount: 0,
      p_grand_total: total(),
      p_payment_method: paymentMethod,
      p_items: formattedItems
    })

    setCheckoutLoading(false)

    if (error) {
      alert(`Transaksi Gagal: ${error.message}`)
      return
    }

    const response = data as { success: boolean; invoice_number: string }
    if (response?.success) {
      setSuccessInfo({ inv: response.invoice_number })
      clearCart()
      setCustomerName('Walk-in Customer')
      fetchProducts()
    }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-[#183022] tracking-tight">Kasir (POS)</h1>
          <p className="text-sm text-[#6B8275] mt-1">Sistem transaksi ritel dan layanan eksklusif</p>
        </div>
      </div>

      {successInfo && (
        <div className="mb-6 bg-[#E8F3ED] border border-[#B8D8C8] rounded-2xl p-4 flex items-center text-[#183022] gap-3 shadow-sm animate-fade-in">
          <div className="p-2 bg-[#2D5A41] rounded-full text-white">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="font-bold">Transaksi Berhasil!</span> Nota <span className="underline font-mono font-semibold">{successInfo.inv}</span> telah tercatat di sistem.
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Area Kiri: Katalog */}
        <div className="w-full lg:w-3/5 bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#EAE5DA] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg text-[#183022]">Katalog Layanan & Produk</h2>
            <span className="text-xs bg-[#F0EBE1] text-[#5A6D62] px-3 py-1 rounded-full font-medium">
              {products.length} Item Aktif
            </span>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#2D5A41]" size={36} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-1">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="group flex flex-col text-left bg-[#FCFBF9] border border-[#EAE5DA] rounded-2xl p-4 hover:border-[#2D5A41] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none"
                >
                  <div className="flex justify-between items-start w-full mb-3">
                    <div className="p-2.5 rounded-xl bg-[#F4EFE6] group-hover:bg-[#E8F3ED] transition-colors">
                      {product.type === 'retail' ? (
                        <Package className="text-[#5A6D62] group-hover:text-[#183022]" size={18} />
                      ) : (
                        <Scissors className="text-[#A85A32] group-hover:text-[#183022]" size={18} />
                      )}
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold tracking-wide ${
                      product.type === 'retail' 
                        ? 'bg-[#E8F3ED] text-[#2D5A41]' 
                        : 'bg-[#FBECE6] text-[#C26D46]'
                    }`}>
                      {product.type === 'retail' ? 'Barang' : 'Jasa'}
                    </span>
                  </div>
                  <span className="font-semibold text-[#183022] text-sm line-clamp-2 mt-auto group-hover:text-[#2D5A41] transition-colors">{product.name}</span>
                  <span suppressHydrationWarning className="text-[#183022] font-extrabold text-base mt-2">{formatRupiah(product.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Area Kanan: Keranjang */}
        <div className="w-full lg:w-2/5 bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#EAE5DA] p-6 flex flex-col h-[calc(100vh-8.5rem)]">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#F0EBE1]">
            <ShoppingBag className="text-[#2D5A41]" size={20} />
            <h2 className="font-bold text-lg text-[#183022]">Keranjang Pesanan</h2>
          </div>
          
          <div className="space-y-3 mb-4 bg-[#FCFBF9] p-4 rounded-2xl border border-[#EAE5DA]/60">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">Nama Pelanggan</label>
              <input 
                type="text" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl px-3.5 py-2 text-sm text-[#183022] font-medium focus:outline-none focus:border-[#2D5A41] focus:ring-1 focus:ring-[#2D5A41] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">Metode Pembayaran</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl px-3.5 py-2 text-sm text-[#183022] font-medium focus:outline-none focus:border-[#2D5A41] focus:ring-1 focus:ring-[#2D5A41] transition-all"
              >
                <option value="cash">Tunai (Cash)</option>
                <option value="qris">QRIS Instant</option>
                <option value="transfer">Transfer Bank</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#A4B5AC] border-2 border-dashed border-[#EAE5DA] rounded-2xl bg-[#FCFBF9]/50">
                <ShoppingBag size={40} className="mb-2 opacity-40" />
                <span className="text-sm font-medium">Keranjang Masih Kosong</span>
              </div>
            ) : (
              items.map((item: any) => (
                <div key={item.cartItemId} className="flex justify-between items-center p-3.5 border border-[#EAE5DA] rounded-2xl bg-[#FCFBF9] hover:bg-white transition-colors">
                  <div className="flex-1 mr-2">
                    <h3 className="text-sm font-bold text-[#183022] line-clamp-1">{item.name}</h3>
                    <div className="text-xs font-semibold text-[#6B8275] mt-0.5">
                      <span suppressHydrationWarning>{formatRupiah(item.price)}</span> <span className="text-[#A4B5AC]">×</span> {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span suppressHydrationWarning className="font-extrabold text-sm text-[#183022]">{formatRupiah(item.price * item.quantity)}</span>
                    <button onClick={() => removeFromCart(item.cartItemId)} className="text-[#D37A74] hover:text-[#B54D46] hover:bg-[#FDF2F1] p-1.5 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="border-t border-[#EAE5DA] pt-4 mt-3">
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="font-bold text-sm uppercase tracking-wider text-[#6B8275]">Total Tagihan:</span>
              <span suppressHydrationWarning className="font-extrabold text-2xl text-[#183022]">{formatRupiah(total())}</span>
            </div>
            <button 
              onClick={handlePay}
              disabled={items.length === 0 || checkoutLoading}
              className="w-full bg-[#183022] text-[#F7F5F0] font-bold py-4 rounded-2xl hover:bg-[#234330] transition-all duration-200 disabled:opacity-40 disabled:hover:bg-[#183022] disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl text-base tracking-wide"
            >
              {checkoutLoading ? <Loader2 className="animate-spin" size={22} /> : 'Bayar Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}