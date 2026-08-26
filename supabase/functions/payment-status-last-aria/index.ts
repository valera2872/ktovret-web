import {
  adminClient,
  cleanOrigin,
  corsHeaders,
  isAllowedOrigin,
  json,
  sha256,
  validAccessToken,
  validUuid,
} from '../_shared/last-aria-payment.ts';
import { tbankConfigReady } from '../_shared/last-aria-tbank.ts';
import {
  LAST_ARIA_PRODUCT_ID,
  refreshLastAriaTbankOrder,
} from '../_shared/last-aria-commerce.ts';

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!isAllowedOrigin(origin)) return json(403, { error: 'origin_not_allowed' });

  const auth = req.headers.get('authorization') || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() || '';
  if (!validAccessToken(token)) return json(401, { error: 'access_token_required' }, origin);

  let body: any = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }
  const orderId = String(body.orderId || '').trim();
  if (!validUuid(orderId)) return json(400, { error: 'invalid_order_id' }, origin);

  const tokenHash = await sha256(token);
  const admin = adminClient();
  const { data: order, error: orderError } = await admin
    .from('payment_orders')
    .select('*')
    .eq('id', orderId)
    .eq('product_id', LAST_ARIA_PRODUCT_ID)
    .maybeSingle();
  if (orderError) return json(503, { error: 'order_lookup_failed' }, origin);
  if (!order) return json(404, { error: 'order_not_found' }, origin);
  if (order.token_hash !== tokenHash) return json(403, { error: 'order_access_denied' }, origin);
  if (!tbankConfigReady()) return json(503, { error: 'payment_service_not_configured' }, origin);

  try {
    let refreshed = order;
    if (['creating', 'pending'].includes(order.status)) {
      refreshed = await refreshLastAriaTbankOrder(admin, order);
    }

    const { data: entitlement } = await admin
      .from('access_entitlements')
      .select('status,expires_at,revoked_at')
      .eq('token_hash', tokenHash)
      .eq('product_id', LAST_ARIA_PRODUCT_ID)
      .maybeSingle();
    const entitled = entitlement?.status === 'active'
      && !entitlement?.revoked_at
      && (!entitlement?.expires_at || new Date(entitlement.expires_at) > new Date());

    return json(200, {
      ok: true,
      orderId: order.id,
      paymentId: order.provider_payment_id,
      provider: 'tbank',
      status: refreshed.status,
      entitled,
      productId: LAST_ARIA_PRODUCT_ID,
      amountRub: Number(order.amount_value),
      discountRub: Math.max(0, 299 - Number(order.amount_value)),
    }, origin);
  } catch (error: any) {
    return json(503, { error: String(error?.message || 'payment_status_failed').slice(0, 120) }, origin);
  }
});
