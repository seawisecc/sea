'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Store, Mail, Lock, Building2, User, ArrowRight, Loader2,
  Sparkles, CheckCircle2, ShieldCheck, HelpCircle
} from 'lucide-react'

export default function UnifiedAuthPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [storeName, setStoreName] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (isRegistering) {
        if (!storeName.trim() || !fullName.trim()) {
          throw new Error('Nama lengkap dan nama usaha wajib diisi.')
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              store_name: storeName,
            },
          },
        })

        if (signUpError) throw signUpError

        setSuccessMsg('Toko berhasil didirikan! Mempersiapkan ruang kerja Anda...')
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 2000)

      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsRegistering(!isRegistering)
    setError(null)
    setSuccessMsg(null)
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans text-ink">
      
      {/* ========================================================= */}
      {/* AMBIENT BACKGROUND GLOW (Pencerah Kaca Liquid Glass) */}
      {/* ========================================================= */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-brand/25 to-accent/20 blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-expense/20 to-brand/20 blur-[120px] pointer-events-none z-0" />

      {/* ========================================================= */}
      {/* MAIN SPLIT GLASS CONTAINER */}
      {/* ========================================================= */}
      <div className="w-full max-w-4xl bg-white/40 backdrop-blur-2xl border border-white/40 rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.15)] z-10 overflow-hidden flex flex-col md:flex-row transition-all duration-500 min-h-[560px]">
        
        {/* --------------------------------------------------------- */}
        {/* KOLOM KIRI: BANNER & SWITCHER (Deep Emerald Glass) */}
        {/* --------------------------------------------------------- */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-ink via-ink-hi to-ink text-on-dark p-8 md:p-10 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          {/* Logo Brand */}
          <div className="flex items-center gap-3 z-10">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm">
              <Store size={24} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight block">SEA ERP</span>
              <span className="text-[10px] uppercase tracking-widest text-on-dark-3 font-bold block">SaaS Edition</span>
            </div>
          </div>

          {/* Konten Dinamis Banner */}
          <div className="my-8 md:my-auto z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-on-dark-2 backdrop-blur-md">
              <Sparkles size={14} className="text-accent" />
              <span>{isRegistering ? 'Enterprise POS System' : 'Welcome Back, Owner'}</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              {isRegistering 
                ? 'Kelola Bisnis Ritel & Jasa Tanpa Batas.' 
                : 'Pantau Performa & Arus Kas Real-Time.'}
            </h2>
            
            <p className="text-xs md:text-sm text-on-dark-2 leading-relaxed font-medium">
              {isRegistering
                ? 'Daftarkan bisnis Anda sekarang untuk membuka seluruh fitur POS, kontrol inventaris, dan laporan laba rugi otomatis.'
                : 'Masuk kembali ke dasbor kontrol Anda untuk melanjutkan operasional dan analisis finansial harian.'}
            </p>
          </div>

          {/* Switch Mode Button */}
          <div className="z-10 pt-6 border-t border-white/10">
            <p className="text-xs text-on-dark-3 mb-2 font-medium">
              {isRegistering ? 'Sudah memiliki akun toko?' : 'Belum mendaftarkan bisnis Anda?'}
            </p>
            <button
              type="button"
              onClick={toggleMode}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/20 font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{isRegistering ? 'Sign In ke Sistem Sekarang' : 'Buat Akun Bisnis Baru'}</span>
              <ArrowRight size={15} strokeWidth={2} />
            </button>

            <Link
              href="/kenapa"
              className="mt-3 w-full py-3 px-4 rounded-xl border border-white/15 hover:bg-white/10 font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 text-on-dark-2 hover:text-white"
            >
              <HelpCircle size={15} strokeWidth={2} />
              <span>Kenapa Harus Pakai SEA ERP?</span>
            </Link>
          </div>

        </div>

        {/* --------------------------------------------------------- */}
        {/* KOLOM KANAN: INTERACTIVE FORM (Light Liquid Glass) */}
        {/* --------------------------------------------------------- */}
        <div className="w-full md:w-7/12 bg-white/60 backdrop-blur-xl p-8 md:p-12 flex flex-col justify-center relative">
          
          <div className="max-w-sm mx-auto w-full">
            
            {/* Header Form */}
            <div className="mb-6">
              <h3 className="text-2xl font-black tracking-tight text-ink">
                {isRegistering ? 'Create New Account' : 'Sign In to System'}
              </h3>
              <p className="text-xs text-muted font-medium mt-1">
                {isRegistering 
                  ? 'Lengkapi data di bawah untuk mendirikan tenant baru.' 
                  : 'Masukkan kredensial email bisnis Anda yang terdaftar.'}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="mb-5 p-3.5 bg-tint-danger border border-danger/30 rounded-xl text-xs text-danger font-bold flex items-center gap-2 animate-shake">
                <span>⚠️ {error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-4 bg-tint border border-brand/30 rounded-xl text-xs text-brand font-bold flex items-center gap-2.5 animate-fade-in">
                <CheckCircle2 size={18} className="flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* INPUT KHUSUS REGISTER: Nama Lengkap & Nama Usaha */}
              {isRegistering && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">
                      Full Name (Nama Pemilik)
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" strokeWidth={2} />
                      <input
                        type="text"
                        required={isRegistering}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Contoh: Gemini Assistant"
                        className="w-full bg-white/80 border border-line rounded-xl px-10 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">
                      Business / Company Name
                    </label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" strokeWidth={2} />
                      <input
                        type="text"
                        required={isRegistering}
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Contoh: Kopi Kenangan Bali"
                        className="w-full bg-white/80 border border-line rounded-xl px-10 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* INPUT STANDAR: Email */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">
                  Business Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" strokeWidth={2} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@perusahaan.com"
                    className="w-full bg-white/80 border border-line rounded-xl px-10 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-bold"
                  />
                </div>
              </div>

              {/* INPUT STANDAR: Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted">
                    Password
                  </label>
                  {!isRegistering && (
                    <Link href="/reset-password" className="text-[10px] font-bold text-brand hover:underline">
                      Lupa password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" strokeWidth={2} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-white/80 border border-line rounded-xl px-10 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-bold"
                  />
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-ink hover:bg-ink-hi active:scale-[0.99] text-on-dark font-extrabold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-xs tracking-wider uppercase"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-accent" />
                    <span>{isRegistering ? 'Mendaftarkan Tenant...' : 'Memverifikasi Akses...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isRegistering ? 'Create Account Now' : 'Sign In to System'}</span>
                    <ArrowRight size={16} strokeWidth={2} />
                  </>
                )}
              </button>
            </form>

            {/* Security Badge Footer */}
            <div className="mt-8 pt-6 border-t border-line flex items-center justify-center gap-2 text-[11px] font-bold text-muted">
              <ShieldCheck size={16} className="text-brand" />
              <span>256-Bit SSL Encrypted & Multi-Tenant Enterprise Architecture</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}