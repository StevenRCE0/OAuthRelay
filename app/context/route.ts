import type { NextRequest } from 'next/server'
import { JOIN_SCRIPT } from '@/lib/joinScript'
import { inviteLabels, inviteQuery, type InviteLabels } from '@/lib/invite'
import { HOME_URL, escape, htmlResponse } from '@/lib/page'

// Landing page for KeepTalking context invites:
//
//   https://<this relay>/context?name=…&from=…&as=…#ktctx:<token>
//
// The token is in the fragment, so it never reaches this server — not the
// request, not the logs, not Referer. The query only carries the names to show
// (lib/invite.ts), which is all this server renders: the title, the OpenGraph
// tags and the first paint. Installed apps claim the URL as a universal link
// and never load this page; it is for people who don't have the app yet, or
// whose browser opened the link directly. JOIN_SCRIPT is the only code that
// runs here (see lib/page.ts), and it fills in the rest from the token.

const TITLE = 'Join a conversation on KeepTalking'
const DESCRIPTION = "You've been invited to a conversation on KeepTalking. Open the link on a device with KeepTalking installed to join."

function describe({ name, from, as }: InviteLabels) {
  if (!name) return DESCRIPTION
  const invited = from ? `${from} invited you to join ${name} on KeepTalking.` : `You've been invited to join ${name} on KeepTalking.`
  return as ? `${invited} You'll join as ${as}.` : invited
}

const STYLE = `
/* A roomier card than the frame's default, sat lower on the first screen. */
.page { padding-top: clamp(3rem, 12vh, 7rem); }
.card { margin-top: clamp(2.5rem, 6vh, 3.5rem); max-width: 30rem; }
.card .stack { gap: 1.75rem; }
.invited { margin-bottom: 0.75rem; font-size: 0.875rem; line-height: 1.25rem; color: var(--muted); }
.card .title { font-size: 2.5rem; }
@media (min-width: 640px) {
  .card { padding: 2.75rem; }
  .card .card-actions { margin: 0 -2.75rem -2.75rem; }
}
/* Once the page scrolls down to the install section, the card recedes and the
   dock takes over at the top. */
.card { transition: opacity 0.3s ease, transform 0.3s ease; }
.is-docked .card { opacity: 0; transform: scale(0.94); }

/* The card, cut down to its name and Join, pinned to the top. */
.dock {
  position: fixed; z-index: 10; top: 0.75rem; left: 0; right: 0; margin: 0 auto;
  width: calc(100% - 1.5rem); max-width: 26rem;
  display: flex; align-items: stretch; border: 1px solid var(--line); background: var(--panel);
  box-shadow: 0 12px 32px -18px rgb(0 0 0 / 0.25);
  visibility: hidden; opacity: 0; transform: translateY(-0.75rem) scale(0.94); transform-origin: top center;
  transition: opacity 0.25s ease, transform 0.25s ease, visibility 0s linear 0.25s;
}
.dock.is-shown { visibility: visible; opacity: 1; transform: none; transition-delay: 0s; }
.dock-text { flex: 1; min-width: 0; padding: 0.7rem 1.1rem; }
.dock-text p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dock-invited { font-size: 0.75rem; line-height: 1rem; color: var(--muted); }
.dock-title { font-family: var(--serif); font-size: 1.35rem; line-height: 1.2; letter-spacing: -0.01em; }
.dock .action {
  width: auto; height: auto; display: flex; align-items: center; padding: 0 1.75rem;
  border-left: 1px solid var(--line);
}
@media (prefers-reduced-motion: reduce) {
  .dock { transform: none; }
  .card { animation: none; }
}

/* New to KeepTalking: the install rows, as keeptalking.dev/beta numbers them. */
.install { margin-top: clamp(7rem, 28vh, 12rem); width: 100%; max-width: 40rem; }
.row-label {
  font-family: var(--mono); font-weight: 300; font-size: 0.8rem; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--faint);
}
.install .intro {
  font-family: var(--serif); font-weight: 400; font-size: clamp(2.25rem, 1.7rem + 2.2vw, 3.25rem);
  line-height: 1.05; letter-spacing: -0.01em;
}
.install .lede { margin-top: 0.9rem; color: var(--muted); }
.lede .link { color: var(--ink); }
.rows { margin-top: 2.5rem; border-top: 1px solid var(--line); }
.row {
  display: flex; justify-content: space-between; align-items: baseline; gap: 2rem;
  padding: 1.4rem 0; border-bottom: 1px solid var(--line);
}
.row h2 {
  margin-top: 0.5rem; font-family: var(--serif); font-weight: 400;
  font-size: clamp(1.5rem, 1.3rem + 1vw, 2rem); line-height: 1;
}
.link {
  text-decoration: underline; text-decoration-color: var(--line-firm); text-underline-offset: 0.25em;
  white-space: nowrap; transition: text-decoration-color 0.15s;
}
.link:hover { text-decoration-color: currentColor; }
/* The arrow falls back to a system font, whose underline sits elsewhere; an
   inline-block keeps it out of the decoration so only the words are ruled. */
.link span { display: inline-block; margin-left: 0.2em; }
@media (max-width: 640px) {
  .row { flex-direction: column; gap: 0.75rem; }
}
`

// Install links for people without the app, numbered like keeptalking.dev/beta,
// in their own section a scroll below the invite.
function install() {
  const builds = [
    { kind: 'Mobile', platform: 'iPhone &amp; iPad', href: process.env.INVITE_IOS_URL, action: 'Join Beta Testing' },
    { kind: 'Desktop', platform: 'macOS', href: process.env.INVITE_MAC_URL, action: 'Download DMG' },
  ].filter((build) => build.href)
  if (builds.length === 0) return ''
  const rows = builds.map(
    (build, i) => `
    <div class="row">
      <div><p class="row-label">0${i + 1} / ${build.kind}</p><h2>${build.platform}</h2></div>
      <a class="link" href="${escape(build.href!)}">${build.action}<span aria-hidden="true">↗</span></a>
    </div>`,
  )
  return `<section class="install" aria-labelledby="install-title">
  <h2 class="intro" id="install-title">New to KeepTalking?</h2>
  <p class="lede">Get the app, then open this invite again. <a class="link" href="${HOME_URL}">Learn more<span aria-hidden="true">↗</span></a></p>
  <div class="rows">${rows.join('')}
  </div>
</section>`
}

// The compact card the page docks at the top; JOIN_SCRIPT fills and shows it.
const DOCK = `<div class="dock" id="dock" hidden>
  <div class="dock-text">
    <p class="dock-invited" id="dock-invited"></p>
    <p class="dock-title" id="dock-title"></p>
  </div>
  <a class="action action-primary" id="dock-join" href="#">Join</a>
</div>`

export function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url)
  const labels = inviteLabels(searchParams)
  const query = inviteQuery(labels)
  const url = `${origin}/context${query}`
  const image = `${origin}/og/invite${query}`
  const title = labels.name ? `Join ${labels.name} on KeepTalking` : TITLE
  const description = describe(labels)
  const { name, from, as } = labels

  return htmlResponse({
    head: `<meta name="robots" content="noindex">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="KeepTalking">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${escape(url)}">
<meta property="og:image" content="${escape(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${escape(image)}">`,
    style: STYLE,
    body: `<div class="stack">
  <div>
    <p class="invited" id="invited-by"${from ? '' : ' hidden'}><span class="emphasis" id="inviter-name">${escape(from ?? '')}</span> invited you to join</p>
    <p class="invited" id="invited"${from ? ' hidden' : ''}>You've been invited to join</p>
    <h1 class="title" id="context-name">${escape(name ?? 'A conversation on KeepTalking')}</h1>
  </div>
  <ul class="list" id="details"${as ? '' : ' hidden'}>
    <li class="list-row" id="slot"${as ? '' : ' hidden'}><span class="muted">Joining as</span><span class="emphasis" id="slot-alias">${escape(as ?? '')}</span></li>
    <li class="list-row" id="context-id-row" hidden><span class="muted">Conversation</span><span class="mono" id="context-id"></span></li>
  </ul>
  <p class="note" id="hint">Open the invite link on a device with KeepTalking installed.</p>
  <p class="note" id="incomplete" hidden>This invite link is incomplete. Ask the sender to share it again, and make sure the whole link was copied.</p>
  <div class="actions card-actions" id="actions" hidden>
    <a class="action action-primary" id="open" href="#">Join</a>
  </div>
</div>`,
    after: `${DOCK}
${install()}`,
    script: JOIN_SCRIPT,
  })
}
