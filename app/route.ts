import { HOME_URL, SOURCE_URL, htmlResponse } from '@/lib/page'

// The relay's front door. Every unknown path redirects here too (app/[...path]).

const TITLE = 'KeepTalking Relay'
const DESCRIPTION =
  'A small public relay for KeepTalking: it hands OAuth sign-ins back to the app and opens invite links.'

export function GET() {
  return htmlResponse({
    head: `<title>${TITLE}</title>
<meta name="description" content="${DESCRIPTION}">`,
    body: `  <section>
    <p class="eyebrow mono muted">Relay</p>
    <h1 class="serif">Nothing to see here.</h1>
    <p class="intro muted">A small, open-source relay for KeepTalking. It hands OAuth sign-ins back to the app and opens conversation invites, and never sees your tokens or invite secrets.</p>
  </section>
  <div class="actions">
    <a class="link cta" href="${HOME_URL}">Go to keeptalking.dev<span aria-hidden="true">↗</span></a>
    <a class="link cta" href="${SOURCE_URL}">Source on GitHub<span aria-hidden="true">↗</span></a>
  </div>`,
  })
}
