import { createHash } from 'node:crypto'

// The relay's pages are hand-written documents served from route handlers, not
// React pages, so the framework injects no scripts. Each response carries a CSP
// that admits only the stylesheet below and, where a page has one, its single
// inline script — both by SHA-256 of exactly what is served.

export const SOURCE_URL = 'https://github.com/StevenRCE0/OAuthRelay'
export const HOME_URL = 'https://keeptalking.dev'

export const STYLE = `
@font-face { font-family: "Instrument Serif"; font-weight: 400; font-display: swap;
  src: url(/fonts/instrument-serif-latin-400-normal.woff2) format("woff2"); }
@font-face { font-family: "Raleway"; font-weight: 400; font-display: swap;
  src: url(/fonts/raleway-latin-400-normal.woff2) format("woff2"); }
@font-face { font-family: "Raleway"; font-weight: 500; font-display: swap;
  src: url(/fonts/raleway-latin-500-normal.woff2) format("woff2"); }
@font-face { font-family: "JetBrains Mono"; font-weight: 300; font-display: swap;
  src: url(/fonts/jetbrains-mono-latin-300-normal.woff2) format("woff2"); }
@font-face { font-family: "JetBrains Mono"; font-weight: 400; font-display: swap;
  src: url(/fonts/jetbrains-mono-latin-400-normal.woff2) format("woff2"); }

/* Tokens and type scale follow keeptalking.dev (KeepTalkingFront/src/app.css). */
:root {
  color-scheme: light;
  --bg: #f6f6f4; --fg: #0a0a0a; --fg-muted: #5a5a5a; --fg-faint: #888;
  --line: #dadad8; --line-ink: #bbbbba;
  --serif: "Instrument Serif", "Times New Roman", ui-serif, Georgia, serif;
  --sans: "Raleway", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --step--1: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --step-0: clamp(0.95rem, 0.9rem + 0.3vw, 1.05rem);
  --step-1: clamp(1.1rem, 1rem + 0.6vw, 1.35rem);
  --step-2: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --step-3: clamp(2.5rem, 2rem + 3vw, 4.75rem);
  --gutter: clamp(1.5rem, 5vw, 6rem);
}
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0; background: var(--bg); color: var(--fg);
  font-family: var(--sans); font-size: var(--step-0); line-height: 1.55;
  -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
}
a { color: inherit; text-decoration: none; }
h1, h2, p, dl, dd { margin: 0; }
h1, h2 { font-weight: 400; }
.serif { font-family: var(--serif); font-weight: 400; letter-spacing: -0.01em; }
.mono { font-family: var(--mono); font-weight: 300; }
.muted { color: var(--fg-muted); }
.faint { color: var(--fg-faint); }
[hidden] { display: none !important; }

body { min-height: 100vh; display: flex; flex-direction: column; }
.nav { padding: 1.25rem var(--gutter) 1.5rem; }
.brand { font-size: clamp(1.35rem, 1.1rem + 0.9vw, 1.75rem); line-height: 1; }
main {
  flex: 1; display: flex; flex-direction: column; gap: clamp(2.5rem, 6vw, 5rem);
  padding: clamp(1.5rem, 6vw, 5rem) var(--gutter) 3rem; max-width: 60rem;
}
.eyebrow, .label { font-size: var(--step--1); letter-spacing: 0.08em; text-transform: uppercase; }
h1 { margin-top: 1rem; font-size: var(--step-3); line-height: 0.95; overflow-wrap: anywhere; }
.subtitle { margin-top: 1rem; font-size: var(--step--1); letter-spacing: 0.04em; }
.intro { max-width: 43ch; margin-top: 1.75rem; font-size: var(--step-1); line-height: 1.45; }

.rows { border-top: 1px solid var(--line); }
.row {
  display: flex; justify-content: space-between; align-items: baseline; gap: 2rem;
  padding: 1.1rem 0; border-bottom: 1px solid var(--line);
}
.row dd { text-align: right; overflow-wrap: anywhere; }
.row dd .mono { margin-left: 0.6em; font-size: var(--step--1); }
.row h2 { margin-top: 0.5rem; font-size: var(--step-2); line-height: 1; }

.link {
  text-decoration: underline; text-decoration-color: var(--line-ink);
  text-underline-offset: 0.25em; white-space: nowrap;
}
.link:hover { text-decoration-color: currentColor; }
/* The arrow falls back to a system font, whose underline sits elsewhere; an
   inline-block keeps it out of the decoration so only the words are ruled. */
.link span { display: inline-block; margin-left: 0.2em; }
.cta { font-family: var(--serif); font-size: var(--step-2); line-height: 1.2; }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem 2rem; }
.stack { display: flex; flex-direction: column; gap: clamp(2rem, 5vw, 3.5rem); }
.install .rows { margin-top: 1rem; }

footer {
  display: flex; justify-content: space-between; align-items: baseline; gap: 2rem;
  padding: 0 var(--gutter) 2rem; font-size: var(--step--1);
}
@media (max-width: 640px) {
  .row { flex-direction: column; gap: 0.5rem; }
  .row dd { text-align: left; }
  .row dd .mono { display: block; margin: 0.25rem 0 0; }
  footer { flex-direction: column; gap: 0.5rem; }
}
`

export const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const sha256 = (value: string) => `'sha256-${createHash('sha256').update(value).digest('base64')}'`

const STYLE_HASH = sha256(STYLE)

function csp(script?: string) {
  return [
    "default-src 'none'",
    `script-src ${script ? sha256(script) : "'none'"}`,
    `style-src ${STYLE_HASH}`,
    "img-src 'self'",
    "font-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ')
}

// A full document in the keeptalking.dev frame: the wordmark row on top,
// `body` inside <main>, an optional `footer` line, and `script` (if any) as the
// page's only script. `head` goes after the shared meta and stylesheet.
export function htmlResponse({
  head,
  body,
  footer,
  script,
}: {
  head: string
  body: string
  footer?: string
  script?: string
}) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<link rel="icon" href="/favicon.svg">
${head}
<style>${STYLE}</style>
</head>
<body>
<nav class="nav"><a class="brand serif" href="${HOME_URL}">KeepTalking</a></nav>
<main>
${body}
</main>
${footer ? `<footer class="muted">${footer}</footer>` : ''}
${script ? `<script>${script}</script>` : ''}
</body>
</html>`
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': csp(script),
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
