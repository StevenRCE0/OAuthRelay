import { ADJECTIVES, NOUNS } from './friendlyName'

// The only script /context runs. It is served inline and pinned in the CSP by
// its SHA-256, so nothing else can execute on the page.
//
// The invite token lives in the URL fragment, which browsers never send to
// this server. The server renders the card from the names in the query; this
// script reads the token in the browser, fills the "Open" button, and redraws
// the card from the token's own names and friendly names — and that is all: no
// network, no storage, no cookies, and it never touches the payload's `secret`.
// Every value is written with textContent.
const BODY = `
const A = __ADJECTIVES__;
const N = __NOUNS__;
const $ = (id) => document.getElementById(id);
const toggle = (id, visible) => { $(id).hidden = !visible; };

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

const text = (value) => (typeof value === 'string' ? value.replace(/\\s+/g, ' ').trim() : '');

const incomplete = () => {
  toggle('hint', false);
  toggle('incomplete', true);
};

const run = async () => {
  // No fragment: a bare /context stays the generic card, but one that names a
  // conversation lost its token on the way here.
  if (!location.hash) {
    if (new URLSearchParams(location.search).get('name')) incomplete();
    return;
  }
  const match = /^#ktctx:(?:\\/\\/)?([A-Za-z0-9_=-]+)$/.exec(location.hash);
  let invite = null;
  try { invite = match && decode(match[1]); } catch (e) { invite = null; }
  if (!invite || typeof invite !== 'object' || !hexBytes(invite.id)) {
    incomplete();
    return;
  }

  const contextFriendly = await friendlyName(invite.id);
  const contextName = text(invite.contextName);
  const name = contextName || contextFriendly;
  $('context-name').textContent = name || 'A conversation on KeepTalking';
  $('context-id').textContent = contextName && contextFriendly ? contextFriendly : '';
  toggle('context-id-row', contextName && contextFriendly);

  const inviter = hexBytes(invite.inviter) ? (text(invite.inviterName) || await friendlyName(invite.inviter)) : text(invite.inviterName);
  $('inviter-name').textContent = inviter || '';
  toggle('invited-by', inviter);
  toggle('invited', !inviter);

  const slotAlias = text(invite.slotAlias);
  $('slot-alias').textContent = slotAlias;
  toggle('slot', slotAlias);
  toggle('details', slotAlias || (contextName && contextFriendly));

  $('open').href = 'ktctx://' + match[1];
  toggle('actions', true);
  $('hint').textContent = 'Nothing happening? KeepTalking may not be installed on this device yet.';

  dock(name, inviter, 'ktctx://' + match[1]);
};

// Once the page scrolls down to the install section (or, without one, past the
// card's Join), the card recedes and the dock (the card cut down to its name
// and Join) takes its place at the top.
const dock = (name, inviter, href) => {
  if (!window.IntersectionObserver) return;
  const bar = $('dock');
  $('dock-invited').textContent = inviter ? inviter + ' invited you to join' : "You've been invited to join";
  $('dock-title').textContent = name || 'A conversation on KeepTalking';
  $('dock-join').href = href;
  bar.inert = true;
  bar.hidden = false;
  const install = document.querySelector('.install');
  new IntersectionObserver(([entry]) => {
    const reached = install
      ? (entry.isIntersecting || entry.boundingClientRect.top < 0) && window.scrollY > 0
      : !entry.isIntersecting && entry.boundingClientRect.top < 0;
    document.body.classList.toggle('is-docked', reached);
    bar.classList.toggle('is-shown', reached);
    bar.inert = !reached;
  }, install ? { rootMargin: '0px 0px -35% 0px' } : {}).observe(install || $('actions'));
};

run();
`

export const JOIN_SCRIPT = `(() => {${BODY
  .replace('__ADJECTIVES__', JSON.stringify(ADJECTIVES))
  .replace('__NOUNS__', JSON.stringify(NOUNS))}})();`
