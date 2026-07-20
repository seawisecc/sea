'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Store, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    })

    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    // Selalu tampilkan pesan sukses, bahkan bila email tidak terdaftar.
    // Membedakan keduanya akan membocorkan email mana yang punya akun.
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 relative overflow-hidden text-ink">
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-brand/25 to-accent/20 blur-[140px] pointer-events-none z-0" />

      <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.12)] z-10 p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="p-2.5 bg-ink rounded-2xl text-on-dark shadow-sm">
            <Store size={22} strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight block">SEA ERP</span>
            <span className="text-[10px] uppercase tracking-widest text-muted font-bold">
              Pemulihan Akun
            </span>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-tint rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={30} className="text-brand" />
            </div>
            <h1 className="text-xl font-extrabold mb-2">Cek email Anda</h1>
            <p className="text-sm text-muted leading-relaxed mb-6">
              Kalau <strong className="text-ink">{email}</strong> terdaftar, kami sudah
              mengirim tautan untuk membuat kata sandi baru. Tautannya berlaku
              satu jam.
            </p>
            <p className="text-xs text-muted mb-6">
              Tidak ada di kotak masuk? Coba periksa folder spam.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand hover:text-ink transition-colors"
            >
              <ArrowLeft size={14} /> Kembali ke halaman masuk
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-extrabold mb-1.5">Lupa kata sandi?</h1>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              Masukkan email yang Anda pakai untuk masuk. Kami akan mengirimkan
              tautan untuk membuat kata sandi baru.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-tint-danger border border-danger/30 rounded-xl text-xs text-danger font-bold">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@tokosaya.com"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink hover:bg-ink-hi text-on-dark font-extrabold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-wider"
              >
                {loading ? <Loader2 size={16} className="animate-spin text-accent" /> : 'Kirim Tautan Reset'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-line text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-ink transition-colors"
              >
                <ArrowLeft size={14} /> Kembali ke halaman masuk
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
