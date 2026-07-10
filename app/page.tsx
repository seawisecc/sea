import { redirect } from 'next/navigation'

export default function HomePage() {
  // Secara otomatis melempar pengunjung dari halaman utama ke halaman login
  redirect('/login')
}