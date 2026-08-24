import {
  SUPABASE_URL,
  adminClient,
  cleanOrigin,
  corsHeaders,
  isAllowedOrigin,
  json,
  sha256,
  validAccessToken,
  validEmail,
  validUuid,
} from '../_shared/last-aria-payment.ts';
import {
  amountToKopecks,
  tbankConfigReady,
  tbankRequest,
} from '../_shared/last-aria-tbank.ts';
import {
  LAST_ARIA_DESCRIPTION,
  LAST_ARIA_PRICE_RUB,
  LAST_ARIA_PRODUCT_ID,
  LAST_ARIA_RECEIPT_NAME,
  lastAriaAmountValue,
} from '../_shared/last-aria-commerce.ts';

const OFFER_VERSION = '2026-08-16';
const PRIVACY_VERSION = '2026-08-16';

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
  const email = String(body.email || '').trim().toLowerCase();
  const language = String(body.language || '').toLowerCase() === 'en' ? 'en' : 'ru';
  const offerAccepted = body.offerAccepted === true;
  const privacyAcknowledged = body.privacyAcknowledged === true;

  if (!validAccessToken(accessToken)) return json(400, { error: 'invalid_access_token' }, origin);
  if (!validUuid(requestId)) return json(400, { error: 'invalid_request_id' }, origin);
  if (!email) return json(400, { error: 'email_required_for_receipt' }, origin);
  if (!validEmail(email)) return json(400, { error: 'invalid_email' }, origin);
  if (!offerAccepted) return json(400, { error: 'offer_acceptance_required' }, origin);
  if (!privacyAcknowledged) return json(400, { error: 'privacy_acknowledgement_required' }, origin);

  let returnUrl: URL;
  try { returnUrl = new URL(String(body.returnUrl || '')); } catch {
    return json(400, { error: 'invalid_return_url' }, origin);
  }
  if (returnUrl.protocol !== 'https:' || !isAllowedOrigin(returnUrl.origin)) {
    return json(400, { error: 'invalid_return_url' }, origin);
  }
  returnUrl.hash = '';
  returnUrl.search = '';

  const amountValue = lastAriaAmountValue();
  const amount = amountToKopecks(LAST_ARIA_PRICE_RUB);
  if (!amountValue || amount !== 29900) return json(503, { error: 'payment_service_not_configured' }, origin);

  const receipt = {
    Email: email,
    Taxation: 'usn_income',
    Items: [{
      Name: LAST_ARIA_RECEIPT_NAME.slice(0, 128),
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
    .select('id,token_hash,product_id,status,payment_provider,provider_payment_id,confirmation_url')
    .eq('client_request_id', requestId)
    .maybeSingle();
  if (existingError) return json(503, { error: 'order_lookup_failed' }, origin);
  if (existing) {
    if (existing.token_hash !== tokenHash || existing.product_id !== LAST_ARIA_PRODUCT_ID) {
      return json(409, { error: 'request_id_conflict' }, origin);
    }
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
  const acceptedAt = new Date().toISOString();
  const successUrl = new URL(returnUrl.href);
  successUrl.searchParams.set('payment_return', '1');
  successUrl.searchParams.set('payment_result', 'success');
  successUrl.searchParams.set('order_id', orderId);
  const failUrl = new URL(returnUrl.href);
  failUrl.searchParams.set('payment_return', '1');
  failUrl.searchParams.set('payment_result', 'fail');
  failUrl.searchParams.set('order_id', orderId);
  const notificationUrl = `${SUPABASE_URL}/functions/v1/tbank-webhook-last-aria`;

  if (!existing) {
    const { error: insertError } = await admin.from('payment_orders').insert({
      id: orderId,
      product_id: LAST_ARIA_PRODUCT_ID,
      token_hash: tokenHash,
      client_request_id: requestId,
      amount_value: amountValue,
      currency: 'RUB',
      status: 'creating',
      payment_provider: 'tbank',
      return_url: successUrl.href,
      source_origin: origin || returnUrl.origin,
      case_id: 'special:last-aria',
      customer_email_hash: customerEmailHash,
      offer_version: OFFER_VERSION,
      offer_accepted_at: acceptedAt,
      privacy_version: PRIVACY_VERSION,
      privacy_acknowledged_at: acceptedAt,
      metadata: {
        source: 'web_checkout',
        product_id: LAST_ARIA_PRODUCT_ID,
        payment_provider: 'tbank',
        offer_version: OFFER_VERSION,
        offer_accepted_at: acceptedAt,
        privacy_version: PRIVACY_VERSION,
        privacy_acknowledged_at: acceptedAt,
      },
    });
    if (insertError) return json(503, { error: 'order_create_failed' }, origin);
  }

  try {
    const payment = await tbankRequest('Init', {
      Amount: amount,
      OrderId: orderId,
      Description: LAST_ARIA_DESCRIPTION.slice(0, 140),
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

    return json(200, { ok: true, orderId, paymentId, status: 'pending', confirmationUrl }, origin);
  } catch (error: any) {
    await admin.from('payment_orders').update({
      status: 'failed',
      failure_code: String(error?.code || error?.message || 'payment_create_failed').slice(0, 120),
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);
    return json(502, { error: 'payment_create_failed' }, origin);
  }
});
