import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 1. Definisikan struktur kamus kata (Dictionary)
export const dictionary = {
  id: {
    common: {
      loading: 'Memuat...',
      save: 'Simpan',
      delete: 'Hapus',
      cancel: 'Batal',
      search: 'Cari...',
      success: 'Berhasil!',
      error: 'Terjadi Kesalahan',
    },
    nav: {
      dashboard: 'Dashboard',
      pos: 'Kasir (POS)',
      inventory: 'Inventaris',
      customers: 'Pelanggan',
      settings: 'Pengaturan',
      logout: 'Keluar Sistem',
      mainMenu: 'Menu Utama',
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
    common: {
      loading: 'Loading...',
      save: 'Save',
      delete: 'Delete',
      cancel: 'Cancel',
      search: 'Search...',
      success: 'Success!',
      error: 'An Error Occurred',
    },
    nav: {
      dashboard: 'Dashboard',
      pos: 'Point of Sale (POS)',
      inventory: 'Inventory',
      customers: 'Customers',
      settings: 'Settings',
      logout: 'Sign Out',
      mainMenu: 'Main Menu',
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
  t: typeof dictionary['id'] // Tipe otomatis mengikuti struktur kamus
  setLang: (lang: Language) => void
  toggleLang: () => void
}

// 2. Buat Zustand Store dengan fitur persist (memori permanen di browser)
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'id', // Bahasa default Indonesia
      t: dictionary['id'],
      setLang: (newLang) => set({ lang: newLang, t: dictionary[newLang] }),
      toggleLang: () => {
        const current = get().lang
        const next = current === 'id' ? 'en' : 'id'
        set({ lang: next, t: dictionary[next] })
      }
    }),
    {
      name: 'sea-erp-lang-storage', // Nama key di localStorage
    }
  )
)