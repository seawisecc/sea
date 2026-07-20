import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const dictionary = {
  id: {
    nav: {
      dashboard: 'Dashboard',
      pos: 'Kasir (POS)',
      inventory: 'Inventaris',
      customers: 'Pelanggan',
      history: 'Riwayat Transaksi',
      expenses: 'Pengeluaran',
      settings: 'Pengaturan',
      logout: 'Keluar Sistem',
      mainMenu: 'Menu Utama',
      lang: 'Bahasa',
    },
    auth: {
      welcome: 'Selamat Datang',
      welcomeSub: 'Masuk ke dasbor kelola bisnis Anda',
      email: 'Email Bisnis',
      password: 'Kata Sandi',
      signIn: 'Masuk ke Sistem',
      signUp: 'Daftar Akun Baru',
      noAccount: 'Belum Punya Akun?',
      noAccountSub: 'Daftarkan bisnis Anda sekarang untuk membuka akses penuh ke kasir POS, inventaris, dan analitik real-time.',
      hasAccount: 'Sudah Punya Akun?',
      hasAccountSub: 'Masuk kembali dengan email bisnis Anda untuk memantau performa toko dan melanjutkan operasional.',
      fullName: 'Nama Lengkap',
      companyName: 'Nama Bisnis / Perusahaan',
      createAccount: 'Daftarkan Akun Sekarang',
    },
    pos: {
      title: 'Kasir (POS)',
      subtitle: 'Sistem transaksi ritel dan layanan eksklusif',
      catalog: 'Katalog Layanan & Produk',
      cart: 'Keranjang Pesanan',
      customerName: 'Nama Pelanggan',
      paymentMethod: 'Metode Pembayaran',
      total: 'Total Tagihan',
      payNow: 'Bayar Sekarang',
      emptyCart: 'Keranjang Masih Kosong',
    },
    expenses: {
      title: 'Arus Kas & Pengeluaran',
      subtitle: 'Catat biaya operasional untuk menghitung laba rugi bersih',
      addExpense: 'Catat Biaya Baru',
      searchPlaceholder: 'Cari catatan pengeluaran...',
      category: 'Kategori Biaya',
      amount: 'Nominal (Rp)',
      date: 'Tanggal Biaya',
      description: 'Keterangan / Judul',
      totalExpenses: 'Total Pengeluaran Recorded',
      empty: 'Belum ada catatan pengeluaran.',
      catOps: 'Operasional Toko',
      catRaw: 'Bahan Baku / Stok',
      catSalary: 'Gaji & Honor Staf',
      catUtil: 'Listrik, Air & Internet',
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      pos: 'Point of Sale (POS)',
      inventory: 'Inventory',
      customers: 'Customers',
      history: 'Transaction History',
      expenses: 'Expenses',
      settings: 'Settings',
      logout: 'Sign Out',
      mainMenu: 'Main Menu',
      lang: 'Language',
    },
    auth: {
      welcome: 'Welcome Back',
      welcomeSub: 'Sign in to manage your business dashboard',
      email: 'Business Email',
      password: 'Password',
      signIn: 'Sign In to System',
      signUp: 'Create New Account',
      noAccount: 'New around here?',
      noAccountSub: 'Register your business now to unlock full access to POS, inventory management, and real-time analytics.',
      hasAccount: 'Already a member?',
      hasAccountSub: 'Sign back in with your business email to monitor performance and resume operations.',
      fullName: 'Full Name',
      companyName: 'Business / Company Name',
      createAccount: 'Create Account Now',
    },
    pos: {
      title: 'Point of Sale (POS)',
      subtitle: 'Retail transaction system and exclusive services',
      catalog: 'Services & Products Catalog',
      cart: 'Shopping Cart',
      customerName: 'Customer Name',
      paymentMethod: 'Payment Method',
      total: 'Total Amount',
      payNow: 'Pay Now',
      emptyCart: 'Cart is Currently Empty',
    },
    expenses: {
      title: 'Cash Flow & Expenses',
      subtitle: 'Track operational costs to calculate accurate net profit',
      addExpense: 'Record New Expense',
      searchPlaceholder: 'Search expense records...',
      category: 'Expense Category',
      amount: 'Amount (IDR)',
      date: 'Expense Date',
      description: 'Description / Title',
      totalExpenses: 'Total Recorded Expenses',
      empty: 'No expense records found.',
      catOps: 'Store Operations',
      catRaw: 'Raw Materials / Stock',
      catSalary: 'Staff Salary & Wages',
      catUtil: 'Electricity, Water & Internet',
    }
  }
}

type Language = 'id' | 'en'

interface LanguageState {
  lang: Language
  t: typeof dictionary['id']
  setLang: (lang: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'id',
      t: dictionary['id'],
      setLang: (newLang: Language) => set({ lang: newLang, t: dictionary[newLang] }),
    }),
    { 
      name: 'sea-erp-lang-storage',
      partialize: (state) => ({ lang: state.lang }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        lang: persistedState?.lang || currentState.lang,
        t: dictionary[persistedState?.lang as Language] || currentState.t,
      }),
    }
  )
)