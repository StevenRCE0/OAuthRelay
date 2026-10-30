import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { inviteLabels } from '@/lib/invite'

// The OpenGraph card for /context, drawn as an envelope: the inviter in the
// sender's corner, a plain stamp, and the conversation written where the
// address goes, inside an airmail border in the accent.
// Crawlers fetch the invite without its fragment, so the envelope shows only
// the names /context passes along from its query (lib/invite.ts); with none it
// is addressed to "a conversation". The fonts are read from public/ (the
// renderer takes woff, not woff2) and traced into the function by
// next.config.ts.

const asset = (file: string) => readFile(join(process.cwd(), 'public', file))

// CJK faces, fetched from Google Fonts cut down to just the characters they
// set. Chinese in the serif title is set in a Song face, as on the page: Songti
// itself is Apple's and can't ship, so this is Noto Serif SC. The sans lines
// get Noto Sans SC explicitly, since the renderer would otherwise reach for any
// loaded face with the glyph, Song included. If a fetch fails the renderer falls
// back to its own CJK face rather than failing the card.
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u3000-\u303f\uff00-\uffef]/gu

async function cjkFont(family: string, text: string) {
  const chars = [...new Set(text.match(CJK) ?? [])].join('')
  if (!chars) return null
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(chars)}`, {
      // An old Safari user agent gets TrueType, which the renderer reads.
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1' },
    }).then((response) => response.text())
    const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1]
    const response = url ? await fetch(url) : null
    return response?.ok ? await response.arrayBuffer() : null
  } catch {
    return null
  }
}

// The page's own background, hatched; the lines sit 1.5x as far from it as
// they first did against a darker desk.
const DESK = '#f6f6f4'
const HATCH = '#dedcd8'
const ENVELOPE = '#fbfaf6'
const INK = '#0a0a0a'
const MUTED = '#5a5a5a'
const FAINT = '#888888'
const LINE = '#cfccc5'
const ACCENT = '#7949b0'
const STAMP = '#dedcd6'
// How far the address line sits above the bottom of the title's line box, as
// a share of the font size: a touch above Instrument Serif's baseline (about
// 0.2 at a line height of 1.02), so it runs through the foot of the letters.
const RULE = 0.27

export async function GET(request: NextRequest) {
  const { name, from, as } = inviteLabels(new URL(request.url).searchParams)
  const length = Array.from(name ?? '').length
  const titleSize = length > 40 ? 64 : length > 22 ? 80 : 104
  const title = name ?? 'A conversation'
  const [serif, sans, mono, song, sansCJK] = await Promise.all([
    asset('fonts/instrument-serif-latin-400-normal.woff'),
    asset('fonts/raleway-latin-400-normal.woff'),
    asset('fonts/jetbrains-mono-latin-400-normal.woff'),
    cjkFont('Noto+Serif+SC', title),
    cjkFont('Noto+Sans+SC', [from, as].join(' ')),
  ])
  const label = { fontFamily: 'JetBrains Mono', fontSize: 20, letterSpacing: 4, color: FAINT }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // The surface the envelope lies on, hatched in thin grey lines at 135°.
          background: `repeating-linear-gradient(135deg, ${HATCH} 0px, ${HATCH} 2px, ${DESK} 2px, ${DESK} 16px)`,
          fontFamily: 'Raleway, Sans CJK',
          color: INK,
        }}
      >
        {/* The airmail border: the envelope's edge, striped in the accent. */}
        <div
          style={{
            width: 1064,
            height: 540,
            display: 'flex',
            padding: 14,
            background: `repeating-linear-gradient(45deg, ${ACCENT} 0px, ${ACCENT} 20px, ${ENVELOPE} 20px, ${ENVELOPE} 40px)`,
          }}
        >
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '44px 56px 52px',
              background: ENVELOPE,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={label}>FROM</div>
              <div style={{ marginTop: 10, fontSize: 38 }}>{from ?? 'KeepTalking'}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 780 }}>
              <div style={label}>AN INVITATION TO</div>
              {/* The address line runs just above the name's last baseline, drawn
                  first so the letters cross it on their way down. */}
              <div style={{ position: 'relative', display: 'flex', marginTop: 14 }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: Math.round(titleSize * RULE),
                    height: 2,
                    background: LINE,
                  }}
                />
                <div
                  style={{
                    display: 'block',
                    fontFamily: 'Instrument Serif, Songti',
                    fontSize: titleSize,
                    lineHeight: 1.02,
                    letterSpacing: -1.5,
                    lineClamp: 2,
                  }}
                >
                  {title}
                </div>
              </div>
              <div style={{ marginTop: 14, fontSize: 32, color: MUTED }}>
                {as ? `Joining as ${as}` : 'on KeepTalking'}
              </div>
            </div>

            {/* The stamp: a plain grey rectangle. */}
            <div
              style={{
                position: 'absolute',
                top: 36,
                right: 44,
                width: 140,
                height: 172,
                background: STAMP,
              }}
            />
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
        ...(song ? [{ name: 'Songti', data: song, weight: 400 as const }] : []),
        ...(sansCJK ? [{ name: 'Sans CJK', data: sansCJK, weight: 400 as const }] : []),
      ],
      headers: { 'Cache-Control': 'public, max-age=86400, immutable' },
    },
  )
}
