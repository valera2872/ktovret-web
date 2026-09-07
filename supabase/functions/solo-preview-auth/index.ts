const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);
const encoder = new TextEncoder();

function clean(value: unknown, max = 600) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}
function allowed(origin = '') { return !origin || configuredOrigins.includes(origin.replace(/\/$/, '')); }
function cors(origin = '') {
  return {
    ...(origin && allowed(origin) ? { 'access-control-allow-origin': origin.replace(/\/$/, '') } : {}),
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-max-age': '600',
    'vary': 'Origin',
  };
}
function json(status: number, body: unknown, origin = '') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store, max-age=0',
      ...cors(origin),
    },
  });
}
async function sha256(value: string) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  return [...digest].map((v) => v.toString(16).padStart(2, '0')).join('');
}
function bearer(req: Request) {
  return (req.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
}

Deno.serve(async (req: Request) => {
  const origin = (req.headers.get('origin') || '').replace(/\/$/, '');
  if (req.method === 'OPTIONS') return allowed(origin) ? new Response(null, { status: 204, headers: cors(origin) }) : new Response(null, { status: 403 });
  if (req.method !== 'GET') return json(405, { error: 'method_not_allowed' }, origin);
  if (!allowed(origin)) return json(403, { error: 'origin_not_allowed' });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'preview_auth_not_configured' }, origin);

  const token = bearer(req);
  if (!/^MLPREVIEW-[A-Za-z0-9_-]{32,100}$/.test(token)) return json(401, { error: 'unauthorized' }, origin);
  const tokenHash = await sha256(token);

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/access_entitlements?select=id,product_id,status,starts_at,expires_at,revoked_at,metadata&token_hash=eq.${tokenHash}&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  if (!response.ok) return json(503, { error: 'preview_auth_store_unavailable' }, origin);
  const rows = await response.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const now = Date.now();
  const startsAt = row?.starts_at ? new Date(row.starts_at).getTime() : 0;
  const expiresAt = row?.expires_at ? new Date(row.expires_at).getTime() : 0;
  const caseId = clean(metadata.case_id, 160);
  const allowedCases = Array.isArray(metadata.allowed_case_ids) ? metadata.allowed_case_ids.map((x: unknown) => clean(x, 160)).filter(Boolean) : [];

  const valid = Boolean(
    row?.id &&
    row?.status === 'active' &&
    !row?.revoked_at &&
    (!startsAt || startsAt <= now) &&
    (!expiresAt || expiresAt > now) &&
    metadata.source === 'internal_preview' &&
    metadata.solo_access_mode === 'owned' &&
    caseId &&
    allowedCases.length === 1 &&
    allowedCases[0] === caseId
  );
  if (!valid) return json(401, { error: 'unauthorized' }, origin);

  return json(200, { ok: true, caseId, productId: clean(row.product_id, 160) }, origin);
});
