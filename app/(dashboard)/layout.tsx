'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useRoleStore } from '@/store/useRoleStore'
import Link from 'next/link'
import { 
  Store, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Globe,
  ShieldCheck,
  Crown,
  UserCheck
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  allowedRoles: ('owner' | 'cashier')[]
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  const { lang, setLang, t } = useLanguageStore()
  const { role, setRole } = useRoleStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Definisi hak akses setiap menu (RBAC)
  const navigation: NavItem[] = [
    { name: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard, allowedRoles: ['owner'] }, // Hanya Owner
    { name: t.nav.pos, href: '/pos', icon: ShoppingCart, allowedRoles: ['owner', 'cashier'] }, // Owner & Kasir
    { name: t.nav.inventory, href: '/inventory', icon: Package, allowedRoles: ['owner', 'cashier'] }, // Owner & Kasir (tapi kasir read-only)
    { name: t.nav.customers, href: '/customers', icon: Users, allowedRoles: ['owner', 'cashier'] }, // Owner & Kasir
    { name: t.nav.settings, href: '/settings', icon: Settings, allowedRoles: ['owner'] }, // Hanya Owner
  ]

  // Filter menu berdasarkan role yang sedang aktif
  const filteredNav = navigation.filter(item => item.allowedRoles.includes(role))

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex font-sans text-[#2C3E35]">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#183022] text-[#E8EFEA] border-r border-[#102218] shadow-xl">
        <div className="h-20 flex items-center px-6 border-b border-[#234330]/60 gap-3">
          <div className="p-2.5 bg-[#2D5A41] rounded-xl text-[#F7F5F0] shadow-inner">
            <Store size={22} />
          </div>
          <div>
            <span className="text-lg font-bold tracking-wide text-[#F7F5F0] block">SEA ERP</span>
            <span className="text-[10px] uppercase tracking-wider text-[#93B2A1] font-medium">SaaS Edition</span>
          </div>
        </div>
        
        {/* Banner Status Role Aktif */}
        <div className="mx-4 mt-4 p-2.5 bg-[#14281C] border border-[#234330] rounded-xl flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${role === 'owner' ? 'bg-[#F4EFE6] text-[#8C7A5B]' : 'bg-[#E8F3ED] text-[#2D5A41]'}`}>
            {role === 'owner' ? <Crown size={16} /> : <UserCheck size={16} />}
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] uppercase tracking-wider text-[#7A9C88] block font-bold">Akses Staf:</span>
            <span className="text-xs font-extrabold text-[#F7F5F0] truncate block">
              {role === 'owner' ? '👑 Pemilik (Owner)' : '🛒 Kasir (Staff)'}
            </span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#7A9C88]">
            {t.nav.mainMenu}
          </div>
          {filteredNav.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3.5 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#2D5A41] text-[#FFFFFF] shadow-md font-semibold translate-x-1'
                    : 'text-[#A8C3B3] hover:bg-[#224230] hover:text-[#FFFFFF]'
                }`}
              >
                <Icon className={`mr-3.5 flex-shrink-0 h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110 text-[#E2F0E8]' : 'text-[#7A9C88]'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* CONTROLLER 1: TOGGLE BAHASA */}
        <div className="px-4 py-2 border-t border-[#234330]/60 flex items-center justify-between bg-[#14281C]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#93B2A1]">
            <Globe size={15} />
            <span>{t.nav.lang}</span>
          </div>
          <div className="flex bg-[#234330] p-0.5 rounded-lg border border-[#2D5A41]">
            <button onClick={() => setLang('id')} className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all ${lang === 'id' ? 'bg-[#F7F5F0] text-[#183022] shadow' : 'text-[#A8C3B3]'}`}>ID</button>
            <button onClick={() => setLang('en')} className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all ${lang === 'en' ? 'bg-[#F7F5F0] text-[#183022] shadow' : 'text-[#A8C3B3]'}`}>EN</button>
          </div>
        </div>

        {/* CONTROLLER 2: SIMULATOR ROLE (KHUSUS TES DEMO) */}
        <div className="px-4 py-2.5 border-t border-[#234330]/60 flex items-center justify-between bg-[#102016]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#93B2A1]">
            <ShieldCheck size={15} className="text-[#8C7A5B]" />
            <span>Simulasi</span>
          </div>
          <div className="flex bg-[#234330] p-0.5 rounded-lg border border-[#2D5A41]">
            <button onClick={() => setRole('owner')} className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all ${role === 'owner' ? 'bg-[#8C7A5B] text-white shadow' : 'text-[#A8C3B3]'}`}>Owner</button>
            <button onClick={() => setRole('cashier')} className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all ${role === 'cashier' ? 'bg-[#2D5A41] text-white shadow' : 'text-[#A8C3B3]'}`}>Kasir</button>
          </div>
        </div>

        {/* Tombol Logout */}
        <div className="p-4 border-t border-[#234330]/60">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center px-3.5 py-3 text-sm font-medium text-[#ECA29B] rounded-xl hover:bg-[#224230] hover:text-[#F5B8B3] transition-colors"
          >
            <LogOut className="mr-3.5 flex-shrink-0 h-5 w-5 text-[#ECA29B]" />
            {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-[#183022] text-white px-4 h-16 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Store className="text-[#A8C3B3]" size={24} />
            <span className="font-bold text-lg text-[#F7F5F0]">SEA ERP</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-[#224230] text-[#E8EFEA] focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#183022] text-[#E8EFEA] px-4 pt-2 pb-6 space-y-2 border-b border-[#234330] shadow-2xl z-50">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl ${
                  pathname === item.href ? 'bg-[#2D5A41] text-white font-semibold' : 'text-[#A8C3B3]'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
            
            {/* Toggle Simulator Role & Bahasa di Mobile */}
            <div className="grid grid-cols-2 gap-2 my-3 pt-2 border-t border-[#234330]">
              <div className="bg-[#14281C] p-2.5 rounded-xl flex flex-col items-center">
                <span className="text-[10px] text-[#7A9C88] font-bold mb-1">Bahasa</span>
                <div className="flex gap-1">
                  <button onClick={() => setLang('id')} className={`px-2.5 py-1 rounded text-xs font-bold ${lang === 'id' ? 'bg-[#F7F5F0] text-[#183022]' : 'bg-[#234330] text-white'}`}>ID</button>
                  <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded text-xs font-bold ${lang === 'en' ? 'bg-[#F7F5F0] text-[#183022]' : 'bg-[#234330] text-white'}`}>EN</button>
                </div>
              </div>
              <div className="bg-[#14281C] p-2.5 rounded-xl flex flex-col items-center">
                <span className="text-[10px] text-[#7A9C88] font-bold mb-1">Simulasi Role</span>
                <div className="flex gap-1">
                  <button onClick={() => setRole('owner')} className={`px-2 py-1 rounded text-xs font-bold ${role === 'owner' ? 'bg-[#8C7A5B] text-white' : 'bg-[#234330] text-white'}`}>Owner</button>
                  <button onClick={() => setRole('cashier')} className={`px-2 py-1 rounded text-xs font-bold ${role === 'cashier' ? 'bg-[#2D5A41] text-white' : 'bg-[#234330] text-white'}`}>Kasir</button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-3 text-sm font-medium text-[#ECA29B] rounded-xl hover:bg-[#224230]"
            >
              <LogOut className="mr-3 h-5 w-5" />
              {t.nav.logout}
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}