import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

// The OpenGraph card for /context, in keeptalking.dev's type. Deliberately
// generic: link crawlers fetch the URL without its fragment, so they can never
// know which conversation an invite is for — the sender's device supplies the
// rich preview instead. Rendered once at build time, so the fonts are read from
// public/ during the build (the renderer takes woff, not woff2).
export const dynamic = 'force-static'

const font = (file: string) => readFile(join(process.cwd(), 'public/fonts', file))

export async function GET() {
  const [serif, sans, mono] = await Promise.all([
    font('instrument-serif-latin-400-normal.woff'),
    font('raleway-latin-400-normal.woff'),
    font('jetbrains-mono-latin-400-normal.woff'),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 88px 80px',
          background: '#f6f6f4',
          color: '#0a0a0a',
          fontFamily: 'Raleway',
        }}
      >
        <div style={{ fontFamily: 'Instrument Serif', fontSize: 44, letterSpacing: -0.4 }}>KeepTalking</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 24, letterSpacing: 2, color: '#5a5a5a' }}>
            INVITATION
          </div>
          <div
            style={{
              fontFamily: 'Instrument Serif',
              fontSize: 112,
              lineHeight: 0.95,
              letterSpacing: -1,
              marginTop: 24,
              maxWidth: 900,
            }}
          >
            Join a conversation on KeepTalking.
          </div>
          <div style={{ fontSize: 30, color: '#5a5a5a', marginTop: 32 }}>
            Open the link on a device with KeepTalking installed.
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Instrument Serif', data: serif, weight: 400 },
        { name: 'Raleway', data: sans, weight: 400 },
        { name: 'JetBrains Mono', data: mono, weight: 400 },
      ],
    },
  )
}
