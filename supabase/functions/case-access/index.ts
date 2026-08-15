import { createClient } from 'npm:@supabase/supabase-js@2';

const PRODUCT_ID = 'volume1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',')
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    'vary': 'Origin',
    ...(origin ? { 'access-control-allow-origin': origin } : {}),
  },
});

const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes))
  .map((value) => value.toString(16).padStart(2, '0'))
  .join('');

const sha256 = async (value: string) => hex(await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(value),
));

Deno.serve(async (req: Request) => {
  const origin = (req.headers.get('origin') || '').replace(/\/$/, '');
  const allowedOrigin = !origin || configuredOrigins.includes(origin);

  if (req.method === 'OPTIONS') {
    if (!allowedOrigin) return new Response(null, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin ? { 'access-control-allow-origin': origin } : {}),
        'access-control-allow-headers': 'authorization, content-type',
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-max-age': '600',
        'vary': 'Origin',
      },
    });
  }

  if (req.method !== 'GET') return json(405, { error: 'method_not_allowed' }, origin);
  if (!allowedOrigin) return json(403, { error: 'origin_not_allowed' });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  const auth = req.headers.get('authorization') || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() || '';
  if (token.length < 32 || token.length > 512) return json(401, { error: 'access_token_required' }, origin);

  const caseId = new URL(req.url).searchParams.get('case_id')?.trim() || '';
  if (!/^[a-zA-Z0-9_:-]{3,160}$/.test(caseId)) return json(400, { error: 'invalid_case_id' }, origin);

  const tokenHash = await sha256(token);
  const now = new Date();
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: entitlement, error: entitlementError } = await admin
    .from('access_entitlements')
    .select('id,product_id,status,starts_at,expires_at,revoked_at,metadata')
    .eq('token_hash', tokenHash)
    .eq('product_id', PRODUCT_ID)
    .eq('status', 'active')
    .maybeSingle();

  if (entitlementError) return json(503, { error: 'access_check_failed' }, origin);
  if (!entitlement) return json(403, { error: 'access_denied' }, origin);
  if (entitlement.revoked_at) return json(403, { error: 'access_revoked' }, origin);
  if (entitlement.starts_at && new Date(entitlement.starts_at) > now) return json(403, { error: 'access_not_started' }, origin);
  if (entitlement.expires_at && new Date(entitlement.expires_at) <= now) return json(403, { error: 'access_expired' }, origin);

  const { data: paidCase, error: caseError } = await admin
    .from('paid_case_payloads')
    .select('case_id,product_id,language,payload,payload_version')
    .eq('case_id', caseId)
    .eq('product_id', PRODUCT_ID)
    .eq('status', 'published')
    .maybeSingle();

  if (caseError) return json(503, { error: 'case_lookup_failed' }, origin);
  if (!paidCase) return json(404, { error: 'case_not_found' }, origin);

  const rawOrderId = String(entitlement.metadata?.order_id || '');
  const orderId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawOrderId)
    ? rawOrderId
    : null;

  const { error: auditError } = await admin.from('paid_access_audit').insert({
    entitlement_id: entitlement.id,
    order_id: orderId,
    product_id: PRODUCT_ID,
    case_id: paidCase.case_id,
    event_type: 'payload_delivered',
    payload_version: paidCase.payload_version,
    metadata: {
      source: 'case_access',
      source_origin: origin || null,
    },
  });
  if (auditError) console.error('paid_access_audit_failed', auditError.message);

  return json(200, {
    ok: true,
    caseId: paidCase.case_id,
    productId: paidCase.product_id,
    language: paidCase.language,
    payloadVersion: paidCase.payload_version,
    config: paidCase.payload,
  }, origin);
});
