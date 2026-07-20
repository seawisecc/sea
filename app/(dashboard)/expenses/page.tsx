'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useRoleStore } from '@/store/useRoleStore'
import { 
  Wallet, 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  X, 
  Calendar, 
  DollarSign, 
  Tag, 
  AlertCircle,
  PackagePlus,
  Zap,
  CheckCircle2
} from 'lucide-react'

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number).replace(/\s+/g, '')
}

interface Expense {
  id: string
  title: string
  category: string
  amount: number
  expense_date: string
}

interface Product {
  id: string
  name: string
  stock: number
  type: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const supabase = createClient()
  const { t } = useLanguageStore()
  const { role, tenantId, loaded: sessionLoaded, fetchSession } = useRoleStore()

  // Form States
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(t.expenses.catOps)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  // Khusus Pengadaan Inventaris (Bahan Baku / Stok)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [addQty, setAddQty] = useState('')

  const fetchData = async () => {
    if (!tenantId) {
      setExpenses([])
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage(null)

    // 1. Tarik Data Pengeluaran — selalu dibatasi tenant milik pengguna
    const { data: expData, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('expense_date', { ascending: false })

    if (expError) {
      console.error("Fetch Expenses Error:", expError)
      setErrorMessage(`Gagal memuat data: ${expError.message}`)
    } else if (expData) {
      setExpenses(expData as Expense[])
    }

    // 2. Tarik Data Barang Inventaris (Khusus Tipe Retail/Barang)
    const { data: prodData } = await supabase
      .from('products')
      .select('id, name, stock, type')
      .eq('tenant_id', tenantId)
      .eq('type', 'retail')
      .order('name', { ascending: true })

    if (prodData) {
      setProducts(prodData as Product[])
      if (prodData.length > 0) setSelectedProductId(prodData[0].id)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (sessionLoaded) fetchData()
  }, [sessionLoaded, tenantId])

  // Kamus Pilihan Cepat Operasional (Quick Chips)
  const getQuickOptions = () => {
    if (category === t.expenses.catOps || category === 'Operasional Toko' || category === 'Store Operations') {
      return ['Beli ATK & Kertas Kasir', 'Biaya Kebersihan & Sampah', 'Service & Perawatan AC/Alat', 'Konsumsi Staf & Tamu', 'Sewa Tempat / Maintenance']
    }
    if (category === t.expenses.catUtil || category === 'Listrik, Air & Internet' || category === 'Electricity, Water & Internet') {
      return ['Tagihan Listrik PLN', 'Tagihan Air PDAM', 'Tagihan Internet WiFi / Telkomsel', 'Langganan Software / SaaS', 'Pulsa & Paket Data Staf']
    }
    if (category === t.expenses.catSalary || category === 'Gaji & Honor Staf' || category === 'Staff Salary & Wages') {
      return ['Gaji Pokok Karyawan', 'Bonus / Insentif Penjualan', 'Uang Lembur (Overtime)', 'Honor Staf Harian / Lepas', 'Tunjangan Hari Raya (THR)']
    }
    return []
  }

  // Cek apakah kategori yang dipilih adalah Pengadaan Stok
  const isProcurement = category === t.expenses.catRaw || category === 'Bahan Baku / Stok' || category === 'Raw Materials / Stock'

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      // tenant_id HANYA boleh berasal dari profil pengguna yang sedang login.
      // Jangan pernah menebak dari baris lain atau memakai nilai fallback —
      // itu bisa menulis data ke tenant milik orang lain.
      if (!tenantId) {
        setErrorMessage("Akun Anda belum terhubung ke toko mana pun. Silakan login ulang.")
        setIsSubmitting(false)
        return
      }

      // =========================================================
      // LOGIKA PENYIMPANAN & UPGRADE STOK OTOMATIS
      // =========================================================
      let finalTitle = title

      // Jika ini pengadaan stok barang
      if (isProcurement && selectedProductId) {
        const targetProduct = products.find(p => p.id === selectedProductId)
        const qtyNumber = Number(addQty) || 0
        
        if (!targetProduct) {
          setErrorMessage("Barang inventaris tidak valid.")
          setIsSubmitting(false)
          return
        }

        if (qtyNumber <= 0) {
          setErrorMessage("Jumlah stok dibeli (Qty) harus lebih dari 0.")
          setIsSubmitting(false)
          return
        }

        finalTitle = `[Pengadaan Stok] ${targetProduct.name} (+${qtyNumber} Unit)`

        // 1. Update/Tambahkan Stok ke Tabel Products Inventaris
        const newStock = targetProduct.stock + qtyNumber
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', selectedProductId)
          .eq('tenant_id', tenantId)

        if (stockError) {
          console.error("Stock Update Error:", stockError)
          setErrorMessage(`Gagal menambah stok di Inventaris: ${stockError.message}`)
          setIsSubmitting(false)
          return
        }
      }

      // 2. Simpan Catatan Biaya ke Tabel Expenses
      const { error } = await supabase
        .from('expenses')
        .insert({
          tenant_id: tenantId,
          title: finalTitle || 'Pengeluaran Operasional',
          category: category || 'Operasional Toko',
          amount: Number(amount) || 0,
          expense_date: date || new Date().toISOString().split('T')[0]
        })
        .select()

      if (error) {
        console.error("Supabase Insert Error:", error)
        setErrorMessage(`Gagal menyimpan pengeluaran: ${error.message}`)
      } else {
        setSuccessMessage(isProcurement ? "Berhasil! Stok barang di Inventaris bertambah & biaya tercatat." : "Catatan biaya berhasil disimpan.")
        setTitle('')
        setAmount('')
        setAddQty('')
        setTimeout(() => {
          setIsModalOpen(false)
          setSuccessMessage(null)
          fetchData()
        }, 1200)
      }
    } catch (err: any) {
      setErrorMessage(`Terjadi kesalahan sistem: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (role !== 'owner') {
      alert('Akses Ditolak: Hanya Pemilik (Owner) yang dapat menghapus catatan pengeluaran.')
      return
    }
    if (confirm('Yakin ingin menghapus catatan biaya ini?')) {
      await supabase.from('expenses').delete().eq('id', id).eq('tenant_id', tenantId)
      fetchData()
    }
  }

  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  const filteredExpenses = expenses.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 h-full flex flex-col text-ink">
      
      {errorMessage && !isModalOpen && (
        <div className="mb-6 bg-tint-danger border border-danger-2 rounded-2xl p-4 text-danger text-sm font-medium flex items-center gap-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">{t.expenses.title}</h1>
          <p className="text-sm text-muted mt-1">{t.expenses.subtitle}</p>
        </div>
        <button 
          onClick={() => { setIsModalOpen(true); setErrorMessage(null); setSuccessMessage(null); }}
          className="bg-ink hover:bg-ink-hi text-on-dark px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition shadow-md hover:shadow-lg text-sm"
        >
          <Plus size={18} />
          <span>{t.expenses.addExpense}</span>
        </button>
      </div>

      {/* Kartu Ringkasan Total Pengeluaran */}
      <div className="mb-6 bg-white border border-line rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-tint-expense text-expense rounded-2xl">
            <Wallet size={28} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted block">{t.expenses.totalExpenses}</span>
            <span className="text-2xl font-extrabold text-ink mt-1 block">{formatRupiah(totalExpenses)}</span>
          </div>
        </div>
        <span className="text-xs bg-paper text-muted px-3.5 py-1.5 rounded-full font-bold">
          {expenses.length} Catatan Biaya
        </span>
      </div>

      {/* Tabel Pengeluaran */}
      <div className="bg-white border border-line rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-line bg-paper-2">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.expenses.searchPlaceholder} 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-line rounded-xl focus:outline-none focus:border-brand text-sm text-ink font-medium transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-brand" size={36} />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-faint border-2 border-dashed border-line rounded-2xl bg-paper-2/50">
              <Wallet size={48} className="mb-3 opacity-40 text-muted" />
              <p className="font-bold text-ink text-base">{t.expenses.empty}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-paper-2 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-muted uppercase tracking-wider">{t.expenses.date}</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-muted uppercase tracking-wider">{t.expenses.description}</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-muted uppercase tracking-wider">{t.expenses.category}</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-muted uppercase tracking-wider">{t.expenses.amount}</th>
                  {role === 'owner' && <th className="px-6 py-4 text-right text-xs font-extrabold text-muted uppercase tracking-wider">Aksi</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-line/60">
                {filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-paper-2 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-muted">
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-accent-ink" />
                        <span>{item.expense_date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-ink text-sm">
                      <div className="flex items-center gap-2">
                        {item.title.startsWith('[Pengadaan Stok]') && (
                          <span className="p-1 bg-tint text-brand rounded-lg" title="Otomatis menambah stok inventaris">
                            <PackagePlus size={14} />
                          </span>
                        )}
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-tint-accent text-accent-deep">
                        <Tag size={13} /> {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-expense text-base">
                      -{formatRupiah(item.amount)}
                    </td>
                    {role === 'owner' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button onClick={() => handleDelete(item.id)} className="text-faint hover:text-danger-2 p-1.5 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL FORM WITH DIRECT INVENTORY PROCUREMENT & QUICK CHIPS */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-line flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-line bg-paper-2">
              <div className="flex items-center gap-2">
                <Wallet className="text-brand" size={22} />
                <h3 className="font-extrabold text-xl text-ink">{t.expenses.addExpense}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-faint hover:text-ink"><X size={22} /></button>
            </div>
            
            <form onSubmit={handleAddExpense} className="p-6 space-y-4 overflow-y-auto">
              
              {errorMessage && (
                <div className="p-3 bg-tint-danger border border-danger-2 rounded-xl text-xs text-danger flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-tint border border-tint-3 rounded-xl text-xs text-brand flex items-center gap-2 font-bold">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* 1. Kategori Pengeluaran */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">{t.expenses.category}</label>
                <select 
                  value={category} 
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setTitle(''); // Reset judul saat ganti kategori
                  }} 
                  className="w-full bg-white border border-line rounded-xl px-4 py-2.5 text-sm text-ink font-bold focus:outline-none focus:border-brand shadow-sm"
                >
                  <option value={t.expenses.catOps}>{t.expenses.catOps}</option>
                  <option value={t.expenses.catRaw}>📦 {t.expenses.catRaw} (Direct Inventory)</option>
                  <option value={t.expenses.catSalary}>{t.expenses.catSalary}</option>
                  <option value={t.expenses.catUtil}>{t.expenses.catUtil}</option>
                </select>
              </div>

              {/* 2. LOGIKA KONDISIONAL: JIKA PENGADAAN STOK VS OPERASIONAL BIASA */}
              {isProcurement ? (
                <div className="p-3.5 bg-tint/60 border border-tint-3 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand">
                    <PackagePlus size={16} />
                    <span>Pengadaan & Penambahan Stok Otomatis</span>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-muted-2 mb-1">Pilih Barang dari Katalog Inventaris</label>
                    <select 
                      value={selectedProductId} 
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-white border border-tint-3 rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-brand"
                    >
                      {products.length === 0 ? (
                        <option value="">Katalog Barang Kosong</option>
                      ) : (
                        products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Stok Saat Ini: {p.stock} Unit)</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-2 mb-1">Jumlah Unit Dibeli (Qty)</label>
                    <input 
                      type="number" 
                      value={addQty} 
                      onChange={(e) => setAddQty(e.target.value)}
                      placeholder="Contoh: 10" 
                      className="w-full bg-white border border-tint-3 rounded-xl px-3 py-2 text-xs font-extrabold text-ink focus:outline-none focus:border-brand" 
                    />
                  </div>
                  <p className="text-[10px] text-muted-2 italic">
                    *Stok barang yang dipilih akan otomatis bertambah di menu Inventaris setelah disimpan.
                  </p>
                </div>
              ) : (
                /* Operasional Biasa: Input Judul + Tombol Pilihan Cepat (Quick Chips) */
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">{t.expenses.description}</label>
                  <input 
                    required 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Ketik manual atau pilih opsi cepat di bawah..." 
                    className="w-full bg-white border border-line rounded-xl px-4 py-2.5 text-sm text-ink font-medium focus:outline-none focus:border-brand" 
                  />
                  
                  {/* Pilihan Cepat (Quick Chips) */}
                  {getQuickOptions().length > 0 && (
                    <div className="mt-2.5">
                      <span className="text-[10px] font-bold text-accent-ink flex items-center gap-1 mb-1.5">
                        <Zap size={12} /> Pilihan Cepat (Klik untuk mengisi):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {getQuickOptions().map((opt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTitle(opt)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                              title === opt 
                                ? 'bg-ink text-white border-ink shadow-sm' 
                                : 'bg-paper-2 text-muted-2 border-line hover:border-brand hover:text-ink'
                            }`}
                          >
                            + {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Nominal Biaya */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">{t.expenses.amount}</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
                  <input 
                    required 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="Contoh: 250000" 
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-line rounded-xl text-sm text-ink font-extrabold focus:outline-none focus:border-brand" 
                  />
                </div>
              </div>

              {/* 4. Tanggal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">{t.expenses.date}</label>
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white border border-line rounded-xl px-4 py-2.5 text-sm text-ink font-medium focus:outline-none focus:border-brand" />
              </div>

              <div className="pt-4 border-t border-line mt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-ink text-on-dark rounded-2xl py-3.5 font-bold hover:bg-ink-hi disabled:opacity-50 flex items-center justify-center shadow-lg transition-all text-sm gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>{isProcurement ? 'Simpan & Tambah Stok Inventaris' : 'Simpan Catatan Biaya'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}