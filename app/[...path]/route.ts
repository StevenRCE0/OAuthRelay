import type { NextRequest } from 'next/server'

// Any path without a route of its own goes to the relay's front door
// (app/route.ts). Static routes always win over this catch-all, so /context,
// /api/auth/callback and /.well-known/* are never redirected. Temporary (307),
// so a path that gains a real route later isn't stuck in someone's cache.
function toFrontDoor(request: NextRequest) {
  return Response.redirect(new URL('/', request.url), 307)
}

export const GET = toFrontDoor
export const HEAD = toFrontDoor
