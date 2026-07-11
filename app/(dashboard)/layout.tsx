'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useRoleStore } from '@/store/useRoleStore'
import { useSubscriptionStore } from '@/store/useSubscriptionStore'
import Link from 'next/link'
import { 
  Store, LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut, 
  Menu, X, Globe, ShieldCheck, Crown, UserCheck, Wallet, Award 
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
  const { plan, setPlan } = useSubscriptionStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navigation: NavItem[] = [
    { name: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard, allowedRoles: ['owner'] },
    { name: t.nav.pos, href: '/pos', icon: ShoppingCart, allowedRoles: ['owner', 'cashier'] },
    { name: t.nav.inventory, href: '/inventory', icon: Package, allowedRoles: ['owner', 'cashier'] },
    { name: t.nav.customers, href: '/customers', icon: Users, allowedRoles: ['owner', 'cashier'] },
    { name: t.nav.expenses, href: '/expenses', icon: Wallet, allowedRoles: ['owner', 'cashier'] },
    { name: t.nav.settings, href: '/settings', icon: Settings, allowedRoles: ['owner'] },
  ]

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
        
        {/* Banner Role */}
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
        
        {/* Navigasi */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#7A9C88]">
            {t.nav.mainMenu}
          </div>
          {filteredNav.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href} className={`flex items-center px-3.5 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive ? 'bg-[#2D5A41] text-[#FFFFFF] shadow-md font-semibold translate-x-1' : 'text-[#A8C3B3] hover:bg-[#224230] hover:text-[#FFFFFF]'}`}>
                <Icon className={`mr-3.5 h-5 w-5 ${isActive ? 'text-[#E2F0E8]' : 'text-[#7A9C88]'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Controllers */}
        <div className="p-4 border-t border-[#234330]/60 bg-[#14281C] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#93B2A1] flex items-center gap-1.5"><Globe size={14}/> Lang</span>
            <div className="flex bg-[#234330] p-0.5 rounded-lg border border-[#2D5A41]">
              <button onClick={() => setLang('id')} className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${lang === 'id' ? 'bg-[#F7F5F0] text-[#183022]' : 'text-[#A8C3B3]'}`}>ID</button>
              <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${lang === 'en' ? 'bg-[#F7F5F0] text-[#183022]' : 'text-[#A8C3B3]'}`}>EN</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#93B2A1] flex items-center gap-1.5"><ShieldCheck size={14}/> Role</span>
            <div className="flex bg-[#234330] p-0.5 rounded-lg border border-[#2D5A41]">
              <button onClick={() => setRole('owner')} className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${role === 'owner' ? 'bg-[#8C7A5B] text-white' : 'text-[#A8C3B3]'}`}>Owner</button>
              <button onClick={() => setRole('cashier')} className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${role === 'cashier' ? 'bg-[#2D5A41] text-white' : 'text-[#A8C3B3]'}`}>Kasir</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#93B2A1] flex items-center gap-1.5"><Award size={14}/> Plan</span>
            <div className="flex bg-[#234330] p-0.5 rounded-lg border border-[#2D5A41]">
              <button onClick={() => setPlan('free')} className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${plan === 'free' ? 'bg-[#8C7A5B] text-white' : 'text-[#A8C3B3]'}`}>Free</button>
              <button onClick={() => setPlan('pro')} className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${plan === 'pro' ? 'bg-[#2D5A41] text-white' : 'text-[#A8C3B3]'}`}>Pro</button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#234330]/60">
          <button onClick={handleLogout} className="flex w-full items-center px-3.5 py-3 text-sm font-medium text-[#ECA29B] rounded-xl hover:bg-[#224230] transition-colors">
            <LogOut className="mr-3.5 h-5 w-5" /> {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-[#183022] text-white px-4 h-16 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Store className="text-[#A8C3B3]" size={24} />
            <span className="font-bold text-lg text-[#F7F5F0]">SEA ERP</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-[#224230] rounded-lg">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#183022] text-[#E8EFEA] px-4 pt-2 pb-6 space-y-2">
            {/* Navigasi Mobile ... */}
          </div>
        )}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}