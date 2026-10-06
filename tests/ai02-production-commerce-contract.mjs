import fs from 'node:fs';
import assert from 'node:assert/strict';

const player=fs.readFileSync('assets/ai-case-player-v2.js','utf8');
const helper=fs.readFileSync('assets/ai02-investigation-staging.js','utf8');
const storefront=fs.readFileSync('assets/ai02-storefront.js','utf8');
const page=fs.readFileSync('detektivnaya-igra-s-ii/nulevaya-kopiya/index.html','utf8');
const hub=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');

assert.match(player,/STORAGE_KEY_PREFIX='mysterylogic:ai-investigation:access-token:'/);
assert.match(player,/storageScope=\(\)=>ui\.caseId\.replace\(/,'AI player must scope token to case family, not difficulty');
assert.match(player,/root\.dataset\.caseId/);
assert.match(player,/storedToken\(\)/);
assert.doesNotMatch(player,/localStorage\.getItem\(STORAGE_KEY\)/,'legacy global AI token must not remain primary storage');
assert.match(player,/ml:ai-case-access/);

assert.match(helper,/PREVIEW_WORKSPACE=PREVIEW_MODE==='workspace'/,'localhost must not reveal workspace by default');
assert.match(helper,/FAMILY_ACCESS_KEY='mysterylogic:ai-investigation:access-token:'\+ACCESS_FAMILY/);

assert.match(storefront,/PRODUCT_ID='ai02_zero_copy'/,'storefront must use the deployed AI-02 order product id');
assert.match(storefront,/create-checkout'/);
assert.match(storefront,/payment-status'/);
assert.doesNotMatch(storefront,/create-checkout-ai02|payment-status-ai02/,'parallel unused commerce endpoints must not be referenced');
assert.match(storefront,/DOSSIER_MIN_XP=240/,'storefront must mirror deployed dossier discount threshold');
assert.match(storefront,/dossierDiscountRequested:dossierEligible/,'server must revalidate requested dossier discount');
assert.match(storefront,/TOKEN_KEY='mysterylogic:ai-investigation:access-token:AI02-NK'/,'checkout must use AI-02 family token');
assert.match(page,/data-case-id="AI02-NK-STANDARD"/);
assert.match(page,/Доступ не сгорает/);
assert.match(page,/ранг «Следователь»/);
assert.match(hub,/vosem-minut-bez-kamery/);
assert.match(hub,/nulevaya-kopiya/);
assert.match(hub,/249 ₽ с рангом «Следователь»/);

console.log('AI-02 production storefront contract: ok');
