'use strict';
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/generated/cases-index.json'),'utf8'));
const report=JSON.parse(fs.readFileSync(path.join(root,'assets/generated/import-report.json'),'utf8'));
const client=fs.readFileSync(path.join(root,'assets/paid-access-client.js'),'utf8');
const storefront=fs.readFileSync(path.join(root,'assets/volume-storefront.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'assets/paid-access-config.js'),'utf8');
const edge=fs.readFileSync(path.join(root,'supabase/functions/case-access/index.ts'),'utf8');
const paymentShared=fs.readFileSync(path.join(root,'supabase/functions/_shared/payment.ts'),'utf8');
const tbankShared=fs.readFileSync(path.join(root,'supabase/functions/_shared/tbank.ts'),'utf8');
const russianCa=fs.readFileSync(path.join(root,'supabase/functions/_shared/russian-ca.ts'),'utf8');
const checkout=fs.readFileSync(path.join(root,'supabase/functions/create-checkout/index.ts'),'utf8');
const legacyWebhook=fs.readFileSync(path.join(root,'supabase/functions/yookassa-webhook/index.ts'),'utf8');
const tbankWebhook=fs.readFileSync(path.join(root,'supabase/functions/tbank-webhook/index.ts'),'utf8');
const paymentStatus=fs.readFileSync(path.join(root,'supabase/functions/payment-status/index.ts'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase/migrations/20260808181000_paid_access.sql'),'utf8');
const paymentMigration=fs.readFileSync(path.join(root,'supabase/migrations/20260808204000_payment_orders.sql'),'utf8');
const providerMigration=fs.readFileSync(path.join(root,'supabase/migrations/20260815221500_tbank_payment_provider.sql'),'utf8');
const gitignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8');

const premium=catalog.cases.filter((item)=>item.access==='premium');
const free=catalog.cases.filter((item)=>item.access==='free');
assert.equal(premium.length,85,'premium boundary must remain 85');
assert.equal(free.length,15,'free boundary must remain 15');
assert.equal(report.paidGatewayPages,85,'all 85 locked pages need the gateway');

for(const item of premium){
  const html=fs.readFileSync(path.join(root,item.legacyPath,'index.html'),'utf8');
  assert.ok(html.includes('data-paid-case-gateway="1.15.0"'),`${item.id} needs paid gateway marker`);
  assert.ok(html.includes('data-paid-access-panel'),`${item.id} needs paid access panel`);
  assert.ok(html.includes('paid-access-client.js?v=1.15.0'),`${item.id} needs paid access client`);
  assert.ok(html.includes('paid-access-config.js?v=1.15.0'),`${item.id} needs paid access runtime config`);
  assert.ok(html.includes('tom-1/'),`${item.id} must route unpurchased users to the first-volume storefront`);
  assert.ok(!html.includes('window.KtoVretWeb='),`${item.id} must not expose paid game config publicly`);
}

for(const item of free){
  const html=fs.readFileSync(path.join(root,item.path,'index.html'),'utf8');
  assert.ok(html.includes('window.KtoVretWeb='),`${item.id} free case must remain directly playable`);
  assert.ok(!html.includes('data-paid-case-gateway='),`${item.id} free case must not get paywall gateway`);
}

assert.ok(runtime.includes("endpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/case-access'"),'live paid endpoint must remain configured');
assert.ok(runtime.includes("checkoutEnabled:true"),'live T-Bank checkout must remain enabled');
assert.ok(runtime.includes("checkoutEndpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/create-checkout'"),'create-checkout endpoint missing');
assert.ok(runtime.includes("paymentStatusEndpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/payment-status'"),'payment-status endpoint missing');
assert.ok(runtime.includes("productId:'volume1'"),'volume1 product id missing');

assert.ok(storefront.includes('crypto.getRandomValues(bytes)'),'browser must create a cryptographically random purchase token');
assert.ok(storefront.includes('localStorage.setItem(storageKey, token)'),'browser must persist the opaque token before redirect');
assert.ok(storefront.includes("track('purchase_completed'"),'purchase completion analytics missing');
assert.ok(storefront.includes('payment_return'),'payment return reconciliation missing');
assert.ok(!client.includes('SERVICE_ROLE'),'service-role secret must never be present in browser code');

assert.ok(edge.includes("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"),'case access must keep service role server-side');
assert.ok(edge.includes(".from('access_entitlements')"),'case access must verify entitlement');
assert.ok(edge.includes(".from('paid_case_payloads')"),'case access must read paid payload only after access check');
assert.ok(edge.includes("'cache-control': 'private, no-store, max-age=0'"),'paid payload responses must not be publicly cached');

assert.ok(paymentShared.includes("Deno.env.get('YOOKASSA_SHOP_ID')"),'legacy YooKassa shop id must remain server-side while old orders are recoverable');
assert.ok(paymentShared.includes("Deno.env.get('YOOKASSA_SECRET_KEY')"),'legacy YooKassa secret must remain server-side while old orders are recoverable');
assert.ok(paymentShared.includes("Deno.env.get('VOLUME1_PRICE_RUB')"),'price must be server-side env');
assert.ok(paymentShared.includes('Basic ${btoa(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`)}'),'legacy payment adapter must keep server-side Basic Auth');
assert.ok(paymentShared.includes(".upsert({\n      token_hash: order.token_hash"),'legacy entitlement issuance must use the stored token hash');

assert.ok(tbankShared.includes("Deno.env.get('TBANK_TERMINAL_KEY')"),'T-Bank terminal key must be server-side');
assert.ok(tbankShared.includes("Deno.env.get('TBANK_PASSWORD')"),'T-Bank password must be server-side');
assert.ok(tbankShared.includes("crypto.subtle.digest('SHA-256'"),'T-Bank requests must be signed with SHA-256');
assert.ok(tbankShared.includes("typeof value !== 'object'"),'T-Bank signature must exclude nested request objects');
assert.ok(tbankShared.includes("Deno.createHttpClient({ caCerts: RUSSIAN_TRUSTED_CA_CERTS })"),'T-Bank needs a dedicated client with Russian trusted CAs');
assert.ok(tbankShared.includes("tbankRequest('GetState'"),'T-Bank final states must be verified through GetState');
assert.ok(tbankShared.includes("payment_provider: 'tbank'"),'T-Bank entitlement must record its payment provider');
assert.ok(russianCa.includes('RUSSIAN_TRUSTED_ROOT_CA'),'Russian Trusted Root CA missing');
assert.ok(russianCa.includes('RUSSIAN_TRUSTED_SUB_CA'),'Russian Trusted Sub CA missing');
assert.ok(russianCa.includes('-----BEGIN CERTIFICATE-----'),'Russian CA bundle must use PEM certificates');

assert.ok(checkout.includes("tbankRequest('Init'"),'T-Bank checkout must initiate payment server-side');
assert.ok(checkout.includes('Amount: amount'),'checkout must use server-derived kopeck amount');
assert.ok(checkout.includes('OrderId: orderId'),'checkout must bind T-Bank payment to the internal order');
assert.ok(checkout.includes('NotificationURL: notificationUrl'),'checkout must provide the verified notification endpoint');
assert.ok(checkout.includes('SuccessURL: successUrl.href'),'checkout needs a controlled success return URL');
assert.ok(checkout.includes('FailURL: failUrl.href'),'checkout needs a controlled failure return URL');
assert.ok(!checkout.includes('body.amount'),'client must not be able to choose payment amount');
assert.ok(checkout.includes('customerEmailHash'),'checkout may store only hashed customer email');
assert.ok(checkout.includes("payment_provider: 'tbank'"),'new orders must be explicitly marked as T-Bank');

assert.ok(tbankWebhook.includes('verifyTbankToken(notification)'),'T-Bank webhook must verify notification signature');
assert.ok(tbankWebhook.includes("String(notification.TerminalKey || '') !== TBANK_TERMINAL_KEY"),'T-Bank webhook must bind notifications to our terminal');
assert.ok(tbankWebhook.includes('PAYMENT_MISMATCH'),'T-Bank webhook must reject mismatched payment IDs');
assert.ok(tbankWebhook.includes('AMOUNT_MISMATCH'),'T-Bank webhook must reject mismatched amounts');
assert.ok(tbankWebhook.includes('refreshTbankOrder'),'T-Bank webhook must re-read final payment state before entitlement changes');
assert.ok(tbankWebhook.includes("new Response('OK'"),'valid T-Bank notification must acknowledge with exact OK body');

assert.ok(legacyWebhook.includes("yookassaRequest(`payments/${encodeURIComponent(paymentId)}`)"),'legacy webhook must re-read old YooKassa payments');
assert.ok(legacyWebhook.includes("event === 'payment.succeeded'"),'legacy payment success handler missing');
assert.ok(legacyWebhook.includes("event === 'refund.succeeded'"),'legacy refund revocation handler missing');
assert.ok(paymentStatus.includes('refreshTbankOrder(admin, order)'),'return flow must reconcile T-Bank through GetState');
assert.ok(paymentStatus.includes('refreshPaymentOrder(admin, order)'),'return flow must preserve legacy YooKassa recovery');
assert.ok(paymentStatus.includes('order.token_hash !== tokenHash'),'payment status must bind order to browser-held secret');

assert.ok(migration.includes('enable row level security'),'paid tables must have RLS enabled');
assert.ok(migration.includes('revoke all on table public.paid_case_payloads from anon, authenticated'),'paid payload table must deny browser roles');
assert.ok(migration.includes('revoke all on table public.access_entitlements from anon, authenticated'),'entitlements table must deny browser roles');
assert.ok(paymentMigration.includes('create table if not exists public.payment_orders'),'payment order table missing');
assert.ok(paymentMigration.includes('alter table public.payment_orders enable row level security'),'payment orders need RLS');
assert.ok(paymentMigration.includes('revoke all on table public.payment_orders from anon, authenticated'),'payment orders must deny browser roles');
assert.ok(!paymentMigration.includes('access_token text'),'plaintext access token column must never exist');
assert.ok(providerMigration.includes("payment_provider text not null default 'tbank'"),'payment orders must record provider');
assert.ok(providerMigration.includes('provider_payment_id text'),'generic provider payment id missing');
assert.ok(providerMigration.includes('payment_orders_provider_payment_uidx'),'provider payment identifiers need uniqueness protection');

assert.ok(gitignore.includes('.secure-backend/'),'secure payload export must be gitignored');
assert.ok(!fs.existsSync(path.join(root,'.secure-backend')),'secure backend export must not exist in public build tree');

const mobileSource=path.resolve(root,'../mobile-source');
if(fs.existsSync(mobileSource)){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-paid-'));
  const out=path.join(temp,'paid-case-payloads.json');
  const exportRun=spawnSync(process.execPath,[
    path.join(root,'tools/export-paid-backend.mjs'),
    '--source',mobileSource,
    '--out',out,
    '--commit','51c178f4dceba7bdb859e1e5d0c3244150438c0d',
  ],{cwd:root,encoding:'utf8'});
  assert.equal(exportRun.status,0,`secure paid export failed: ${exportRun.stderr||exportRun.stdout}`);
  const bundle=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(bundle.totalCases,85,'secure export must contain 85 paid cases');
  assert.equal(bundle.items.length,85,'secure export item count mismatch');
  for(const item of bundle.items){
    assert.equal(item.product_id,'volume1');
    assert.equal(item.case_id,item.payload.case.id);
    assert.equal(item.payload.case.witnessCount,item.payload.case.characters.length,`${item.case_id} witness shape mismatch`);
    assert.ok(item.payload.case.answerStages.length>0,`${item.case_id} needs answer stages`);
    assert.ok(item.payload.case.explanation.fullReason,`${item.case_id} needs protected explanation`);
  }
  fs.rmSync(temp,{recursive:true,force:true});
}

console.log('paid access boundary passed: live T-Bank checkout / 15 public / 85 server-gated');
