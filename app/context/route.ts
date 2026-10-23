import type { NextRequest } from 'next/server'
import { JOIN_SCRIPT } from '@/lib/joinScript'
import { HOME_URL, escape, htmlResponse } from '@/lib/page'

// Landing page for KeepTalking context invites:
//
//   https://<this relay>/context#ktctx:<token>
//
// The token is in the fragment, so it never reaches this server — not the
// request, not the logs, not Referer. Installed apps claim the URL as a
// universal link and never load this page; it is for people who don't have
// the app yet, or whose browser opened the link directly. JOIN_SCRIPT is the
// only code that runs here (see lib/page.ts).

const TITLE = 'Join a conversation on KeepTalking'
const DESCRIPTION = "You've been invited to a conversation on KeepTalking. Open the link on a device with KeepTalking installed to join."

// Install links for people without the app, numbered like keeptalking.dev/beta.
function installRows() {
  const builds = [
    { kind: 'Mobile', platform: 'iPhone &amp; iPad', href: process.env.INVITE_IOS_URL, action: 'Join Beta Testing' },
    { kind: 'Desktop', platform: 'macOS', href: process.env.INVITE_MAC_URL, action: 'Download DMG' },
  ].filter((build) => build.href)
  if (builds.length === 0) return ''
  const rows = builds.map(
    (build, i) => `
      <div class="row">
        <div><p class="label mono faint">0${i + 1} / ${build.kind}</p><h2 class="serif">${build.platform}</h2></div>
        <a class="link" href="${escape(build.href!)}">${build.action}<span aria-hidden="true">↗</span></a>
      </div>`,
  )
  return `
  <section class="install">
    <p class="eyebrow mono muted">New to KeepTalking</p>
    <div class="rows">${rows.join('')}</div>
  </section>`
}

export function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  const url = `${origin}/context`
  const image = `${origin}/og/invite`

  return htmlResponse({
    head: `<meta name="robots" content="noindex">
<title>${TITLE}</title>
<meta name="description" content="${escape(DESCRIPTION)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="KeepTalking">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${escape(DESCRIPTION)}">
<meta property="og:url" content="${escape(url)}">
<meta property="og:image" content="${escape(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${TITLE}">
<meta name="twitter:description" content="${escape(DESCRIPTION)}">
<meta name="twitter:image" content="${escape(image)}">`,
    body: `  <section id="generic">
    <p class="eyebrow mono muted">Invitation</p>
    <h1 class="serif">Join a conversation on KeepTalking.</h1>
    <p class="intro muted">Open the invite link on a device with KeepTalking installed.</p>
  </section>
  <section id="incomplete" hidden>
    <p class="eyebrow mono muted">Invitation</p>
    <h1 class="serif">This invite link is incomplete.</h1>
    <p class="intro muted">Ask the sender to share it again, and make sure the whole link was copied.</p>
  </section>
  <div class="stack" id="invite" hidden>
    <section>
      <p class="eyebrow mono muted">You're invited to</p>
      <h1 class="serif" id="context-name"></h1>
      <p class="subtitle mono faint" id="context-id" hidden></p>
    </section>
    <dl class="rows" id="meta" hidden>
      <div class="row" id="inviter" hidden>
        <dt class="label mono faint">From</dt>
        <dd><span id="inviter-name"></span><span class="mono faint" id="inviter-id" hidden></span></dd>
      </div>
      <div class="row" id="slot" hidden>
        <dt class="label mono faint">Joining as</dt>
        <dd id="slot-alias"></dd>
      </div>
    </dl>
    <div class="actions">
      <a class="link cta" id="open" href="#">Open in KeepTalking<span aria-hidden="true">↗</span></a>
    </div>
  </div>
  ${installRows()}`,
    footer: `<span>After installing, tap the invite link again.</span>
<a class="link" href="${HOME_URL}">keeptalking.dev</a>`,
    script: JOIN_SCRIPT,
  })
}
