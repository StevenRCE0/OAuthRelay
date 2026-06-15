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
