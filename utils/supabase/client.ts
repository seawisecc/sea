import { createBrowserClient } from '@supabase/ssr'

// Fungsi ini memastikan kita hanya membuat satu instance Supabase di sisi client (browser)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}