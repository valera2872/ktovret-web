import {
  PRODUCT_ID,
  VOLUME1_PRICE_RUB,
  formatAmount,
} from './payment.ts';
import { RUSSIAN_TRUSTED_CA_CERTS } from './russian-ca.ts';

export const TBANK_TERMINAL_KEY = (Deno.env.get('TBANK_TERMINAL_KEY') || '').trim();
export const TBANK_PASSWORD = Deno.env.get('TBANK_PASSWORD') || '';
const TBANK_API_BASE = 'https://securepay.tinkoff.ru/v2';

export const amountToKopecks = (value: unknown) => {
  const formatted = formatAmount(value);
  if (!formatted) return 0;
  return Math.round(Number(formatted) * 100);
};

export const tbankConfigReady = () => Boolean(
  TBANK_TERMINAL_KEY && TBANK_PASSWORD && amountToKopecks(VOLUME1_PRICE_RUB) > 0,
);

const tokenEntries = (payload: Record<string, unknown>) => Object.entries(payload)
  .filter(([key, value]) => key !== 'Token'
    && value !== undefined
    && value !== null
    && typeof value !== 'object')
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

export const tbankToken = async (payload: Record<string, unknown>) => {
  const signed = { ...payload, Password: TBANK_PASSWORD };
  const source = tokenEntries(signed).map(([, value]) => String(value)).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
};

const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
};

export const verifyTbankToken = async (payload: Record<string, unknown>) => {
  const supplied = String(payload.Token || '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(supplied)) return false;
  const expected = await tbankToken(payload);
  return safeEqual(supplied, expected);
};

let tbankHttpClient: Deno.HttpClient | null = null;
const getTbankHttpClient = () => {
  if (!tbankHttpClient) {
    tbankHttpClient = Deno.createHttpClient({ caCerts: RUSSIAN_TRUSTED_CA_CERTS });
  }
  return tbankHttpClient;
};

export const tbankRequest = async (method: string, payload: Record<string, unknown>) => {
  if (!tbankConfigReady()) throw new Error('tbank_not_configured');
  const unsigned = { TerminalKey: TBANK_TERMINAL_KEY, ...payload };
  const body = { ...unsigned, Token: await tbankToken(unsigned) };
  const response = await fetch(`${TBANK_API_BASE}/${method.replace(/^\//, '')}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    client: getTbankHttpClient(),
  });
  let data: any = null;
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const error: any = new Error(`tbank_http_${response.status}`);
    error.status = response.status;
    error.body = data;
    throw error;
  }
  const errorCode = String(data?.ErrorCode ?? '0');
  if (data?.Success === false || (errorCode && errorCode !== '0')) {
    const error: any = new Error(String(data?.Message || data?.Details || `tbank_error_${errorCode}`));
    error.status = response.status;
    error.code = errorCode;
    error.body = data;
    throw error;
  }
  return data;
};

export const tbankPaymentMatchesOrder = (payment: any, order: any) => {
  if (!payment || !order) return false;
  const paymentId = String(order.provider_payment_id || '');
  if (!paymentId || String(payment.PaymentId || '') !== paymentId) return false;
  if (payment.OrderId != null && String(payment.OrderId) !== String(order.id)) return false;
  if (payment.TerminalKey != null && String(payment.TerminalKey) !== TBANK_TERMINAL_KEY) return false;
  const expectedAmount = amountToKopecks(order.amount_value);
  if (payment.Amount != null && Number(payment.Amount) !== expectedAmount) return false;
  return expectedAmount > 0;
};

const activateTbankEntitlement = async (admin: any, order: any, payment: any) => {
  if (!tbankPaymentMatchesOrder(payment, order)) throw new Error('payment_order_mismatch');
  if (String(payment.Status || '') !== 'CONFIRMED') throw new Error('payment_not_confirmed');

  const paymentId = String(payment.PaymentId);
  const { data: entitlement, error: entitlementError } = await admin
    .from('access_entitlements')
    .upsert({
      token_hash: order.token_hash,
      product_id: PRODUCT_ID,
      status: 'active',
      payment_provider: 'tbank',
      payment_reference: paymentId,
      customer_email_hash: order.customer_email_hash || null,
      starts_at: new Date().toISOString(),
      expires_at: null,
      revoked_at: null,
      metadata: { order_id: order.id, source: 'tbank' },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'token_hash' })
    .select('id')
    .single();
  if (entitlementError || !entitlement?.id) throw entitlementError || new Error('entitlement_write_failed');

  const { error: orderError } = await admin.from('payment_orders').update({
    status: 'paid',
    provider_status: 'CONFIRMED',
    paid_at: order.paid_at || new Date().toISOString(),
    entitlement_id: entitlement.id,
    failure_code: null,
    updated_at: new Date().toISOString(),
  }).eq('id', order.id);
  if (orderError) throw orderError;
  return entitlement.id;
};

const refundTbankEntitlement = async (admin: any, order: any, payment: any) => {
  if (!tbankPaymentMatchesOrder(payment, order)) throw new Error('payment_order_mismatch');
  if (String(payment.Status || '') !== 'REFUNDED') throw new Error('payment_not_refunded');
  const now = new Date().toISOString();
  if (order.entitlement_id) {
    await admin.from('access_entitlements').update({
      status: 'refunded', revoked_at: now, updated_at: now,
    }).eq('id', order.entitlement_id);
  } else {
    await admin.from('access_entitlements').update({
      status: 'refunded', revoked_at: now, updated_at: now,
    }).eq('token_hash', order.token_hash).eq('product_id', PRODUCT_ID);
  }
  const { error } = await admin.from('payment_orders').update({
    status: 'refunded', provider_status: 'REFUNDED', refunded_at: now, updated_at: now,
  }).eq('id', order.id);
  if (error) throw error;
  return { ...order, status: 'refunded', provider_status: 'REFUNDED' };
};

const canceledStatuses = new Set(['CANCELED', 'REJECTED', 'REVERSED', 'DEADLINE_EXPIRED']);

export const refreshTbankOrder = async (admin: any, order: any) => {
  if (!order?.provider_payment_id) return order;
  const payment = await tbankRequest('GetState', { PaymentId: String(order.provider_payment_id) });
  if (!tbankPaymentMatchesOrder(payment, order)) throw new Error('payment_order_mismatch');
  const providerStatus = String(payment.Status || '');

  if (providerStatus === 'CONFIRMED') {
    const entitlementId = await activateTbankEntitlement(admin, order, payment);
    return { ...order, status: 'paid', provider_status: providerStatus, entitlement_id: entitlementId };
  }
  if (providerStatus === 'REFUNDED') return refundTbankEntitlement(admin, order, payment);
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
