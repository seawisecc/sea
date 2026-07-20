'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useCartStore, Product } from '@/store/useCartStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useRoleStore } from '@/store/useRoleStore'
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
  Phone,
  Search,
  Plus,
  Minus,
  Banknote
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
  subtotal: number
  discount: number
  totalAmount: number
  cashReceived: number
  change: number
  storeName: string
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

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'retail' | 'service'>('all')

  const [discountInput, setDiscountInput] = useState('')
  const [cashInput, setCashInput] = useState('')

  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string }[]>([])
  const [showSuggest, setShowSuggest] = useState(false)

  const supabase = createClient()
  const {
    items, addToCart, removeFromCart, setQuantity, increment, decrement, total, clearCart
  } = useCartStore()
  const { t } = useLanguageStore()
  const { tenantName, tenantId, fetchSession } = useRoleStore()

  const fetchProducts = async () => {
  setLoading(true)
  setErrorMessage(null)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    setProducts([])
    setLoading(false)
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    setProducts([])
    setLoading(false)
    return
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
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
    fetchSession()
    fetchProducts()
  }, [])

  // Daftar pelanggan dipakai untuk saran nama saat kasir mengetik.
  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('customers')
      .select('id, name, phone')
      .eq('tenant_id', tenantId)
      .order('name')
      .then(({ data }) => setCustomers(data ?? []))
  }, [tenantId])

  const customerSuggestions = (() => {
    const q = customerName.trim().toLowerCase()
    if (!q || q === 'walk-in customer') return customers.slice(0, 6)
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q))
      .slice(0, 6)
  })()

  const subtotal = total()
  const discount = Math.min(Math.max(Number(discountInput) || 0, 0), subtotal)
  const grandTotal = subtotal - discount
  const cashReceived = Number(cashInput) || 0
  const isCash = paymentMethod === 'CASH'
  const change = cashReceived - grandTotal
  // Uang tunai kurang dari total adalah satu-satunya kondisi yang menahan bayar.
  const cashShort = isCash && cashInput !== '' && change < 0

  /** Pecahan uang yang paling sering diterima kasir di Indonesia. */
  const quickCash = [5000, 10000, 20000, 50000, 100000]

  const handlePay = async () => {
    if (items.length === 0 || cashShort) return
    setCheckoutLoading(true)
    setErrorMessage(null)

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
      p_total_amount: subtotal,
      p_discount_amount: discount,
      p_grand_total: grandTotal,
      p_payment_method: paymentMethod,
      p_items: formattedItems
    })

    setCheckoutLoading(false)

    if (error) {
      alert(`Transaksi Gagal: ${error.message}`)
      return
    }

    const response = data as {
      success: boolean
      invoice_number: string
      total_amount?: number
      discount_amount?: number
      grand_total?: number
    }
    if (response?.success) {
      // Struk memakai angka dari server, bukan hitungan browser. Kalau harga
      // produk sempat berubah, yang tercetak sama dengan yang tercatat di
      // database.
      const finalSubtotal = Number(response.total_amount ?? subtotal)
      const finalDiscount = Number(response.discount_amount ?? discount)
      const finalTotal = Number(response.grand_total ?? grandTotal)
      const finalCash = isCash && cashInput !== '' ? cashReceived : finalTotal

      const receiptSnapshot: ReceiptData = {
        invoiceNumber: response.invoice_number,
        customerName: customerName,
        customerPhone: customerPhone,
        paymentMethod: paymentMethod,
        date: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        items: items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price, subtotal: i.price * i.quantity })),
        subtotal: finalSubtotal,
        discount: finalDiscount,
        totalAmount: finalTotal,
        cashReceived: finalCash,
        change: Math.max(finalCash - finalTotal, 0),
        storeName: tenantName || 'SEA ERP'
      }

      setLastReceipt(receiptSnapshot)
      clearCart()
      setCustomerName('Walk-in Customer')
      setCustomerPhone('')
      setDiscountInput('')
      setCashInput('')
      fetchProducts()
    }
  }

  const handleSendWhatsApp = () => {
    if (!lastReceipt) return

    let text = `*NOTA TRANSAKSI - ${lastReceipt.storeName.toUpperCase()}*\n`
    text += `No: ${lastReceipt.invoiceNumber}\n`
    text += `Tanggal: ${lastReceipt.date}\n`
    text += `Pelanggan: ${lastReceipt.customerName}\n`
    text += `----------------------------------\n`

    lastReceipt.items.forEach(item => {
      text += `${item.name}\n${item.quantity}x @ ${formatRupiah(item.price)} = *${formatRupiah(item.subtotal)}*\n`
    })

    text += `----------------------------------\n`
    if (lastReceipt.discount > 0) {
      text += `Subtotal: ${formatRupiah(lastReceipt.subtotal)}\n`
      text += `Diskon: -${formatRupiah(lastReceipt.discount)}\n`
    }
    text += `*TOTAL: ${formatRupiah(lastReceipt.totalAmount)}*\n`
    text += `Metode Bayar: ${lastReceipt.paymentMethod}\n`
    if (lastReceipt.paymentMethod === 'CASH' && lastReceipt.cashReceived > 0) {
      text += `Tunai: ${formatRupiah(lastReceipt.cashReceived)}\n`
      text += `Kembali: ${formatRupiah(lastReceipt.change)}\n`
    }
    text += `\n_Terima kasih atas kepercayaan Anda!_\n`

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

  // Pencarian mengabaikan huruf besar/kecil dan spasi berlebih di ujung.
  const query = searchTerm.trim().toLowerCase()
  const filteredProducts = products.filter((p) => {
    const cocokTipe = typeFilter === 'all' || p.type === typeFilter
    const cocokNama = query === '' || p.name.toLowerCase().includes(query)
    return cocokTipe && cocokNama
  })

  return (
    <div className="p-6 h-full flex flex-col relative text-ink">
      
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
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">{t.pos.title}</h1>
          <p className="text-sm text-muted mt-1">{t.pos.subtitle}</p>
        </div>
        <button 
          onClick={fetchProducts}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-tint text-brand rounded-xl hover:bg-tint-2 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 bg-tint-danger border border-danger-2 rounded-2xl p-4 text-danger text-sm font-medium no-print">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 no-print">
        <div className="w-full lg:w-3/5 bg-white rounded-3xl shadow-sm border border-line p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-ink">{t.pos.catalog}</h2>
            <span className="text-xs bg-paper text-muted-2 px-3 py-1 rounded-full font-medium">
              {filteredProducts.length}
              {filteredProducts.length !== products.length && ` / ${products.length}`} Item
            </span>
          </div>

          {/* PENCARIAN & FILTER */}
          <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama produk atau jasa..."
                className="w-full pl-10 pr-9 py-2.5 bg-paper-2 border border-line rounded-xl text-sm font-medium text-ink placeholder:text-faint focus:outline-none focus:border-brand focus:bg-white transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex bg-paper-2 border border-line p-1 rounded-xl flex-shrink-0">
              {([
                { key: 'all', label: 'Semua' },
                { key: 'retail', label: 'Barang' },
                { key: 'service', label: 'Jasa' }
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTypeFilter(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    typeFilter === opt.key
                      ? 'bg-ink text-on-dark shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-brand" size={36} />
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-faint border-2 border-dashed border-line rounded-2xl bg-paper-2/50">
              <Package size={48} className="mb-3 opacity-40 text-muted" />
              <p className="font-bold text-ink text-base">Katalog Kosong</p>
              <p className="text-xs text-muted mt-1">Silakan tambah barang di menu Inventaris.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-faint border-2 border-dashed border-line rounded-2xl bg-paper-2/50">
              <Search size={40} className="mb-3 opacity-40 text-muted" />
              <p className="font-bold text-ink text-sm">Tidak ada yang cocok</p>
              <p className="text-xs text-muted mt-1">
                Coba kata kunci lain atau ubah filternya.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-1">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="group flex flex-col text-left bg-paper-2 border border-line rounded-2xl p-4 hover:border-brand hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none"
                >
                  <div className="flex justify-between items-start w-full mb-3">
                    <div className="p-2.5 rounded-xl bg-tint-accent group-hover:bg-tint transition-colors">
                      {product.type === 'retail' ? (
                        <Package className="text-muted-2 group-hover:text-ink" size={18} />
                      ) : (
                        <Scissors className="text-expense-deep group-hover:text-ink" size={18} />
                      )}
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold tracking-wide ${
                      product.type === 'retail' ? 'bg-tint text-brand' : 'bg-tint-expense text-expense'
                    }`}>
                      {product.type === 'retail' ? 'Barang' : 'Jasa'}
                    </span>
                  </div>
                  <span className="font-semibold text-ink text-sm line-clamp-2 mt-auto group-hover:text-brand transition-colors">{product.name}</span>
                  <span suppressHydrationWarning className="text-ink font-extrabold text-base mt-2">{formatRupiah(product.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-2/5 bg-white rounded-3xl shadow-sm border border-line p-6 flex flex-col h-[calc(100vh-8.5rem)]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-paper">
            <ShoppingBag className="text-brand" size={20} />
            <h2 className="font-bold text-lg text-ink">{t.pos.cart}</h2>
          </div>
          
          <div className="space-y-2.5 mb-4 bg-paper-2 p-3.5 rounded-2xl border border-line/60">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">{t.pos.customerName}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onFocus={() => setShowSuggest(true)}
                    // Ditunda sedikit supaya klik pada daftar saran sempat terdaftar
                    // sebelum daftarnya hilang.
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    autoComplete="off"
                    className="w-full bg-white border border-line rounded-xl px-3 py-1.5 text-xs text-ink font-medium focus:outline-none focus:border-brand"
                  />

                  {showSuggest && customerSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-line rounded-xl shadow-lg z-30 overflow-hidden max-h-52 overflow-y-auto">
                      {customerSuggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCustomerName(c.name)
                            if (c.phone) setCustomerPhone(c.phone)
                            setShowSuggest(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-tint transition-colors border-b border-line last:border-0"
                        >
                          <p className="text-xs font-bold text-ink truncate">{c.name}</p>
                          {c.phone && <p className="text-[10px] text-muted">{c.phone}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">WhatsApp (Opsional)</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" size={12} />
                  <input 
                    type="text" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08123..."
                    className="w-full pl-7 pr-2 py-1.5 bg-white border border-line rounded-xl text-xs text-ink font-medium focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">{t.pos.paymentMethod}</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-line rounded-xl px-3 py-1.5 text-xs text-ink font-bold focus:outline-none focus:border-brand"
              >
                <option value="CASH">Tunai (Cash)</option>
                <option value="QRIS">QRIS Instant</option>
                <option value="TRANSFER">Transfer Bank / EDC</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-faint border-2 border-dashed border-line rounded-2xl bg-paper-2/50">
                <ShoppingBag size={36} className="mb-2 opacity-40" />
                <span className="text-xs font-medium">{t.pos.emptyCart}</span>
              </div>
            ) : (
              items.map((item: any) => (
                <div key={item.cartItemId} className="p-3 border border-line rounded-2xl bg-paper-2 hover:bg-white transition-colors">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-ink line-clamp-1">{item.name}</h3>
                      <div className="text-[11px] font-semibold text-muted mt-0.5">
                        <span suppressHydrationWarning>{formatRupiah(item.price)}</span> / unit
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      aria-label={`Keluarkan ${item.name} dari keranjang`}
                      className="text-danger-2 hover:text-danger p-1 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center bg-white border border-line rounded-xl overflow-hidden">
                      <button
                        onClick={() => decrement(item.cartItemId)}
                        aria-label="Kurangi jumlah"
                        className="px-2.5 py-1.5 text-muted hover:text-ink hover:bg-tint transition-colors"
                      >
                        <Minus size={13} strokeWidth={2.5} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => setQuantity(item.cartItemId, Number(e.target.value))}
                        aria-label={`Jumlah ${item.name}`}
                        className="w-12 text-center text-xs font-black text-ink bg-transparent border-x border-line py-1.5 focus:outline-none focus:bg-tint [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => increment(item.cartItemId)}
                        aria-label="Tambah jumlah"
                        className="px-2.5 py-1.5 text-muted hover:text-ink hover:bg-tint transition-colors"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                    <span suppressHydrationWarning className="font-extrabold text-sm text-ink">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="border-t border-line pt-3 mt-2 space-y-2.5">
            {/* DISKON */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted flex-shrink-0">
                Diskon
              </label>
              <div className="relative w-36">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-faint">Rp</span>
                <input
                  type="number"
                  min={0}
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-2 py-1.5 bg-paper-2 border border-line rounded-xl text-xs font-bold text-ink text-right focus:outline-none focus:border-brand focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {discount > 0 && (
              <div className="flex justify-between items-center px-1 text-[11px] font-semibold">
                <span className="text-muted">Subtotal</span>
                <span suppressHydrationWarning className="text-muted line-through">{formatRupiah(subtotal)}</span>
              </div>
            )}

            <div className="flex justify-between items-center px-1">
              <span className="font-bold text-xs uppercase tracking-wider text-muted">{t.pos.total}:</span>
              <span suppressHydrationWarning className="font-extrabold text-2xl text-ink">
                {formatRupiah(grandTotal)}
              </span>
            </div>

            {/* UANG DITERIMA & KEMBALIAN — hanya relevan untuk tunai */}
            {isCash && (
              <div className="bg-paper-2 border border-line rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Banknote size={13} /> Uang Diterima
                  </label>
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-faint">Rp</span>
                    <input
                      type="number"
                      min={0}
                      value={cashInput}
                      onChange={(e) => setCashInput(e.target.value)}
                      placeholder="0"
                      className={`w-full pl-7 pr-2 py-1.5 bg-white border rounded-xl text-xs font-black text-ink text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        cashShort ? 'border-danger' : 'border-line focus:border-brand'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCashInput(String(grandTotal))}
                    disabled={grandTotal <= 0}
                    className="px-2.5 py-1 rounded-lg bg-ink text-on-dark text-[10px] font-bold hover:bg-ink-hi transition-colors disabled:opacity-30"
                  >
                    Uang Pas
                  </button>
                  {quickCash.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setCashInput(String((Number(cashInput) || 0) + amount))}
                      className="px-2.5 py-1 rounded-lg bg-white border border-line text-[10px] font-bold text-muted hover:text-ink hover:border-brand transition-colors"
                    >
                      +{amount / 1000}rb
                    </button>
                  ))}
                  {cashInput !== '' && (
                    <button
                      onClick={() => setCashInput('')}
                      aria-label="Kosongkan uang diterima"
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-danger-2 hover:text-danger transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {cashInput !== '' && (
                  <div
                    className={`flex justify-between items-center px-1 pt-2 border-t border-line ${
                      cashShort ? 'text-danger' : 'text-ink'
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {cashShort ? 'Kurang' : 'Kembalian'}
                    </span>
                    <span suppressHydrationWarning className="font-black text-lg">
                      {formatRupiah(Math.abs(change))}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={items.length === 0 || checkoutLoading || cashShort}
              className="w-full bg-ink text-on-dark font-bold py-3.5 rounded-2xl hover:bg-ink-hi transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl text-sm tracking-wide gap-2"
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-line flex flex-col">
            
            <div className="bg-ink text-on-dark p-6 text-center relative">
              <button 
                onClick={() => setLastReceipt(null)} 
                className="absolute right-4 top-4 text-on-dark-2 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <h3 className="font-extrabold text-xl">Transaksi Berhasil!</h3>
              <p className="text-xs text-on-dark-2 mt-0.5 font-mono">{lastReceipt.invoiceNumber}</p>
            </div>

            <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
              <div className="flex justify-between text-xs font-semibold text-muted border-b border-line pb-2">
                <span>Pelanggan: <strong className="text-ink">{lastReceipt.customerName}</strong></span>
                <span>Metode: <strong className="text-ink">{lastReceipt.paymentMethod}</strong></span>
              </div>

              <div className="space-y-2">
                {lastReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-ink font-medium">{item.quantity}x {item.name}</span>
                    <span suppressHydrationWarning className="font-bold text-ink">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-line pt-3 space-y-1.5">
                {lastReceipt.discount > 0 && (
                  <>
                    <div className="flex justify-between text-[11px] font-semibold text-muted">
                      <span>Subtotal</span>
                      <span suppressHydrationWarning>{formatRupiah(lastReceipt.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-expense">
                      <span>Diskon</span>
                      <span suppressHydrationWarning>-{formatRupiah(lastReceipt.discount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs uppercase text-muted">Total Dibayar</span>
                  <span suppressHydrationWarning className="font-extrabold text-lg text-ink">
                    {formatRupiah(lastReceipt.totalAmount)}
                  </span>
                </div>
                {lastReceipt.paymentMethod === 'CASH' && lastReceipt.cashReceived > 0 && (
                  <>
                    <div className="flex justify-between text-[11px] font-semibold text-muted">
                      <span>Tunai diterima</span>
                      <span suppressHydrationWarning>{formatRupiah(lastReceipt.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-tint rounded-xl px-3 py-2 mt-1">
                      <span className="font-bold text-xs uppercase text-brand">Kembalian</span>
                      <span suppressHydrationWarning className="font-black text-lg text-brand">
                        {formatRupiah(lastReceipt.change)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-5 bg-paper-2 border-t border-line flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <button 
                  onClick={handlePrintReceipt}
                  className="bg-ink hover:bg-ink-hi text-on-dark py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
                >
                  <Printer size={16} />
                  <span>Cetak Struk</span>
                </button>
                <button 
                  onClick={handleSendWhatsApp}
                  className="bg-brand hover:bg-ink-hi text-on-dark py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
                >
                  <MessageCircle size={16} />
                  <span>Kirim WA</span>
                </button>
              </div>
              
              <button 
                onClick={() => setLastReceipt(null)}
                className="w-full bg-line hover:bg-line-2 text-ink py-2.5 rounded-xl font-bold text-xs transition-colors"
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
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>
              {lastReceipt.storeName}
            </h2>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Nota Pembelian</p>
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

          {lastReceipt.discount > 0 && (
            <>
              <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                <span>SUBTOTAL:</span>
                <span>{formatRupiah(lastReceipt.subtotal)}</span>
              </div>
              <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>DISKON:</span>
                <span>-{formatRupiah(lastReceipt.discount)}</span>
              </div>
            </>
          )}

          <div style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>TOTAL:</span>
            <span>{formatRupiah(lastReceipt.totalAmount)}</span>
          </div>

          <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
            <span>METODE BAYAR:</span>
            <span>{lastReceipt.paymentMethod}</span>
          </div>

          {lastReceipt.paymentMethod === 'CASH' && lastReceipt.cashReceived > 0 && (
            <>
              <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                <span>TUNAI:</span>
                <span>{formatRupiah(lastReceipt.cashReceived)}</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <span>KEMBALI:</span>
                <span>{formatRupiah(lastReceipt.change)}</span>
              </div>
            </>
          )}

          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '15px' }}>
            <p style={{ margin: '2px 0' }}>Terima Kasih Atas Kunjungan Anda</p>
            <p style={{ margin: '2px 0' }}>Powered by SEA ERP</p>
          </div>
        </div>
      )}

    </div>
  )
}