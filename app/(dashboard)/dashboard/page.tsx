'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { TrendingUp, ShoppingCart, DollarSign, Loader2, Package, Scissors } from 'lucide-react'

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number).replace(/\s+/g, '')
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
    totalTransactions: 0,
    averageOrderValue: 0,
    retailRevenue: 0,
    serviceRevenue: 0
  })

  const supabase = createClient()

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

        setOrders(ordersData as Order[])
        setStats({ totalRevenue: totalRev, totalTransactions: totalTx, averageOrderValue: aov, retailRevenue: retailRev, serviceRevenue: serviceRev })
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
        <h1 className="text-3xl font-extrabold tracking-tight text-[#183022]">Dashboard Analitik</h1>
        <p className="text-sm text-[#6B8275] mt-1">Ikhtisar performa bisnis Ritel & Jasa Anda secara real-time</p>
      </div>

      {/* Grid Kartu KPI - Estetika Cream & Forest Green */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE5DA] p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B8275]">Total Pendapatan</p>
            <p className="mt-2 text-2xl font-extrabold text-[#183022]">{formatRupiah(stats.totalRevenue)}</p>
          </div>
          <div className="p-3.5 bg-[#E8F3ED] rounded-2xl text-[#2D5A41]">
            <DollarSign size={26} />
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE5DA] p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B8275]">Total Transaksi</p>
            <p className="mt-2 text-2xl font-extrabold text-[#183022]">{stats.totalTransactions} Nota</p>
          </div>
          <div className="p-3.5 bg-[#F4EFE6] rounded-2xl text-[#8C7A5B]">
            <ShoppingCart size={26} />
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE5DA] p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B8275]">Rata-rata Nilai Order</p>
            <p className="mt-2 text-2xl font-extrabold text-[#183022]">{formatRupiah(stats.averageOrderValue)}</p>
          </div>
          <div className="p-3.5 bg-[#FBECE6] rounded-2xl text-[#C26D46]">
            <TrendingUp size={26} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Proporsi Pendapatan */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE5DA] p-6 shadow-sm lg:col-span-1">
          <h2 className="font-bold text-lg text-[#183022] mb-5">Proporsi Pendapatan</h2>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm font-semibold text-[#5A6D62] mb-1.5">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-[#2D5A41]" />
                  <span>Ritel (Barang)</span>
                </div>
                <span>{retailPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#F0EBE1] h-3.5 rounded-full overflow-hidden">
                <div className="bg-[#2D5A41] h-full rounded-full transition-all duration-500" style={{ width: `${retailPercentage}%` }}></div>
              </div>
              <p className="text-xs text-[#6B8275] mt-1.5 font-bold">{formatRupiah(stats.retailRevenue)}</p>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-[#5A6D62] mb-1.5">
                <div className="flex items-center gap-2">
                  <Scissors size={18} className="text-[#C26D46]" />
                  <span>Jasa / Layanan</span>
                </div>
                <span>{servicePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#F0EBE1] h-3.5 rounded-full overflow-hidden">
                <div className="bg-[#C26D46] h-full rounded-full transition-all duration-500" style={{ width: `${servicePercentage}%` }}></div>
              </div>
              <p className="text-xs text-[#6B8275] mt-1.5 font-bold">{formatRupiah(stats.serviceRevenue)}</p>
            </div>
          </div>
        </div>

        {/* Tabel Aktivitas */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE5DA] p-6 shadow-sm lg:col-span-2 flex flex-col">
          <h2 className="font-bold text-lg text-[#183022] mb-4">Aktivitas Transaksi Terakhir</h2>
          <div className="overflow-x-auto flex-1">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-[#A4B5AC] text-sm font-medium border-2 border-dashed border-[#EAE5DA] rounded-2xl bg-[#FCFBF9]/50">
                Belum ada transaksi recorded.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-[#EAE5DA] text-sm">
                <thead>
                  <tr className="text-left text-xs font-extrabold text-[#6B8275] uppercase tracking-wider bg-[#FCFBF9]">
                    <th className="px-4 py-3 rounded-l-xl">No. Invoice</th>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3 text-right rounded-r-xl">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DA]/60">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-[#FCFBF9] transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#2D5A41]">{order.invoice_number}</td>
                      <td className="px-4 py-3.5 text-[#183022] font-semibold">{order.customer_name}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          order.payment_method === 'cash' ? 'bg-[#F4EFE6] text-[#6A5A3C]' : 'bg-[#E8F3ED] text-[#2D5A41]'
                        }`}>
                          {order.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-[#183022]">{formatRupiah(order.grand_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}