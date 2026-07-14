import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Tidak ada token otorisasi.' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // 1. Validasi token milik siapa (pakai anon client, cukup untuk verifikasi identitas)
    const anonClient = createClient(supabaseUrl, anonKey)
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Sesi tidak valid. Silakan login ulang.' }, { status: 401 })
    }

    // 2. Client dengan service role (bypass RLS, hanya dipakai di server)
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 3. Pastikan pemanggil adalah owner, dan ambil tenant_id-nya
    const { data: ownerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !ownerProfile) {
      return NextResponse.json({ error: 'Profil tidak ditemukan.' }, { status: 403 })
    }

    if (ownerProfile.role !== 'owner') {
      return NextResponse.json({ error: 'Hanya Owner yang bisa menambah kasir.' }, { status: 403 })
    }

    const { email, password, name } = await req.json()

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: 'Email dan password (min 6 karakter) wajib diisi.' }, { status: 400 })
    }

    // 4. Buat user baru di auth.users
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    })

    if (createError || !newUser.user) {
      return NextResponse.json({ error: createError?.message || 'Gagal membuat akun.' }, { status: 400 })
    }

    // 5. Daftarkan sebagai profile dengan role 'cashier', tenant sama dengan owner
    const { error: insertError } = await adminClient.from('profiles').insert({
      id: newUser.user.id,
      tenant_id: ownerProfile.tenant_id,
      email: email,
      role: 'cashier'
    })

    if (insertError) {
      // Rollback: hapus user auth yang sudah terlanjur dibuat
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: 'Gagal menyimpan profil kasir: ' + insertError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan server.' }, { status: 500 })
  }
}