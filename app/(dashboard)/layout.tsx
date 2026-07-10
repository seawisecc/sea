'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Store, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType // Ini yang memberitahu TypeScript bahwa 'icon' adalah komponen React
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  // Daftar menu navigasi
  const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Inventaris', href: '/inventory', icon: Package },
  { name: 'Pelanggan', href: '/customers', icon: Users },
]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar untuk Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Store className="text-blue-600 mr-2" size={24} />
          <span className="text-xl font-bold text-gray-900">SEA ERP</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Tombol Logout letaknya di sini, di bawah Navigasi */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-red-500" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header & Hamburger Menu */}
        <header className="md:hidden bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Store className="text-blue-600 mr-2" size={24} />
            <span className="text-lg font-bold text-gray-900">SEA</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Navigation Dropdown (Tampil hanya di HP jika ditekan) */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
               <Link
               key={item.name}
               href={item.href}
               onClick={() => setIsMobileMenuOpen(false)}
               className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
             >
               {item.name}
             </Link>
            ))}
          </div>
        )}

        {/* Area Dinamis untuk Konten Halaman (POS, Inventory, dll) */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}