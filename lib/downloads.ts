import { HOME_URL } from './page'

// The KeepTalking builds /context offers to people without the app. The list
// lives with keeptalking.dev (KeepTalkingFront: src/lib/downloads.js), which
// renders the same rows on /beta and publishes them as /downloads.json, so a
// new build or link only ever changes there. DOWNLOADS_URL points a relay
// elsewhere.
//
// A build without an `href` is work in progress: listed, with nothing to
// download yet.

export type Download = {
  kind: string
  platform: string
  meta: string
  action?: string
  href?: string
}

const SOURCE = process.env.DOWNLOADS_URL || `${HOME_URL}/downloads.json`

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)

// Only https links are offered; a build with any other `href` reads as in
// progress.
function parse(entry: unknown): Download | null {
  if (!entry || typeof entry !== 'object') return null
  const fields = entry as Record<string, unknown>
  const kind = text(fields.kind)
  const platform = text(fields.platform)
  if (!kind || !platform) return null
  const build: Download = { kind, platform, meta: text(fields.meta) ?? '' }
  const href = text(fields.href)
  const action = text(fields.action)
  return href?.startsWith('https://') && action ? { ...build, href, action } : build
}

// Cached for an hour like the page itself. A slow or failed fetch leaves the
// page without its install section rather than holding up the invite.
export async function downloads(): Promise<Download[]> {
  try {
    const response = await fetch(SOURCE, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(2500) })
    if (!response.ok) return []
    const list: unknown = await response.json()
    return Array.isArray(list) ? list.map(parse).filter((build): build is Download => build !== null) : []
  } catch {
    return []
  }
}
