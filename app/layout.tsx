import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <-- INI SANGAT KRUSIAL AGAR TAILWIND AKTIF

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SEA ERP - Liquid Edition",
  description: "Modern ERP & POS for Growing Businesses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}