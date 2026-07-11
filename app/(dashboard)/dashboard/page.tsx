'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useLanguageStore } from '@/store/useLanguageStore'
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
  Award 
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    retailRevenue: 0,
    serviceRevenue: 0
  })

  const supabase = createClient()
  const { t, lang } = useLanguageStore()

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, invoice_number, customer_name, grand_total, payment_method, created_at')
        .order('created_at', { ascending: false })

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('id, quantity, subtotal, products(type)')

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')

      if (ordersData) {
        const totalRev = ordersData.reduce((sum, o) => sum + Number(o.grand_total), 0)
        const totalTx = ordersData.length
        const aov = totalTx > 0 ? totalRev / totalTx : 0

        let retailRev = 0
        let serviceRev = 0

        if (itemsData) {
          itemsData.forEach((item: any) => {
            const type = item.products?.type
            if (type === 'retail') retailRev += Number(item.subtotal)
            else if (type === 'service') serviceRev += Number(item.subtotal)
          })
        }

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
          serviceRevenue: serviceRev 
        })
      }
      setLoading(false)
    }
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#2D5A41]" size={40} />
      </div>
    )
  }

  const totalItemRevenue = stats.retailRevenue + stats.serviceRevenue
  const retailPercentage = totalItemRevenue > 0 ? (stats.retailRevenue / totalItemRevenue) * 100 : 0
  const servicePercentage = totalItemRevenue > 0 ? (stats.serviceRevenue / totalItemRevenue) * 100 : 0

  return (
    <div className="p-6 space-y-6 text-[#183022]">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#183022]">
          {lang === 'id' ? 'Dashboard Analitik Finansial' : 'Financial Analytics Dashboard'}
        </h1>
        <p className="text-sm text-[#6B8275] mt-1">
          {lang === 'id' ? 'Pantau arus kas, performa penjualan, dan laba rugi bersih.' : 'Monitor cash flow, sales performance, and net profit.'}
        </p>
      </div>

      <Paywall>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE5DA] p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B8275]">Gross Revenue</p>
              <p className="mt-2 text-xl font-extrabold text-[#183022]">{formatRupiah(stats.totalRevenue)}</p>
            </div>
            <div className="p-3.5 bg-[#E8F3ED] rounded-2xl text-[#2D5A41]"><DollarSign size={24} /></div>
          </div>

          <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE5DA] p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B8275]">Total Expenses</p>
              <p className="mt-2 text-xl font-extrabold text-[#C26D46]">{formatRupiah(stats.totalExpenses)}</p>
            </div>
            <div className="p-3.5 bg-[#FBECE6] rounded-2xl text-[#C26D46]"><Wallet size={24} /></div>
          </div>

          <div className={`rounded-3xl p-6 shadow-md flex items-center justify-between ${stats.netProfit >= 0 ? 'bg-[#183022] text-[#F7F5F0]' : 'bg-[#FDF2F1] text-[#B54D46]'}`}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">Net Profit</p>
              <p className="mt-2 text-2xl font-black">{formatRupiah(stats.netProfit)}</p>
            </div>
            <div className={`p-3.5 rounded-2xl ${stats.netProfit >= 0 ? 'bg-[#234330]' : 'bg-[#FBECE6]'}`}><Award size={26} /></div>
          </div>

          <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE5DA] p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B8275]">Total Orders</p>
              <p className="mt-2 text-xl font-extrabold text-[#183022]">{stats.totalTransactions} Nota</p>
            </div>
            <div className="p-3.5 bg-[#F4EFE6] rounded-2xl text-[#8C7A5B]"><ShoppingCart size={24} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE5DA] p-6 shadow-sm lg:col-span-1">
            <h2 className="font-bold text-lg mb-5">Revenue Streams</h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1.5">
                  <span>Ritel</span><span>{retailPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#F0EBE1] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#2D5A41] h-full" style={{ width: `${retailPercentage}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1.5">
                  <span>Jasa</span><span>{servicePercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#F0EBE1] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#C26D46] h-full" style={{ width: `${servicePercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE5DA] p-6 shadow-sm lg:col-span-2">
            <h2 className="font-bold text-lg mb-4">Recent Transactions</h2>
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex justify-between py-3 border-b border-[#EAE5DA]">
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