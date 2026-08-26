import {
  adminClient,
  cleanOrigin,
  corsHeaders,
  isAllowedOrigin,
  json,
  sha256,
} from '../_shared/last-aria-payment.ts';
import {
  REVIEW_DISCOUNT_PRICE_RUB,
  REVIEW_DISCOUNT_RUB,
  REVIEW_DISCOUNT_TTL_DAYS,
} from '../_shared/last-aria-review-discount.ts';

const BROWSER_KEY_RE = /^[a-f0-9]{48}$/;
const CASE_ID_RE = /^[A-Za-z0-9:_-]{3,160}$/;
const PROMO_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DIFFICULTIES = new Set(['too_easy', 'just_right', 'too_hard']);

const makePromoCode = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (value) => PROMO_ALPHABET[value & 31]);
  return `ML-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}-${chars.slice(12, 16).join('')}`;
};

const cleanOptionalName = (value: unknown) => {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, 80) : null;
};

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!isAllowedOrigin(origin)) return json(403, { error: 'origin_not_allowed' });

  let body: any = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }

  const browserKey = String(body.browserKey || '').trim();
  const caseId = String(body.caseId || '').trim();
  const rating = Number(body.rating);
  const comment = String(body.comment || '').trim();
  const difficultyRaw = String(body.difficulty || '').trim();
  const difficulty = difficultyRaw && DIFFICULTIES.has(difficultyRaw) ? difficultyRaw : null;
  const displayName = cleanOptionalName(body.displayName);
  const publicationConsent = body.publicationConsent === true;

  if (!BROWSER_KEY_RE.test(browserKey)) return json(400, { error: 'invalid_browser_key' }, origin);
  if (!CASE_ID_RE.test(caseId)) return json(400, { error: 'invalid_case_id' }, origin);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json(400, { error: 'invalid_rating' }, origin);
  if (comment.length < 20) return json(400, { error: 'review_too_short' }, origin);
  if (comment.length > 2000) return json(400, { error: 'review_too_long' }, origin);

  const reviewerKeyHash = await sha256(browserKey);
  const admin = adminClient();

  // Reward identity is the same browser key already used by case-stats.
  // A review can be stored and rewarded only after this exact browser/case pair
  // has an immutable first-completion row on the server.
  const { data: completion, error: completionError } = await admin
    .from('case_first_results')
    .select('completed_at')
    .eq('case_id', caseId)
    .eq('player_key_hash', reviewerKeyHash)
    .maybeSingle();
  if (completionError) return json(503, { error: 'completion_lookup_failed' }, origin);
  if (!completion?.completed_at) return json(409, { error: 'case_completion_required' }, origin);

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
      updated_at: now,
    }, { onConflict: 'case_id,reviewer_key_hash' })
    .select('id')
    .single();
  if (reviewError || !review?.id) return json(503, { error: 'review_save_failed' }, origin);

  let { data: reward, error: rewardLookupError } = await admin
    .from('review_discount_rewards')
    .select('*')
    .eq('reviewer_key_hash', reviewerKeyHash)
    .maybeSingle();
  if (rewardLookupError) return json(503, { error: 'reward_lookup_failed' }, origin);

  if (!reward) {
    const expiresAt = new Date(Date.now() + REVIEW_DISCOUNT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    for (let attempt = 0; attempt < 3 && !reward; attempt += 1) {
      const code = makePromoCode();
      const { data: created, error: createError } = await admin
        .from('review_discount_rewards')
        .insert({
          review_id: review.id,
          reviewer_key_hash: reviewerKeyHash,
          product_id: 'last_aria',
          code,
          discount_value: REVIEW_DISCOUNT_RUB,
          discounted_price: REVIEW_DISCOUNT_PRICE_RUB,
          expires_at: expiresAt,
        })
        .select('*')
        .single();
      if (!createError && created) {
        reward = created;
        break;
      }
      if (String(createError?.code || '') !== '23505') {
        return json(503, { error: 'reward_create_failed' }, origin);
      }
      const { data: concurrent } = await admin
        .from('review_discount_rewards')
        .select('*')
        .eq('reviewer_key_hash', reviewerKeyHash)
        .maybeSingle();
      if (concurrent) reward = concurrent;
    }
  }

  if (!reward) return json(503, { error: 'reward_create_failed' }, origin);

  const expired = new Date(reward.expires_at).getTime() <= Date.now();
  const used = Boolean(reward.used_at);
  if (expired || used) {
    return json(200, {
      ok: true,
      reviewSaved: true,
      rewardEligible: false,
      rewardReason: used ? 'already_used' : 'expired',
    }, origin);
  }

  return json(200, {
    ok: true,
    reviewSaved: true,
    rewardEligible: true,
    reward: {
      code: reward.code,
      discountRub: Number(reward.discount_value),
      priceRub: Number(reward.discounted_price),
      expiresAt: reward.expires_at,
      productId: reward.product_id,
    },
  }, origin);
});
