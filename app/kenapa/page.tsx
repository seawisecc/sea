'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Store, ArrowRight, Check, ShoppingCart, Package, Users, Wallet,
  Receipt, LayoutDashboard, ShieldCheck, Printer, MessageCircle,
  Languages, Sparkles, TrendingUp, Crown, Search, Banknote
} from 'lucide-react'

const KONTAK_EMAIL = 'seawise.cc@gmail.com'
const KONTAK_WA_TAMPIL = '0812-3759-7759'
const KONTAK_WA_INTL = '6281237597759' // format internasional untuk tautan wa.me

/** Membuat tautan WhatsApp dengan pesan yang sudah terisi. */
const waLink = (pesan: string) =>
  `https://wa.me/${KONTAK_WA_INTL}?text=${encodeURIComponent(pesan)}`

const PESAN_LANGGANAN =
  'Halo Seawise, saya tertarik berlangganan SEA ERP Pro.\n\n' +
  'Nama toko: \n' +
  'Jenis usaha: \n' +
  'Jumlah produk kira-kira: '

const PESAN_TANYA = 'Halo Seawise, saya mau tanya soal SEA ERP.'

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(n).replace(/\s+/g, '')

const HARGA_BULANAN = 50_000
const HARGA_TAHUNAN = 500_000
const PER_HARI = Math.round(HARGA_TAHUNAN / 365)

export default function KenapaPage() {
  const [tagihan, setTagihan] = useState<'tahunan' | 'bulanan'>('tahunan')

  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      {/* ================= NAV ================= */}
      <header className="sticky top-0 z-50 bg-paper/80 backdrop-blur-xl border-b border-line/70">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-ink rounded-xl text-on-dark">
              <Store size={17} strokeWidth={2} />
            </div>
            <div className="leading-none">
              <span className="text-sm font-extrabold tracking-tight block">SEA ERP</span>
              <span className="text-[9px] uppercase tracking-widest text-muted font-bold">
                Retail &amp; Service Edition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#harga"
              className="hidden sm:inline-block px-4 py-2 text-xs font-bold text-muted hover:text-ink transition-colors"
            >
              Harga
            </a>
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-ink text-on-dark text-xs font-bold hover:bg-ink-hi transition-colors"
            >
              Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] max-w-3xl max-h-3xl rounded-full bg-gradient-to-br from-brand/15 to-accent/25 blur-[140px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-line text-[11px] font-bold text-muted mb-7">
            <Sparkles size={12} className="text-accent-ink" />
            Kasir &amp; Pembukuan untuk UMKM Indonesia
          </span>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            Jualan tercatat.
            <br />
            <span className="text-muted">Untung terlihat.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted leading-relaxed max-w-2xl mx-auto mb-9">
            Kasir, stok, pengeluaran, dan laporan laba rugi dalam satu aplikasi.
            Buka di HP atau laptop, tanpa instal apa pun.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-ink text-on-dark text-sm font-bold hover:bg-ink-hi transition-all shadow-lg hover:shadow-xl"
            >
              Coba Sekarang <ArrowRight size={16} />
            </Link>
            <a
              href="#harga"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white border border-line text-sm font-bold text-ink hover:border-brand transition-all"
            >
              Lihat Harga
            </a>
          </div>

          <p className="text-xs text-muted mt-6">
            Mulai gratis · Tanpa kartu kredit
          </p>
        </div>

        {/* Cuplikan tampilan aplikasi */}
        <div className="max-w-5xl mx-auto px-6 pb-20">
          <div className="rounded-[24px] border border-line bg-white shadow-[0_30px_70px_rgba(0,0,102,0.10)] overflow-hidden">
            <div className="flex">
              {/* Sidebar mini */}
              <div className="hidden sm:block w-44 bg-ink p-4 flex-shrink-0">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-brand rounded-lg text-on-dark">
                    <Store size={13} />
                  </div>
                  <span className="text-[11px] font-extrabold text-on-dark truncate">
                    Toko Berkah
                  </span>
                </div>
                {[
                  { icon: LayoutDashboard, label: 'Dashboard', active: true },
                  { icon: ShoppingCart, label: 'Kasir' },
                  { icon: Package, label: 'Inventaris' },
                  { icon: Receipt, label: 'Riwayat' },
                  { icon: Wallet, label: 'Pengeluaran' }
                ].map(({ icon: Icon, label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg mb-1 ${
                      active ? 'bg-white/15 text-white' : 'text-on-dark-2'
                    }`}
                  >
                    <Icon size={13} />
                    <span className="text-[10px] font-bold">{label}</span>
                  </div>
                ))}
              </div>

              {/* Konten mini */}
              <div className="flex-1 p-5 bg-paper min-w-0">
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {[
                    { l: 'OMZET', v: 'Rp12,4jt', c: 'text-ink' },
                    { l: 'PENGELUARAN', v: 'Rp3,1jt', c: 'text-expense' },
                    { l: 'LABA BERSIH', v: 'Rp9,2jt', c: 'text-brand' }
                  ].map((s) => (
                    <div key={s.l} className="bg-white border border-line rounded-xl p-3">
                      <p className="text-[8px] font-bold tracking-wider text-muted">{s.l}</p>
                      <p className={`text-xs sm:text-sm font-extrabold mt-1 ${s.c}`}>{s.v}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-line rounded-xl p-4">
                  <p className="text-[9px] font-bold text-muted mb-3">PENJUALAN 14 HARI</p>
                  <div className="flex items-end gap-1 h-20">
                    {[35, 52, 28, 64, 45, 78, 40, 58, 88, 47, 62, 35, 71, 95].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-sm ${i === 13 ? 'bg-accent-ink' : 'bg-brand'}`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MASALAH ================= */}
      <section className="bg-white border-y border-line py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Buku tulis tidak bisa bilang<br className="hidden sm:block" /> kamu untung atau rugi.
            </h2>
            <p className="text-muted max-w-xl mx-auto leading-relaxed">
              Tiga hal yang diam-diam menggerus keuntungan toko kecil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                t: 'Stok habis tanpa sadar',
                d: 'Barang laris kosong berhari-hari karena tidak ada yang memantau. Pelanggan pindah ke sebelah.'
              },
              {
                t: 'Omzet ramai, uang tipis',
                d: 'Penjualan terasa banyak tapi pengeluaran tidak pernah dicatat, jadi laba sebenarnya tidak pernah ketahuan.'
              },
              {
                t: 'Nota hilang, selisih kas',
                d: 'Pelanggan komplain kemarin beli apa, dan tidak ada catatan yang bisa dibuka lagi.'
              }
            ].map((item) => (
              <div key={item.t} className="bg-paper border border-line rounded-2xl p-6">
                <h3 className="font-extrabold text-base mb-2">{item.t}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FITUR UTAMA ================= */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 space-y-24">
          {/* Kasir */}
          <FeatureBlock
            eyebrow="KASIR (POS)"
            title="Transaksi selesai sebelum antrean panjang."
            body="Cari produk dengan mengetik namanya, atur jumlah lewat tombol tambah-kurang, masukkan diskon bila perlu. Untuk pembayaran tunai, ketik uang yang diterima dan kembaliannya langsung dihitung — lengkap dengan tombol pecahan 5rb sampai 100rb supaya kasir tidak perlu menghitung di kepala."
            visual={
              <div className="bg-white border border-line rounded-2xl p-5 space-y-3">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                  <div className="pl-8 pr-3 py-2 bg-paper-2 border border-line rounded-lg text-[11px] text-faint">
                    Cari nama produk...
                  </div>
                </div>
                <div className="flex items-center justify-between bg-paper-2 border border-line rounded-lg p-2.5">
                  <span className="text-[11px] font-bold">Kopi Arabica 250g</span>
                  <div className="flex items-center bg-white border border-line rounded-lg text-[11px] font-black">
                    <span className="px-2 py-1 text-muted">−</span>
                    <span className="px-2.5 py-1 border-x border-line">3</span>
                    <span className="px-2 py-1 text-muted">+</span>
                  </div>
                </div>
                <div className="bg-paper-2 border border-line rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted font-bold flex items-center gap-1.5">
                      <Banknote size={12} /> Uang Diterima
                    </span>
                    <span className="font-black">Rp250.000</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-line">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                      Kembalian
                    </span>
                    <span className="font-black text-brand">Rp25.000</span>
                  </div>
                </div>
              </div>
            }
          />

          {/* Dashboard */}
          <FeatureBlock
            reverse
            eyebrow="DASHBOARD"
            title="Untung rugi, bukan cuma omzet."
            body="Grafik penjualan 14 hari, barang terlaris, dan omzet hari ini dalam sekali pandang. Pengeluaran ikut dihitung, jadi angka yang kamu lihat adalah laba bersih — bukan sekadar total uang masuk. Ganti periode ke hari ini, 7 hari, 30 hari, atau sepanjang masa."
            visual={
              <div className="bg-white border border-line rounded-2xl p-5">
                <div className="flex gap-2 mb-4">
                  {['Hari Ini', '7 Hari', '30 Hari'].map((p, i) => (
                    <span
                      key={p}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        i === 1 ? 'bg-ink text-on-dark' : 'text-muted bg-paper-2'
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
                <div className="space-y-2.5">
                  {[
                    { n: 'Kopi Arabica 250g', q: 160, w: 100 },
                    { n: 'Kaos Polos Cotton', q: 84, w: 52 },
                    { n: 'Gunting Rambut', q: 41, w: 26 }
                  ].map((p, i) => (
                    <div key={p.n} className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black ${
                          i === 0 ? 'bg-accent text-ink' : 'bg-tint text-brand'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate">{p.n}</p>
                        <div className="h-1.5 bg-paper rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-brand" style={{ width: `${p.w}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] font-black">{p.q}</span>
                    </div>
                  ))}
                </div>
              </div>
            }
          />

          {/* Struk */}
          <FeatureBlock
            eyebrow="STRUK &amp; RIWAYAT"
            title="Nota kemarin, ketemu dalam hitungan detik."
            body="Cetak struk termal 80mm dengan nama tokomu sendiri, atau kirim langsung ke WhatsApp pelanggan. Semua nota tersimpan dan bisa dicari lewat nomor atau nama pelanggan, lalu dicetak ulang kapan pun diminta."
            visual={
              <div className="bg-white border border-line rounded-2xl p-5">
                <div className="bg-paper-2 border border-dashed border-line rounded-lg p-4 font-mono text-[10px] leading-relaxed">
                  <p className="text-center font-bold tracking-wider">TOKO BERKAH</p>
                  <p className="text-center text-muted">Nota Pembelian</p>
                  <p className="text-muted my-1.5">------------------------</p>
                  <div className="flex justify-between">
                    <span>3 x Kopi Arabica</span><span>225.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1 x Kaos Polos</span><span>85.000</span>
                  </div>
                  <p className="text-muted my-1.5">------------------------</p>
                  <div className="flex justify-between font-bold">
                    <span>TOTAL</span><span>310.000</span>
                  </div>
                  <div className="flex justify-between"><span>TUNAI</span><span>350.000</span></div>
                  <div className="flex justify-between font-bold"><span>KEMBALI</span><span>40.000</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-ink text-on-dark rounded-lg py-2 text-[10px] font-bold flex items-center justify-center gap-1.5">
                    <Printer size={12} /> Cetak
                  </div>
                  <div className="bg-brand text-on-dark rounded-lg py-2 text-[10px] font-bold flex items-center justify-center gap-1.5">
                    <MessageCircle size={12} /> Kirim WA
                  </div>
                </div>
              </div>
            }
          />

          {/* Keamanan */}
          <FeatureBlock
            reverse
            eyebrow="KASIR &amp; HAK AKSES"
            title="Kasir bisa jualan, tapi tidak bisa lihat semuanya."
            body="Buat akun untuk pegawaimu dari menu Pengaturan. Kasir bisa melayani transaksi dan melihat stok, tapi laporan keuangan dan pengeluaran hanya untuk pemilik. Pembatasannya dipasang di level database — bukan sekadar menu yang disembunyikan."
            visual={
              <div className="bg-white border border-line rounded-2xl p-5 space-y-3">
                {[
                  { r: 'Owner', i: Crown, items: ['Dashboard & laba rugi', 'Pengeluaran', 'Kelola akun kasir'], full: true },
                  { r: 'Kasir', i: Users, items: ['Kasir & riwayat nota', 'Lihat stok'], full: false }
                ].map(({ r, i: Icon, items, full }) => (
                  <div key={r} className="border border-line rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className={`p-1.5 rounded-lg ${full ? 'bg-accent text-ink' : 'bg-tint text-brand'}`}>
                        <Icon size={12} />
                      </div>
                      <span className="text-[11px] font-extrabold">{r}</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((it) => (
                        <div key={it} className="flex items-center gap-1.5 text-[10px] text-muted">
                          <Check size={11} className="text-brand flex-shrink-0" /> {it}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </section>

      {/* ================= DAFTAR FITUR ================= */}
      <section className="bg-white border-y border-line py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Semua yang toko kamu butuhkan.
            </h2>
            <p className="text-muted">Satu langganan, seluruh operasional tercakup.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-7">
            {[
              { i: ShoppingCart, t: 'Kasir (POS)', d: 'Pencarian produk, diskon, tunai/QRIS/transfer, hitung kembalian.' },
              { i: Package, t: 'Inventaris', d: 'Barang dan jasa, stok otomatis berkurang tiap transaksi.' },
              { i: LayoutDashboard, t: 'Dashboard Analitik', d: 'Grafik penjualan, terlaris, laba bersih, filter periode.' },
              { i: Receipt, t: 'Riwayat Transaksi', d: 'Cari nota lama, lihat rincian, cetak ulang, kirim WA.' },
              { i: Wallet, t: 'Catatan Pengeluaran', d: 'Biaya operasional dan pengadaan stok, khusus pemilik.' },
              { i: Users, t: 'Database Pelanggan', d: 'Simpan kontak, muncul otomatis sebagai saran di kasir.' },
              { i: Printer, t: 'Struk Termal 80mm', d: 'Kop struk memakai nama tokomu sendiri.' },
              { i: MessageCircle, t: 'Kirim Nota via WA', d: 'Struk langsung ke WhatsApp pelanggan, tanpa aplikasi lain.' },
              { i: TrendingUp, t: 'Peringatan Stok Menipis', d: 'Tahu barang mana yang harus dipesan sebelum kehabisan.' },
              { i: ShieldCheck, t: 'Data Terpisah per Toko', d: 'Tiap toko terisolasi di level database.' },
              { i: Languages, t: 'Dwibahasa ID / EN', d: 'Ganti bahasa seluruh aplikasi seketika.' },
              { i: Crown, t: 'Hak Akses Owner & Kasir', d: 'Batasi apa yang bisa dilihat pegawai.' }
            ].map(({ i: Icon, t, d }) => (
              <div key={t}>
                <div className="p-2 bg-tint rounded-xl text-brand w-fit mb-3">
                  <Icon size={17} />
                </div>
                <h3 className="font-extrabold text-sm mb-1">{t}</h3>
                <p className="text-xs text-muted leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HARGA ================= */}
      <section id="harga" className="py-20 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted">Harga</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-3 mb-4">
              Hanya {rupiah(PER_HARI)}/hari
            </h2>
            <p className="text-muted max-w-lg mx-auto leading-relaxed">
              Kurang dari segelas es teh. Untuk sistem yang mencatat setiap
              rupiah yang masuk dan keluar dari tokomu.
            </p>
          </div>

          {/* Pemilih siklus */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white border border-line p-1 rounded-full">
              <button
                onClick={() => setTagihan('bulanan')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  tagihan === 'bulanan' ? 'bg-ink text-on-dark' : 'text-muted hover:text-ink'
                }`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setTagihan('tahunan')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tagihan === 'tahunan' ? 'bg-ink text-on-dark' : 'text-muted hover:text-ink'
                }`}
              >
                Tahunan
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  tagihan === 'tahunan' ? 'bg-accent text-ink' : 'bg-tint-accent text-accent-ink'
                }`}>
                  HEMAT 2 BULAN
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Gratis */}
            <div className="bg-white border border-line rounded-3xl p-7">
              <h3 className="font-extrabold text-lg mb-1">Gratis</h3>
              <p className="text-xs text-muted mb-5">Untuk mencoba dan toko yang baru mulai.</p>
              <p className="text-3xl font-black mb-6">Rp0</p>
              <ul className="space-y-2.5">
                {[
                  'Kasir & cetak struk',
                  'Maksimal 20 produk',
                  'Inventaris & pelanggan',
                  'Riwayat transaksi'
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-muted">
                    <Check size={14} className="text-brand mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-7 block text-center py-3 rounded-xl border border-line text-xs font-bold hover:border-brand transition-colors"
              >
                Mulai Gratis
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-ink text-on-dark rounded-3xl p-7 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,102,0.25)]">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-lg">Pro</h3>
                  <Sparkles size={14} className="text-accent" />
                </div>
                <p className="text-xs text-on-dark-2 mb-5">Seluruh fitur, tanpa batasan.</p>

                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-3xl font-black">
                    {rupiah(tagihan === 'tahunan' ? HARGA_TAHUNAN : HARGA_BULANAN)}
                  </span>
                  <span className="text-xs text-on-dark-2 font-bold">
                    /{tagihan === 'tahunan' ? 'tahun' : 'bulan'}
                  </span>
                </div>
                <p className="text-[11px] text-on-dark-3 mb-6">
                  {tagihan === 'tahunan'
                    ? `Setara ${rupiah(PER_HARI)}/hari · gratis 2 bulan (hemat ${rupiah(HARGA_BULANAN * 12 - HARGA_TAHUNAN)})`
                    : 'Fleksibel, bisa berhenti kapan saja.'}
                </p>

                <ul className="space-y-2.5">
                  {[
                    'Produk tanpa batas',
                    'Dashboard analitik & laba rugi',
                    'Peringatan stok menipis',
                    'Akun kasir dengan hak akses',
                    'Kirim nota via WhatsApp',
                    'Pendampingan awal & migrasi data'
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs text-on-dark-2">
                      <Check size={14} className="text-accent mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={waLink(PESAN_LANGGANAN)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-ink text-xs font-black hover:bg-accent/90 transition-colors"
                >
                  <MessageCircle size={14} /> Hubungi via WhatsApp
                </a>
                <a
                  href={`mailto:${KONTAK_EMAIL}?subject=Langganan%20SEA%20ERP%20Pro`}
                  className="mt-2 flex items-center justify-center py-2.5 rounded-xl border border-white/15 text-[11px] font-bold text-on-dark-2 hover:text-white hover:bg-white/5 transition-colors"
                >
                  atau kirim email
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted mt-8">
            Harga berlaku per toko. Butuh beberapa cabang? Hubungi kami untuk penawaran.
          </p>
        </div>
      </section>

      {/* ================= CTA PENUTUP ================= */}
      <section className="bg-white border-t border-line py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Siap berhenti menebak-nebak?
          </h2>
          <p className="text-muted leading-relaxed mb-8">
            Coba gratis hari ini. Kalau butuh bantuan memindahkan data lama atau
            menyiapkan katalog, tim kami siap mendampingi.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-ink text-on-dark text-sm font-bold hover:bg-ink-hi transition-all shadow-lg"
            >
              Mulai Sekarang <ArrowRight size={16} />
            </Link>
            <a
              href={waLink(PESAN_TANYA)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white border border-line text-sm font-bold hover:border-brand transition-all"
            >
              <MessageCircle size={16} /> Chat WhatsApp
            </a>
          </div>

          <p className="text-xs text-muted mt-7">
            {KONTAK_WA_TAMPIL} ·{' '}
            <a href={`mailto:${KONTAK_EMAIL}`} className="font-bold text-brand hover:underline">
              {KONTAK_EMAIL}
            </a>
          </p>
        </div>
      </section>

      {/* Tombol mengambang — pengunjung bisa bertanya tanpa harus scroll ke bawah */}
      <a
        href={waLink(PESAN_TANYA)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi kami lewat WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-ink text-on-dark shadow-[0_8px_30px_rgba(0,0,102,0.35)] hover:bg-ink-hi transition-all hover:scale-105"
      >
        <MessageCircle size={17} className="text-accent" />
        <span className="text-xs font-bold">Tanya Kami</span>
      </a>

      {/* ================= FOOTER ================= */}
      <footer className="bg-paper py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-ink rounded-lg text-on-dark">
              <Store size={14} />
            </div>
            <span className="text-xs font-extrabold">SEA ERP</span>
          </div>
          <p className="text-[11px] text-muted text-center">
            © {new Date().getFullYear()} Seawise Creative · Retail &amp; Service Edition
          </p>
          <div className="flex items-center gap-4">
            <a
              href={waLink(PESAN_TANYA)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-brand hover:underline"
            >
              {KONTAK_WA_TAMPIL}
            </a>
            <a href={`mailto:${KONTAK_EMAIL}`} className="text-[11px] font-bold text-brand hover:underline">
              {KONTAK_EMAIL}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function FeatureBlock({
  eyebrow,
  title,
  body,
  visual,
  reverse = false
}: {
  eyebrow: string
  title: string
  body: string
  visual: React.ReactNode
  reverse?: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
      <div className={reverse ? 'md:order-2' : ''}>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted">
          {eyebrow}
        </span>
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight mt-3 mb-4 leading-tight">
          {title}
        </h3>
        <p className="text-sm text-muted leading-relaxed">{body}</p>
      </div>
      <div className={reverse ? 'md:order-1' : ''}>{visual}</div>
    </div>
  )
}
