import type { Metadata } from 'next'

// Halaman /kenapa adalah komponen klien, jadi metadata-nya diletakkan di
// layout terpisah — export `metadata` tidak diizinkan dari file 'use client'.
export const metadata: Metadata = {
  title: 'Kenapa SEA ERP?',
  description:
    'Kasir, stok, pengeluaran, dan laporan laba rugi dalam satu aplikasi. ' +
    'Mulai gratis, atau Rp1.370 per hari untuk seluruh fitur tanpa batas.',
  openGraph: {
    title: 'Kenapa SEA ERP? — Kasir & Pembukuan untuk UMKM',
    description:
      'Jualan tercatat, untung terlihat. Kasir, stok, pengeluaran, dan laba ' +
      'rugi dalam satu aplikasi. Mulai dari Rp1.370 per hari.',
    url: '/kenapa',
  },
}

export default function KenapaLayout({ children }: { children: React.ReactNode }) {
  return children
}
