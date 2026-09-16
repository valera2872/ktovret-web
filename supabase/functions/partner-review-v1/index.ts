import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  SUPABASE_URL,
  adminClient,
  cleanOrigin,
  isAllowedOrigin,
  sha256,
  validAccessToken,
} from '../_shared/last-aria-payment.ts';
import { PARTNER_PRODUCT_ID } from '../_shared/partner-commerce.ts';
import { FULL_PARTNER_CASE_ID } from '../_shared/partner-ne-publikovat-content-v2.ts';

const REVIEW_KEY_HASH = '340d6f743084798aef68413958950dedea2ff76224e7472c61f27a9db2a9576b';
const REVIEW_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REVIEW_KEY_RE = /^ml_review_[A-Za-z0-9_-]{32,160}$/;
const REVIEW_PREVIEW_ORIGINS = new Set(['https://rawcdn.githack.com']);
const REVIEW_PROXY_TARGETS = new Set([
  'partner-access-v1',
  'duel-room',
  'partner-session-v2',
  'partner-interrogate-v2',
]);

const reviewOriginAllowed = (origin = '') => !origin
  || isAllowedOrigin(origin)
  || REVIEW_PREVIEW_ORIGINS.has(cleanOrigin(origin));

const reviewCorsHeaders = (origin = '') => ({
  ...(origin && reviewOriginAllowed(origin)
    ? { 'access-control-allow-origin': cleanOrigin(origin) }
    : {}),
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-max-age': '600',
  'vary': 'Origin',
});

const reviewJson = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    ...reviewCorsHeaders(origin),
  },
});

const requireReviewKey = async (value: unknown) => {
  const key = String(value || '').trim();
  if (!REVIEW_KEY_RE.test(key)) throw new Error('review_key_required');
  if ((await sha256(key)) !== REVIEW_KEY_HASH) throw new Error('review_key_invalid');
  return key;
};

const loadEntitlement = async (admin: any, tokenHash: string) => {
  const { data, error } = await admin.from('access_entitlements')
    .select('id,token_hash,product_id,status,starts_at,expires_at,revoked_at,metadata,payment_provider')
    .eq('token_hash', tokenHash)
    .eq('product_id', PARTNER_PRODUCT_ID)
    .maybeSingle();
  if (error) throw new Error('review_access_lookup_failed');
  return data;
};

const isReviewEntitlement = (row: any) => Boolean(
  row
  && row.product_id === PARTNER_PRODUCT_ID
  && row.metadata?.mode === 'review'
  && row.metadata?.case_id === FULL_PARTNER_CASE_ID
);

const activateReview = async (admin: any, tokenHash: string) => {
  const existing = await loadEntitlement(admin, tokenHash);
  if (existing && !isReviewEntitlement(existing)) throw new Error('review_token_conflict');

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + REVIEW_TTL_MS).toISOString();
  const payload = {
    token_hash: tokenHash,
    product_id: PARTNER_PRODUCT_ID,
    status: 'active',
    payment_provider: 'review',
    payment_reference: null,
    customer_email_hash: null,
    starts_at: nowIso,
    expires_at: expiresAt,
    revoked_at: null,
    metadata: {
      mode: 'review',
      source: 'pre_release_review',
      case_id: FULL_PARTNER_CASE_ID,
      partner_seats: 2,
      reset_allowed: true,
    },
    updated_at: nowIso,
  };

  if (existing?.id) {
    const { data, error } = await admin.from('access_entitlements')
      .update(payload)
      .eq('id', existing.id)
      .select('id,expires_at')
      .single();
    if (error || !data?.id) throw new Error('review_access_write_failed');
    return data;
  }

  const { data, error } = await admin.from('access_entitlements')
    .insert(payload)
    .select('id,expires_at')
    .single();
  if (error || !data?.id) throw new Error('review_access_write_failed');
  return data;
};

const requireReviewEntitlement = async (admin: any, tokenHash: string) => {
  const row = await loadEntitlement(admin, tokenHash);
  const now = Date.now();
  if (!isReviewEntitlement(row)
    || row.status !== 'active'
    || row.revoked_at
    || (row.expires_at && new Date(row.expires_at).getTime() <= now)) {
    throw new Error('review_access_required');
  }
  return row;
};

const resetReviewRooms = async (admin: any, entitlementId: string) => {
  const { data: states, error } = await admin.from('partner_room_states')
    .select('room_id')
    .eq('entitlement_id', entitlementId)
    .eq('case_id', FULL_PARTNER_CASE_ID);
  if (error) throw new Error('review_room_lookup_failed');
  const roomIds = [...new Set((states || []).map((row: any) => row.room_id).filter(Boolean))];
  if (!roomIds.length) return 0;
  const { error: deleteError } = await admin.from('duel_rooms').delete().in('id', roomIds);
  if (deleteError) throw new Error('review_room_reset_failed');
  return roomIds.length;
};

const proxyReviewRequest = async (origin: string, body: Record<string, any>) => {
  const target = String(body.target || '').trim();
  if (!REVIEW_PROXY_TARGETS.has(target)) throw new Error('review_proxy_target_invalid');
  const payload = body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
    ? body.payload
    : {};

  if (target === 'duel-room') {
    const action = String(payload.action || '').trim().toLowerCase();
    if (!['preview', 'join', 'status'].includes(action)) throw new Error('review_proxy_action_invalid');
  }

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (target === 'partner-access-v1') {
    const token = String(body.accessToken || '').trim();
    if (!validAccessToken(token)) throw new Error('access_token_required');
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${target}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'private, no-store, max-age=0',
      ...reviewCorsHeaders(origin),
    },
  });
};

const errorStatus = (code: string) => {
  if (['review_key_required', 'invalid_request', 'access_token_required', 'review_proxy_target_invalid', 'review_proxy_action_invalid'].includes(code)) return 400;
  if (['review_key_invalid', 'review_access_required', 'review_token_conflict'].includes(code)) return 403;
  if (code.endsWith('_failed')) return 503;
  return 400;
};

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!reviewOriginAllowed(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: reviewCorsHeaders(origin) });
  }
  if (req.method !== 'POST') return reviewJson(405, { error: 'method_not_allowed' }, origin);
  if (!reviewOriginAllowed(origin)) return reviewJson(403, { error: 'origin_not_allowed' });

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { return reviewJson(400, { error: 'invalid_request' }, origin); }

  try {
    await requireReviewKey(body.reviewKey);
    const action = String(body.action || 'ACTIVATE').trim().toUpperCase();

    if (action === 'PROXY') return await proxyReviewRequest(origin, body);

    const accessToken = String(body.accessToken || '').trim();
    if (!validAccessToken(accessToken)) throw new Error('access_token_required');
    const tokenHash = await sha256(accessToken);
    const admin = adminClient();

    if (action === 'ACTIVATE') {
      const entitlement = await activateReview(admin, tokenHash);
      return reviewJson(200, {
        ok: true,
        reviewMode: true,
        entitlementId: entitlement.id,
        expiresAt: entitlement.expires_at,
      }, origin);
    }

    if (action === 'RESET') {
      const entitlement = await requireReviewEntitlement(admin, tokenHash);
      const deletedRooms = await resetReviewRooms(admin, entitlement.id);
      return reviewJson(200, { ok: true, reviewMode: true, reset: true, deletedRooms }, origin);
    }

    if (action === 'REVOKE') {
      const entitlement = await requireReviewEntitlement(admin, tokenHash);
      await resetReviewRooms(admin, entitlement.id);
      const now = new Date().toISOString();
      const { error } = await admin.from('access_entitlements').update({
        status: 'revoked', revoked_at: now, updated_at: now,
      }).eq('id', entitlement.id);
      if (error) throw new Error('review_access_revoke_failed');
      return reviewJson(200, { ok: true, reviewMode: true, revoked: true }, origin);
    }

    return reviewJson(400, { error: 'invalid_request' }, origin);
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const code = raw.split(':')[0] || 'review_access_failed';
    console.error('partner_review_v1_error', code);
    return reviewJson(errorStatus(code), { error: code }, origin);
  }
});