import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const origins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CASE_ID_RE = /^[A-Za-z0-9:_-]{3,160}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,158}[a-z0-9]$/;
const EXPIRY_DAYS = new Set([0, 7, 30, 90, 365]);

const cleanOrigin = (value = '') => value.trim().replace(/\/$/, '');
const allowed = (origin = '') => !origin || origins.includes(cleanOrigin(origin));
const cors = (origin = '') => ({
  ...(origin && allowed(origin) ? { 'access-control-allow-origin': cleanOrigin(origin) } : {}),
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-max-age': '600',
  'vary': 'Origin',
});
const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    ...cors(origin),
  },
});
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes))
  .map((value) => value.toString(16).padStart(2, '0')).join('');
const sha256 = async (value: string) => hex(await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(value),
));
const adminClient = () => createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function authorize(req: Request, admin: any) {
  const raw = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!/^MLADM-[A-Za-z0-9_-]{30,100}$/.test(raw)) return false;
  const tokenHash = await sha256(raw);
  const { data, error } = await admin
    .from('review_moderation_access')
    .select('id,active')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error || !data?.active) return false;
  await admin.from('review_moderation_access')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);
  return true;
}

const makeRewardCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(28));
  const chars = Array.from(bytes, (value) => CODE_ALPHABET[value & 31]);
  const groups = Array.from({ length: 7 }, (_, index) => chars.slice(index * 4, index * 4 + 4).join(''));
  return `ml_reward_${groups.join('-')}`;
};

const publicRow = (row: any) => ({
  id: row.id,
  productId: row.product_id,
  status: row.status,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  revokedAt: row.revoked_at,
  caseId: String(row.metadata?.case_id || ''),
  caseTitle: String(row.metadata?.case_title || 'Премиальное дело'),
  targetPath: String(row.metadata?.target_path || '/'),
  note: String(row.metadata?.note || ''),
  codeHint: String(row.metadata?.code_hint || ''),
  activatedAt: row.metadata?.activated_at || null,
  lastActivatedAt: row.metadata?.last_activated_at || null,
  activationCount: Number(row.metadata?.activation_count || 0) || 0,
  feedbackAt: row.metadata?.feedback_at || null,
});

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    return allowed(origin)
      ? new Response(null, { status: 204, headers: cors(origin) })
      : new Response(null, { status: 403 });
  }
  if (!allowed(origin)) return json(403, { error: 'origin_not_allowed' });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);
  const admin = adminClient();
  if (!(await authorize(req, admin))) return json(401, { error: 'unauthorized' }, origin);

  if (req.method === 'GET') {
    const { data, error } = await admin
      .from('access_entitlements')
      .select('id,product_id,status,created_at,expires_at,revoked_at,metadata')
      .contains('metadata', { source: 'player_reward' })
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) return json(503, { error: 'reward_list_failed' }, origin);
    return json(200, { ok: true, rewards: (data || []).map(publicRow) }, origin);
  }

  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  let body: any = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }
  const action = String(body.action || '').trim();

  if (action === 'revoke') {
    const id = String(body.id || '').trim();
    if (!UUID_RE.test(id)) return json(400, { error: 'invalid_reward_id' }, origin);
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from('access_entitlements')
      .update({ status: 'revoked', revoked_at: now, updated_at: now })
      .eq('id', id)
      .contains('metadata', { source: 'player_reward' })
      .select('id,product_id,status,created_at,expires_at,revoked_at,metadata')
      .maybeSingle();
    if (error || !data) return json(404, { error: 'reward_not_found' }, origin);
    return json(200, { ok: true, reward: publicRow(data) }, origin);
  }

  if (action !== 'create') return json(400, { error: 'invalid_action' }, origin);
  const targetType = String(body.targetType || '').trim();
  const note = String(body.note || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 1000);
  const expiryDays = Number(body.expiryDays ?? 90);
  if (!Number.isInteger(expiryDays) || !EXPIRY_DAYS.has(expiryDays)) {
    return json(400, { error: 'invalid_expiry' }, origin);
  }

  let productId = '';
  let caseId = '';
  let caseTitle = '';
  let targetPath = '';

  if (targetType === 'last_aria') {
    productId = 'last_aria';
    caseId = 'special:last-aria';
    caseTitle = 'Последняя ария';
    targetPath = '/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/';
  } else if (targetType === 'volume_case') {
    caseId = String(body.caseId || '').trim();
    const slug = String(body.slug || '').trim();
    if (!CASE_ID_RE.test(caseId) || !SLUG_RE.test(slug)) return json(400, { error: 'invalid_case_target' }, origin);
    const { data: paidCase, error: paidCaseError } = await admin
      .from('paid_case_payloads')
      .select('case_id,product_id,payload')
      .eq('case_id', caseId)
      .eq('product_id', 'volume1')
      .eq('status', 'published')
      .maybeSingle();
    if (paidCaseError) return json(503, { error: 'case_lookup_failed' }, origin);
    if (!paidCase) return json(404, { error: 'premium_case_not_found' }, origin);
    productId = 'volume1';
    caseTitle = String(paidCase.payload?.case?.title || 'Премиальное дело').slice(0, 180);
    targetPath = `/delo/${slug}/`;
  } else {
    return json(400, { error: 'invalid_target_type' }, origin);
  }

  const expiresAt = expiryDays === 0
    ? null
    : new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeRewardCode();
    const tokenHash = await sha256(code);
    const metadata = {
      source: 'player_reward',
      case_id: caseId,
      case_title: caseTitle,
      target_path: targetPath,
      allowed_case_ids: [caseId],
      note,
      code_hint: `••••-${code.slice(-4)}`,
      created_via: 'reward-admin',
      activation_count: 0,
    };
    const { data: created, error } = await admin
      .from('access_entitlements')
      .insert({
        token_hash: tokenHash,
        product_id: productId,
        status: 'active',
        expires_at: expiresAt,
        metadata,
      })
      .select('id,product_id,status,created_at,expires_at,revoked_at,metadata')
      .single();
    if (!error && created) {
      return json(201, {
        ok: true,
        code,
        reward: publicRow(created),
        activationUrl: 'https://mysterylogic.com/bonus/',
      }, origin);
    }
    if (String(error?.code || '') !== '23505') return json(503, { error: 'reward_create_failed' }, origin);
  }
  return json(503, { error: 'reward_code_generation_failed' }, origin);
});
