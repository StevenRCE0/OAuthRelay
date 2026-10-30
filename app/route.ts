import { HOME_URL, SOURCE_URL, htmlResponse } from '@/lib/page'

// The relay's front door. Every unknown path redirects here too (app/[...path]).

const TITLE = 'KeepTalking Relay'
const DESCRIPTION =
  'A small public relay for KeepTalking: it hands OAuth sign-ins back to the app and opens invite links.'

export function GET() {
  return htmlResponse({
    head: `<title>${TITLE}</title>
<meta name="description" content="${DESCRIPTION}">`,
    body: `<div class="stack">
  <div>
    <p class="label">Relay</p>
    <h1 class="title">Nothing to see here.</h1>
    <p class="subtitle">A small, open-source relay for KeepTalking. It hands OAuth sign-ins back to the app and opens conversation invites, and never sees your tokens or invite secrets.</p>
  </div>
  <div class="actions card-actions">
    <a class="action" href="${SOURCE_URL}">Source on GitHub</a>
    <a class="action action-primary" href="${HOME_URL}">Go to keeptalking.dev</a>
  </div>
</div>`,
  })
}
