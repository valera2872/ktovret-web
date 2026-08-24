import { formatAmount } from './payment.ts';
import {
  amountToKopecks,
  tbankPaymentMatchesOrder,
  tbankRequest,
} from './tbank.ts';

export const LAST_ARIA_PRODUCT_ID = 'last_aria';
export const LAST_ARIA_PRICE_RUB = 299;
export const LAST_ARIA_DESCRIPTION = 'Mystery Logic — детективное дело «Последняя ария»';
export const LAST_ARIA_RECEIPT_NAME = 'Цифровой доступ Mystery Logic — «Последняя ария»';

export const lastAriaAmountValue = () => formatAmount(LAST_ARIA_PRICE_RUB);
export const lastAriaAmountKopecks = () => amountToKopecks(LAST_ARIA_PRICE_RUB);

const activateEntitlement = async (admin: any, order: any, payment: any) => {
  if (!tbankPaymentMatchesOrder(payment, order)) throw new Error('payment_order_mismatch');
  if (String(payment.Status || '') !== 'CONFIRMED') throw new Error('payment_not_confirmed');

  const paymentId = String(payment.PaymentId || '');
  const now = new Date().toISOString();
  const { data: entitlement, error: entitlementError } = await admin
    .from('access_entitlements')
    .upsert({
      token_hash: order.token_hash,
      product_id: LAST_ARIA_PRODUCT_ID,
      status: 'active',
      payment_provider: 'tbank',
      payment_reference: paymentId,
      customer_email_hash: order.customer_email_hash || null,
      starts_at: now,
      expires_at: null,
      revoked_at: null,
      metadata: { order_id: order.id, source: 'tbank', case_id: 'special:last-aria' },
      updated_at: now,
    }, { onConflict: 'token_hash' })
    .select('id')
    .single();
  if (entitlementError || !entitlement?.id) throw entitlementError || new Error('entitlement_write_failed');

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

export const finalizeLastAriaRefund = async (admin: any, order: any) => {
  const now = new Date().toISOString();
  if (order.entitlement_id) {
    const { error } = await admin.from('access_entitlements').update({
      status: 'refunded', revoked_at: now, updated_at: now,
    }).eq('id', order.entitlement_id);
    if (error) throw error;
  } else {
    const { error } = await admin.from('access_entitlements').update({
      status: 'refunded', revoked_at: now, updated_at: now,
    }).eq('token_hash', order.token_hash).eq('product_id', LAST_ARIA_PRODUCT_ID);
    if (error) throw error;
  }
  const { error: orderError } = await admin.from('payment_orders').update({
    status: 'refunded', provider_status: 'REFUNDED', refunded_at: now, updated_at: now,
  }).eq('id', order.id);
  if (orderError) throw orderError;
  return { ...order, status: 'refunded', provider_status: 'REFUNDED' };
};

const canceledStatuses = new Set(['CANCELED', 'REJECTED', 'REVERSED', 'DEADLINE_EXPIRED']);

export const refreshLastAriaTbankOrder = async (admin: any, order: any) => {
  if (!order?.provider_payment_id) return order;
  const payment = await tbankRequest('GetState', { PaymentId: String(order.provider_payment_id) });
  if (!tbankPaymentMatchesOrder(payment, order)) throw new Error('payment_order_mismatch');
  const providerStatus = String(payment.Status || '');

  if (providerStatus === 'CONFIRMED') {
    const entitlementId = await activateEntitlement(admin, order, payment);
    return { ...order, status: 'paid', provider_status: providerStatus, entitlement_id: entitlementId };
  }
  if (providerStatus === 'REFUNDED') return finalizeLastAriaRefund(admin, order);
  if (canceledStatuses.has(providerStatus)) {
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
