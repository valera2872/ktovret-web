'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const supplement=JSON.parse(read('content/who-lied-volume-2-supplement.json'));
const runtime=read('assets/paid-access-config.js');
const checkout=read('supabase/functions/create-checkout/index.ts');
const payment=read('supabase/functions/_shared/payment.ts');
const tbank=read('supabase/functions/_shared/tbank.ts');
const webhook=read('supabase/functions/tbank-webhook/index.ts');
const paymentStatus=read('supabase/functions/payment-status/index.ts');
const caseAccess=read('supabase/functions/case-access/index.ts');
const migration=read('supabase/migrations/20260906110000_multi_product_entitlements.sql');
const importer=read('tools/import-mobile-cases.mjs');
const loader=read('tools/import-mobile/load-active.mjs');
const seoCtr=read('tools/import-mobile/seo-ctr-modernization.mjs');
const finalSeo=read('tools/import-mobile/final-seo-postprocess.mjs');
const volumeSales=read('tools/import-mobile/storefront-volume-sales-postprocess.mjs');
const pickerCss=read('assets/storefront-reference-v41.css');

assert.equal(supplement.schemaVersion,1);
assert.equal(supplement.cases.length,10,'Volume II supplement must add exactly ten cases');
assert.equal(new Set(supplement.cases.map((item)=>item.id)).size,10,'new case ids must be unique');
assert.equal(supplement.sets.length,1,'supplement must define one source set');
assert.equal(supplement.sets[0].isPremium,true,'supplement source set must remain premium');

for(const item of supplement.cases){
  assert.ok(item.id.startsWith('web_v2_'),`${item.id} must be namespaced as web Volume II content`);
  assert.equal(item.setId,'web_volume2_new_2026_09',`${item.id} set mismatch`);
  assert.ok(item.title&&item.intro&&item.question,`${item.id} needs player-facing copy`);
  assert.ok(Array.isArray(item.facts)&&item.facts.length>=3,`${item.id} needs at least three facts`);
  assert.ok(Array.isArray(item.timeline)&&item.timeline.length>=1,`${item.id} needs a timeline`);
  assert.ok(Array.isArray(item.characters)&&item.characters.length===3,`${item.id} needs exactly three statements in this short format`);
  const ids=new Set(item.characters.map((character)=>character.id));
  assert.equal(ids.size,item.characters.length,`${item.id} character ids must be unique`);
  assert.ok(ids.has(item.explanation?.correctOptionId),`${item.id} correctOptionId must point at a character`);
  assert.ok(item.explanation?.shortReason,`${item.id} needs a short reason`);
  assert.ok(item.explanation?.fullReason,`${item.id} needs a full evidence-backed explanation`);
  assert.ok(Array.isArray(item.explanation?.reasoningSteps)&&item.explanation.reasoningSteps.length>=3,`${item.id} needs explicit reasoning steps`);
}

assert.ok(loader.includes('const FREE_CASE_COUNT=10'),'exactly 10 cases must be free');
assert.ok(loader.includes('const VOLUME_SIZE=50'),'each paid volume must contain 50 cases');
assert.ok(loader.includes('expectedTotal=FREE_CASE_COUNT+(VOLUME_SIZE*2)'),'catalog must enforce 10 + 50 + 50 = 110');
assert.ok(importer.includes('schemaVersion:5'),'generated catalog must use the multi-volume schema');
assert.ok(importer.includes('totalCases:lib.totalCases'));
assert.ok(importer.includes('freeCount:lib.freeCount'));
assert.ok(importer.includes('volume1Count:lib.volume1Count'));
assert.ok(importer.includes('volume2Count:lib.volume2Count'));
assert.ok(importer.includes('applyPlayerFeedback(siteRoot)'),'two-volume import must retain universal player feedback');

assert.ok(runtime.includes("volume1:{label:'Том I',priceRub:199,caseCount:50}"));
assert.ok(runtime.includes("volume2:{label:'Том II',priceRub:199,caseCount:50}"));
assert.ok(runtime.includes("volume_bundle_1_2:{label:'Том I + Том II',priceRub:299,caseCount:100"));
assert.ok(checkout.includes("const requestedProductId = String(body.productId || '').trim()"),'checkout must require an explicit product id');
assert.ok(checkout.includes("if (!requestedProductId) return json(400, { error: 'invalid_product' }"),'old cached checkout without product must be rejected');
assert.ok(!checkout.includes('body.amount'),'checkout must never trust client amount');
assert.ok(payment.includes("entitlementProductIds: ['volume1', 'volume2']"),'bundle must grant both volumes');

assert.ok(payment.includes("LEGACY_VOLUME_ALL_PRODUCT_ID = 'legacy_volume_all'"),'legacy full-catalog entitlement must exist');
assert.ok(payment.includes('entitlementProductsForOrder'),'order-aware grandfathering must exist');
assert.ok(tbank.includes('entitlementProductsForOrder(order)'),'TBank confirmation/refund must preserve grandfathering');
assert.ok(webhook.includes('entitlementProductsForOrder(order)'),'TBank webhook refund must revoke grandfathered access too');
assert.ok(paymentStatus.includes('entitlementProductsForOrder(order)'),'payment restore must understand legacy ownership');
assert.ok(caseAccess.includes("WHO_LIED_VOLUME_PRODUCTS = new Set(['volume1', 'volume2'])"),'legacy ownership must be scoped only to Who Lied volumes');
assert.ok(caseAccess.includes(".in('product_id', acceptedProducts)"),'case access must check exact volume or legacy all-access entitlement');
assert.ok(migration.includes("coalesce(po.offer_version, '') <> '2026-09-06'"),'migration must not grandfather new split-era orders');

assert.ok(seoCtr.includes('10 бесплатных дел без регистрации'),'homepage SEO must advertise 10 free cases');
assert.ok(!seoCtr.includes('15 бесплатных'),'CTR SEO must not advertise the old free count');
assert.ok(finalSeo.includes('Final SEO expected 110 case pages'),'SEO pipeline must validate all 110 cases');
assert.ok(finalSeo.includes('10 бесплатных детективных дел онлайн'),'SEO hubs must advertise 10 free cases');
assert.ok(volumeSales.includes('data-free-case-count="10"'),'sales page must expose the 10-case free tier');
assert.ok(volumeSales.includes('Who Lied offer copy is stale'),'build must fail if old 15/85 offer copy leaks into public pages');
assert.ok(pickerCss.includes('.ref-volume-product-picker button.is-selected'),'volume picker must have a visible selected state');

console.log('Who Lied volume model passed: 10 free + 50/50 paid + 199/199/299 + grandfathering + SEO safeguards');
