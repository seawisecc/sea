'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLanguageStore } from '@/store/useLanguageStore'
import { Store, Mail, Lock, User, Building, ArrowRight, Loader2, CheckCircle2, AlertCircle, Globe } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')

  const router = useRouter()
  const supabase = createClient()
  
  // Panggil Engine Bahasa
  const { lang, setLang, t } = useLanguageStore()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setErrorMessage(error.message)
    else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName, company_name: companyName } }
    })
    setLoading(false)
    if (error) setErrorMessage(error.message)
    else {
      setSuccessMessage('Pendaftaran berhasil! Silakan periksa email Anda atau langsung masuk.')
      setIsSignUp(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-4 font-sans text-[#183022] relative">
      
      {/* FLOATING LANGUAGE TOGGLE (POJOK KANAN ATAS) */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-[#FFFFFF] border border-[#EAE5DA] p-1.5 rounded-2xl shadow-sm">
        <Globe size={18} className="text-[#2D5A41] ml-1.5" />
        <div className="flex bg-[#F0EBE1] p-1 rounded-xl">
          <button
            onClick={() => setLang('id')}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${lang === 'id' ? 'bg-[#183022] text-[#F7F5F0] shadow' : 'text-[#6B8275] hover:text-[#183022]'}`}
          >
            ID
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${lang === 'en' ? 'bg-[#183022] text-[#F7F5F0] shadow' : 'text-[#6B8275] hover:text-[#183022]'}`}
          >
            EN
          </button>
        </div>
      </div>

      {/* DESKTOP LAYOUT (SLIDING OVERLAY ANIMATION) */}
      <div className="hidden md:flex relative w-full max-w-4xl h-[640px] bg-[#FFFFFF] rounded-3xl shadow-2xl border border-[#EAE5DA] overflow-hidden">
        
        {/* PANEL KIRI: SIGN IN */}
        <div className={`absolute top-0 left-0 w-1/2 h-full p-10 flex flex-col justify-center transition-all duration-700 ease-in-out ${isSignUp ? 'translate-x-full opacity-0 pointer-events-none z-10' : 'translate-x-0 opacity-100 z-20'}`}>
          <div className="max-w-xs mx-auto w-full space-y-6">
            <div className="flex items-center gap-2 text-[#2D5A41]">
              <Store size={26} />
              <span className="font-extrabold text-xl tracking-tight text-[#183022]">SEA ERP</span>
            </div>

            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#183022]">{t.auth.welcome}</h2>
              <p className="text-sm text-[#6B8275] mt-1">{t.auth.welcomeSub}</p>
            </div>

            {errorMessage && !isSignUp && (
              <div className="p-3 bg-[#FDF2F1] border border-[#D37A74] rounded-xl text-xs text-[#B54D46] flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-[#E8F3ED] border border-[#B8D8C8] rounded-xl text-xs text-[#2D5A41] flex items-center gap-2">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">{t.auth.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4B5AC]" size={18} />
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@perusahaan.com" className="w-full pl-10 pr-4 py-3 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-sm font-medium focus:outline-none focus:border-[#2D5A41]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">{t.auth.password}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4B5AC]" size={18} />
                  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-sm font-medium focus:outline-none focus:border-[#2D5A41]" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full mt-2 bg-[#183022] hover:bg-[#234330] text-[#F7F5F0] font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><span>{t.auth.signIn}</span><ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        </div>

        {/* PANEL KANAN: SIGN UP */}
        <div className={`absolute top-0 left-0 w-1/2 h-full p-10 flex flex-col justify-center transition-all duration-700 ease-in-out ${isSignUp ? 'translate-x-full opacity-100 z-20' : 'translate-x-0 opacity-0 pointer-events-none z-10'}`}>
          <div className="max-w-xs mx-auto w-full space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#183022]">{t.auth.signUp}</h2>
              <p className="text-xs text-[#6B8275] mt-1">{t.auth.noAccountSub}</p>
            </div>

            {errorMessage && isSignUp && (
              <div className="p-3 bg-[#FDF2F1] border border-[#D37A74] rounded-xl text-xs text-[#B54D46] flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B8275] mb-1">{t.auth.fullName}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4B5AC]" size={16} />
                  <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama" className="w-full pl-9 pr-3 py-2.5 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D5A41]" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B8275] mb-1">{t.auth.companyName}</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4B5AC]" size={16} />
                  <input required type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nama Usaha" className="w-full pl-9 pr-3 py-2.5 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D5A41]" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B8275] mb-1">{t.auth.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4B5AC]" size={16} />
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@perusahaan.com" className="w-full pl-9 pr-3 py-2.5 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D5A41]" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B8275] mb-1">{t.auth.password}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4B5AC]" size={16} />
                  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" className="w-full pl-9 pr-3 py-2.5 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D5A41]" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full mt-3 bg-[#183022] hover:bg-[#234330] text-[#F7F5F0] font-bold py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <span>{t.auth.createAccount}</span>}
              </button>
            </form>
          </div>
        </div>

        {/* SLIDING OVERLAY PANEL (HIJAU ZAMRUD) */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-30 shadow-2xl ${isSignUp ? '-translate-x-full' : 'translate-x-0'}`}>
          <div className="w-full h-full bg-[#183022] text-[#F7F5F0] relative flex flex-col justify-center items-center p-10 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2D5A41]/50 via-transparent to-[#102218] pointer-events-none" />
            
            <div className={`transition-all duration-500 absolute px-10 flex flex-col items-center justify-center ${isSignUp ? 'opacity-0 translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-[#93B2A1] mb-2">SaaS Edition</span>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3">{t.auth.noAccount}</h2>
              <p className="text-sm text-[#A8C3B3] mb-8 leading-relaxed max-w-xs">{t.auth.noAccountSub}</p>
              <button onClick={() => { setIsSignUp(true); setErrorMessage(null); }} className="border-2 border-[#F7F5F0] text-[#F7F5F0] hover:bg-[#F7F5F0] hover:text-[#183022] font-extrabold py-3 px-8 rounded-2xl transition-all shadow-lg text-sm">
                {t.auth.signUp}
              </button>
            </div>

            <div className={`transition-all duration-500 absolute px-10 flex flex-col items-center justify-center ${!isSignUp ? 'opacity-0 -translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-[#93B2A1] mb-2">SaaS Edition</span>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3">{t.auth.hasAccount}</h2>
              <p className="text-sm text-[#A8C3B3] mb-8 leading-relaxed max-w-xs">{t.auth.hasAccountSub}</p>
              <button onClick={() => { setIsSignUp(false); setErrorMessage(null); }} className="border-2 border-[#F7F5F0] text-[#F7F5F0] hover:bg-[#F7F5F0] hover:text-[#183022] font-extrabold py-3 px-8 rounded-2xl transition-all shadow-lg text-sm">
                {t.auth.signIn}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT (VERTICAL TAB) */}
      <div className="md:hidden w-full max-w-md bg-[#FFFFFF] rounded-3xl shadow-xl border border-[#EAE5DA] p-6 overflow-hidden relative mt-12">
        <div className="flex items-center justify-center gap-2 text-[#2D5A41] mb-6">
          <Store size={28} />
          <span className="font-extrabold text-2xl tracking-tight text-[#183022]">SEA ERP</span>
        </div>

        <div className="flex bg-[#F0EBE1] p-1 rounded-2xl mb-6">
          <button onClick={() => { setIsSignUp(false); setErrorMessage(null); }} className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${!isSignUp ? 'bg-[#183022] text-[#F7F5F0] shadow-md' : 'text-[#6B8275]'}`}>
            {t.auth.signIn}
          </button>
          <button onClick={() => { setIsSignUp(true); setErrorMessage(null); }} className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${isSignUp ? 'bg-[#183022] text-[#F7F5F0] shadow-md' : 'text-[#6B8275]'}`}>
            {t.auth.signUp}
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 bg-[#FDF2F1] border border-[#D37A74] rounded-xl text-xs text-[#B54D46] flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isSignUp ? (
          <form onSubmit={handleSignIn} className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">{t.auth.email}</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@perusahaan.com" className="w-full px-4 py-3 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-sm font-medium focus:outline-none focus:border-[#2D5A41]" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1.5">{t.auth.password}</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-sm font-medium focus:outline-none focus:border-[#2D5A41]" />
            </div>
            <button type="submit" disabled={loading} className="w-full pt-1 bg-[#183022] text-[#F7F5F0] font-bold py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <span>{t.auth.signIn}</span>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-3 animate-fade-in">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1">{t.auth.fullName}</label>
              <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Name" className="w-full px-3 py-2.5 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D5A41]" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1">{t.auth.companyName}</label>
              <input required type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name" className="w-full px-3 py-2.5 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D5A41]" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1">{t.auth.email}</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@perusahaan.com" className="w-full px-3 py-2.5 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D5A41]" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B8275] mb-1">{t.auth.password}</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" className="w-full px-3 py-2.5 bg-[#FCFBF9] border border-[#EAE5DA] rounded-xl text-xs font-medium focus:outline-none focus:border-[#2D5A41]" />
            </div>
            <button type="submit" disabled={loading} className="w-full mt-2 bg-[#183022] text-[#F7F5F0] font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center text-xs">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <span>{t.auth.createAccount}</span>}
            </button>
          </form>
        )}
      </div>

    </div>
  )
}