# oauth-relay

A minimal Vercel-hosted relay that bridges OAuth authorization callbacks from providers that reject custom URI schemes (e.g. `myapp://`) back to your native app.

## Why this exists

OAuth providers such as Vercel require `redirect_uri` to use `https://`. Native apps (iOS, macOS, Android) typically handle callbacks via a custom scheme registered with the OS. This relay sits in between: it receives the `https://` callback, then issues a `302` redirect to your app's custom scheme.

```
Native app  →  System browser  →  OAuth provider
                                        │
Native app  ←  Browser redirect  ←  This relay (https://)
```

The relay only forwards `code`, `state`, and error fields — it never touches tokens or secrets.

## Deployment

### 1. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/oauth-relay)

Or via CLI:

```sh
npm install
vercel deploy
```

### 2. Set environment variables

| Variable | Required | Description |
|---|---|---|
| `OAUTH_CALLBACK_SCHEME` | **Yes** | The custom URI scheme your native app handles (e.g. `myapp`). |
| `OAUTH_CALLBACK_PATH` | **Yes** | The path within that scheme (e.g. `oauth/callback`). The relay redirects to `{scheme}://{path}?…`. |

Set them in the Vercel dashboard under **Project → Settings → Environment Variables**, or with:

```sh
vercel env add OAUTH_CALLBACK_SCHEME
vercel env add OAUTH_CALLBACK_PATH
```

### 3. Register the relay URL with your OAuth provider

Use `https://your-relay.vercel.app/api/auth/callback` as the allowed callback URL in your OAuth application settings.

### 4. Configure your native app

Pass `https://your-relay.vercel.app` as the relay base URL in your app's build config so the authorization request uses the relay URL as `redirect_uri`.

## Callback endpoint

```
GET /api/auth/callback?code=...&state=...
```

On success, redirects to:

```
{OAUTH_CALLBACK_SCHEME}://oauth/callback?code=...&state=...
```

On provider error, redirects to:

```
{OAUTH_CALLBACK_SCHEME}://oauth/callback?error=...&error_description=...
```

On missing `code` with no `error`, returns `400 { "error": "missing_code" }`.

## Security notes

- The relay cannot redirect to an arbitrary URL — the destination scheme is fixed by the `OAUTH_CALLBACK_SCHEME` env var set at deploy time.
- The relay does not exchange the authorization code for a token. Code exchange happens inside the native app using PKCE, keeping your OAuth client secret out of this service entirely.
- `state` is passed through opaquely. Validate it inside your native app against the value you generated before opening the browser.

## Front door

`/` is a short introduction that links to keeptalking.dev and to this repository. Every path without a route of its own gets a temporary (307) redirect there. The OAuth callback, `/context` and the apple-app-site-association file are never redirected. All pages are hand-written HTML served from route handlers (`lib/page.ts`), so they load no framework scripts.

## Context invites (`/context`)

The relay also fronts KeepTalking context invites, so they can be tapped in any app, get a link preview, and tell new users where to get the app:

```
https://your-relay/context#ktctx:<token>
```

An invite token is a bearer credential (it carries the context's group secret), so it rides the URL **fragment**. Browsers never send the fragment to the server, and never put it in `Referer` either. This relay only ever sees `GET /context`, and nothing it logs can carry an invite. The `ktctx:` link inside the fragment is the real invite. The app accepts it bare, and anyone can strip the wrapper by hand.

- **Installed apps** claim `/context` as a universal link through `/.well-known/apple-app-site-association` and open the invite directly, without loading the page.
- **Everyone else** gets a static page with generic OpenGraph tags, install links, and an "Open in KeepTalking" button.
  - The page's single inline script fills the button and shows the context name, the inviter, and their friendly names (`lib/friendlyName.ts`, a verbatim copy of the SDK's `UUIDFriendlyName` word lists). It decodes the fragment in the browser.
  - The script makes no requests, stores nothing, writes everything with `textContent`, and never reads the secret.
- **The page is a route handler, not a React page**, so the framework injects no scripts. Its `Content-Security-Policy` admits only that one script and that one stylesheet, by SHA-256 hash, computed at startup from what is served.
- **The link-preview image** (`/og/invite`) is generic on purpose. Crawlers never see the fragment, so the sending device supplies the rich preview instead.

| Variable | Required | Description |
|---|---|---|
| `APPLE_APP_IDS` | For universal links | Comma-separated `<TeamID>.<bundle id>` list allowed to claim `/context`. Unset serves no apple-app-site-association. |
| `INVITE_IOS_URL` | No | Install link for iPhone and iPad shown on `/context` (e.g. TestFlight). |
| `INVITE_MAC_URL` | No | Install link for Mac shown on `/context`. |

The app's entitlements must list `applinks:<your relay host>`. KeepTalking takes this from the `INVITE_LINK_HOST` build setting.
