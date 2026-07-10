'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useCartStore, Product } from '@/store/useCartStore'
import { Loader2, Plus, Trash2, Package, Scissors, CheckCircle2 } from 'lucide-react'

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number)
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
    const { data } = await supabase
      .from('products')
      .select('id, name, price, type')
      .eq('is_active', true)
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

    // Format data payload keranjang agar sesuai dengan struktur JSONB PostgreSQL
    const formattedItems = items.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
      type: item.type,
      metadata: item.type === 'service' ? { staff_name: 'Staf Default' } : {}
    }))

    // Tembak fungsi transaksi RPC Supabase
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
      clearCart() // Kosongkan keranjang belanja
      setCustomerName('Walk-in Customer')
      fetchProducts() // Segarkan katalog produk untuk memperbarui sisa stok fisik
    }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Kasir (POS)</h1>
        <p className="text-sm text-gray-500">Sistem transaksi ritel dan jasa hibrida</p>
      </div>

      {successInfo && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center text-green-800 gap-3">
          <CheckCircle2 className="text-green-500 flex-shrink-0" size={24} />
          <div>
            <span className="font-bold">Transaksi Sukses!</span> Nota <span className="underline font-mono">{successInfo.inv}</span> telah direkam ke dalam database.
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Area Kiri: Katalog */}
        <div className="w-full lg:w-3/5 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col">
          <h2 className="font-semibold mb-4 text-gray-800">Katalog</h2>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex flex-col text-left border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-sm transition-all focus:outline-none"
                >
                  <div className="flex justify-between items-start w-full mb-2">
                    {product.type === 'retail' ? <Package className="text-gray-400" size={20} /> : <Scissors className="text-orange-400" size={20} />}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.type === 'retail' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>
                      {product.type === 'retail' ? 'Barang' : 'Jasa'}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 line-clamp-2">{product.name}</span>
                  <span className="text-blue-600 font-bold mt-1">{formatRupiah(product.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Area Kanan: Keranjang */}
        <div className="w-full lg:w-2/5 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-[calc(100vh-8rem)]">
          <h2 className="font-semibold text-gray-800 mb-4">Detail Pembayaran</h2>
          
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">NAMA PELANGGAN</label>
              <input 
                type="text" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">METODE PEMBAYARAN</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="cash">Tunai (Cash)</option>
                <option value="qris">QRIS otomatis</option>
                <option value="transfer">Transfer Bank</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 border-t pt-4">
            {items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                Keranjang Kosong
              </div>
            ) : (
              items.map((item) => (
                <div key={item.cartItemId} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</h3>
                    <div className="text-xs text-gray-500 mt-1">{formatRupiah(item.price)} x {item.quantity}</div>
                  </div>
                  <div className="flex items-center gap-3 ml-2">
                    <span className="font-bold text-gray-900">{formatRupiah(item.price * item.quantity)}</span>
                    <button onClick={() => removeFromCart(item.cartItemId)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between font-bold text-xl mb-4 text-gray-900">
              <span>Total:</span>
              <span>{formatRupiah(total())}</span>
            </div>
            <button 
              onClick={handlePay}
              disabled={items.length === 0 || checkoutLoading}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center shadow-sm text-lg"
            >
              {checkoutLoading ? <Loader2 className="animate-spin" size={22} /> : 'Bayar Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}