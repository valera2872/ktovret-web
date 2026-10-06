import fs from 'node:fs';
import assert from 'node:assert/strict';

const checkout=fs.readFileSync('supabase/functions/create-checkout-ai02/index.ts','utf8');
const status=fs.readFileSync('supabase/functions/payment-status-ai02/index.ts','utf8');
const webhook=fs.readFileSync('supabase/functions/tbank-webhook-ai02/index.ts','utf8');

assert.match(checkout,/ORDER_PRODUCT_ID='ai02_zero_copy'/);
assert.match(checkout,/ENTITLEMENT_PRODUCT_ID='ai02-zero-copy'/);
assert.match(checkout,/STANDARD_PRICE_RUB=299/);
assert.match(checkout,/DOSSIER_PRICE_RUB=249/);
assert.match(checkout,/DOSSIER_MIN_XP=240/);
assert.match(checkout,/\.from\('player_profiles'\)/);
assert.match(checkout,/dossier_discount_not_eligible/);
assert.match(checkout,/tbank-webhook-ai02/);
assert.match(checkout,/AI02-NK-EASY/);
assert.match(checkout,/AI02-NK-STANDARD/);
assert.match(checkout,/AI02-NK-HARD/);

for(const source of [status,webhook]){
  assert.match(source,/ENTITLEMENT_PRODUCT_ID='ai02-zero-copy'/);
  assert.match(source,/expires_at:null/,'paid AI-02 access must be non-expiring');
  assert.match(source,/allowed_case_ids:CASE_IDS/,'all difficulty variants must share one purchase');
  assert.match(source,/experience_tier:'text'/);
  assert.match(source,/product_id:ENTITLEMENT_PRODUCT_ID/);
  assert.match(source,/REFUNDED/,'refund must revoke AI-02 entitlement');
}
assert.doesNotMatch(checkout,/service_role|SUPABASE_SERVICE_ROLE_KEY/i,'checkout must not expose service role directly');
console.log('AI-02 commerce release contract: ok');
