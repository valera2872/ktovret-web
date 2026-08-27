import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);

const REWARD_CODE_RE = /^ml_reward_(?:[A-HJ-NP-Z2-9]{4}-){6}[A-HJ-NP-Z2-9]{4}$/;
const DIFFICULTIES = new Set(['too_easy', 'just_right', 'too_hard']);

const cleanOrigin = (value = '') => value.trim().replace(/\/$/, '');
const allowedOrigin = (origin = '') => !origin || configuredOrigins.includes(cleanOrigin(origin));
const cors = (origin = '') => ({
  ...(origin && allowedOrigin(origin) ? { 'access-control-allow-origin': cleanOrigin(origin) } : {}),
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
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
const normalizeCode = (value: unknown) => {
  const raw = String(value || '').trim().replace(/\s+/g, '');
  const match = raw.match(/^ml_reward_(.+)$/i);
  return match ? `ml_reward_${match[1].toUpperCase()}` : raw;
};
const cleanOptionalName = (value: unknown) => {
  const text = String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, 80) : null;
};

const adminClient = () => createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type RewardEntitlement = {
  id: string;
  token_hash: string;
  product_id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  metadata: Record<string, any> | null;
};

const rewardError = (row: RewardEntitlement | null) => {
  if (!row || row.metadata?.source !== 'player_reward') return 'reward_invalid';
  if (row.status !== 'active' || row.revoked_at) return 'reward_revoked';
  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return 'reward_not_started';
  if (row.expires_at && new Date(row.expires_at).getTime() <= now) return 'reward_expired';
  return '';
};

const publicReward = (row: RewardEntitlement) => ({
  productId: row.product_id,
  caseId: String(row.metadata?.case_id || ''),
  caseTitle: String(row.metadata?.case_title || 'Премиальное дело'),
  targetPath: String(row.metadata?.target_path || '/'),
  expiresAt: row.expires_at,
  activatedAt: row.metadata?.activated_at || null,
  feedbackAt: row.metadata?.feedback_at || null,
});

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!allowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!allowedOrigin(origin)) return json(403, { error: 'origin_not_allowed' });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }
  const action = String(body.action || 'status').trim();
  if (!['status', 'activate', 'feedback'].includes(action)) return json(400, { error: 'invalid_action' }, origin);

  const code = normalizeCode(body.code);
  if (!REWARD_CODE_RE.test(code)) return json(400, { error: 'reward_invalid' }, origin);
  const tokenHash = await sha256(code);
  const admin = adminClient();
  const { data, error } = await admin
    .from('access_entitlements')
    .select('id,token_hash,product_id,status,starts_at,expires_at,revoked_at,metadata')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error) return json(503, { error: 'reward_lookup_failed' }, origin);
  const entitlement = data as RewardEntitlement | null;
  const entitlementError = rewardError(entitlement);
  if (entitlementError) {
    const status = entitlementError === 'reward_invalid' ? 404 : entitlementError === 'reward_not_started' ? 409 : 410;
    return json(status, { error: entitlementError }, origin);
  }
  const reward = entitlement as RewardEntitlement;

  if (action === 'status') {
    return json(200, { ok: true, reward: publicReward(reward) }, origin);
  }

  if (action === 'activate') {
    const now = new Date().toISOString();
    const metadata = reward.metadata || {};
    const activationCount = Math.max(0, Number(metadata.activation_count || 0) || 0) + 1;
    const nextMetadata = {
      ...metadata,
      activated_at: metadata.activated_at || now,
      last_activated_at: now,
      activation_count: Math.min(activationCount, 1000000),
    };
    const { data: updated, error: updateError } = await admin
      .from('access_entitlements')
      .update({ metadata: nextMetadata, updated_at: now })
      .eq('id', reward.id)
      .eq('status', 'active')
      .select('id,token_hash,product_id,status,starts_at,expires_at,revoked_at,metadata')
      .maybeSingle();
    if (updateError || !updated) return json(503, { error: 'reward_activate_failed' }, origin);
    return json(200, { ok: true, reward: publicReward(updated as RewardEntitlement) }, origin);
  }

  const metadata = reward.metadata || {};
  if (!metadata.activated_at) return json(409, { error: 'reward_activation_required' }, origin);
  const caseId = String(metadata.case_id || '').trim();
  if (!/^[A-Za-z0-9:_-]{3,160}$/.test(caseId)) return json(409, { error: 'reward_target_invalid' }, origin);

  const rating = Number(body.rating);
  const comment = String(body.comment || '').trim();
  const difficultyRaw = String(body.difficulty || '').trim();
  const difficulty = difficultyRaw && DIFFICULTIES.has(difficultyRaw) ? difficultyRaw : null;
  const displayName = cleanOptionalName(body.displayName);
  const publicationConsent = body.publicationConsent === true;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json(400, { error: 'invalid_rating' }, origin);
  if (comment.length < 20) return json(400, { error: 'review_too_short' }, origin);
  if (comment.length > 2000) return json(400, { error: 'review_too_long' }, origin);

  const reviewerKeyHash = await sha256(`reward-review:${reward.token_hash}`);
  const now = new Date().toISOString();
  const { data: review, error: reviewError } = await admin
    .from('case_reviews')
    .upsert({
      case_id: caseId,
      reviewer_key_hash: reviewerKeyHash,
      rating,
      comment,
      difficulty,
      display_name: displayName,
      publication_consent: publicationConsent,
      moderation_status: 'pending',
      moderation_note: 'Отзыв игрока, получившего благодарственный доступ',
      moderated_at: null,
      updated_at: now,
    }, { onConflict: 'case_id,reviewer_key_hash' })
    .select('id')
    .single();
  if (reviewError || !review?.id) return json(503, { error: 'review_save_failed' }, origin);

  const nextMetadata = { ...metadata, feedback_at: now, feedback_review_id: review.id };
  const { error: metadataError } = await admin
    .from('access_entitlements')
    .update({ metadata: nextMetadata, updated_at: now })
    .eq('id', reward.id);
  if (metadataError) console.error('reward_feedback_metadata_failed', metadataError.message);

  return json(200, {
    ok: true,
    reviewSaved: true,
    reward: { ...publicReward(reward), feedbackAt: now },
  }, origin);
});
