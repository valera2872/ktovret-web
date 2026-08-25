import { formatAmount } from './last-aria-payment.ts';

export const REVIEW_DISCOUNT_RUB = 50;
export const REVIEW_DISCOUNT_PRICE_RUB = 249;
export const REVIEW_DISCOUNT_TTL_DAYS = 7;
export const REVIEW_DISCOUNT_RESERVATION_MINUTES = 30;

const PROMO_RE = /^ML-[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}$/;

export const normalizeReviewDiscountCode = (value: unknown) => String(value || '').trim().toUpperCase();
export const validReviewDiscountCode = (value: unknown) => PROMO_RE.test(normalizeReviewDiscountCode(value));
export const reviewDiscountAmountValue = () => formatAmount(REVIEW_DISCOUNT_PRICE_RUB);

const staleCutoffIso = () => new Date(Date.now() - REVIEW_DISCOUNT_RESERVATION_MINUTES * 60_000).toISOString();

const cleanupStaleEmailReservation = async (admin: any, emailHash: string) => {
  const { error } = await admin
    .from('review_discount_rewards')
    .update({
      reserved_order_id: null,
      reserved_at: null,
      claimed_email_hash: null,
    })
    .eq('claimed_email_hash', emailHash)
    .is('used_at', null)
    .lt('reserved_at', staleCutoffIso());
  if (error) throw new Error('review_discount_cleanup_failed');
};

export const reserveReviewDiscount = async (
  admin: any,
  codeInput: unknown,
  orderId: string,
  emailHash: string,
) => {
  const code = normalizeReviewDiscountCode(codeInput);
  if (!validReviewDiscountCode(code)) throw new Error('review_discount_invalid');

  await cleanupStaleEmailReservation(admin, emailHash);

  let { data: reward, error: lookupError } = await admin
    .from('review_discount_rewards')
    .select('*')
    .eq('code', code)
    .eq('product_id', 'last_aria')
    .maybeSingle();
  if (lookupError) throw new Error('review_discount_lookup_failed');
  if (!reward) throw new Error('review_discount_invalid');
  if (reward.used_at) throw new Error('review_discount_used');
  if (new Date(reward.expires_at).getTime() <= Date.now()) throw new Error('review_discount_expired');

  if (reward.reserved_order_id && reward.reserved_order_id !== orderId) {
    const reservedAt = reward.reserved_at ? new Date(reward.reserved_at).getTime() : 0;
    if (reservedAt && reservedAt <= Date.now() - REVIEW_DISCOUNT_RESERVATION_MINUTES * 60_000) {
      const { error: releaseError } = await admin
        .from('review_discount_rewards')
        .update({ reserved_order_id: null, reserved_at: null, claimed_email_hash: null })
        .eq('id', reward.id)
        .eq('reserved_order_id', reward.reserved_order_id)
        .is('used_at', null);
      if (releaseError) throw new Error('review_discount_cleanup_failed');
      reward = { ...reward, reserved_order_id: null, reserved_at: null, claimed_email_hash: null };
    } else {
      throw new Error('review_discount_in_use');
    }
  }

  if (reward.reserved_order_id === orderId) {
    if (reward.claimed_email_hash !== emailHash) throw new Error('review_discount_in_use');
    return reward;
  }

  const { data: emailClaim, error: emailClaimError } = await admin
    .from('review_discount_rewards')
    .select('id,used_at,reserved_order_id,reserved_at')
    .eq('claimed_email_hash', emailHash)
    .maybeSingle();
  if (emailClaimError) throw new Error('review_discount_lookup_failed');
  if (emailClaim?.used_at) throw new Error('review_discount_already_used');
  if (emailClaim?.reserved_order_id) throw new Error('review_discount_in_use');

  const now = new Date().toISOString();
  const { data: reserved, error: reserveError } = await admin
    .from('review_discount_rewards')
    .update({
      reserved_order_id: orderId,
      reserved_at: now,
      claimed_email_hash: emailHash,
    })
    .eq('id', reward.id)
    .is('used_at', null)
    .is('reserved_order_id', null)
    .is('claimed_email_hash', null)
    .select('*')
    .maybeSingle();

  if (reserveError) {
    if (String(reserveError.code || '') === '23505') throw new Error('review_discount_in_use');
    throw new Error('review_discount_reserve_failed');
  }
  if (!reserved) throw new Error('review_discount_in_use');
  return reserved;
};

export const releaseReviewDiscountReservation = async (admin: any, orderId: string) => {
  const { error } = await admin
    .from('review_discount_rewards')
    .update({
      reserved_order_id: null,
      reserved_at: null,
      claimed_email_hash: null,
    })
    .eq('reserved_order_id', orderId)
    .is('used_at', null);
  if (error) throw new Error('review_discount_release_failed');
};

export const settleReviewDiscountForOrder = async (admin: any, order: any) => {
  const rewardId = String(order?.metadata?.review_discount_reward_id || '').trim();
  if (!rewardId) return null;

  const { data: reward, error: lookupError } = await admin
    .from('review_discount_rewards')
    .select('*')
    .eq('id', rewardId)
    .maybeSingle();
  if (lookupError) throw new Error('review_discount_lookup_failed');
  if (!reward) throw new Error('review_discount_missing');

  if (reward.used_at) {
    if (String(reward.used_order_id || '') !== String(order.id || '')) throw new Error('review_discount_used');
    return reward.id;
  }

  if (String(reward.reserved_order_id || '') !== String(order.id || '')) throw new Error('review_discount_not_reserved');
  if (!order.customer_email_hash || reward.claimed_email_hash !== order.customer_email_hash) {
    throw new Error('review_discount_email_mismatch');
  }
  if (new Date(reward.expires_at).getTime() <= Date.now()) {
    // A discount that was valid and reserved at checkout remains valid for that payment session.
    // Expiry prevents new reservations; it does not invalidate an already-created bank payment.
  }

  const now = new Date().toISOString();
  const { data: settled, error: settleError } = await admin
    .from('review_discount_rewards')
    .update({
      used_order_id: order.id,
      used_at: now,
      reserved_order_id: null,
      reserved_at: null,
    })
    .eq('id', reward.id)
    .eq('reserved_order_id', order.id)
    .is('used_at', null)
    .select('id')
    .maybeSingle();
  if (settleError) throw new Error('review_discount_settle_failed');
  if (!settled?.id) throw new Error('review_discount_settle_failed');
  return settled.id;
};
