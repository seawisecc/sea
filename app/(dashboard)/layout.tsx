'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useRoleStore } from '@/store/useRoleStore'
import { useSubscriptionStore } from '@/store/useSubscriptionStore'
import Link from 'next/link'
import { 
  Store, LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut, 
  Globe, ShieldCheck, Crown, UserCheck, Wallet, Sparkles, LayoutGrid 
} from 'lucide-react'

// Daftar email yang dianggap superadmin (sementara, hardcoded)
const ADMIN_EMAILS = ['seawise.cc@gmail.com']

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  allowedRoles: ('owner' | 'cashier')[]
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const { lang, setLang, t } = useLanguageStore()
  const { role, setRole } = useRoleStore()
  const { plan, fetchPlan } = useSubscriptionStore()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchPlan()

    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
      }
    }
    checkAdmin()
  }, [])

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
    <div className="min-h-screen bg-[#F0EBE1] flex font-sans text-[#183022] relative overflow-hidden">
      
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-[#2D5A41]/20 to-[#8C7A5B]/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-gradient-to-tl from-[#C26D46]/15 to-[#2D5A41]/15 blur-[100px] pointer-events-none z-0" />

      <aside className="hidden md:flex flex-col w-64 m-4 rounded-3xl bg-[#183022]/80 backdrop-blur-2xl border border-white/10 text-[#F7F5F0] shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] z-10 transition-all duration-300">
        
        <div className="h-20 flex items-center px-6 border-b border-white/10 gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#2D5A41] to-[#183022] rounded-2xl text-[#F7F5F0] shadow-md border border-white/20">
            <Store size={22} strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-[#F7F5F0]">SEA ERP</span>
              <Sparkles size={13} className="text-[#8C7A5B] animate-pulse" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#93B2A1] font-semibold block">Liquid Edition</span>
          </div>
        </div>
        
        <div className="mx-4 mt-4 p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-3 shadow-inner">
          <div className={`p-2 rounded-xl border border-white/10 ${role === 'owner' ? 'bg-gradient-to-br from-[#8C7A5B] to-[#6A5A3C] text-white' : 'bg-gradient-to-br from-[#2D5A41] to-[#183022] text-white'}`}>
            {role === 'owner' ? <Crown size={16} strokeWidth={2} /> : <UserCheck size={16} strokeWidth={2} />}
          </div>
          <div className="overflow-hidden">
            <span className="text-[9px] uppercase tracking-widest text-[#93B2A1] block font-bold">Current Access</span>
            <span className="text-xs font-black text-[#F7F5F0] truncate block">
              {role === 'owner' ? '👑 Owner Plan' : '🛒 Cashier Staff'}
            </span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#7A9C88]">
            {t.nav.mainMenu}
          </div>
          {filteredNav.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-lg border border-white/20 translate-x-1'
                    : 'text-[#A8C3B3] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`mr-3.5 h-5 w-5 transition-transform duration-300 flex-shrink-0 ${isActive ? 'scale-110 text-white drop-shadow' : 'text-[#7A9C88] group-hover:scale-110'}`} strokeWidth={isActive ? 2 : 1.75} />
                <span>{item.name}</span>
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-5 bg-[#8C7A5B] rounded-full shadow-[0_0_10px_#8C7A5B]" />
                )}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div className="px-3 pt-4 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#7A9C88]">
                Superadmin
              </div>
              <Link
                href="/admin"
                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 relative group ${
                  pathname === '/admin'
                    ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-lg border border-white/20 translate-x-1'
                    : 'text-[#A8C3B3] hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutGrid className="mr-3.5 h-5 w-5 flex-shrink-0 text-[#7A9C88] group-hover:scale-110" strokeWidth={1.75} />
                <span>Kelola Tenant</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20 rounded-b-3xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-[#93B2A1] flex items-center gap-1.5"><Globe size={14} strokeWidth={1.75}/> {t.nav.lang}</span>
            <div className="flex bg-white/10 p-1 rounded-xl border border-white/10 backdrop-blur-md">
              <button onClick={() => setLang('id')} className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black transition-all ${lang === 'id' ? 'bg-white text-[#183022] shadow-sm' : 'text-[#A8C3B3] hover:text-white'}`}>ID</button>
              <button onClick={() => setLang('en')} className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black transition-all ${lang === 'en' ? 'bg-white text-[#183022] shadow-sm' : 'text-[#A8C3B3] hover:text-white'}`}>EN</button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-[#93B2A1] flex items-center gap-1.5"><ShieldCheck size={14} strokeWidth={1.75}/> Role</span>
            <div className="flex bg-white/10 p-1 rounded-xl border border-white/10 backdrop-blur-md">
              <button onClick={() => setRole('owner')} className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${role === 'owner' ? 'bg-[#8C7A5B] text-white shadow-sm' : 'text-[#A8C3B3] hover:text-white'}`}>Owner</button>
              <button onClick={() => setRole('cashier')} className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${role === 'cashier' ? 'bg-[#2D5A41] text-white shadow-sm' : 'text-[#A8C3B3] hover:text-white'}`}>Kasir</button>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="flex w-full items-center justify-center px-4 py-2.5 text-xs font-bold text-[#ECA29B] rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
            <LogOut className="mr-2 h-4 w-4" strokeWidth={2} /> {t.nav.logout}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 relative">
        
        <header className="md:hidden bg-white/40 backdrop-blur-xl border-b border-white/40 px-6 h-16 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#183022] text-white rounded-xl shadow-sm">
              <Store size={18} strokeWidth={2} />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#183022]">SEA ERP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#183022] text-white">
              {role} • {plan}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">{children}</main>

        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
          <nav className="bg-[#183022]/85 backdrop-blur-2xl border border-white/20 rounded-full p-2 shadow-[0_10px_35px_rgba(0,0,0,0.35)] flex items-center justify-around">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full transition-all duration-300 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-white/25 to-white/15 text-white shadow-md border border-white/25 scale-105'
                      : 'text-[#A8C3B3] hover:text-white'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.75} className="flex-shrink-0" />
                  {isActive && (
                    <span className="text-[11px] font-extrabold tracking-wide text-white animate-fade-in">
                      {item.name.split(' ')[0]}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

      </div>
    </div>
  )
}