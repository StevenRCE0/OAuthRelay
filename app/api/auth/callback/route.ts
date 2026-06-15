import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const scheme = process.env.OAUTH_CALLBACK_SCHEME
  const path = process.env.OAUTH_CALLBACK_PATH
  if (!scheme || !path) {
    return NextResponse.json(
      { error: 'relay_misconfigured', error_description: 'OAUTH_CALLBACK_SCHEME and OAUTH_CALLBACK_PATH are required' },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)

  const error = searchParams.get('error')
  if (error) {
    const params = new URLSearchParams({ error })
    const desc = searchParams.get('error_description')
    if (desc) params.set('error_description', desc)
    return NextResponse.redirect(`${scheme}://${path}?${params}`)
  }

  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 })
  }

  const params = new URLSearchParams({ code })
  const state = searchParams.get('state')
  if (state) params.set('state', state)

  return NextResponse.redirect(`${scheme}://${path}?${params}`)
}
