'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useRoleStore } from '@/store/useRoleStore'
import {
  Receipt, Search, Loader2, X, Printer,
  MessageCircle, ChevronRight
} from 'lucide-react'

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(n).replace(/\s+/g, '')

interface Order {
  id: string
  invoice_number: string
  customer_name: string
  total_amount: number
  discount_amount: number
  grand_total: number
  payment_method: string
  created_at: string
}

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  products: { name: string; type: string } | null
}

type RangeKey = 'today' | '7d' | '30d' | 'all'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: '7d', label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: 'all', label: 'Semua' }
]

/** Awal hari dalam zona waktu lokal, bukan UTC. */
const startOfDay = (offsetDays = 0) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - offsetDays)
  return d
}

export default function HistoryPage() {
  const supabase = createClient()
  const { t } = useLanguageStore()
  const { tenantId, tenantName, loaded: sessionLoaded, fetchSession } = useRoleStore()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<RangeKey>('7d')
  const [search, setSearch] = useState('')

  const [selected, setSelected] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (!sessionLoaded) return

    const load = async () => {
      if (!tenantId) {
        setOrders([])
        setLoading(false)
        return
      }

      setLoading(true)

      let q = supabase
        .from('orders')
        .select('id, invoice_number, customer_name, total_amount, discount_amount, grand_total, payment_method, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(500)

      if (range !== 'all') {
        const days = range === 'today' ? 0 : range === '7d' ? 6 : 29
        q = q.gte('created_at', startOfDay(days).toISOString())
      }

      const { data } = await q
      setOrders((data as Order[]) ?? [])
      setLoading(false)
    }

    load()
  }, [sessionLoaded, tenantId, range])

  const openDetail = async (order: Order) => {
    setSelected(order)
    setItemsLoading(true)
    const { data } = await supabase
      .from('order_items')
      .select('id, quantity, unit_price, subtotal, products(name, type)')
      .eq('order_id', order.id)
    setItems((data as unknown as OrderItem[]) ?? [])
    setItemsLoading(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(
      (o) =>
        o.invoice_number.toLowerCase().includes(q) ||
        (o.customer_name ?? '').toLowerCase().includes(q)
    )
  }, [orders, search])

  const summary = useMemo(() => {
    const omzet = filtered.reduce((s, o) => s + Number(o.grand_total), 0)
    return {
      omzet,
      jumlah: filtered.length,
      rata: filtered.length ? Math.round(omzet / filtered.length) : 0
    }
  }, [filtered])

  const handleSendWhatsApp = () => {
    if (!selected) return

    let text = `*NOTA TRANSAKSI - ${(tenantName || 'SEA ERP').toUpperCase()}*\n`
    text += `No: ${selected.invoice_number}\n`
    text += `Tanggal: ${new Date(selected.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}\n`
    text += `Pelanggan: ${selected.customer_name}\n`
    text += `----------------------------------\n`
    items.forEach((it) => {
      text += `${it.products?.name ?? 'Item'}\n${it.quantity}x @ ${formatRupiah(it.unit_price)} = *${formatRupiah(it.subtotal)}*\n`
    })
    text += `----------------------------------\n`
    if (Number(selected.discount_amount) > 0) {
      text += `Subtotal: ${formatRupiah(selected.total_amount)}\n`
      text += `Diskon: -${formatRupiah(selected.discount_amount)}\n`
    }
    text += `*TOTAL: ${formatRupiah(selected.grand_total)}*\n`
    text += `Metode Bayar: ${selected.payment_method}\n\n`
    text += `_Terima kasih atas kepercayaan Anda!_\n`

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="p-6 space-y-6 text-ink">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #reprint-area, #reprint-area * { visibility: visible !important; }
          #reprint-area {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 80mm !important; padding: 10px !important; margin: 0 !important;
            background: white !important; color: black !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 12px !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.nav.history}</h1>
        <p className="text-sm text-muted mt-1">
          Cari nota lama, lihat rinciannya, dan cetak ulang bila pelanggan memintanya.
        </p>
      </div>

      {/* RINGKASAN PERIODE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="bg-white rounded-2xl border border-line p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Omzet Periode Ini</p>
          <p className="mt-1.5 text-xl font-extrabold text-ink">{formatRupiah(summary.omzet)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-line p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Jumlah Nota</p>
          <p className="mt-1.5 text-xl font-extrabold text-ink">{summary.jumlah}</p>
        </div>
        <div className="bg-white rounded-2xl border border-line p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Rata-rata per Nota</p>
          <p className="mt-1.5 text-xl font-extrabold text-ink">{formatRupiah(summary.rata)}</p>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex flex-col sm:flex-row gap-3 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor nota atau nama pelanggan..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-line rounded-xl text-sm font-medium placeholder:text-faint focus:outline-none focus:border-brand"
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

        <div className="flex bg-white border border-line p-1 rounded-xl flex-shrink-0">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                range === r.key ? 'bg-ink text-on-dark shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* DAFTAR NOTA */}
      <div className="bg-white rounded-3xl border border-line overflow-hidden no-print">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 size={30} className="animate-spin text-brand" />
            <span className="text-xs font-bold text-muted">Memuat riwayat...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Receipt size={44} className="mx-auto text-faint opacity-50" />
            <p className="text-sm font-bold text-muted">
              {orders.length === 0 ? 'Belum ada transaksi pada periode ini.' : 'Tidak ada nota yang cocok.'}
            </p>
            <p className="text-xs text-muted">
              {orders.length === 0 ? 'Coba pilih rentang waktu yang lebih panjang.' : 'Coba kata kunci lain.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((o) => (
              <button
                key={o.id}
                onClick={() => openDetail(o)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-paper-2 transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-tint text-brand flex-shrink-0">
                  <Receipt size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-ink truncate">{o.invoice_number}</p>
                  <p className="text-[11px] text-muted truncate">
                    {o.customer_name || 'Pelanggan umum'} ·{' '}
                    {new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                <span className="hidden sm:inline-flex text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-paper text-muted-2 flex-shrink-0">
                  {o.payment_method}
                </span>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-extrabold text-ink">{formatRupiah(o.grand_total)}</p>
                  {Number(o.discount_amount) > 0 && (
                    <p className="text-[10px] text-expense font-bold">
                      disk. {formatRupiah(o.discount_amount)}
                    </p>
                  )}
                </div>

                <ChevronRight size={16} className="text-faint flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL NOTA */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-line flex flex-col max-h-[85vh]">
            <div className="bg-ink text-on-dark p-5 relative rounded-t-3xl">
              <button
                onClick={() => setSelected(null)}
                aria-label="Tutup"
                className="absolute right-4 top-4 text-on-dark-2 hover:text-white"
              >
                <X size={20} />
              </button>
              <p className="text-[10px] uppercase tracking-widest text-on-dark-3 font-bold">Detail Nota</p>
              <h3 className="font-extrabold text-lg font-mono">{selected.invoice_number}</h3>
              <p className="text-xs text-on-dark-2 mt-0.5">
                {new Date(selected.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="flex justify-between text-xs font-semibold text-muted border-b border-line pb-2">
                <span>Pelanggan: <strong className="text-ink">{selected.customer_name || '-'}</strong></span>
                <span>Bayar: <strong className="text-ink">{selected.payment_method}</strong></span>
              </div>

              {itemsLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 size={22} className="animate-spin text-brand" />
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className="flex justify-between text-xs gap-3">
                      <span className="text-ink font-medium min-w-0">
                        <span className="font-bold">{it.quantity}x</span> {it.products?.name ?? 'Item terhapus'}
                      </span>
                      <span className="font-bold text-ink flex-shrink-0">{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-dashed border-line pt-3 space-y-1.5">
                {Number(selected.discount_amount) > 0 && (
                  <>
                    <div className="flex justify-between text-[11px] font-semibold text-muted">
                      <span>Subtotal</span>
                      <span>{formatRupiah(selected.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-expense">
                      <span>Diskon</span>
                      <span>-{formatRupiah(selected.discount_amount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs uppercase text-muted">Total</span>
                  <span className="font-extrabold text-lg text-ink">{formatRupiah(selected.grand_total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-paper-2 border-t border-line grid grid-cols-2 gap-2.5 rounded-b-3xl">
              <button
                onClick={() => window.print()}
                disabled={itemsLoading}
                className="bg-ink hover:bg-ink-hi text-on-dark py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Printer size={15} /> Cetak Ulang
              </button>
              <button
                onClick={handleSendWhatsApp}
                disabled={itemsLoading}
                className="bg-brand hover:bg-ink text-on-dark py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <MessageCircle size={15} /> Kirim WA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AREA CETAK ULANG */}
      {selected && (
        <div id="reprint-area" className="hidden print:block">
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
              {tenantName || 'SEA ERP'}
            </h2>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Salinan Nota</p>
            <p style={{ fontSize: '10px', margin: 0 }}>--------------------------------</p>
          </div>

          <div style={{ fontSize: '11px', marginBottom: '8px' }}>
            <p style={{ margin: '2px 0' }}>No  : {selected.invoice_number}</p>
            <p style={{ margin: '2px 0' }}>Tgl : {new Date(selected.created_at).toLocaleString('id-ID')}</p>
            <p style={{ margin: '2px 0' }}>Plg : {selected.customer_name || '-'}</p>
            <p style={{ margin: '4px 0 0 0' }}>--------------------------------</p>
          </div>

          <div style={{ fontSize: '11px', marginBottom: '8px' }}>
            {items.map((it) => (
              <div key={it.id} style={{ marginBottom: '4px' }}>
                <div style={{ fontWeight: 'bold' }}>{it.products?.name ?? 'Item'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{it.quantity} x {formatRupiah(it.unit_price)}</span>
                  <span>{formatRupiah(it.subtotal)}</span>
                </div>
              </div>
            ))}
            <p style={{ margin: '4px 0 0 0' }}>--------------------------------</p>
          </div>

          {Number(selected.discount_amount) > 0 && (
            <>
              <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                <span>SUBTOTAL:</span><span>{formatRupiah(selected.total_amount)}</span>
              </div>
              <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                <span>DISKON:</span><span>-{formatRupiah(selected.discount_amount)}</span>
              </div>
            </>
          )}

          <div style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>TOTAL:</span><span>{formatRupiah(selected.grand_total)}</span>
          </div>
          <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>METODE BAYAR:</span><span>{selected.payment_method}</span>
          </div>

          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '15px' }}>
            <p style={{ margin: '2px 0' }}>*** SALINAN ***</p>
            <p style={{ margin: '2px 0' }}>Terima Kasih Atas Kunjungan Anda</p>
          </div>
        </div>
      )}
    </div>
  )
}
