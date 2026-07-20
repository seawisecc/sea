# Prompt Ilustrasi SEA ERP

Untuk ChatGPT (GPT Image), Midjourney, atau generator gambar lain.

## Catatan rasio

Model gambar OpenAI hanya mendukung **1024×1024**, **1536×1024** (lanskap), dan
**1024×1536** (potret). Tidak ada opsi 1600×1000 langsung.

1600×1000 adalah rasio **8:5 (1,6)**. Yang paling dekat adalah **1536×1024**
yaitu 3:2 (1,5). Jadi:

1. Generate di **1536×1024**
2. Perbesar ke 1600×1067 lalu potong 67px dari atas/bawah, **atau**
3. Minta komposisi dengan ruang kosong ekstra di atas dan bawah supaya aman dipotong

Untuk Midjourney, tinggal tambahkan `--ar 8:5` dan rasionya persis.

## Palet warna (sertakan di setiap prompt)

| Peran | Hex |
|---|---|
| Navy utama | `#000066` |
| Navy sekunder | `#2A2A96` |
| Chalk (aksen) | `#FFFF99` |
| Latar kertas | `#FAFAEC` |
| Putih kartu | `#FFFFFF` |

---

## 1. Hero — perangkat di atas meja (paling serbaguna)

> A premium product hero shot for an Indonesian small-business POS app called
> SEA ERP. A modern silver laptop and a smartphone sit on a warm off-white
> desk surface (#FAFAEC), photographed at a slight three-quarter angle. The
> laptop screen shows a clean analytics dashboard with a deep navy (#000066)
> sidebar, white cards, a pale-yellow chalk (#FFFF99) accent highlight, and a
> bar chart in navy. The phone screen shows a simplified point-of-sale cart
> screen. Soft natural window light from the upper left, gentle diffused
> shadows, shallow depth of field. Minimal props: a small ceramic coffee cup
> and a folded receipt. Clean, calm, Apple-style product photography.
> Generous negative space at the top for a headline. Photorealistic, 8k,
> no text legible on screens, no logos.

Kegunaan: banner utama halaman `/kenapa`, thumbnail, cover proposal.

---

## 2. Suasana toko — kasir sedang melayani (paling menjual)

> Warm documentary-style photograph inside a small modern Indonesian retail
> shop. A friendly female shop owner in her thirties stands behind a wooden
> counter, using a tablet on a stand to process a sale while smiling at a
> customer. The tablet screen glows with a clean interface using deep navy
> (#000066) and soft yellow (#FFFF99) accents. Behind her, neat wooden
> shelves with coffee bags, packaged goods, and folded shirts. A small
> thermal receipt printer sits beside the tablet. Golden afternoon light
> through a shopfront window, natural skin tones, authentic and unstaged.
> Shallow depth of field, subject sharp, background softly blurred.
> Photorealistic, editorial quality, 8k.

Kegunaan: bagian "kenapa", iklan media sosial, materi promosi ke UMKM.

Variasi: ganti jadi toko kelontong, kedai kopi, barbershop, atau butik
pakaian sesuai target pasar.

---

## 3. Kolase antarmuka — showcase fitur

> A clean UI showcase composition on a soft off-white background (#FAFAEC).
> Four floating rounded-corner interface cards arranged in a loose overlapping
> stack with soft realistic drop shadows: (1) an analytics dashboard with a
> navy bar chart and three stat cards, (2) a point-of-sale cart with product
> tiles and a large total figure, (3) a narrow thermal receipt slip, (4) a
> low-stock alert card with warm orange accents. Color palette strictly deep
> navy #000066, chalk yellow #FFFF99, white, and warm off-white. Flat modern
> design, generous whitespace, subtle depth, no gradients, no text.
> Isometric-leaning but mostly flat. Premium SaaS marketing aesthetic.

Kegunaan: bagian daftar fitur, slide presentasi.

---

## 4. Ilustrasi isometrik — untuk yang tidak mau pakai foto

> A minimal isometric illustration of a small retail shop interior, viewed
> from a raised three-quarter angle. A tidy counter with a tablet and a
> thermal printer, shelves with neatly stacked goods, a hanging plant, and a
> shop window. Floating above the counter, three small translucent UI panels
> showing a bar chart, a shopping cart, and a receipt. Strictly limited
> palette: deep navy #000066 for structure, chalk yellow #FFFF99 for
> highlights, warm off-white #FAFAEC background, and one muted terracotta
> accent. Clean vector style, flat shading with subtle soft shadows, thin
> consistent line weights, no gradients, no text. Calm and premium.

Kegunaan: bagian penjelas, dokumentasi, ilustrasi pembuka.

---

## 5. Sebelum dan sesudah — cerita masalah

> A split-composition editorial illustration. Left half: a cluttered wooden
> desk with a messy stack of handwritten paper ledgers, scattered receipts, a
> calculator, and a worried atmosphere, rendered in desaturated muted tones.
> Right half: the same desk, clean and organised, with a single tablet
> displaying a tidy navy-and-white dashboard, a small stack of neat receipts,
> and calm warm light. Palette on the right side: deep navy #000066, chalk
> yellow #FFFF99, warm off-white #FAFAEC. A soft vertical transition between
> the two halves, not a hard line. Photorealistic still life, natural light,
> 8k, no text.

Kegunaan: bagian "masalah", konten media sosial yang mudah dipahami sekilas.

---

## 6. Struk ke WhatsApp — fitur pembeda

> A close-up product photograph of a hand holding a smartphone showing a
> WhatsApp chat thread containing a neatly formatted digital receipt. Beside
> the hand, a small thermal printer on a counter is producing a paper receipt
> that curls slightly. Warm shop lighting, soft focus background of shelves.
> Deep navy and soft yellow accents visible in the app interface on screen.
> Photorealistic, shallow depth of field, 8k, receipt text not legible.

Kegunaan: menonjolkan fitur kirim nota via WhatsApp, yang jarang dimiliki
kompetitor di kelas harga ini.

---

## Tips penggunaan

**Selalu tulis "no text" atau "text not legible".** Model gambar hampir selalu
gagal menulis teks yang benar — hasilnya huruf berantakan yang membuat gambar
terlihat murahan. Lebih baik layar tampak kosong lalu kamu tempelkan
screenshot asli di atasnya pakai Figma atau Canva.

**Sebutkan hex secara eksplisit.** Tanpa itu, model cenderung memilih biru
generik. Menyebut `#000066` dan `#FFFF99` membuat hasilnya menyatu dengan
tema aplikasi.

**Minta ruang kosong.** Frasa "generous negative space at the top" memberi
tempat untuk judul, dan sekaligus jadi cadangan saat gambar dipotong ke 8:5.

**Untuk foto orang**, sebutkan "Indonesian" secara eksplisit — kalau tidak,
hasilnya cenderung wajah Barat yang terasa asing bagi calon pelangganmu.

**Kalau hasilnya terasa palsu**, tambahkan "shot on 50mm lens, natural
imperfections, slightly worn surfaces". Foto yang terlalu bersih justru
terlihat seperti stok gambar dan kurang dipercaya.
