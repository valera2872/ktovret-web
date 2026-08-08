import {
  PRODUCT_ID,
  VOLUME1_PRICE_RUB,
  adminClient,
  cleanOrigin,
  formatAmount,
  isAllowedOrigin,
  json,
  paymentConfigReady,
  sha256,
  validAccessToken,
  validEmail,
  validUuid,
  yookassaRequest,
  corsHeaders,
} from '../_shared/payment.ts';

const receiptMode = (Deno.env.get('YOOKASSA_RECEIPT_MODE') || 'disabled').trim().toLowerCase();
const receiptVatCode = Number(Deno.env.get('YOOKASSA_VAT_CODE') || '');
const receiptPaymentMode = Deno.env.get('YOOKASSA_PAYMENT_MODE') || '';
const receiptPaymentSubject = Deno.env.get('YOOKASSA_PAYMENT_SUBJECT') || '';
const description = Deno.env.get('VOLUME1_DESCRIPTION') || 'Mystery Logic — полный том «Кто врёт?»';

const buildReceipt = (email: string, amountValue: string) => {
  if (receiptMode !== 'yookassa') return undefined;
  if (!validEmail(email)) throw new Error('email_required');
  if (!Number.isInteger(receiptVatCode) || receiptVatCode < 1 || receiptVatCode > 12
    || !receiptPaymentMode || !receiptPaymentSubject) throw new Error('receipt_not_configured');
  return {
    customer: { email },
    items: [{
      description: description.slice(0, 128),
      quantity: '1.00',
      amount: { value: amountValue, currency: 'RUB' },
      vat_code: receiptVatCode,
      payment_mode: receiptPaymentMode,
      payment_subject: receiptPaymentSubject,
    }],
  };
};

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!isAllowedOrigin(origin)) return json(403, { error: 'origin_not_allowed' });
  if (!paymentConfigReady()) return json(503, { error: 'payment_service_not_configured' }, origin);

  let body: any = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }

  const accessToken = String(body.accessToken || '').trim();
  const requestId = String(body.requestId || '').trim();
  const caseId = String(body.caseId || '').trim().slice(0, 160);
  const email = String(body.email || '').trim().toLowerCase();
  if (!validAccessToken(accessToken)) return json(400, { error: 'invalid_access_token' }, origin);
  if (!validUuid(requestId)) return json(400, { error: 'invalid_request_id' }, origin);
  if (email && !validEmail(email)) return json(400, { error: 'invalid_email' }, origin);

  let returnUrl: URL;
  try {
    returnUrl = new URL(String(body.returnUrl || ''));
  } catch {
    return json(400, { error: 'invalid_return_url' }, origin);
  }
  if (returnUrl.protocol !== 'https:' || !isAllowedOrigin(returnUrl.origin)) {
    return json(400, { error: 'invalid_return_url' }, origin);
  }
  returnUrl.hash = '';
  returnUrl.search = '';

  const amountValue = formatAmount(VOLUME1_PRICE_RUB);
  const tokenHash = await sha256(accessToken);
  const customerEmailHash = email ? await sha256(email) : null;
  const admin = adminClient();

  const { data: existing, error: existingError } = await admin
    .from('payment_orders')
    .select('id,token_hash,status,yookassa_payment_id,confirmation_url,return_url')
    .eq('client_request_id', requestId)
    .maybeSingle();
  if (existingError) return json(503, { error: 'order_lookup_failed' }, origin);
  if (existing) {
    if (existing.token_hash !== tokenHash) return json(409, { error: 'request_id_conflict' }, origin);
    if (existing.confirmation_url) {
      return json(200, {
        ok: true,
        reused: true,
        orderId: existing.id,
        status: existing.status,
        paymentId: existing.yookassa_payment_id,
        confirmationUrl: existing.confirmation_url,
      }, origin);
    }
  }

  const orderId = existing?.id || crypto.randomUUID();
  returnUrl.searchParams.set('payment_return', '1');
  returnUrl.searchParams.set('order_id', orderId);

  if (!existing) {
    const { error: insertError } = await admin.from('payment_orders').insert({
      id: orderId,
      product_id: PRODUCT_ID,
      token_hash: tokenHash,
      client_request_id: requestId,
      amount_value: amountValue,
      currency: 'RUB',
      status: 'creating',
      return_url: returnUrl.href,
      source_origin: origin || returnUrl.origin,
      case_id: caseId || null,
      customer_email_hash: customerEmailHash,
      metadata: { source: 'web_checkout' },
    });
    if (insertError) return json(503, { error: 'order_create_failed' }, origin);
  }

  let receipt: any;
  try {
    receipt = buildReceipt(email, amountValue);
  } catch (error) {
    await admin.from('payment_orders').update({
      status: 'failed', failure_code: error instanceof Error ? error.message : 'receipt_error', updated_at: new Date().toISOString(),
    }).eq('id', orderId);
    return json(400, { error: error instanceof Error ? error.message : 'receipt_error' }, origin);
  }

  try {
    const payment = await yookassaRequest('payments', {
      method: 'POST',
      headers: { 'Idempotence-Key': requestId },
      body: JSON.stringify({
        amount: { value: amountValue, currency: 'RUB' },
        capture: true,
        save_payment_method: false,
        confirmation: { type: 'redirect', return_url: returnUrl.href },
        description: description.slice(0, 128),
        metadata: { order_id: orderId, product_id: PRODUCT_ID, case_id: caseId || '' },
        ...(receipt ? { receipt } : {}),
      }),
    });

    const confirmationUrl = String(payment?.confirmation?.confirmation_url || '');
    if (!payment?.id || !confirmationUrl) throw new Error('invalid_payment_response');

    const { error: updateError } = await admin.from('payment_orders').update({
      yookassa_payment_id: payment.id,
      confirmation_url: confirmationUrl,
      status: payment.status === 'pending' ? 'pending' : String(payment.status || 'pending'),
      failure_code: null,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);
    if (updateError) throw updateError;

    return json(200, {
      ok: true,
      orderId,
      paymentId: payment.id,
      status: payment.status,
      confirmationUrl,
    }, origin);
  } catch (error: any) {
    await admin.from('payment_orders').update({
      status: 'failed', failure_code: String(error?.message || 'payment_create_failed').slice(0, 120), updated_at: new Date().toISOString(),
    }).eq('id', orderId);
    return json(error?.status === 401 ? 503 : 502, { error: 'payment_create_failed' }, origin);
  }
});
