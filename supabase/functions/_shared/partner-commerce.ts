import { formatAmount } from './last-aria-payment.ts';
import { tbankPaymentMatchesOrder, tbankRequest } from './last-aria-tbank.ts';
import { FULL_PARTNER_CASE_ID } from './partner-ne-publikovat-content-v2.ts';

export const PARTNER_PRODUCT_ID = 'partner_ne_publikovat';
export const PARTNER_PRICE_RUB = 599;
export const PARTNER_DESCRIPTION = 'Mystery Logic — Premium Partner «Не публиковать»';
export const PARTNER_RECEIPT_NAME = 'Цифровой доступ Mystery Logic — «Не публиковать» на двоих';

export const partnerAmountValue = () => formatAmount(PARTNER_PRICE_RUB);

export const partnerEntitlementUsable = (entitlement: any, now = new Date()) => Boolean(
  entitlement
  && entitlement.product_id === PARTNER_PRODUCT_ID
  && entitlement.status === 'active'
  && !entitlement.revoked_at
  && (!entitlement.starts_at || new Date(entitlement.starts_at) <= now)
  && (!entitlement.expires_at || new Date(entitlement.expires_at) > now)
);

const activatePartnerEntitlement = async (admin: any, order: any, payment: any) => {
  if (!tbankPaymentMatchesOrder(payment, order)) throw new Error('payment_order_mismatch');
  if (String(payment.Status || '') !== 'CONFIRMED') throw new Error('payment_not_confirmed');
  if (String(order.product_id || '') !== PARTNER_PRODUCT_ID) throw new Error('payment_product_mismatch');

  const paymentId = String(payment.PaymentId || '');
  const now = new Date().toISOString();
  const entitlementPayload = {
    token_hash: order.token_hash,
    product_id: PARTNER_PRODUCT_ID,
    status: 'active',
    payment_provider: 'tbank',
    payment_reference: paymentId,
    customer_email_hash: order.customer_email_hash || null,
    starts_at: now,
    expires_at: null,
    revoked_at: null,
    metadata: {
      order_id: order.id,
      source: 'tbank',
      case_id: FULL_PARTNER_CASE_ID,
      partner_seats: 2,
      list_price_rub: PARTNER_PRICE_RUB,
    },
    updated_at: now,
  };

  const { data: existing, error: lookupError } = await admin
    .from('access_entitlements')
    .select('id')
    .eq('token_hash', order.token_hash)
    .eq('product_id', PARTNER_PRODUCT_ID)
    .maybeSingle();
  if (lookupError) throw lookupError;

  let entitlement: any = existing;
  if (existing?.id) {
    const { data, error } = await admin
      .from('access_entitlements')
      .update(entitlementPayload)
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error || !data?.id) throw error || new Error('entitlement_write_failed');
    entitlement = data;
  } else {
    const { data, error } = await admin
      .from('access_entitlements')
      .insert(entitlementPayload)
      .select('id')
      .single();
    if (error || !data?.id) throw error || new Error('entitlement_write_failed');
    entitlement = data;
  }

  const { error: orderError } = await admin.from('payment_orders').update({
    status: 'paid',
    provider_status: 'CONFIRMED',
    paid_at: order.paid_at || now,
    entitlement_id: entitlement.id,
    failure_code: null,
    updated_at: now,
  }).eq('id', order.id);
  if (orderError) throw orderError;
  return entitlement.id;
};

export const finalizePartnerRefund = async (admin: any, order: any) => {
  const now = new Date().toISOString();
  if (order.entitlement_id) {
    const { error } = await admin.from('access_entitlements').update({
      status: 'refunded', revoked_at: now, updated_at: now,
    }).eq('id', order.entitlement_id);
    if (error) throw error;
  } else {
    const { error } = await admin.from('access_entitlements').update({
      status: 'refunded', revoked_at: now, updated_at: now,
    }).eq('token_hash', order.token_hash).eq('product_id', PARTNER_PRODUCT_ID);
    if (error) throw error;
  }

  const { error: orderError } = await admin.from('payment_orders').update({
    status: 'refunded', provider_status: 'REFUNDED', refunded_at: now, updated_at: now,
  }).eq('id', order.id);
  if (orderError) throw orderError;
  return { ...order, status: 'refunded', provider_status: 'REFUNDED' };
};

const CANCELED_STATUSES = new Set(['CANCELED', 'REJECTED', 'REVERSED', 'DEADLINE_EXPIRED']);

export const refreshPartnerTbankOrder = async (admin: any, order: any) => {
  if (!order?.provider_payment_id) return order;
  if (String(order.product_id || '') !== PARTNER_PRODUCT_ID) throw new Error('payment_product_mismatch');

  const payment = await tbankRequest('GetState', { PaymentId: String(order.provider_payment_id) });
  if (!tbankPaymentMatchesOrder(payment, order)) throw new Error('payment_order_mismatch');
  const providerStatus = String(payment.Status || '');

  if (providerStatus === 'CONFIRMED') {
    const entitlementId = await activatePartnerEntitlement(admin, order, payment);
    return { ...order, status: 'paid', provider_status: providerStatus, entitlement_id: entitlementId };
  }
  if (providerStatus === 'REFUNDED') return finalizePartnerRefund(admin, order);
  if (CANCELED_STATUSES.has(providerStatus)) {
    const now = new Date().toISOString();
    await admin.from('payment_orders').update({
      status: 'canceled', provider_status: providerStatus, canceled_at: now, updated_at: now,
    }).eq('id', order.id).neq('status', 'paid');
    return { ...order, status: order.status === 'paid' ? 'paid' : 'canceled', provider_status: providerStatus };
  }

  await admin.from('payment_orders').update({
    provider_status: providerStatus || null,
    status: order.status === 'creating' ? 'pending' : order.status,
    updated_at: new Date().toISOString(),
  }).eq('id', order.id).neq('status', 'paid');
  return { ...order, status: order.status === 'creating' ? 'pending' : order.status, provider_status: providerStatus };
};
