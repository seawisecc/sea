import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <-- INI SANGAT KRUSIAL AGAR TAILWIND AKTIF

const inter = Inter({ subsets: ["latin"] });

// Dipakai untuk mengubah path relatif (gambar OG) jadi URL absolut. Perayap
// WhatsApp dan LinkedIn menolak path relatif, dan kalau domainnya salah,
// gambarnya gagal diambil sehingga pratinjau muncul tanpa gambar.
//
// Urutan: nilai yang diset manual > domain produksi Vercel > domain deploy
// saat ini > localhost. Dengan begini domainnya terdeteksi sendiri, tanpa
// perlu menebak nama proyek.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000";

const title = "Seawise Enterprise Apps — Retail & Service Edition";
const description =
  "Kasir, inventaris, pengeluaran, dan laporan laba rugi dalam satu aplikasi. " +
  "Dirancang untuk UMKM Indonesia — mulai dari Rp1.370 per hari.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s — SEA ERP",
  },
  description,
  applicationName: "SEA ERP",
  keywords: [
    "aplikasi kasir",
    "POS UMKM",
    "software toko",
    "pembukuan usaha",
    "manajemen stok",
    "ERP UMKM Indonesia",
  ],
  authors: [{ name: "Seawise Creative" }],
  creator: "Seawise Creative",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Seawise Enterprise Apps",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#000066",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
