import { createHash } from 'node:crypto'

// The relay's pages are hand-written documents served from route handlers, not
// React pages, so the framework injects no scripts. Each response carries a CSP
// that admits only the stylesheet below (with any additions of the page's own)
// and, where a page has one, its single inline script — both by SHA-256 of
// exactly what is served.

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

/* Tokens and components follow PassKeyValue (Resources/Utils/styles.css), so
   the services around KeepTalking read as one family: a centred wordmark, one
   square card, and an action bar along the card's foot. */
:root {
  color-scheme: light dark;
  --paper: #f6f6f4; --panel: #fbfbfa; --ink: #0a0a0a; --muted: #5a5a5a; --faint: #888;
  --line: #dadad8; --line-firm: #c7c7c5; --wash: #ededeb; --wash-faint: #f1f1ef;
  --accent: #7949b0;
  /* Instrument Serif carries no CJK, so Chinese in serif text falls through to
     Songti (or the nearest Song face a platform has). Sans text keeps the
     system's own CJK face. */
  --serif: "Instrument Serif", "Songti SC", "STSong", "Songti TC", "SimSun", "Noto Serif CJK SC",
    "Source Han Serif SC", "Noto Serif SC", "Times New Roman", ui-serif, Georgia, serif;
  --sans: "Raleway", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #0e0e0d; --panel: #151514; --ink: #f2f2f0; --muted: #a3a3a0; --faint: #757573;
    --line: #2a2a28; --line-firm: #3a3a38; --wash: #232321; --wash-faint: #1b1b1a;
    --accent: #b48ce6;
  }
}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
html {
  background: var(--paper); color: var(--ink); font-family: var(--sans); line-height: 1.5;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}
a { color: inherit; text-decoration: none; }
h1, h2, p, ul { margin: 0; }
ul { padding: 0; list-style: none; }
[hidden] { display: none !important; }

.page {
  position: relative; isolation: isolate; min-height: 100vh;
  display: flex; flex-direction: column; align-items: center; padding: 3rem 1.5rem;
}
.page-glow {
  pointer-events: none; position: absolute; inset: 0 0 auto; z-index: -1; height: 18rem;
  background: linear-gradient(to bottom, color-mix(in srgb, var(--accent) 7%, transparent), transparent);
}
.brand { font-family: var(--serif); font-size: 1.875rem; line-height: 2.25rem; letter-spacing: -0.01em; }
.card {
  margin-top: 2.5rem; width: 100%; max-width: 28rem;
  border: 1px solid var(--line); background: var(--panel); padding: 1.75rem;
}
.stack { display: flex; flex-direction: column; gap: 1.5rem; }
.title {
  font-family: var(--serif); font-weight: 400; font-size: 2.25rem; line-height: 1.1;
  letter-spacing: -0.02em; overflow-wrap: anywhere;
}
.label + .title { margin-top: 0.75rem; }
.subtitle { margin-top: 0.5rem; font-size: 0.875rem; line-height: 1.25rem; color: var(--muted); }
.label {
  display: block; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--muted);
}
.muted { color: var(--muted); }
.emphasis { font-weight: 500; color: var(--ink); }
.mono { font-family: var(--mono); font-weight: 300; }
.note { font-size: 0.75rem; line-height: 1rem; color: var(--muted); }

.list { border-block: 1px solid var(--line); }
.list-row {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  padding: 0.75rem 0; font-size: 0.875rem; line-height: 1.25rem;
}
.list-row + .list-row { border-top: 1px solid var(--line); }
.list-row > :last-child { text-align: right; overflow-wrap: anywhere; }

.actions {
  display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); border: 1px solid var(--line);
}
.actions > * + * { border-left: 1px solid var(--line); }
.card-actions { margin: 0 -1.75rem -1.75rem; border-inline: 0; border-bottom: 0; }
.action {
  display: block; width: 100%; height: 100%; padding: 0.875rem 1rem; text-align: center;
  font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; color: var(--muted);
  transition: color 0.15s, background-color 0.15s;
}
.action:hover, .action:focus-visible { background: var(--wash-faint); color: var(--ink); outline: none; }
.action-primary { color: var(--ink); }
.action-primary:hover, .action-primary:focus-visible { color: var(--accent); }
.link-action {
  display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; font-weight: 500;
  transition: color 0.15s;
}
.link-action::after { content: "→"; }
.link-action:hover { color: var(--accent); }

/* One quiet line at the trailing edge of the content column; a page whose
   column is wider than the card widens it to match. */
.footer {
  margin-top: 3rem; width: 100%; max-width: 28rem;
  display: flex; align-items: center; justify-content: flex-end; gap: 1rem;
  font-size: 0.75rem; line-height: 1rem; color: var(--faint);
}
.footer a { display: flex; color: var(--muted); transition: color 0.15s; }
.footer a:hover { color: var(--ink); }
.footer svg { width: 1rem; height: 1rem; }

@media (min-width: 640px) {
  .page { padding-block: 5rem; }
  .card { padding: 2.25rem; }
  .card-actions { margin: 0 -2.25rem -2.25rem; }
}
`

export const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const sha256 = (value: string) => `'sha256-${createHash('sha256').update(value).digest('base64')}'`

function csp(style: string, script?: string) {
  return [
    "default-src 'none'",
    `script-src ${script ? sha256(script) : "'none'"}`,
    `style-src ${sha256(style)}`,
    "img-src 'self'",
    "font-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ')
}

// The GitHub mark, inline so the CSP needs no image source for it.
const GITHUB_MARK = `<svg viewBox="0 0 98 96" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/></svg>`

// A full document in PassKeyValue's frame: the wordmark, `body` inside the card,
// `after` (if any) beneath it, the footer line, and `script` (if any) as the
// page's only script. `head` goes after the shared meta and stylesheet, and
// `style` extends the stylesheet for this page.
export function htmlResponse({
  head,
  body,
  after = '',
  script,
  style = '',
}: {
  head: string
  body: string
  after?: string
  script?: string
  style?: string
}) {
  const css = STYLE + style
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<link rel="icon" href="/favicon.svg">
${head}
<style>${css}</style>
</head>
<body>
<div class="page">
<div class="page-glow"></div>
<a class="brand" href="${HOME_URL}">KeepTalking</a>
<main class="card">
${body}
</main>
${after}
<footer class="footer">
<span>KeepTalking Ltd.</span>
<a href="${SOURCE_URL}" aria-label="Source on GitHub" title="Source on GitHub">${GITHUB_MARK}</a>
</footer>
</div>
${script ? `<script>${script}</script>` : ''}
</body>
</html>`
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': csp(css, script),
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
