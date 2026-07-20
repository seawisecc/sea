'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useRoleStore } from '@/store/useRoleStore'
import { Paywall } from '../../components/Paywall'
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Loader2, 
  Package, 
  Scissors, 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight,
  Award,
  PackageX
} from 'lucide-react'

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(number).replace(/\s+/g, '')
}

interface Order {
  id: string
  invoice_number: string
  customer_name: string
  grand_total: number
  payment_method: string
  created_at: string
}

interface DayPoint {
  key: string
  label: string
  total: number
  count: number
}

interface TopProduct {
  name: string
  qty: number
  revenue: number
  type: string
}

const DAYS_SHOWN = 14

/** Ambang stok yang dianggap perlu segera dipesan ulang. */
const LOW_STOCK_THRESHOLD = 5

type PeriodKey = 'today' | '7d' | '30d' | 'all'

const PERIODS: { key: PeriodKey; label: string; labelEn: string; days: number | null }[] = [
  { key: 'today', label: 'Hari Ini', labelEn: 'Today', days: 0 },
  { key: '7d', label: '7 Hari', labelEn: '7 Days', days: 6 },
  { key: '30d', label: '30 Hari', labelEn: '30 Days', days: 29 },
  { key: 'all', label: 'Semua', labelEn: 'All Time', days: null }
]

interface LowStockItem {
  id: string
  name: string
  stock: number
}

/** Awal hari dalam zona waktu lokal, bukan UTC. */
const startOfDay = (offsetDays = 0) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - offsetDays)
  return d
}

/** Kunci tanggal lokal (bukan UTC) supaya "hari ini" sesuai zona waktu toko. */
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [daily, setDaily] = useState<DayPoint[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [period, setPeriod] = useState<PeriodKey>('all')
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    retailRevenue: 0,
    serviceRevenue: 0,
    todayRevenue: 0,
    todayTransactions: 0
  })

  const supabase = createClient()
  const { t, lang } = useLanguageStore()
  const { tenantId, loaded: sessionLoaded, fetchSession } = useRoleStore()

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (!sessionLoaded) return

    const fetchDashboardData = async () => {
      if (!tenantId) {
        setLoading(false)
        return
      }

      setLoading(true)

      const periodDays = PERIODS.find((p) => p.key === period)?.days ?? null
      const sinceIso = periodDays === null ? null : startOfDay(periodDays).toISOString()

      // Semua agregat dibatasi ke tenant pengguna yang login.
      let ordersQuery = supabase
        .from('orders')
        .select('id, invoice_number, customer_name, grand_total, payment_method, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (sinceIso) ordersQuery = ordersQuery.gte('created_at', sinceIso)

      const { data: ordersData } = await ordersQuery

      // Stok menipis tidak terikat periode — ini kondisi saat ini, bukan riwayat.
      const { data: lowStockData } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('tenant_id', tenantId)
        .eq('type', 'retail')
        .lte('stock', LOW_STOCK_THRESHOLD)
        .order('stock', { ascending: true })
        .limit(8)

      setLowStock((lowStockData as LowStockItem[]) ?? [])

      // order_items dibatasi lewat order milik tenant ini, jadi tidak
      // bergantung pada ada/tidaknya kolom tenant_id di tabel tersebut.
      const orderIds = (ordersData ?? []).map((o) => o.id)
      const { data: itemsData } = orderIds.length
        ? await supabase
            .from('order_items')
            .select('id, quantity, subtotal, order_id, products(type, name)')
            .in('order_id', orderIds)
        : { data: [] as any[] }

      let expensesQuery = supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('tenant_id', tenantId)

      if (periodDays !== null) {
        // expense_date bertipe DATE, jadi dibandingkan sebagai YYYY-MM-DD.
        expensesQuery = expensesQuery.gte('expense_date', dayKey(startOfDay(periodDays)))
      }

      const { data: expensesData } = await expensesQuery

      if (ordersData) {
        const totalRev = ordersData.reduce((sum, o) => sum + Number(o.grand_total), 0)
        const totalTx = ordersData.length
        const aov = totalTx > 0 ? totalRev / totalTx : 0

        let retailRev = 0
        let serviceRev = 0

        // Peringkat barang terlaris, diurutkan berdasarkan jumlah unit terjual
        const productTally = new Map<string, TopProduct>()

        if (itemsData) {
          itemsData.forEach((item: any) => {
            const type = item.products?.type
            if (type === 'retail') retailRev += Number(item.subtotal)
            else if (type === 'service') serviceRev += Number(item.subtotal)

            const name = item.products?.name
            if (!name) return
            const prev = productTally.get(name) ?? { name, qty: 0, revenue: 0, type: type ?? 'retail' }
            prev.qty += Number(item.quantity) || 0
            prev.revenue += Number(item.subtotal) || 0
            productTally.set(name, prev)
          })
        }

        setTopProducts(
          [...productTally.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)
        )

        // Grafik selalu menampilkan 14 hari terakhir apa pun periode yang
        // dipilih, jadi datanya diambil terpisah. Kalau ikut difilter, memilih
        // "Hari Ini" akan membuat grafiknya nyaris kosong dan menyesatkan.
        const { data: chartOrders } = await supabase
          .from('orders')
          .select('grand_total, created_at')
          .eq('tenant_id', tenantId)
          .gte('created_at', startOfDay(DAYS_SHOWN - 1).toISOString())

        // Hari tanpa transaksi tetap muncul sebagai nol supaya jeda penjualan
        // terlihat, bukan tersembunyi.
        const buckets = new Map<string, DayPoint>()
        const today = new Date()
        for (let i = DAYS_SHOWN - 1; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(today.getDate() - i)
          buckets.set(dayKey(d), {
            key: dayKey(d),
            label: d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' }),
            total: 0,
            count: 0
          })
        }

        const todayKey = dayKey(today)
        let todayRev = 0
        let todayTx = 0

        ;(chartOrders ?? []).forEach((o) => {
          const k = dayKey(new Date(o.created_at))
          const bucket = buckets.get(k)
          if (bucket) {
            bucket.total += Number(o.grand_total)
            bucket.count += 1
          }
          if (k === todayKey) {
            todayRev += Number(o.grand_total)
            todayTx += 1
          }
        })

        setDaily([...buckets.values()])

        const totalExp = expensesData ? expensesData.reduce((sum, e) => sum + Number(e.amount), 0) : 0
        const net = totalRev - totalExp

        setOrders(ordersData as Order[])
        setStats({
          totalRevenue: totalRev,
          totalExpenses: totalExp,
          netProfit: net,
          totalTransactions: totalTx,
          averageOrderValue: aov,
          retailRevenue: retailRev,
          serviceRevenue: serviceRev,
          todayRevenue: todayRev,
          todayTransactions: todayTx
        })
      }
      setLoading(false)
    }
    fetchDashboardData()
  }, [sessionLoaded, tenantId, period])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand" size={40} />
      </div>
    )
  }

  const maxDaily = daily.reduce((m, d) => Math.max(m, d.total), 0)
  const avgDaily = daily.length ? Math.round(daily.reduce((s, d) => s + d.total, 0) / daily.length) : 0

  const totalItemRevenue = stats.retailRevenue + stats.serviceRevenue
  const retailPercentage = totalItemRevenue > 0 ? (stats.retailRevenue / totalItemRevenue) * 100 : 0
  const servicePercentage = totalItemRevenue > 0 ? (stats.serviceRevenue / totalItemRevenue) * 100 : 0

  return (
    <div className="p-6 space-y-6 text-ink">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            {lang === 'id' ? 'Dashboard Analitik Finansial' : 'Financial Analytics Dashboard'}
          </h1>
          <p className="text-sm text-muted mt-1">
            {lang === 'id' ? 'Pantau arus kas, performa penjualan, dan laba rugi bersih.' : 'Monitor cash flow, sales performance, and net profit.'}
          </p>
        </div>

        <div className="flex bg-white border border-line p-1 rounded-xl self-start lg:self-auto flex-shrink-0">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                period === p.key ? 'bg-ink text-on-dark shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {lang === 'id' ? p.label : p.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* PERINGATAN STOK MENIPIS */}
      {lowStock.length > 0 && (
        <div className="bg-tint-expense border border-expense/25 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-expense/10 rounded-xl text-expense flex-shrink-0">
              <PackageX size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-sm text-expense-deep">
                {lang === 'id' ? 'Stok Menipis' : 'Low Stock'}
              </h2>
              <p className="text-xs text-expense-deep/80 mb-3">
                {lang === 'id'
                  ? `${lowStock.length} barang tersisa ${LOW_STOCK_THRESHOLD} unit atau kurang. Segera pesan ulang.`
                  : `${lowStock.length} items at ${LOW_STOCK_THRESHOLD} units or fewer. Time to restock.`}
              </p>
              <div className="flex flex-wrap gap-2">
                {lowStock.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 bg-white border border-expense/20 rounded-full pl-3 pr-2 py-1"
                  >
                    <span className="text-[11px] font-bold text-ink truncate max-w-[160px]">{item.name}</span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        item.stock === 0 ? 'bg-danger text-white' : 'bg-tint-expense text-expense-deep'
                      }`}
                    >
                      {item.stock === 0 ? (lang === 'id' ? 'HABIS' : 'OUT') : item.stock}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Paywall>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-3xl border border-line p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Gross Revenue</p>
              <p className="mt-2 text-xl font-extrabold text-ink">{formatRupiah(stats.totalRevenue)}</p>
            </div>
            <div className="p-3.5 bg-tint rounded-2xl text-brand"><DollarSign size={24} /></div>
          </div>

          <div className="bg-white rounded-3xl border border-line p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Total Expenses</p>
              <p className="mt-2 text-xl font-extrabold text-expense">{formatRupiah(stats.totalExpenses)}</p>
            </div>
            <div className="p-3.5 bg-tint-expense rounded-2xl text-expense"><Wallet size={24} /></div>
          </div>

          <div className={`rounded-3xl p-6 shadow-md flex items-center justify-between ${stats.netProfit >= 0 ? 'bg-ink text-on-dark' : 'bg-tint-danger text-danger'}`}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">Net Profit</p>
              <p className="mt-2 text-2xl font-black">{formatRupiah(stats.netProfit)}</p>
            </div>
            <div className={`p-3.5 rounded-2xl ${stats.netProfit >= 0 ? 'bg-ink-hi' : 'bg-tint-expense'}`}><Award size={26} /></div>
          </div>

          <div className="bg-white rounded-3xl border border-line p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Total Orders</p>
              <p className="mt-2 text-xl font-extrabold text-ink">{stats.totalTransactions} Nota</p>
            </div>
            <div className="p-3.5 bg-tint-accent rounded-2xl text-accent-ink"><ShoppingCart size={24} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* GRAFIK PENJUALAN 14 HARI */}
          <div className="bg-white rounded-3xl border border-line p-6 shadow-sm lg:col-span-2">
            <div className="flex items-start justify-between mb-5 gap-4">
              <div>
                <h2 className="font-bold text-lg">
                  {lang === 'id' ? 'Penjualan 14 Hari Terakhir' : 'Sales — Last 14 Days'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {lang === 'id' ? 'Arahkan kursor ke batang untuk melihat detail' : 'Hover a bar for details'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  {lang === 'id' ? 'Hari Ini' : 'Today'}
                </p>
                <p className="text-lg font-extrabold text-ink leading-tight">{formatRupiah(stats.todayRevenue)}</p>
                <p className="text-[11px] text-muted">
                  {stats.todayTransactions} {lang === 'id' ? 'nota' : 'orders'}
                </p>
              </div>
            </div>

            {maxDaily === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-faint border-2 border-dashed border-line rounded-2xl">
                <TrendingUp size={28} className="mb-2 opacity-50" />
                <p className="text-xs font-semibold text-muted">
                  {lang === 'id' ? 'Belum ada penjualan dalam 14 hari terakhir' : 'No sales in the last 14 days'}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-end gap-1.5 h-44">
                  {daily.map((d) => {
                    const pct = (d.total / maxDaily) * 100
                    const isToday = d.key === dayKey(new Date())
                    return (
                      <div key={d.key} className="flex-1 h-full flex flex-col justify-end group relative">
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            isToday ? 'bg-accent-ink' : 'bg-brand group-hover:bg-ink'
                          }`}
                          style={{ height: `${Math.max(pct, d.total > 0 ? 3 : 0)}%` }}
                        />
                        {d.total > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 whitespace-nowrap bg-ink text-on-dark text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg">
                            {formatRupiah(d.total)} · {d.count} {lang === 'id' ? 'nota' : 'orders'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-1.5 mt-2">
                  {daily.map((d, i) => (
                    <div key={d.key} className="flex-1 text-center">
                      {/* Hanya tiap hari kedua yang diberi label agar tidak bertumpuk */}
                      <span className="text-[9px] text-muted font-semibold">
                        {i % 2 === 0 ? d.label : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted font-semibold mt-3 pt-3 border-t border-line">
                  <span>{lang === 'id' ? 'Tertinggi' : 'Peak'}: {formatRupiah(maxDaily)}</span>
                  <span>
                    {lang === 'id' ? 'Rata-rata/hari' : 'Avg/day'}: {formatRupiah(avgDaily)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* BARANG TERLARIS */}
          <div className="bg-white rounded-3xl border border-line p-6 shadow-sm lg:col-span-1">
            <h2 className="font-bold text-lg mb-1">
              {lang === 'id' ? 'Terlaris' : 'Best Sellers'}
            </h2>
            <p className="text-xs text-muted mb-5">
              {lang === 'id' ? 'Berdasarkan jumlah unit terjual' : 'By units sold'}
            </p>

            {topProducts.length === 0 ? (
              <div className="py-10 text-center text-muted text-xs">
                {lang === 'id' ? 'Belum ada data penjualan.' : 'No sales data yet.'}
              </div>
            ) : (
              <div className="space-y-3.5">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-[11px] font-black ${
                        i === 0 ? 'bg-accent text-ink' : 'bg-tint text-brand'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ink truncate">{p.name}</p>
                      <div className="w-full bg-paper h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={p.type === 'service' ? 'bg-expense h-full' : 'bg-brand h-full'}
                          style={{ width: `${(p.qty / topProducts[0].qty) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-extrabold text-ink">{p.qty}</p>
                      <p className="text-[9px] text-muted uppercase tracking-wider">
                        {lang === 'id' ? 'unit' : 'sold'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-white rounded-3xl border border-line p-6 shadow-sm lg:col-span-1">
            <h2 className="font-bold text-lg mb-5">Revenue Streams</h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1.5">
                  <span>Ritel</span><span>{retailPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-paper h-3 rounded-full overflow-hidden">
                  <div className="bg-brand h-full" style={{ width: `${retailPercentage}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1.5">
                  <span>Jasa</span><span>{servicePercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-paper h-3 rounded-full overflow-hidden">
                  <div className="bg-expense h-full" style={{ width: `${servicePercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-line p-6 shadow-sm lg:col-span-2">
            <h2 className="font-bold text-lg mb-4">Recent Transactions</h2>
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex justify-between py-3 border-b border-line">
                <span className="font-bold">{order.invoice_number}</span>
                <span className="font-extrabold">{formatRupiah(order.grand_total)}</span>
              </div>
            ))}
          </div>
        </div>
      </Paywall>
    </div>
  )
}