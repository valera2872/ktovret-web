import {
  PRODUCT_ID,
  SUPABASE_URL,
  VOLUME1_PRICE_RUB,
  adminClient,
  cleanOrigin,
  formatAmount,
  isAllowedOrigin,
  json,
  sha256,
  validAccessToken,
  validEmail,
  validUuid,
  corsHeaders,
} from '../_shared/payment.ts';
import {
  amountToKopecks,
  tbankConfigReady,
  tbankRequest,
} from '../_shared/tbank.ts';

const description = Deno.env.get('VOLUME1_DESCRIPTION') || 'Mystery Logic — полный том «Кто врёт?»';
const receiptName = Deno.env.get('VOLUME1_RECEIPT_NAME') || 'Цифровой доступ Mystery Logic — том «Кто врёт?»';

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!isAllowedOrigin(origin)) return json(403, { error: 'origin_not_allowed' });
  if (!tbankConfigReady()) return json(503, { error: 'payment_service_not_configured' }, origin);

  let body: any = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }

  const accessToken = String(body.accessToken || '').trim();
  const requestId = String(body.requestId || '').trim();
  const caseId = String(body.caseId || '').trim().slice(0, 160);
  const email = String(body.email || '').trim().toLowerCase();
  const language = String(body.language || '').toLowerCase() === 'en' ? 'en' : 'ru';
  if (!validAccessToken(accessToken)) return json(400, { error: 'invalid_access_token' }, origin);
  if (!validUuid(requestId)) return json(400, { error: 'invalid_request_id' }, origin);
  if (!email) return json(400, { error: 'email_required_for_receipt' }, origin);
  if (!validEmail(email)) return json(400, { error: 'invalid_email' }, origin);

  let returnUrl: URL;
  try { returnUrl = new URL(String(body.returnUrl || '')); } catch {
    return json(400, { error: 'invalid_return_url' }, origin);
  }
  if (returnUrl.protocol !== 'https:' || !isAllowedOrigin(returnUrl.origin)) {
    return json(400, { error: 'invalid_return_url' }, origin);
  }
  returnUrl.hash = '';
  returnUrl.search = '';

  const amountValue = formatAmount(VOLUME1_PRICE_RUB);
  const amount = amountToKopecks(VOLUME1_PRICE_RUB);
  if (!amountValue || amount <= 0) return json(503, { error: 'payment_service_not_configured' }, origin);

  const receipt = {
    Email: email,
    Taxation: 'usn_income',
    Items: [{
      Name: receiptName.slice(0, 128),
      Price: amount,
      Quantity: 1,
      Amount: amount,
      PaymentMethod: 'full_payment',
      PaymentObject: 'intellectual_activity',
      Tax: 'none',
    }],
  };

  const tokenHash = await sha256(accessToken);
  const customerEmailHash = await sha256(email);
  const admin = adminClient();

  const { data: existing, error: existingError } = await admin
    .from('payment_orders')
    .select('id,token_hash,status,payment_provider,provider_payment_id,confirmation_url,return_url')
    .eq('client_request_id', requestId)
    .maybeSingle();
  if (existingError) return json(503, { error: 'order_lookup_failed' }, origin);
  if (existing) {
    if (existing.token_hash !== tokenHash) return json(409, { error: 'request_id_conflict' }, origin);
    if (existing.payment_provider && existing.payment_provider !== 'tbank') {
      return json(409, { error: 'request_provider_conflict' }, origin);
    }
    if (existing.confirmation_url) {
      return json(200, {
        ok: true,
        reused: true,
        orderId: existing.id,
        status: existing.status,
        paymentId: existing.provider_payment_id,
        confirmationUrl: existing.confirmation_url,
      }, origin);
    }
  }

  const orderId = existing?.id || crypto.randomUUID();
  const successUrl = new URL(returnUrl.href);
  successUrl.searchParams.set('payment_return', '1');
  successUrl.searchParams.set('payment_result', 'success');
  successUrl.searchParams.set('order_id', orderId);
  const failUrl = new URL(returnUrl.href);
  failUrl.searchParams.set('payment_return', '1');
  failUrl.searchParams.set('payment_result', 'fail');
  failUrl.searchParams.set('order_id', orderId);
  const notificationUrl = `${SUPABASE_URL}/functions/v1/tbank-webhook`;

  if (!existing) {
    const { error: insertError } = await admin.from('payment_orders').insert({
      id: orderId,
      product_id: PRODUCT_ID,
      token_hash: tokenHash,
      client_request_id: requestId,
      amount_value: amountValue,
      currency: 'RUB',
      status: 'creating',
      payment_provider: 'tbank',
      return_url: successUrl.href,
      source_origin: origin || returnUrl.origin,
      case_id: caseId || null,
      customer_email_hash: customerEmailHash,
      metadata: { source: 'web_checkout', payment_provider: 'tbank' },
    });
    if (insertError) return json(503, { error: 'order_create_failed' }, origin);
  }

  try {
    const payment = await tbankRequest('Init', {
      Amount: amount,
      OrderId: orderId,
      Description: description.slice(0, 140),
      Language: language,
      NotificationURL: notificationUrl,
      SuccessURL: successUrl.href,
      FailURL: failUrl.href,
      Receipt: receipt,
    });
    const paymentId = String(payment?.PaymentId || '');
    const confirmationUrl = String(payment?.PaymentURL || '');
    if (!paymentId || !confirmationUrl) throw new Error('invalid_payment_response');

    const { error: updateError } = await admin.from('payment_orders').update({
      payment_provider: 'tbank',
      provider_payment_id: paymentId,
      provider_status: String(payment?.Status || 'NEW'),
      confirmation_url: confirmationUrl,
      status: 'pending',
      failure_code: null,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);
    if (updateError) throw updateError;

    return json(200, {
      ok: true,
      orderId,
      paymentId,
      status: 'pending',
      confirmationUrl,
    }, origin);
  } catch (error: any) {
    await admin.from('payment_orders').update({
      status: 'failed',
      failure_code: String(error?.code || error?.message || 'payment_create_failed').slice(0, 120),
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);
    return json(502, { error: 'payment_create_failed' }, origin);
  }
});
