// apple-app-site-association: lets the apps listed in APPLE_APP_IDS claim
// /context as a universal link, so an installed app opens invites directly and
// this server never serves the page that would see the fragment.
//
// Unset APPLE_APP_IDS means no app claims this host, and the file 404s.
export function GET() {
  const appIDs = (process.env.APPLE_APP_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  if (appIDs.length === 0) {
    return new Response('Not Found', { status: 404 })
  }

  return Response.json(
    {
      applinks: {
        details: [
          {
            appIDs,
            components: [{ '/': '/context', comment: 'Context invites; the token rides the fragment.' }],
          },
        ],
      },
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
