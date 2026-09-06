'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const supplement=JSON.parse(fs.readFileSync(path.join(root,'content/who-lied-volume-2-supplement.json'),'utf8'));
const runtime=fs.readFileSync(path.join(root,'assets/paid-access-config.js'),'utf8');
const checkout=fs.readFileSync(path.join(root,'supabase/functions/create-checkout/index.ts'),'utf8');
const payment=fs.readFileSync(path.join(root,'supabase/functions/_shared/payment.ts'),'utf8');

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

assert.ok(runtime.includes("volume1:{label:'Том I',priceRub:199,caseCount:50}"));
assert.ok(runtime.includes("volume2:{label:'Том II',priceRub:199,caseCount:50}"));
assert.ok(runtime.includes("volume_bundle_1_2:{label:'Том I + Том II',priceRub:299,caseCount:100"));
assert.ok(checkout.includes('productFor(body.productId)'),'checkout must choose only a server-known product');
assert.ok(!checkout.includes('body.amount'),'checkout must never trust client amount');
assert.ok(payment.includes("entitlementProductIds: ['volume1', 'volume2']"),'bundle must grant both volumes');

console.log('Who Lied volume model passed: 10 free target + 10 new cases + 50/50 paid volumes + 199/199/299 pricing contract');
