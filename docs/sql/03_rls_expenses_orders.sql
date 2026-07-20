-- =============================================================================
-- Langkah 3 — rapikan policy expenses, orders, order_items
--
-- Konteks: policy di PostgreSQL digabung dengan OR. Satu policy yang longgar
-- membatalkan semua policy ketat di tabel yang sama. Itu sebabnya policy lama
-- perlu DIHAPUS, bukan sekadar ditambahi yang baru.
--
-- Keputusan: pengeluaran (expenses) menjadi owner-only — baca, catat, ubah,
-- dan hapus. Kasir tidak punya akses sama sekali.
-- =============================================================================

-- --- expenses ---------------------------------------------------------------
-- Tiga policy lama ini yang membocorkan akses:
--   Tenant Expenses Select  -> tidak mengecek role, jadi kasir ikut melihat
--   Tenant Expenses Insert  -> with_check = true, siapa pun bisa menulis ke
--                              tenant mana pun
--   Tenant Expenses Update  -> tidak mengecek role
drop policy if exists "Tenant Expenses Select" on public.expenses;
drop policy if exists "Tenant Expenses Insert" on public.expenses;
drop policy if exists "Tenant Expenses Update" on public.expenses;

-- Policy SELECT owner-only (expenses_owner_only) sudah ada, biarkan apa adanya.

create policy "expenses_owner_insert" on public.expenses
  for insert
  with check (
    tenant_id = current_tenant_id() and "current_role"() = 'owner'
  );

create policy "expenses_owner_update" on public.expenses
  for update
  using (
    tenant_id = current_tenant_id() and "current_role"() = 'owner'
  )
  with check (
    tenant_id = current_tenant_id() and "current_role"() = 'owner'
  );

-- Sebelumnya tidak ada policy DELETE sama sekali, jadi tombol hapus di
-- aplikasi gagal tanpa pesan error.
create policy "expenses_owner_delete" on public.expenses
  for delete
  using (
    tenant_id = current_tenant_id() and "current_role"() = 'owner'
  );

-- --- orders -----------------------------------------------------------------
-- with_check = true berarti klien bisa menyisipkan order ke tenant orang lain.
-- handle_checkout tidak terpengaruh: fungsi itu SECURITY DEFINER, jadi
-- berjalan sebagai pemilik fungsi dan melewati RLS.
drop policy if exists "Tenant Orders Insert" on public.orders;

create policy "orders_tenant_insert" on public.orders
  for insert
  with check (tenant_id = current_tenant_id());

-- --- order_items ------------------------------------------------------------
drop policy if exists "Tenant OrderItems Insert" on public.order_items;

create policy "order_items_tenant_insert" on public.order_items
  for insert
  with check (tenant_id = current_tenant_id());

-- --- verifikasi -------------------------------------------------------------
-- Tidak boleh ada baris dengan with_check bernilai 'true'.
select tablename, policyname, cmd, qual::text, with_check::text
from pg_policies
where schemaname = 'public'
  and tablename in ('expenses', 'orders', 'order_items')
order by tablename, cmd;
