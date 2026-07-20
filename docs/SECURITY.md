# Keamanan SEA ERP — yang wajib dipasang di Supabase

Kode di aplikasi ini sudah menyaring data per tenant dan per role. **Tapi itu
hanya lapisan kenyamanan UI.** Siapa pun bisa membuka DevTools, memanggil
Supabase langsung dengan anon key, dan melewati seluruh kode frontend.

Penegakan yang sebenarnya harus ada di database. Berikut yang perlu dijalankan.

**Jalankan bagian 1 sampai 6 secara berurutan.** Bagian 2 membuat fungsi bantu
yang dipakai bagian 3, 4, dan 5 — kalau dilewati, sisanya akan error.

Semua blok di bagian 1–4 adalah SQL biasa dan bisa langsung ditempel ke SQL
Editor. Bagian 5 berisi PL/pgSQL yang harus dibungkus `create function` —
baca catatannya di sana.

---

## 1. Kolom yang diasumsikan aplikasi

Tabel `profiles` harus punya:

```sql
alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants(id),
  add column if not exists role text not null default 'owner'
    check (role in ('owner', 'cashier')),
  add column if not exists is_superadmin boolean not null default false;
```

Tandai akun superadmin Anda secara manual, sekali saja:

```sql
update public.profiles set is_superadmin = true
where id = (select id from auth.users where email = 'seawise.cc@gmail.com');
```

Sebelumnya daftar superadmin di-hardcode di file frontend. Itu berarti siapa
pun yang membaca bundle JavaScript tahu email admin Anda, dan siapa pun bisa
memalsukan tampilannya. Sekarang sumber kebenarannya ada di database.

Pastikan `products`, `customers`, `expenses`, `orders` semuanya punya kolom
`tenant_id NOT NULL`.

---

## 2. Fungsi bantu

```sql
create or replace function public.current_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_superadmin from public.profiles where id = auth.uid()), false)
$$;
```

---

## 3. Row Level Security per tabel

Jalankan untuk setiap tabel bertenant (`products`, `customers`, `expenses`,
`orders`, `order_items`):

```sql
alter table public.products enable row level security;

create policy "tenant_read" on public.products
  for select using (tenant_id = public.current_tenant_id());

create policy "tenant_write" on public.products
  for insert with check (tenant_id = public.current_tenant_id());

create policy "tenant_update" on public.products
  for update using (tenant_id = public.current_tenant_id())
          with check (tenant_id = public.current_tenant_id());

-- Hanya owner yang boleh menghapus
create policy "owner_delete" on public.products
  for delete using (
    tenant_id = public.current_tenant_id() and public.current_role() = 'owner'
  );
```

Untuk `expenses`, tambahkan juga pembatasan agar kasir tidak bisa melihat
laporan keuangan bila memang itu yang Anda inginkan:

```sql
create policy "expenses_owner_only" on public.expenses
  for select using (
    tenant_id = public.current_tenant_id() and public.current_role() = 'owner'
  );
```

Untuk `order_items` yang mungkin tidak punya `tenant_id`, ikat lewat ordernya:

```sql
create policy "tenant_read_items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.tenant_id = public.current_tenant_id()
    )
  );
```

---

## 4. Kunci tabel profiles

Ini yang paling penting. Tanpa policy ini, kasir bisa menaikkan dirinya
sendiri jadi owner atau superadmin lewat satu panggilan API.

```sql
alter table public.profiles enable row level security;

create policy "read_own_tenant_profiles" on public.profiles
  for select using (tenant_id = public.current_tenant_id() or id = auth.uid());

-- Pengguna hanya boleh mengubah data non-sensitif miliknya sendiri.
-- role, tenant_id, dan is_superadmin TIDAK boleh diubah dari client.
create policy "update_own_safe_fields" on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = public.current_role()
    and tenant_id = public.current_tenant_id()
    and is_superadmin = public.is_superadmin()
  );
```

Tidak ada policy `insert` untuk pengguna biasa — pembuatan profil hanya lewat
trigger `on auth.users` atau lewat service role di `/api/create-cashier`.

---

## 5. Fungsi RPC admin

`admin_list_tenants`, `admin_update_tenant_plan`, dan `admin_set_tenant_status`
adalah `security definer`, artinya mereka mem-bypass RLS. Masing-masing harus
memeriksa sendiri apakah pemanggilnya superadmin.

> **Penting:** `if ... then ... end if;` adalah sintaks PL/pgSQL, bukan SQL
> biasa. Menempelkannya langsung ke SQL Editor akan menghasilkan
> `syntax error at or near "if"`. Baris itu harus berada **di dalam** badan
> fungsi, di antara `begin` dan `end`.

### Langkah 1 — lihat isi fungsi yang sekarang

```sql
select proname, pg_get_functiondef(oid)
from pg_proc
where proname in (
  'admin_list_tenants',
  'admin_update_tenant_plan',
  'admin_set_tenant_status',
  'handle_checkout'
);
```

Salin hasilnya, lalu sisipkan penjaga di bawah `begin`.

### Langkah 2 — bentuk akhirnya seperti ini

```sql
create or replace function public.admin_update_tenant_plan(
  p_tenant_id uuid,
  p_plan text,
  p_ends_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Penjaga: baris pertama di dalam badan fungsi
  if not public.is_superadmin() then
    raise exception 'Akses ditolak';
  end if;

  update public.tenants
     set subscription_plan   = p_plan,
         subscription_ends_at = p_ends_at
   where id = p_tenant_id;
end;
$$;
```

Untuk fungsi yang mengembalikan tabel, polanya sama:

```sql
create or replace function public.admin_list_tenants()
returns setof public.tenants
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Akses ditolak';
  end if;

  return query select * from public.tenants order by name;
end;
$$;
```

Sesuaikan nama parameter dan tipe kembalian dengan hasil Langkah 1 — jangan
salin mentah-mentah, karena tanda tangan fungsi Anda mungkin berbeda.

### Kenapa ini perlu

Tanpa penjaga tersebut, tenant mana pun bisa memanggil
`admin_update_tenant_plan` dari browser dan menaikkan dirinya sendiri ke paket
Pro secara gratis. `security definer` membuat fungsi berjalan sebagai pemilik
fungsi, jadi RLS tidak menolongnya.

Hal yang sama berlaku untuk `handle_checkout` — pastikan ia mengambil
`tenant_id` dari `auth.uid()`, bukan dari parameter yang dikirim klien:

```sql
-- di dalam badan handle_checkout, sebelum insert
v_tenant_id := public.current_tenant_id();
if v_tenant_id is null then
  raise exception 'Akun tidak terhubung ke toko mana pun';
end if;
```

### Cara cepat menguji

```sql
-- Harus mengembalikan true untuk akun Anda, false untuk yang lain
select public.is_superadmin();
```

Kalau `is_superadmin()` belum ada, berarti bagian 2 di dokumen ini belum
dijalankan — jalankan itu lebih dulu.

---

## 6. Service role key

`SUPABASE_SERVICE_ROLE_KEY` di `.env.local` mem-bypass seluruh RLS. Key ini:

- hanya boleh dibaca di Route Handler / Server Action, tidak pernah di komponen client
- jangan pernah diberi prefix `NEXT_PUBLIC_`
- di Vercel, simpan sebagai Environment Variable biasa (bukan yang di-expose ke browser)

Saat ini satu-satunya pemakaian yang benar ada di `app/api/create-cashier/route.ts`.

---

## Sisa pekerjaan yang belum dikerjakan

- Paywall masih dievaluasi di client. Batas paket Free (maks 20 produk) bisa
  dilewati lewat panggilan API langsung — perlu constraint atau trigger di DB.
- Belum ada rate limiting di `/api/create-cashier`.
- Belum ada audit log untuk perubahan paket langganan.
