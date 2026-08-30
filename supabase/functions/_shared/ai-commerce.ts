export type AiOfferCode = 'text' | 'live' | 'upgrade_live';
export type AiExperienceTier = 'text' | 'live';

export const AI_OFFER_CATALOG = Object.freeze({
  text: Object.freeze({
    code: 'text' as const,
    displayName: 'Расследование',
    displayPriceEur: '4.90',
    grantsTier: 'text' as const,
    kind: 'initial' as const,
  }),
  live: Object.freeze({
    code: 'live' as const,
    displayName: 'Живое расследование',
    displayPriceEur: '9.90',
    grantsTier: 'live' as const,
    kind: 'initial' as const,
  }),
  upgrade_live: Object.freeze({
    code: 'upgrade_live' as const,
    displayName: 'Добавить живой режим',
    displayPriceEur: '5.00',
    grantsTier: 'live' as const,
    kind: 'upgrade' as const,
  }),
});

const OFFER_CODES = new Set<AiOfferCode>(['text', 'live', 'upgrade_live']);
const TOKEN_HASH_RE = /^[0-9a-f]{64}$/;
const SCOPE_RE = /^[a-zA-Z0-9_.:-]{2,160}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const normalizeAiOfferCode = (value: unknown): AiOfferCode | null => {
  const code = String(value || '').trim().toLowerCase() as AiOfferCode;
  return OFFER_CODES.has(code) ? code : null;
};

export const aiExperienceTier = (metadata: Record<string, unknown> | null | undefined): AiExperienceTier =>
  String(metadata?.experience_tier || '').toLowerCase() === 'live' ? 'live' : 'text';

export const getAiOffer = (value: unknown) => {
  const code = normalizeAiOfferCode(value);
  return code ? AI_OFFER_CATALOG[code] : null;
};

const caseAllowedByMetadata = (metadata: Record<string, any> | null | undefined, caseId: string) => {
  const allowed = Array.isArray(metadata?.allowed_case_ids)
    ? metadata.allowed_case_ids.map((item: unknown) => String(item || ''))
    : [];
  if (allowed.length) return allowed.includes(caseId);
  const scopedCaseId = String(metadata?.case_id || '');
  return !scopedCaseId || scopedCaseId === caseId;
};

const appendOfferHistory = (metadata: Record<string, any>, entry: Record<string, unknown>) => {
  const current = Array.isArray(metadata.offer_history) ? metadata.offer_history.slice(-7) : [];
  return [...current, entry];
};

const assertGrantInput = (input: AiPaidGrantInput) => {
  if (!getAiOffer(input.offerCode)) throw new Error('ai_offer_invalid');
  if (!TOKEN_HASH_RE.test(String(input.tokenHash || ''))) throw new Error('ai_token_hash_invalid');
  if (!SCOPE_RE.test(String(input.productId || ''))) throw new Error('ai_product_id_invalid');
  if (!SCOPE_RE.test(String(input.caseId || ''))) throw new Error('ai_case_id_invalid');
  if (!UUID_RE.test(String(input.orderId || ''))) throw new Error('ai_order_id_invalid');
  if (!String(input.paymentProvider || '').trim()) throw new Error('ai_payment_provider_required');
  if (!String(input.paymentReference || '').trim()) throw new Error('ai_payment_reference_required');
};

export type AiPaidGrantInput = {
  offerCode: AiOfferCode;
  tokenHash: string;
  productId: string;
  caseId: string;
  orderId: string;
  paymentProvider: string;
  paymentReference: string;
  customerEmailHash?: string | null;
};

export type AiPaidGrantResult = {
  entitlementId: string;
  experienceTier: AiExperienceTier;
  upgraded: boolean;
  idempotent: boolean;
};

export const applyAiPaidOffer = async (admin: any, input: AiPaidGrantInput): Promise<AiPaidGrantResult> => {
  assertGrantInput(input);
  const offer = AI_OFFER_CATALOG[input.offerCode];
  const now = new Date().toISOString();

  const { data: existing, error: lookupError } = await admin
    .from('access_entitlements')
    .select('id,token_hash,product_id,status,payment_provider,payment_reference,customer_email_hash,metadata')
    .eq('token_hash', input.tokenHash)
    .eq('product_id', input.productId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (offer.kind === 'upgrade') {
    if (!existing || existing.status !== 'active') throw new Error('ai_upgrade_requires_text_entitlement');
    if (!caseAllowedByMetadata(existing.metadata, input.caseId)) throw new Error('ai_upgrade_wrong_case');

    const metadata = { ...(existing.metadata || {}) };
    if (String(metadata.live_upgrade_order_id || '') === input.orderId) {
      return {
        entitlementId: existing.id,
        experienceTier: aiExperienceTier(metadata),
        upgraded: aiExperienceTier(metadata) === 'live',
        idempotent: true,
      };
    }
    if (aiExperienceTier(metadata) === 'live') throw new Error('ai_upgrade_already_live');

    const nextMetadata = {
      ...metadata,
      case_id: String(metadata.case_id || input.caseId),
      allowed_case_ids: Array.isArray(metadata.allowed_case_ids) && metadata.allowed_case_ids.length
        ? metadata.allowed_case_ids
        : [input.caseId],
      experience_tier: 'live',
      live_upgrade_order_id: input.orderId,
      live_upgrade_payment_provider: input.paymentProvider,
      live_upgrade_payment_reference: input.paymentReference,
      live_upgrade_at: now,
      offer_history: appendOfferHistory(metadata, {
        offer_code: input.offerCode,
        order_id: input.orderId,
        payment_provider: input.paymentProvider,
        payment_reference: input.paymentReference,
        applied_at: now,
      }),
    };

    const { data: updated, error: updateError } = await admin
      .from('access_entitlements')
      .update({ metadata: nextMetadata, updated_at: now })
      .eq('id', existing.id)
      .eq('status', 'active')
      .select('id')
      .single();
    if (updateError || !updated?.id) throw updateError || new Error('ai_upgrade_write_failed');

    return { entitlementId: updated.id, experienceTier: 'live', upgraded: true, idempotent: false };
  }

  if (existing) {
    const metadata = { ...(existing.metadata || {}) };
    if (String(metadata.order_id || '') === input.orderId) {
      return {
        entitlementId: existing.id,
        experienceTier: aiExperienceTier(metadata),
        upgraded: false,
        idempotent: true,
      };
    }
    throw new Error('ai_purchase_token_in_use');
  }

  const metadata = {
    source: 'purchase',
    case_id: input.caseId,
    allowed_case_ids: [input.caseId],
    experience_tier: offer.grantsTier,
    offer_code: offer.code,
    order_id: input.orderId,
    offer_history: [{
      offer_code: offer.code,
      order_id: input.orderId,
      payment_provider: input.paymentProvider,
      payment_reference: input.paymentReference,
      applied_at: now,
    }],
  };

  const { data: created, error: createError } = await admin
    .from('access_entitlements')
    .insert({
      token_hash: input.tokenHash,
      product_id: input.productId,
      status: 'active',
      payment_provider: input.paymentProvider,
      payment_reference: input.paymentReference,
      customer_email_hash: input.customerEmailHash || null,
      starts_at: now,
      expires_at: null,
      revoked_at: null,
      metadata,
      updated_at: now,
    })
    .select('id')
    .single();
  if (createError || !created?.id) throw createError || new Error('ai_entitlement_write_failed');

  return {
    entitlementId: created.id,
    experienceTier: offer.grantsTier,
    upgraded: false,
    idempotent: false,
  };
};

export type AiPaidRefundInput = {
  offerCode: AiOfferCode;
  entitlementId: string;
  orderId: string;
};

export const refundAiPaidOffer = async (admin: any, input: AiPaidRefundInput) => {
  const offer = getAiOffer(input.offerCode);
  if (!offer) throw new Error('ai_offer_invalid');
  if (!UUID_RE.test(String(input.entitlementId || ''))) throw new Error('ai_entitlement_id_invalid');
  if (!UUID_RE.test(String(input.orderId || ''))) throw new Error('ai_order_id_invalid');

  const { data: entitlement, error: lookupError } = await admin
    .from('access_entitlements')
    .select('id,status,metadata')
    .eq('id', input.entitlementId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!entitlement) return { changed: false, experienceTier: null };

  const now = new Date().toISOString();
  const metadata = { ...(entitlement.metadata || {}) };

  if (offer.kind === 'upgrade') {
    if (String(metadata.live_upgrade_order_id || '') !== input.orderId) {
      return { changed: false, experienceTier: aiExperienceTier(metadata) };
    }
    const nextMetadata = { ...metadata, experience_tier: 'text' };
    delete nextMetadata.live_upgrade_order_id;
    delete nextMetadata.live_upgrade_payment_provider;
    delete nextMetadata.live_upgrade_payment_reference;
    delete nextMetadata.live_upgrade_at;
    nextMetadata.live_upgrade_refunded_at = now;

    const { error: updateError } = await admin.from('access_entitlements').update({
      metadata: nextMetadata,
      updated_at: now,
    }).eq('id', entitlement.id).eq('status', 'active');
    if (updateError) throw updateError;
    return { changed: true, experienceTier: 'text' as const };
  }

  if (String(metadata.order_id || '') !== input.orderId) {
    return { changed: false, experienceTier: aiExperienceTier(metadata) };
  }
  if (entitlement.status === 'refunded') {
    return { changed: false, experienceTier: aiExperienceTier(metadata) };
  }

  const { error: refundError } = await admin.from('access_entitlements').update({
    status: 'refunded',
    revoked_at: now,
    updated_at: now,
  }).eq('id', entitlement.id);
  if (refundError) throw refundError;
  return { changed: true, experienceTier: aiExperienceTier(metadata) };
};
