import { ImageResponse } from 'next/og'

/**
 * Gambar pratinjau yang muncul saat tautan dibagikan di WhatsApp, Telegram,
 * LinkedIn, dan sejenisnya. Dibuat otomatis oleh Next.js — tidak perlu
 * mengekspor PNG manual setiap kali teksnya berubah.
 *
 * 1200x630 adalah ukuran baku Open Graph. WhatsApp memotongnya jadi kotak
 * pada pratinjau kecil, jadi elemen penting ditaruh di tengah, bukan di tepi.
 */
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'SEA ERP — Kasir & pembukuan untuk UMKM'

const NAVY = '#000066'
const NAVY_2 = '#14147f'
const CHALK = '#ffff99'
const ON_DARK = '#fbfbf0'
const ON_DARK_2 = '#c6c6e8'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_2} 55%, ${NAVY} 100%)`,
          padding: '64px 72px',
          fontFamily: 'sans-serif'
        }}
      >
        {/* Kepala */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: CHALK,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30
            }}
          >
            🏪
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: ON_DARK, fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>
              Seawise Enterprise Apps
            </span>
            <span style={{ color: ON_DARK_2, fontSize: 17, letterSpacing: 1.6 }}>
              Retail &amp; Service Edition
            </span>
          </div>
        </div>

        {/* Isi utama */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: -20 }}>
          <div
            style={{
              display: 'flex',
              color: ON_DARK,
              fontSize: 74,
              fontWeight: 800,
              letterSpacing: -2.4,
              lineHeight: 1.08
            }}
          >
            Jualan tercatat.
          </div>
          <div
            style={{
              display: 'flex',
              color: CHALK,
              fontSize: 74,
              fontWeight: 800,
              letterSpacing: -2.4,
              lineHeight: 1.08,
              marginBottom: 24
            }}
          >
            Untung terlihat.
          </div>
          <div
            style={{
              display: 'flex',
              color: ON_DARK_2,
              fontSize: 27,
              lineHeight: 1.45,
              maxWidth: 880
            }}
          >
            Kasir, stok, pengeluaran, dan laporan laba rugi dalam satu aplikasi —
            dirancang untuk UMKM Indonesia.
          </div>
        </div>

        {/* Tag fitur */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['Kasir POS', 'Inventaris', 'Laba Rugi', 'Struk & WhatsApp', 'Multi-Peran'].map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                padding: '10px 20px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.08)',
                color: ON_DARK_2,
                fontSize: 20,
                fontWeight: 600
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
