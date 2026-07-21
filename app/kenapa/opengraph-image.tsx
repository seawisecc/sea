import { ImageResponse } from 'next/og'

/** Pratinjau khusus halaman /kenapa — menonjolkan harga, bukan fitur. */
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Kenapa SEA ERP — mulai dari Rp1.370 per hari'

const NAVY = '#000066'
const NAVY_2 = '#14147f'
const CHALK = '#ffff99'
const ON_DARK = '#fbfbf0'
const ON_DARK_2 = '#c6c6e8'

export default function KenapaOgImage() {
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
          padding: '60px 72px',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: CHALK,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26
            }}
          >
            🏪
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: ON_DARK, fontSize: 23, fontWeight: 700 }}>
              Seawise Enterprise Apps
            </span>
            <span style={{ color: ON_DARK_2, fontSize: 15, letterSpacing: 1.5 }}>
              Retail &amp; Service Edition
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              color: ON_DARK_2,
              fontSize: 22,
              letterSpacing: 3,
              marginBottom: 14
            }}
          >
            KENAPA SEA ERP?
          </div>
          <div
            style={{
              display: 'flex',
              color: ON_DARK,
              fontSize: 68,
              fontWeight: 800,
              letterSpacing: -2.2,
              lineHeight: 1.1
            }}
          >
            Buku tulis tidak bisa bilang
          </div>
          <div
            style={{
              display: 'flex',
              color: CHALK,
              fontSize: 68,
              fontWeight: 800,
              letterSpacing: -2.2,
              lineHeight: 1.1
            }}
          >
            kamu untung atau rugi.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {['Kasir POS', 'Laba Rugi', 'Stok Otomatis', 'Struk & WA'].map((t) => (
              <div
                key={t}
                style={{
                  display: 'flex',
                  padding: '9px 18px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.22)',
                  background: 'rgba(255,255,255,0.08)',
                  color: ON_DARK_2,
                  fontSize: 19,
                  fontWeight: 600
                }}
              >
                {t}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ color: ON_DARK_2, fontSize: 17, letterSpacing: 1.4 }}>
              MULAI DARI
            </span>
            <span style={{ color: CHALK, fontSize: 44, fontWeight: 800, letterSpacing: -1.2 }}>
              Rp1.370/hari
            </span>
          </div>
        </div>
      </div>
    ),
    size
  )
}
