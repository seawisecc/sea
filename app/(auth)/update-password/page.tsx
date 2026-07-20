'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Store, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)

  // Supabase menukar tautan dari email menjadi sesi sementara. Tanpa sesi itu,
  // halaman ini dibuka langsung dan tidak bisa dipakai.
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSessionReady(!!session)
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setSessionReady(true)
    })

    check()
    return () => sub.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak sama.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 relative overflow-hidden text-ink">
      <div className="fixed bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-brand/20 to-accent/20 blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.12)] z-10 p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="p-2.5 bg-ink rounded-2xl text-on-dark shadow-sm">
            <Store size={22} strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight block">SEA ERP</span>
            <span className="text-[10px] uppercase tracking-widest text-muted font-bold">
              Kata Sandi Baru
            </span>
          </div>
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-tint rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={30} className="text-brand" />
            </div>
            <h1 className="text-xl font-extrabold mb-2">Kata sandi diperbarui</h1>
            <p className="text-sm text-muted">Mengalihkan Anda ke dashboard...</p>
          </div>
        ) : sessionReady === false ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-tint-danger rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={30} className="text-danger" />
            </div>
            <h1 className="text-xl font-extrabold mb-2">Tautan tidak berlaku</h1>
            <p className="text-sm text-muted leading-relaxed mb-6">
              Tautan reset sudah kedaluwarsa atau pernah dipakai. Silakan minta
              tautan baru.
            </p>
            <Link
              href="/reset-password"
              className="inline-block bg-ink hover:bg-ink-hi text-on-dark px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              Minta Tautan Baru
            </Link>
          </div>
        ) : sessionReady === null ? (
          <div className="py-12 flex justify-center">
            <Loader2 size={28} className="animate-spin text-brand" />
          </div>
        ) : (
          <>
            <h1 className="text-xl font-extrabold mb-1.5">Buat kata sandi baru</h1>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              Pilih kata sandi yang belum pernah Anda pakai di layanan lain.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-tint-danger border border-danger/30 rounded-xl text-xs text-danger font-bold">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1.5">
                  Ulangi Kata Sandi
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Ketik ulang untuk memastikan"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink hover:bg-ink-hi text-on-dark font-extrabold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-wider"
              >
                {loading ? <Loader2 size={16} className="animate-spin text-accent" /> : 'Simpan Kata Sandi'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
