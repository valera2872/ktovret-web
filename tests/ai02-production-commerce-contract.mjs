import fs from 'node:fs';
import assert from 'node:assert/strict';

const commerce=fs.readFileSync('supabase/functions/_shared/ai02-commerce.ts','utf8');
const checkout=fs.readFileSync('supabase/functions/create-checkout-ai02/index.ts','utf8');
const status=fs.readFileSync('supabase/functions/payment-status-ai02/index.ts','utf8');
const webhook=fs.readFileSync('supabase/functions/tbank-webhook-ai02/index.ts','utf8');
const player=fs.readFileSync('assets/ai-case-player-v2.js','utf8');
const storefront=fs.readFileSync('assets/ai02-storefront.js','utf8');
const page=fs.readFileSync('detektivnaya-igra-s-ii/nulevaya-kopiya/index.html','utf8');

assert.match(commerce,/AI02_PRODUCT_ID = 'ai02-nk'/);
assert.match(commerce,/AI02_PRICE_RUB = 299/);
assert.match(commerce,/AI02_DOSSIER_DISCOUNT_RUB = 50/);
assert.match(commerce,/AI02_DOSSIER_PRICE_RUB = 249/);
assert.match(commerce,/completedCases>=15/,'dossier discount must require complete 15-case dossier');
assert.match(commerce,/expires_at:null/,'paid AI-02 access must not expire');
assert.match(commerce,/allowed_case_ids:\[\.\.\.AI02_ALLOWED_CASE_IDS\]/,'entitlement must be scoped to AI-02 difficulty variants');
assert.match(commerce,/experience_tier:'text'/);

assert.match(checkout,/ai02DossierDiscount\(admin,browserKey\)/,'checkout must revalidate dossier server-side');
assert.match(checkout,/amount!==\(dossier\.eligible\?24900:29900\)/);
assert.match(checkout,/tbank-webhook-ai02/);
assert.match(status,/accessPermanent:Boolean\(entitled&&!entitlement\?\.expires_at\)/);
assert.match(webhook,/verifyTbankToken/);
assert.match(webhook,/AI02_PRODUCT_ID/);

assert.match(player,/STORAGE_KEY_PREFIX='mysterylogic:ai-investigation:access-token:'/);
assert.match(player,/root\.dataset\.caseId/);
assert.match(player,/storedToken\(\)/);
assert.doesNotMatch(player,/localStorage\.getItem\(STORAGE_KEY\)/,'legacy global AI token must not remain primary storage');
assert.match(player,/ml:ai-case-access/);

assert.match(storefront,/create-checkout-ai02/);
assert.match(storefront,/payment-status-ai02/);
assert.match(storefront,/player-dossier/);
assert.match(storefront,/completedCases>=15/);
assert.match(page,/data-case-id="AI02-NK-STANDARD"/);
assert.match(page,/Доступ не сгорает/);
assert.match(page,/Бонус Досье следователя/);

console.log('AI-02 production commerce/storefront contract: ok');
