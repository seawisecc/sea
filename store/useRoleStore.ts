import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export type UserRole = 'owner' | 'cashier'

interface RoleState {
  role: UserRole | null
  tenantId: string | null
  tenantName: string | null
  userId: string | null
  email: string | null
  isSuperadmin: boolean
  loading: boolean
  loaded: boolean
  fetchSession: (force?: boolean) => Promise<void>
  setTenantName: (name: string) => void
  reset: () => void
}

const EMPTY = {
  role: null,
  tenantId: null,
  tenantName: null,
  userId: null,
  email: null,
  isSuperadmin: false,
}

/**
 * Identitas pengguna diambil dari tabel `profiles` di database — BUKAN dari
 * localStorage. Nilai di sini hanya dipakai untuk menyembunyikan/menampilkan UI.
 *
 * Penegakan izin yang sebenarnya HARUS ada di Row Level Security Supabase,
 * karena apa pun yang tersimpan di browser bisa dimanipulasi pengguna.
 * Lihat docs/SECURITY.md untuk policy yang wajib dipasang.
 */
export const useRoleStore = create<RoleState>()((set, get) => ({
  ...EMPTY,
  loading: false,
  loaded: false,

  fetchSession: async (force = false) => {
    if (get().loading) return
    if (get().loaded && !force) return

    set({ loading: true })
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      set({ ...EMPTY, loading: false, loaded: true })
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role, is_superadmin, tenants(name)')
      .eq('id', user.id)
      .single()

    // Supabase mengembalikan relasi sebagai objek atau array tergantung
    // bagaimana foreign key terdeteksi, jadi keduanya ditangani.
    const tenant = profile?.tenants as { name?: string } | { name?: string }[] | null
    const tenantName = Array.isArray(tenant) ? tenant[0]?.name : tenant?.name

    set({
      userId: user.id,
      email: user.email ?? null,
      tenantId: profile?.tenant_id ?? null,
      tenantName: tenantName ?? null,
      role: profile?.role === 'cashier' ? 'cashier' : 'owner',
      isSuperadmin: profile?.is_superadmin === true,
      loading: false,
      loaded: true,
    })
  },

  // Dipanggil setelah owner mengganti nama toko di Pengaturan, supaya
  // sidebar ikut berubah tanpa perlu memuat ulang halaman.
  setTenantName: (name) => set({ tenantName: name }),

  reset: () => set({ ...EMPTY, loading: false, loaded: false }),
}))
