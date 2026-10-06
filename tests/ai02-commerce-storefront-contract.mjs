import fs from 'node:fs';
import assert from 'node:assert/strict';

const store=fs.readFileSync('assets/ai02-storefront.js','utf8');
const player=fs.readFileSync('assets/ai-case-player-v2.js','utf8');
const catalog=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const premium=fs.readFileSync('detektivnaya-igra-s-ii/nulevaya-kopiya/index.html','utf8');
const free=fs.readFileSync('detektivnaya-igra-s-ii/vosem-minut-bez-kamery/index.html','utf8');
const home=fs.readFileSync('index.html','utf8');

assert.ok(store.includes("PRODUCT_ID='ai02_zero_copy'"),'storefront must use the existing production order product id');
assert.ok(store.includes("CASE_ID='AI02-NK-STANDARD'"));
assert.ok(store.includes('PRICE_RUB=299')&&store.includes('DISCOUNT_RUB=50'));
assert.ok(store.includes("mysterylogic:challenge:client-key"),'storefront must reuse dossier browser identity');
assert.ok(store.includes('dossierDiscountRequested:discountEligible'),'eligible dossier player must explicitly request the existing server-verified discount');
assert.ok(store.includes("mysterylogic:ai-investigation:${CASE_ID}:access-token"),'purchase token must be scoped to AI-02');
assert.ok(player.includes('root.dataset.caseId'),'player must support fixed production case route');
assert.ok(player.includes('mysterylogic:ai-investigation:${requestedCase}:access-token'),'AI tokens must be scoped per case');
assert.ok(catalog.includes('./vosem-minut-bez-kamery/')&&catalog.includes('./nulevaya-kopiya/'));
assert.ok(premium.includes('data-case-id="AI02-NK-STANDARD"')&&premium.includes('data-ai02-storefront'));
assert.ok(!premium.includes('ai02-nk-preview'),'public page must not expose preview product id');
assert.ok(free.includes('../../assets/ai-detective-vslice.js'),'moved free case asset paths invalid');
assert.ok(home.includes('./detektivnaya-igra-s-ii/nulevaya-kopiya/'));
console.log('AI-02 storefront contract: ok');