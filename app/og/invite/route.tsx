import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { inviteLabels } from '@/lib/invite'

// The OpenGraph card for /context: the invite page's card, drawn in the same
// PassKeyValue frame. Crawlers fetch the invite without its fragment, so the
// card shows only the names /context passes along from its query
// (lib/invite.ts); with none it is the generic invitation. The fonts are read
// from public/ (the renderer takes woff, not woff2) and traced into the
// function by next.config.ts.

const font = (file: string) => readFile(join(process.cwd(), 'public/fonts', file))

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

const PAPER = '#f6f6f4'
const PANEL = '#fbfbfa'
const INK = '#0a0a0a'
const MUTED = '#5a5a5a'
const LINE = '#dadad8'
// The page's glow (the accent at 7%), resolved against PAPER: the renderer
// blends a translucent stop far stronger than a browser does.
const GLOW = '#edeaef'

export async function GET(request: NextRequest) {
  const { name, from, as } = inviteLabels(new URL(request.url).searchParams)
  const length = Array.from(name ?? '').length
  const title = name ?? 'A conversation on KeepTalking'
  const [serif, sans, song, sansCJK] = await Promise.all([
    font('instrument-serif-latin-400-normal.woff'),
    font('raleway-latin-400-normal.woff'),
    cjkFont('Noto+Serif+SC', title),
    cjkFont('Noto+Sans+SC', [from, as].join(' ')),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '64px 0 0',
          background: `linear-gradient(to bottom, ${GLOW}, ${PAPER} 300px)`,
          color: INK,
          fontFamily: 'Raleway, Sans CJK',
        }}
      >
        <div style={{ fontFamily: 'Instrument Serif', fontSize: 52, letterSpacing: -0.5 }}>KeepTalking</div>
        <div
          style={{
            marginTop: 40,
            width: 960,
            display: 'flex',
            flexDirection: 'column',
            border: `2px solid ${LINE}`,
            background: PANEL,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', padding: '48px 56px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 30, color: MUTED }}>
              {from ? (
                <span style={{ color: INK, marginRight: 9 }}>{from}</span>
              ) : null}
              {from ? 'invited you to join' : "You've been invited to join"}
            </div>
            <div
              style={{
                display: 'block',
                marginTop: 10,
                fontFamily: 'Instrument Serif, Songti',
                fontSize: length > 40 ? 56 : length > 22 ? 68 : 84,
                lineHeight: 1.1,
                letterSpacing: -1.5,
                lineClamp: 2,
              }}
            >
              {title}
            </div>
            {as ? <div style={{ fontSize: 28, color: MUTED, marginTop: 14 }}>{`Joining as ${as}`}</div> : null}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '26px 0',
              borderTop: `2px solid ${LINE}`,
              fontSize: 30,
            }}
          >
            Join
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
        ...(song ? [{ name: 'Songti', data: song, weight: 400 as const }] : []),
        ...(sansCJK ? [{ name: 'Sans CJK', data: sansCJK, weight: 400 as const }] : []),
      ],
      headers: { 'Cache-Control': 'public, max-age=86400, immutable' },
    },
  )
}
