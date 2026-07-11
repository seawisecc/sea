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
    { name: 'sea-erp-lang-storage' }
  )
)