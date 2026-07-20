-- =============================================================================
-- handle_checkout — versi yang diperketat
--
-- Perubahan dari versi sebelumnya:
--   1. Harga, tipe, dan subtotal diambil dari tabel products (bukan dari klien)
--   2. Produk milik tenant lain kini ditolak dengan error, bukan lolos diam-diam
--   3. Baris produk dikunci (FOR UPDATE) agar dua kasir tidak bisa menjual
--      stok terakhir yang sama secara bersamaan
--   4. SET search_path ditambahkan (wajib untuk SECURITY DEFINER)
--   5. quantity <= 0 ditolak
--
-- Tanda tangan fungsi TIDAK berubah, jadi kode Next.js tidak perlu diubah.
-- Parameter p_total_amount dan p_grand_total masih diterima demi kompatibilitas
-- tapi nilainya diabaikan — server menghitung sendiri.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_checkout(
  p_customer_name   text,
  p_total_amount    numeric,
  p_discount_amount numeric,
  p_grand_total     numeric,
  p_payment_method  text,
  p_items           jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_tenant_id      uuid;
  v_order_id       uuid;
  v_invoice_number varchar(100);
  v_item           record;
  v_product        record;
  v_line_subtotal  numeric;
  v_total          numeric := 0;
  v_discount       numeric;
  v_grand_total    numeric;
BEGIN
  -- 1. Tenant diambil dari sesi auth, tidak pernah dari parameter
  v_tenant_id := get_auth_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Tenant ID tidak valid.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang kosong.';
  END IF;

  v_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' ||
                      upper(substring(gen_random_uuid()::text from 1 for 5));

  INSERT INTO orders (
    tenant_id, invoice_number, customer_name,
    total_amount, discount_amount, grand_total,
    payment_method, created_by
  )
  VALUES (
    v_tenant_id, v_invoice_number, p_customer_name,
    0, 0, 0,                      -- diisi ulang setelah item dihitung
    p_payment_method, auth.uid()
  )
  RETURNING id INTO v_order_id;

  -- 2. Iterasi item. Hanya product_id dan quantity yang dipercaya dari klien.
  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(p_items)
      AS x(product_id uuid, quantity int, metadata jsonb)
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Jumlah item tidak valid.';
    END IF;

    -- Harga dan tipe diambil dari database, bukan dari keranjang.
    -- FOR UPDATE mengunci baris sampai transaksi selesai agar stok tidak
    -- terjual dua kali saat ada dua kasir bersamaan.
    SELECT id, name, price, type, stock
      INTO v_product
      FROM products
     WHERE id = v_item.product_id
       AND tenant_id = v_tenant_id
     FOR UPDATE;

    -- Versi lama membiarkan kasus ini lolos tanpa error.
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produk tidak ditemukan di toko ini (id: %).', v_item.product_id;
    END IF;

    IF v_product.type = 'retail' THEN
      IF v_product.stock < v_item.quantity THEN
        RAISE EXCEPTION 'Stok tidak mencukupi untuk % (Tersedia: %, Diminta: %)',
          v_product.name, v_product.stock, v_item.quantity;
      END IF;

      UPDATE products
         SET stock = stock - v_item.quantity
       WHERE id = v_product.id
         AND tenant_id = v_tenant_id;
    END IF;

    v_line_subtotal := v_product.price * v_item.quantity;
    v_total := v_total + v_line_subtotal;

    INSERT INTO order_items (
      tenant_id, order_id, product_id, quantity, unit_price, subtotal, metadata
    )
    VALUES (
      v_tenant_id, v_order_id, v_product.id, v_item.quantity,
      v_product.price, v_line_subtotal, coalesce(v_item.metadata, '{}'::jsonb)
    );
  END LOOP;

  -- 3. Diskon tetap keputusan kasir, tapi dibatasi agar tidak negatif
  --    dan tidak melebihi total belanja.
  v_discount    := least(greatest(coalesce(p_discount_amount, 0), 0), v_total);
  v_grand_total := v_total - v_discount;

  UPDATE orders
     SET total_amount    = v_total,
         discount_amount = v_discount,
         grand_total     = v_grand_total
   WHERE id = v_order_id;

  RETURN json_build_object(
    'success',        true,
    'order_id',       v_order_id,
    'invoice_number', v_invoice_number,
    'total_amount',   v_total,
    'discount_amount', v_discount,
    'grand_total',    v_grand_total
  );
END;
$function$;
