import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const origins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);

const EVENTS = new Set([
  'page_view',
  'engaged_15s',
  'engaged_45s',
  'scroll_50',
  'primary_action',
  'format_choice',
  'game_open',
  'game_accept',
  'game_answer_attempt',
  'game_complete',
  'review_view',
  'review_submit',
  'checkout_open',
  'checkout_start',
  'checkout_success',
  'no_action_45s',
  'diagnostic_choice',
]);

const cleanOrigin = (value = '') => value.trim().replace(/\/$/, '');
const allowed = (origin = '') => !origin || origins.includes(cleanOrigin(origin));
const cors = (origin = '') => ({
  ...(origin && allowed(origin) ? { 'access-control-allow-origin': cleanOrigin(origin) } : {}),
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-max-age': '600',
  'vary': 'Origin',
});
const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...cors(origin),
  },
});
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes))
  .map((value) => value.toString(16).padStart(2, '0')).join('');
const sha256 = async (value: string) => hex(await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(value),
));

const safeMeta = (value: unknown) => {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const output: Record<string, string | number | boolean> = {};
  for (const key of ['label', 'choice', 'case_id', 'product', 'source', 'position', 'scroll_pct', 'elapsed_bucket', 'href_group']) {
    const item = source[key];
    if (typeof item === 'boolean') output[key] = item;
    else if (typeof item === 'number' && Number.isFinite(item)) output[key] = Math.max(-999999, Math.min(999999, item));
    else if (typeof item === 'string' && item.length <= 160) output[key] = item;
  }
  return output;
};

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    return allowed(origin)
      ? new Response(null, { status: 204, headers: cors(origin) })
      : new Response(null, { status: 403 });
  }
  if (!allowed(origin)) return json(403, { error: 'origin_not_allowed' });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  let body: any = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }

  const browserKey = String(body.browserKey || '').trim();
  const sessionKey = String(body.sessionKey || '').trim();
  const eventName = String(body.eventName || '').trim();
  const pagePath = String(body.pagePath || '').trim();
  const pageGroup = String(body.pageGroup || '').trim();
  const target = String(body.target || '').trim().slice(0, 300) || null;
  const referrerHost = String(body.referrerHost || '').trim().toLowerCase().slice(0, 200) || null;

  if (!/^[a-f0-9]{48}$/.test(browserKey)) return json(400, { error: 'invalid_browser_key' }, origin);
  if (!/^[a-f0-9]{32,64}$/.test(sessionKey)) return json(400, { error: 'invalid_session_key' }, origin);
  if (!EVENTS.has(eventName)) return json(400, { error: 'invalid_event' }, origin);
  if (!/^\/[A-Za-z0-9_~!$&'()*+,;=:@%./-]{0,499}$/.test(pagePath)) return json(400, { error: 'invalid_path' }, origin);
  if (!/^[a-z0-9_-]{2,64}$/.test(pageGroup)) return json(400, { error: 'invalid_page_group' }, origin);
  if (referrerHost && !/^[a-z0-9.-]{1,200}$/.test(referrerHost)) return json(400, { error: 'invalid_referrer' }, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.from('site_funnel_events').insert({
    visitor_key_hash: await sha256(browserKey),
    session_key_hash: await sha256(sessionKey),
    event_name: eventName,
    page_path: pagePath,
    page_group: pageGroup,
    target,
    referrer_host: referrerHost,
    metadata: safeMeta(body.metadata),
  });
  if (error) {
    console.error('funnel_insert_failed', error.code, error.message);
    return json(503, { error: 'write_failed' }, origin);
  }
  return json(200, { ok: true }, origin);
});
