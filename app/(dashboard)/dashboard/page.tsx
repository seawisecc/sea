'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Loader2, 
  ArrowUpRight, 
  Package, 
  Scissors 
} from 'lucide-react'

// Fungsi utilitas format mata uang
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number)
}

interface Order {
  id: string
  invoice_number: string
  customer_name: string
  grand_total: number
  payment_method: string
  created_at: string
}

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  products: {
    type: 'retail' | 'service'
  }
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

      // 1. Tarik semua data orders untuk tenant ini
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, invoice_number, customer_name, grand_total, payment_method, created_at')
        .order('created_at', { ascending: false })

      // 2. Tarik data order_items beserta relasi tipe produk untuk analisis hibrida
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('id, quantity, subtotal, products(type)')

      if (ordersData) {
        const totalRev = ordersData.reduce((sum, o) => sum + Number(o.grand_total), 0)
        const totalTx = ordersData.length
        const aov = totalTx > 0 ? totalRev / totalTx : 0

        // Kalkulasi pemisahan pendapatan Ritel vs Jasa
        let retailRev = 0
        let serviceRev = 0

        if (itemsData) {
          itemsData.forEach((item: any) => {
            const type = item.products?.type
            if (type === 'retail') {
              retailRev += Number(item.subtotal)
            } else if (type === 'service') {
              serviceRev += Number(item.subtotal)
            }
          })
        }

        setOrders(ordersData as Order[])
        setStats({
          totalRevenue: totalRev,
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
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    )
  }

  // Hitung persentase kontribusi untuk visualisasi diagram batang custom
  const totalItemRevenue = stats.retailRevenue + stats.serviceRevenue
  const retailPercentage = totalItemRevenue > 0 ? (stats.retailRevenue / totalItemRevenue) * 100 : 0
  const servicePercentage = totalItemRevenue > 0 ? (stats.serviceRevenue / totalItemRevenue) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Analitik</h1>
        <p className="text-sm text-gray-500">Ikhtisar performa bisnis Ritel & Jasa Anda secara real-time</p>
      </div>

      {/* Grid Kartu KPI (Key Performance Indicators) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card: Total Pendapatan */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Total Pendapatan</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatRupiah(stats.totalRevenue)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-md text-blue-600">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Card: Total Transaksi */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Total Transaksi</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.totalTransactions} Nota</p>
          </div>
          <div className="p-3 bg-green-50 rounded-md text-green-600">
            <ShoppingCart size={24} />
          </div>
        </div>

        {/* Card: Average Order Value */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Rata-rata Nilai Transaksi</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatRupiah(stats.averageOrderValue)}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-md text-purple-600">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Grafik Kontribusi Sektor Hibrida (2 Kolom di Layar Lebar) */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 lg:col-span-1">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Proporsi Pendapatan</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                <div className="flex items-center gap-1.5">
                  <Package size={16} className="text-gray-500" />
                  <span>Ritel (Barang)</span>
                </div>
                <span>{retailPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${retailPercentage}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-semibold">{formatRupiah(stats.retailRevenue)}</p>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                <div className="flex items-center gap-1.5">
                  <Scissors size={16} className="text-orange-500" />
                  <span>Jasa / Layanan</span>
                </div>
                <span>{servicePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: `${servicePercentage}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-semibold">{formatRupiah(stats.serviceRevenue)}</p>
            </div>
          </div>
        </div>

        {/* Tabel Transaksi Terakhir (2 Kolom di Layar Lebar) */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Aktivitas Transaksi Terakhir</h2>
          </div>
          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Belum ada transaksi recorded.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    <th className="px-3 py-2 rounded-l-md">No. Invoice</th>
                    <th className="px-3 py-2">Pelanggan</th>
                    <th className="px-3 py-2">Metode</th>
                    <th className="px-3 py-2 text-right rounded-r-md">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 font-mono font-medium text-blue-600">{order.invoice_number}</td>
                      <td className="px-3 py-3 text-gray-700 font-medium">{order.customer_name}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                          order.payment_method === 'cash' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.payment_method}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-gray-900">{formatRupiah(order.grand_total)}</td>
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