import { ADJECTIVES, NOUNS } from './friendlyName'

// The only script /context runs. It is served inline and pinned in the CSP by
// its SHA-256, so nothing else can execute on the page.
//
// The invite token lives in the URL fragment, which browsers never send to
// this server. This script reads it in the browser, fills the "Open" button,
// and shows who the invite is from — and that is all: no network, no storage,
// no cookies, and it never touches the payload's `secret`. Every value is
// written with textContent.
const BODY = `
const A = __ADJECTIVES__;
const N = __NOUNS__;
const $ = (id) => document.getElementById(id);
const show = (id) => { $(id).hidden = false; };

const hexBytes = (uuid) => {
  const hex = String(uuid || '').replace(/-/g, '');
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) return null;
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
};

// Mirrors UUIDFriendlyName.code(for:) and name(for:) in the SDK.
const friendlyName = async (uuid) => {
  const bytes = hexBytes(uuid);
  if (!bytes || !window.crypto || !crypto.subtle) return null;
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  return [A[d[0]], A[d[1]], N[d[2]]].map(cap).join(' ');
};

const decode = (token) => {
  let b64 = token.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
};

const text = (value) => (typeof value === 'string' ? value.trim() : '');

const run = async () => {
  if (!location.hash) return;
  const match = /^#ktctx:(?:\\/\\/)?([A-Za-z0-9_=-]+)$/.exec(location.hash);
  let invite = null;
  try { invite = match && decode(match[1]); } catch (e) { invite = null; }
  if (!invite || typeof invite !== 'object' || !hexBytes(invite.id)) {
    $('generic').hidden = true;
    show('incomplete');
    return;
  }

  $('open').href = 'ktctx://' + match[1];

  const contextFriendly = await friendlyName(invite.id);
  const contextName = text(invite.contextName);
  $('context-name').textContent = contextName || contextFriendly || 'a conversation';
  if (contextName && contextFriendly) {
    $('context-id').textContent = contextFriendly;
    show('context-id');
  }

  if (hexBytes(invite.inviter)) {
    const inviterFriendly = await friendlyName(invite.inviter);
    const inviterName = text(invite.inviterName);
    $('inviter-name').textContent = inviterName || inviterFriendly || '';
    if (inviterName && inviterFriendly) {
      $('inviter-id').textContent = inviterFriendly;
      show('inviter-id');
    }
    if (inviterName || inviterFriendly) { show('inviter'); show('meta'); }
  }

  const slotAlias = text(invite.slotAlias);
  if (slotAlias) {
    $('slot-alias').textContent = slotAlias;
    show('slot');
    show('meta');
  }

  $('generic').hidden = true;
  show('invite');
};

run();
`

export const JOIN_SCRIPT = `(() => {${BODY
  .replace('__ADJECTIVES__', JSON.stringify(ADJECTIVES))
  .replace('__NOUNS__', JSON.stringify(NOUNS))}})();`
