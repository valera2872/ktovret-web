import {
  PRODUCT_ID,
  adminClient,
} from '../_shared/payment.ts';
import {
  TBANK_TERMINAL_KEY,
  amountToKopecks,
  refreshTbankOrder,
  tbankConfigReady,
  verifyTbankToken,
} from '../_shared/tbank.ts';

const ok = () => new Response('OK', {
  status: 200,
  headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
});
const fail = (status: number, text: string) => new Response(text, {
  status,
  headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
});

const readNotification = async (req: Request) => {
  const type = (req.headers.get('content-type') || '').toLowerCase();
  if (type.includes('application/json')) return await req.json();
  const text = await req.text();
  try { return JSON.parse(text); } catch {}
  return Object.fromEntries(new URLSearchParams(text));
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return fail(405, 'METHOD_NOT_ALLOWED');
  if (!tbankConfigReady()) return fail(503, 'NOT_CONFIGURED');

  let notification: any;
  try { notification = await readNotification(req); } catch { return fail(400, 'INVALID_BODY'); }
  if (!notification || typeof notification !== 'object') return fail(400, 'INVALID_BODY');
  if (!await verifyTbankToken(notification)) return fail(403, 'INVALID_TOKEN');
  if (String(notification.TerminalKey || '') !== TBANK_TERMINAL_KEY) return fail(403, 'INVALID_TERMINAL');

  const orderId = String(notification.OrderId || '').trim();
  const paymentId = String(notification.PaymentId || '').trim();
  if (!orderId || !paymentId) return ok();

  const admin = adminClient();
  const { data: order, error: orderError } = await admin
    .from('payment_orders')
    .select('*')
    .eq('id', orderId)
    .eq('product_id', PRODUCT_ID)
    .maybeSingle();
  if (orderError) return fail(503, 'DB_ERROR');
  if (!order) return ok();
  if (String(order.payment_provider || '') !== 'tbank') return ok();
  if (String(order.provider_payment_id || '') !== paymentId) return fail(409, 'PAYMENT_MISMATCH');
  if (notification.Amount != null && Number(notification.Amount) !== amountToKopecks(order.amount_value)) {
    return fail(409, 'AMOUNT_MISMATCH');
  }

  const providerStatus = String(notification.Status || '').trim();
  try {
    if (providerStatus) {
      await admin.from('payment_orders').update({
        provider_status: providerStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', order.id);
    }

    if (['CONFIRMED', 'REFUNDED', 'CANCELED', 'REJECTED', 'REVERSED', 'DEADLINE_EXPIRED'].includes(providerStatus)) {
      await refreshTbankOrder(admin, { ...order, provider_status: providerStatus });
    }
    return ok();
  } catch {
    return fail(503, 'RETRY');
  }
});
