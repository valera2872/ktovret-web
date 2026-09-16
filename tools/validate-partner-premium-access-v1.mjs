import fs from 'node:fs';

const required = [
  'supabase/functions/_shared/partner-commerce.ts',
  'supabase/functions/create-checkout-partner-v1/index.ts',
  'supabase/functions/payment-status-partner-v1/index.ts',
  'supabase/functions/tbank-webhook-partner-v1/index.ts',
  'supabase/functions/partner-access-v1/index.ts',
  'supabase/functions/partner-session-v2/index.ts',
  'supabase/functions/partner-interrogate-v2/index.ts',
  'assets/partner-premium-commerce-v1.js',
  'assets/partner-premium-commerce-v1.css',
  'admin/partner-premium-preview/index.html',
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`missing:${file}`);
const [commerce, checkout, status, webhook, access, session, ai, commerceUi, commerceCss, html] = required.map((file) => fs.readFileSync(file, 'utf8'));
const must = (source, values, label) => { for (const value of values) if (!source.includes(value)) throw new Error(`${label}:missing:${value}`); };

must(commerce, [
  "PARTNER_PRODUCT_ID = 'partner_ne_publikovat'",
  'PARTNER_PRICE_RUB = 599',
  'partner_seats: 2',
  'refreshPartnerTbankOrder',
  'finalizePartnerRefund',
], 'commerce');

must(checkout, [
  '59900',
  'tbank-webhook-partner-v1',
  'PARTNER_RECEIPT_NAME',
  'offer_acceptance_required',
  'privacy_acknowledgement_required',
  'client_request_id',
], 'checkout');

must(status, [
  'refreshPartnerTbankOrder',
  'partnerEntitlementUsable',
  'entitled',
], 'payment-status');

must(webhook, [
  'verifyTbankToken',
  'PAYMENT_MISMATCH',
  'AMOUNT_MISMATCH',
  'finalizePartnerRefund',
], 'webhook');

must(access, [
  "action === 'STATUS'",
  "action !== 'CREATE_OR_RESUME'",
  'entitlementForToken',
  'partnerEntitlementUsable',
  'entitlement_id: entitlementId',
  'createInitialFullPartnerState()',
  'restoreOwner',
  'creator_key_hash: browserHash',
], 'access');

must(session, [
  'PARTNER_PRODUCT_ID',
  'partner_access_required',
  'requireStateRow',
  'access_entitlements',
  'entitlement_id',
], 'session');
if (session.includes('createInitialFullPartnerState')) throw new Error('session must never mint paid game state');
if (session.includes('ensureStateRow')) throw new Error('legacy state auto-create path remains');

must(ai, [
  'PARTNER_PRODUCT_ID',
  'partner_access_required',
  'access_entitlements',
  'entitlement_id',
], 'ai');

must(commerceUi, [
  'partner-access-v1',
  'create-checkout-partner-v1',
  'payment-status-partner-v1',
  'const PRICE=599',
  'if(roomParam)return',
  "action:'CREATE_OR_RESUME'",
  'offerAccepted:true',
  'privacyAcknowledged:true',
  'Войти по коду',
], 'commerce-ui');

must(html, [
  '599 ₽ за всю комнату',
  'Платит один игрок, второй подключается бесплатно',
  'data-purchase-email',
  'data-purchase-offer',
  'data-purchase-privacy',
  'data-guest-code',
  'data-guest-code-submit',
  'partner-premium-commerce-v1.css',
  'partner-premium-commerce-v1.js',
], 'entry-html');

if (!commerceCss.includes('.pp-purchase-fields') || !commerceCss.includes('.pp-guest-code')) throw new Error('commerce UI styles missing');
const coreScript = html.indexOf('partner-premium-v2.js');
const commerceScript = html.indexOf('partner-premium-commerce-v1.js');
if (coreScript < 0 || commerceScript < 0 || commerceScript <= coreScript) throw new Error('commerce layer must load after core game client');
if (!checkout.includes('PARTNER_PRODUCT_ID') || !status.includes('PARTNER_PRODUCT_ID') || !webhook.includes('PARTNER_PRODUCT_ID')) throw new Error('commerce product scoping missing');
if (checkout.includes('REVIEW_DISCOUNT')) throw new Error('Partner v1 must not inherit Last Aria discount rules');

console.log('Premium Partner paid access + commerce UI v1 contract OK');
