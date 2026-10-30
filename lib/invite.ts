// What /context and /og/invite know about an invite before any script runs.
//
// The invite itself (the ktctx token, with the context's secret) rides the URL
// fragment and never reaches this server. Next to it, the app puts the names a
// recipient should see in the query, so link previews and the first paint can
// show them:
//
//   https://<this relay>/context?name=<context>&from=<inviter>&as=<role>#ktctx:<token>
//
// Every field is optional and only ever displayed. They are the inviter's own
// labels, the same ones the token carries, so the page swaps in the token's
// copy once it has decoded the fragment.

export type InviteLabels = {
  name?: string
  from?: string
  as?: string
}

const MAX_LENGTH = 80

function label(params: URLSearchParams, key: string) {
  const value = (params.get(key) ?? '').replace(/\s+/g, ' ').trim()
  if (!value) return undefined
  const chars = Array.from(value)
  return chars.length > MAX_LENGTH ? `${chars.slice(0, MAX_LENGTH - 1).join('')}…` : value
}

export function inviteLabels(params: URLSearchParams): InviteLabels {
  return { name: label(params, 'name'), from: label(params, 'from'), as: label(params, 'as') }
}

export function inviteQuery(labels: InviteLabels) {
  const params = new URLSearchParams()
  for (const key of ['name', 'from', 'as'] as const) {
    if (labels[key]) params.set(key, labels[key]!)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}
