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
const runtime=fs.readFileSync(path.join(root,'assets/paid-access-config.js'),'utf8');
const edge=fs.readFileSync(path.join(root,'supabase/functions/case-access/index.ts'),'utf8');
const paymentShared=fs.readFileSync(path.join(root,'supabase/functions/_shared/payment.ts'),'utf8');
const checkout=fs.readFileSync(path.join(root,'supabase/functions/create-checkout/index.ts'),'utf8');
const webhook=fs.readFileSync(path.join(root,'supabase/functions/yookassa-webhook/index.ts'),'utf8');
const paymentStatus=fs.readFileSync(path.join(root,'supabase/functions/payment-status/index.ts'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase/migrations/20260808181000_paid_access.sql'),'utf8');
const paymentMigration=fs.readFileSync(path.join(root,'supabase/migrations/20260808204000_payment_orders.sql'),'utf8');
const gitignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8');

const premium=catalog.cases.filter((item)=>item.access==='premium');
const free=catalog.cases.filter((item)=>item.access==='free');
assert.equal(premium.length,85,'premium boundary must remain 85');
assert.equal(free.length,15,'free boundary must remain 15');
assert.equal(report.paidGatewayPages,85,'all 85 locked pages need the gateway');

for(const item of premium){
  const html=fs.readFileSync(path.join(root,item.legacyPath,'index.html'),'utf8');
  assert.ok(html.includes('data-paid-case-gateway="1.13.0"'),`${item.id} needs paid gateway marker`);
  assert.ok(html.includes('data-paid-access-panel'),`${item.id} needs paid access panel`);
  assert.ok(html.includes('data-purchase-email-wrap'),`${item.id} needs dormant checkout email field`);
  assert.ok(html.includes('paid-access-client.js?v=1.13.0'),`${item.id} needs paid access client`);
  assert.ok(html.includes('paid-access-config.js?v=1.13.0'),`${item.id} needs paid access runtime config`);
  assert.ok(html.includes('tom-1/'),`${item.id} must route unpurchased users to the first-volume storefront`);
  assert.ok(!html.includes('window.KtoVretWeb='),`${item.id} must not expose paid game config publicly`);
}

for(const item of free){
  const html=fs.readFileSync(path.join(root,item.path,'index.html'),'utf8');
  assert.ok(html.includes('window.KtoVretWeb='),`${item.id} free case must remain directly playable`);
  assert.ok(!html.includes('data-paid-case-gateway='),`${item.id} free case must not get paywall gateway`);
}

assert.ok(runtime.includes("endpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/case-access'"),'live paid endpoint must remain configured');
assert.ok(runtime.includes("checkoutEnabled:false"),'checkout must remain publicly disabled until acquiring credentials and receipt settings are verified');
assert.ok(runtime.includes("checkoutEndpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/create-checkout'"),'create-checkout endpoint missing');
assert.ok(runtime.includes("paymentStatusEndpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/payment-status'"),'payment-status endpoint missing');
assert.ok(runtime.includes("productId:'volume1'"),'volume1 product id missing');

assert.ok(client.includes('crypto.getRandomValues(bytes)'),'browser must create a cryptographically random purchase token');
assert.ok(client.includes('localStorage.setItem(storageKey, token)'),'browser must persist the opaque token before redirect');
assert.ok(client.includes("track('purchase_completed'"),'purchase completion analytics missing');
assert.ok(client.includes('payment_return'),'payment return reconciliation missing');
assert.ok(!client.includes('SERVICE_ROLE'),'service-role secret must never be present in browser code');

assert.ok(edge.includes("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"),'case access must keep service role server-side');
assert.ok(edge.includes(".from('access_entitlements')"),'case access must verify entitlement');
assert.ok(edge.includes(".from('paid_case_payloads')"),'case access must read paid payload only after access check');
assert.ok(edge.includes("'cache-control': 'private, no-store, max-age=0'"),'paid payload responses must not be publicly cached');

assert.ok(paymentShared.includes("Deno.env.get('YOOKASSA_SHOP_ID')"),'legacy YooKassa shop id must remain server-side until T-Bank adapter replaces it');
assert.ok(paymentShared.includes("Deno.env.get('YOOKASSA_SECRET_KEY')"),'legacy YooKassa secret must remain server-side until T-Bank adapter replaces it');
assert.ok(paymentShared.includes("Deno.env.get('VOLUME1_PRICE_RUB')"),'price must be server-side env');
assert.ok(paymentShared.includes('Basic ${btoa(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`)}'),'legacy payment adapter must use server-side Basic Auth');
assert.ok(paymentShared.includes(".upsert({\n      token_hash: order.token_hash"),'entitlement issuance must use the stored token hash');

assert.ok(checkout.includes("headers: { 'Idempotence-Key': requestId }"),'legacy payment creation needs idempotency');
assert.ok(checkout.includes("amount: { value: amountValue, currency: 'RUB' }"),'checkout must use server amount');
assert.ok(!checkout.includes('body.amount'),'client must not be able to choose payment amount');
assert.ok(checkout.includes("metadata: { order_id: orderId, product_id: PRODUCT_ID"),'payment must carry internal order metadata');
assert.ok(checkout.includes('customerEmailHash'),'checkout may store only hashed customer email');

assert.ok(webhook.includes("yookassaRequest(`payments/${encodeURIComponent(paymentId)}`)"),'legacy webhook must re-read payment');
assert.ok(webhook.includes("event === 'payment.succeeded'"),'payment success handler missing');
assert.ok(webhook.includes("event === 'refund.succeeded'"),'refund revocation handler missing');
assert.ok(webhook.includes("status: 'refunded'"),'full refund must revoke entitlement');
assert.ok(paymentStatus.includes('refreshPaymentOrder(admin, order)'),'return flow must reconcile delayed webhook through payment API');
assert.ok(paymentStatus.includes('order.token_hash !== tokenHash'),'payment status must bind order to browser-held secret');

assert.ok(migration.includes('enable row level security'),'paid tables must have RLS enabled');
assert.ok(migration.includes('revoke all on table public.paid_case_payloads from anon, authenticated'),'paid payload table must deny browser roles');
assert.ok(migration.includes('revoke all on table public.access_entitlements from anon, authenticated'),'entitlements table must deny browser roles');
assert.ok(paymentMigration.includes('create table if not exists public.payment_orders'),'payment order table missing');
assert.ok(paymentMigration.includes('alter table public.payment_orders enable row level security'),'payment orders need RLS');
assert.ok(paymentMigration.includes('revoke all on table public.payment_orders from anon, authenticated'),'payment orders must deny browser roles');
assert.ok(!paymentMigration.includes('access_token text'),'plaintext access token column must never exist');

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

console.log('paid access 1.11 boundary passed: payment orchestration ready / checkout disabled / 15 public / 85 server-gated');