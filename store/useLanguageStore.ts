import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const dictionary = {
  id: {
    nav: {
      dashboard: 'Dashboard',
      pos: 'Kasir (POS)',
      inventory: 'Inventaris',
      customers: 'Pelanggan',
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
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      pos: 'Point of Sale (POS)',
      inventory: 'Inventory',
      customers: 'Customers',
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
      // ARSITEKTUR ANTI-STALE CACHE:
      // 1. Partialize: Hanya simpan variabel 'lang' ke localStorage, abaikan 't'
      partialize: (state) => ({ lang: state.lang }),
      // 2. Merge: Saat app dibuka, pasangkan 'lang' dari memori dengan kamus 't' terbaru dari kode
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        lang: persistedState?.lang || currentState.lang,
        t: dictionary[persistedState?.lang as Language] || currentState.t,
      }),
    }
  )
)