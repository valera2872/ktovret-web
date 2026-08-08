import {
  PRODUCT_ID,
  adminClient,
  activateOrder,
  formatAmount,
  json,
  paymentConfigReady,
  paymentMatchesOrder,
  yookassaRequest,
} from '../_shared/payment.ts';

const fullRefunded = (payment: any) => {
  const amount = Number(formatAmount(payment?.amount?.value));
  const refunded = Number(formatAmount(payment?.refunded_amount?.value) || '0');
  return Number.isFinite(amount) && amount > 0 && refunded >= amount;
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  if (!paymentConfigReady()) return json(503, { error: 'payment_service_not_configured' });

  let notification: any;
  try { notification = await req.json(); } catch { return json(400, { error: 'invalid_json' }); }
  const event = String(notification?.event || '');
  const object = notification?.object || {};
  if (!['payment.succeeded', 'payment.canceled', 'refund.succeeded'].includes(event)) {
    return json(200, { ok: true, ignored: true });
  }

  const paymentId = event === 'refund.succeeded' ? String(object.payment_id || '') : String(object.id || '');
  if (!paymentId) return json(200, { ok: true, ignored: true });

  const admin = adminClient();
  try {
    // Do not trust the incoming notification body. Re-read the payment from YooKassa over authenticated API.
    const payment = await yookassaRequest(`payments/${encodeURIComponent(paymentId)}`);
    const { data: order, error: orderError } = await admin
      .from('payment_orders')
      .select('*')
      .eq('yookassa_payment_id', paymentId)
      .maybeSingle();
    if (orderError) return json(503, { error: 'order_lookup_failed' });
    if (!order) return json(200, { ok: true, ignored: true, reason: 'unknown_payment' });
    if (order.product_id !== PRODUCT_ID || !paymentMatchesOrder(payment, order)) {
      return json(200, { ok: true, ignored: true, reason: 'payment_order_mismatch' });
    }

    if (event === 'payment.succeeded') {
      if (payment.status !== 'succeeded' || payment.paid !== true) return json(503, { error: 'payment_not_final' });
      await activateOrder(admin, order, payment);
      return json(200, { ok: true, status: 'paid' });
    }

    if (event === 'payment.canceled') {
      if (payment.status !== 'canceled') return json(503, { error: 'payment_status_mismatch' });
      await admin.from('payment_orders').update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', order.id).neq('status', 'paid');
      return json(200, { ok: true, status: 'canceled' });
    }

    if (event === 'refund.succeeded') {
      if (!fullRefunded(payment)) return json(200, { ok: true, status: 'partial_refund_ignored' });
      if (order.entitlement_id) {
        await admin.from('access_entitlements').update({
          status: 'refunded',
          revoked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', order.entitlement_id);
      } else {
        await admin.from('access_entitlements').update({
          status: 'refunded',
          revoked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('token_hash', order.token_hash).eq('product_id', PRODUCT_ID);
      }
      await admin.from('payment_orders').update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', order.id);
      return json(200, { ok: true, status: 'refunded' });
    }

    return json(200, { ok: true });
  } catch (error: any) {
    // Non-200 makes YooKassa retry the notification; useful on transient API/database failures.
    return json(503, { error: String(error?.message || 'webhook_processing_failed').slice(0, 120) });
  }
});
