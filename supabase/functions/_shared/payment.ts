import { createClient } from 'npm:@supabase/supabase-js@2';

export const PRODUCT_ID = 'volume1';
export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
export const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
export const YOOKASSA_SHOP_ID = Deno.env.get('YOOKASSA_SHOP_ID') || '';
export const YOOKASSA_SECRET_KEY = Deno.env.get('YOOKASSA_SECRET_KEY') || '';
export const VOLUME1_PRICE_RUB = Deno.env.get('VOLUME1_PRICE_RUB') || '';

const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',')
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const adminClient = () => createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const cleanOrigin = (value = '') => value.trim().replace(/\/$/, '');
export const isAllowedOrigin = (origin = '') => !origin || configuredOrigins.includes(cleanOrigin(origin));

export const corsHeaders = (origin = '') => ({
  ...(origin && isAllowedOrigin(origin) ? { 'access-control-allow-origin': cleanOrigin(origin) } : {}),
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-max-age': '600',
  'vary': 'Origin',
});

export const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    ...corsHeaders(origin),
  },
});

const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes))
  .map((value) => value.toString(16).padStart(2, '0'))
  .join('');

export const sha256 = async (value: string) => hex(await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(value),
));

export const validAccessToken = (value: string) => /^ml_[a-z0-9]+_[A-Za-z0-9_-]{32,160}$/.test(value);
export const validUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

export const formatAmount = (value: unknown) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return '';
  return number.toFixed(2);
};

export const paymentConfigReady = () => Boolean(
  SUPABASE_URL && SERVICE_ROLE_KEY && YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY && formatAmount(VOLUME1_PRICE_RUB),
);

const basicAuth = () => `Basic ${btoa(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`)}`;

export const yookassaRequest = async (path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers || {});
  headers.set('authorization', basicAuth());
  headers.set('content-type', 'application/json');
  const response = await fetch(`https://api.yookassa.ru/v3/${path.replace(/^\//, '')}`, {
    ...init,
    headers,
  });
  let body: any = null;
  try { body = await response.json(); } catch {}
  if (!response.ok) {
    const error: any = new Error(body?.code || body?.description || `yookassa_http_${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
};

export const paymentMatchesOrder = (payment: any, order: any) => {
  if (!payment || !order) return false;
  if (String(payment.id || '') !== String(order.yookassa_payment_id || '')) return false;
  if (String(payment.metadata?.order_id || '') !== String(order.id || '')) return false;
  if (String(payment.metadata?.product_id || '') !== PRODUCT_ID) return false;
  if (String(payment.amount?.currency || '') !== String(order.currency || 'RUB')) return false;
  return formatAmount(payment.amount?.value) === formatAmount(order.amount_value);
};

export const activateOrder = async (admin: any, order: any, payment: any) => {
  if (!paymentMatchesOrder(payment, order)) throw new Error('payment_order_mismatch');
  if (payment.status !== 'succeeded' || payment.paid !== true) throw new Error('payment_not_succeeded');

  const { data: entitlement, error: entitlementError } = await admin
    .from('access_entitlements')
    .upsert({
      token_hash: order.token_hash,
      product_id: PRODUCT_ID,
      status: 'active',
      payment_provider: 'yookassa',
      payment_reference: payment.id,
      customer_email_hash: order.customer_email_hash || null,
      starts_at: new Date().toISOString(),
      expires_at: null,
      revoked_at: null,
      metadata: { order_id: order.id, source: 'yookassa' },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'token_hash' })
    .select('id')
    .single();

  if (entitlementError || !entitlement?.id) throw entitlementError || new Error('entitlement_write_failed');

  const { error: orderError } = await admin
    .from('payment_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      entitlement_id: entitlement.id,
      failure_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);
  if (orderError) throw orderError;
  return entitlement.id;
};

export const refreshPaymentOrder = async (admin: any, order: any) => {
  if (!order?.yookassa_payment_id) return order;
  const payment = await yookassaRequest(`payments/${encodeURIComponent(order.yookassa_payment_id)}`);
  if (!paymentMatchesOrder(payment, order)) throw new Error('payment_order_mismatch');

  if (payment.status === 'succeeded' && payment.paid === true) {
    const entitlementId = await activateOrder(admin, order, payment);
    return { ...order, status: 'paid', entitlement_id: entitlementId };
  }
  if (payment.status === 'canceled') {
    await admin.from('payment_orders').update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', order.id).neq('status', 'paid');
    return { ...order, status: 'canceled' };
  }
  return { ...order, status: payment.status === 'pending' ? 'pending' : order.status };
};
