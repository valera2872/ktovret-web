import {
  PRODUCT_ID,
  adminClient,
  cleanOrigin,
  corsHeaders,
  isAllowedOrigin,
  json,
  paymentConfigReady,
  refreshPaymentOrder,
  sha256,
  validAccessToken,
  validUuid,
} from '../_shared/payment.ts';
import { refreshTbankOrder, tbankConfigReady } from '../_shared/tbank.ts';

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
    .eq('product_id', PRODUCT_ID)
    .maybeSingle();
  if (orderError) return json(503, { error: 'order_lookup_failed' }, origin);
  if (!order) return json(404, { error: 'order_not_found' }, origin);
  if (order.token_hash !== tokenHash) return json(403, { error: 'order_access_denied' }, origin);

  const provider = String(order.payment_provider || (order.yookassa_payment_id ? 'yookassa' : 'tbank'));
  if (provider === 'tbank' && !tbankConfigReady()) return json(503, { error: 'payment_service_not_configured' }, origin);
  if (provider === 'yookassa' && !paymentConfigReady()) return json(503, { error: 'payment_service_not_configured' }, origin);

  try {
    let refreshed = order;
    if (['creating', 'pending'].includes(order.status)) {
      refreshed = provider === 'tbank'
        ? await refreshTbankOrder(admin, order)
        : await refreshPaymentOrder(admin, order);
    }

    const { data: entitlement } = await admin
      .from('access_entitlements')
      .select('status,expires_at,revoked_at')
      .eq('token_hash', tokenHash)
      .eq('product_id', PRODUCT_ID)
      .maybeSingle();
    const entitled = entitlement?.status === 'active'
      && !entitlement?.revoked_at
      && (!entitlement?.expires_at || new Date(entitlement.expires_at) > new Date());

    return json(200, {
      ok: true,
      orderId: order.id,
      paymentId: provider === 'tbank' ? order.provider_payment_id : order.yookassa_payment_id,
      provider,
      status: refreshed.status,
      entitled,
    }, origin);
  } catch (error: any) {
    return json(503, { error: String(error?.message || 'payment_status_failed').slice(0, 120) }, origin);
  }
});
