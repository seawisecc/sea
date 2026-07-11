'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useCartStore, Product } from '@/store/useCartStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import { 
  Loader2, 
  Trash2, 
  Package, 
  Scissors, 
  CheckCircle2, 
  ShoppingBag, 
  RefreshCw, 
  Printer, 
  MessageCircle, 
  X,
  Phone
} from 'lucide-react'

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  })
    .format(number)
    .replace(/\s+/g, '')
}

interface ReceiptData {
  invoiceNumber: string
  customerName: string
  customerPhone: string
  paymentMethod: string
  date: string
  items: { name: string; quantity: number; price: number; subtotal: number }[]
  totalAmount: number
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [customerPhone, setCustomerPhone] = useState('')
  
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const supabase = createClient()
  const { items, addToCart, removeFromCart, total, clearCart } = useCartStore()
  const { t } = useLanguageStore()

  const fetchProducts = async () => {
    setLoading(true)
    setErrorMessage(null)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })
      
    if (error) {
      console.error('Supabase Query Error:', error)
      setErrorMessage(`Gagal memuat katalog: ${error.message}`)
    } else if (data) {
      setProducts(data as Product[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handlePay = async () => {
    if (items.length === 0) return
    setCheckoutLoading(true)
    setErrorMessage(null)

    const currentTotal = total()
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
      p_total_amount: currentTotal,
      p_discount_amount: 0,
      p_grand_total: currentTotal,
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
      const receiptSnapshot: ReceiptData = {
        invoiceNumber: response.invoice_number,
        customerName: customerName,
        customerPhone: customerPhone,
        paymentMethod: paymentMethod,
        date: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        items: items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price, subtotal: i.price * i.quantity })),
        totalAmount: currentTotal
      }
      
      setLastReceipt(receiptSnapshot)
      clearCart()
      setCustomerName('Walk-in Customer')
      setCustomerPhone('')
      fetchProducts()
    }
  }

  const handleSendWhatsApp = () => {
    if (!lastReceipt) return

    let text = `*NOTA TRANSAKSI - SEA ERP*\n`
    text += `No: ${lastReceipt.invoiceNumber}\n`
    text += `Tanggal: ${lastReceipt.date}\n`
    text += `Pelanggan: ${lastReceipt.customerName}\n`
    text += `----------------------------------\n`
    
    lastReceipt.items.forEach(item => {
      text += `${item.name}\n${item.quantity}x @ ${formatRupiah(item.price)} = *${formatRupiah(item.subtotal)}*\n`
    })
    
    text += `----------------------------------\n`
    text += `*TOTAL: ${formatRupiah(lastReceipt.totalAmount)}*\n`
    text += `Metode Bayar: ${lastReceipt.paymentMethod}\n\n`
    text += `_Terima kasih atas kepercayaan Anda!_\n`

    const encodedText = encodeURIComponent(text)
    
    let phone = lastReceipt.customerPhone.replace(/[^0-9]/g, '')
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1)
    }

    const waUrl = phone 
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`

    window.open(waUrl, '_blank')
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="p-6 h-full flex flex-col relative text-[#183022]">
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #receipt-print-area, #receipt-print-area * {
            visibility: visible !important;
          }
          #receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            padding: 10px !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 12px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="mb-6 flex justify-between items-end no-print">
        <div>
          <h1 className="text-3xl font-extrabold text-[#183022] tracking-tight">{t.pos.title}</h1>
          <p className="text-sm text-[#6B8275] mt-1">{t.pos.subtitle}</p>
        </div>
        <button 
          onClick={fetchProducts}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-[#E8F3ED] text-[#2D5A41] rounded-xl hover:bg-[#D0E7DC] transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 bg-[#FDF2F1] border border-[#D37A74] rounded-2xl p-4 text-[#B54D46] text-sm font-medium no-print">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 no-print">
        <div className="w-full lg:w-3/5 bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#EAE5DA] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg text-[#183022]">{t.pos.catalog}</h2>
            <span className="text-xs bg-[#F0EBE1] text-[#5A6D62] px-3 py-1 rounded-full font-medium">
              {products.length} Item
            </span>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#2D5A41]" size={36} />
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-[#A4B5AC] border-2 border-dashed border-[#EAE5DA] rounded-2xl bg-[#FCFBF9]/50">
              <Package size={48} className="mb-3 opacity-40 text-[#6B8275]" />
              <p className="font-bold text-[#183022] text-base">Katalog Kosong</p>
              <p className="text-xs text-[#6B8275] mt-1">Silakan tambah barang di menu Inventaris.</p>
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
                      product.type === 'retail' ? 'bg-[#E8F3ED] text-[#2D5A41]' : 'bg-[#FBECE6] text-[#C26D46]'
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

        <div className="w-full lg:w-2/5 bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#EAE5DA] p-6 flex flex-col h-[calc(100vh-8.5rem)]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F0EBE1]">
            <ShoppingBag className="text-[#2D5A41]" size={20} />
            <h2 className="font-bold text-lg text-[#183022]">{t.pos.cart}</h2>
          </div>
          
          <div className="space-y-2.5 mb-4 bg-[#FCFBF9] p-3.5 rounded-2xl border border-[#EAE5DA]/60">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B8275] mb-1">{t.pos.customerName}</label>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl px-3 py-1.5 text-xs text-[#183022] font-medium focus:outline-none focus:border-[#2D5A41]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B8275] mb-1">WhatsApp (Opsional)</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A4B5AC]" size={12} />
                  <input 
                    type="text" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08123..."
                    className="w-full pl-7 pr-2 py-1.5 bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl text-xs text-[#183022] font-medium focus:outline-none focus:border-[#2D5A41]"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B8275] mb-1">{t.pos.paymentMethod}</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#EAE5DA] rounded-xl px-3 py-1.5 text-xs text-[#183022] font-bold focus:outline-none focus:border-[#2D5A41]"
              >
                <option value="CASH">Tunai (Cash)</option>
                <option value="QRIS">QRIS Instant</option>
                <option value="TRANSFER">Transfer Bank / EDC</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#A4B5AC] border-2 border-dashed border-[#EAE5DA] rounded-2xl bg-[#FCFBF9]/50">
                <ShoppingBag size={36} className="mb-2 opacity-40" />
                <span className="text-xs font-medium">{t.pos.emptyCart}</span>
              </div>
            ) : (
              items.map((item: any) => (
                <div key={item.cartItemId} className="flex justify-between items-center p-3 border border-[#EAE5DA] rounded-2xl bg-[#FCFBF9] hover:bg-white transition-colors">
                  <div className="flex-1 mr-2">
                    <h3 className="text-xs font-bold text-[#183022] line-clamp-1">{item.name}</h3>
                    <div className="text-[11px] font-semibold text-[#6B8275] mt-0.5">
                      <span suppressHydrationWarning>{formatRupiah(item.price)}</span> <span className="text-[#A4B5AC]">×</span> {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span suppressHydrationWarning className="font-extrabold text-xs text-[#183022]">{formatRupiah(item.price * item.quantity)}</span>
                    <button onClick={() => removeFromCart(item.cartItemId)} className="text-[#D37A74] hover:text-[#B54D46] p-1 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="border-t border-[#EAE5DA] pt-3 mt-2">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="font-bold text-xs uppercase tracking-wider text-[#6B8275]">{t.pos.total}:</span>
              <span suppressHydrationWarning className="font-extrabold text-2xl text-[#183022]">{formatRupiah(total())}</span>
            </div>
            <button 
              onClick={handlePay}
              disabled={items.length === 0 || checkoutLoading}
              className="w-full bg-[#183022] text-[#F7F5F0] font-bold py-3.5 rounded-2xl hover:bg-[#234330] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl text-sm tracking-wide gap-2"
            >
              {checkoutLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <CheckCircle2 size={18} />
                  <span>{t.pos.payNow}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {lastReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-[#FFFFFF] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#EAE5DA] flex flex-col">
            
            <div className="bg-[#183022] text-[#F7F5F0] p-6 text-center relative">
              <button 
                onClick={() => setLastReceipt(null)} 
                className="absolute right-4 top-4 text-[#A8C3B3] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-12 h-12 bg-[#2D5A41] rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <h3 className="font-extrabold text-xl">Transaksi Berhasil!</h3>
              <p className="text-xs text-[#A8C3B3] mt-0.5 font-mono">{lastReceipt.invoiceNumber}</p>
            </div>

            <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
              <div className="flex justify-between text-xs font-semibold text-[#6B8275] border-b border-[#EAE5DA] pb-2">
                <span>Pelanggan: <strong className="text-[#183022]">{lastReceipt.customerName}</strong></span>
                <span>Metode: <strong className="text-[#183022]">{lastReceipt.paymentMethod}</strong></span>
              </div>

              <div className="space-y-2">
                {lastReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-[#183022] font-medium">{item.quantity}x {item.name}</span>
                    <span suppressHydrationWarning className="font-bold text-[#183022]">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-[#EAE5DA] pt-3 flex justify-between items-center">
                <span className="font-bold text-xs uppercase text-[#6B8275]">Total Dibayar</span>
                <span suppressHydrationWarning className="font-extrabold text-lg text-[#183022]">{formatRupiah(lastReceipt.totalAmount)}</span>
              </div>
            </div>

            <div className="p-5 bg-[#FCFBF9] border-t border-[#EAE5DA] flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <button 
                  onClick={handlePrintReceipt}
                  className="bg-[#183022] hover:bg-[#234330] text-[#F7F5F0] py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
                >
                  <Printer size={16} />
                  <span>Cetak Struk</span>
                </button>
                <button 
                  onClick={handleSendWhatsApp}
                  className="bg-[#2D5A41] hover:bg-[#1E3D2B] text-[#F7F5F0] py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
                >
                  <MessageCircle size={16} />
                  <span>Kirim WA</span>
                </button>
              </div>
              
              <button 
                onClick={() => setLastReceipt(null)}
                className="w-full bg-[#EAE5DA] hover:bg-[#DED7C8] text-[#183022] py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                Selesai & Transaksi Baru
              </button>
            </div>

          </div>
        </div>
      )}

      {lastReceipt && (
        <div id="receipt-print-area" className="hidden print:block">
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>SEA ERP SAAS</h2>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Sistem Kasir & Operasional Ritel</p>
            <p style={{ fontSize: '10px', margin: '0' }}>--------------------------------</p>
          </div>

          <div style={{ fontSize: '11px', marginBottom: '8px' }}>
            <p style={{ margin: '2px 0' }}>No  : {lastReceipt.invoiceNumber}</p>
            <p style={{ margin: '2px 0' }}>Tgl : {lastReceipt.date}</p>
            <p style={{ margin: '2px 0' }}>Ksr : Admin POS</p>
            <p style={{ margin: '2px 0' }}>Plg : {lastReceipt.customerName}</p>
            <p style={{ margin: '4px 0 0 0' }}>--------------------------------</p>
          </div>

          <div style={{ fontSize: '11px', marginBottom: '8px' }}>
            {lastReceipt.items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.quantity} x {formatRupiah(item.price)}</span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))}
            <p style={{ margin: '4px 0 0 0' }}>--------------------------------</p>
          </div>

          <div style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>TOTAL:</span>
            <span>{formatRupiah(lastReceipt.totalAmount)}</span>
          </div>

          <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>METODE BAYAR:</span>
            <span>{lastReceipt.paymentMethod}</span>
          </div>

          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '15px' }}>
            <p style={{ margin: '2px 0' }}>Terima Kasih Atas Kunjungan Anda</p>
            <p style={{ margin: '2px 0' }}>Powered by SEA ERP SaaS</p>
          </div>
        </div>
      )}

    </div>
  )
}