import fs from 'node:fs';import assert from 'node:assert/strict';
const checkout=fs.readFileSync('supabase/functions/create-checkout/index.ts','utf8');
const status=fs.readFileSync('supabase/functions/payment-status/index.ts','utf8');
const webhook=fs.readFileSync('supabase/functions/tbank-webhook/index.ts','utf8');
assert.match(checkout,/AI02_ORDER_PRODUCT_ID='ai02_zero_copy'/);
assert.match(checkout,/AI02_ENTITLEMENT_PRODUCT_ID='ai02-zero-copy'/);
assert.match(checkout,/AI02_STANDARD_PRICE_RUB=299/);
assert.match(checkout,/AI02_DOSSIER_PRICE_RUB=249/);
assert.match(checkout,/AI02_DOSSIER_MIN_XP=240/);
assert.match(checkout,/\.from\('player_profiles'\)/);
assert.match(checkout,/dossier_discount_not_eligible/);
for(const source of [status,webhook]){assert.match(source,/AI02_ENTITLEMENT_PRODUCT_ID='ai02-zero-copy'/);assert.match(source,/expires_at:null/);assert.match(source,/allowed_case_ids:AI02_CASE_IDS/);assert.match(source,/experience_tier:'text'/);assert.match(source,/REFUNDED/);}
assert.match(checkout,/const PRODUCT_ID = 'volume1'/,'legacy checkout branch must remain');
assert.match(status,/const PRODUCT_ID='volume1'/,'legacy status branch must remain');
assert.match(webhook,/const PRODUCT_ID='volume1'/,'legacy webhook branch must remain');
console.log('AI-02 commerce release contract: ok');