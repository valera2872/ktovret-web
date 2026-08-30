import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('supabase/functions/_shared/ai-commerce.ts','utf8');

assert.match(source,/text: Object\.freeze\(\{[\s\S]*displayPriceEur: '4\.90'[\s\S]*grantsTier: 'text'/,'Text offer must be server-owned at €4.90 and grant text');
assert.match(source,/live: Object\.freeze\(\{[\s\S]*displayPriceEur: '9\.90'[\s\S]*grantsTier: 'live'/,'Live offer must be server-owned at €9.90 and grant live');
assert.match(source,/upgrade_live: Object\.freeze\(\{[\s\S]*displayPriceEur: '5\.00'[\s\S]*kind: 'upgrade'/,'Text→Live upgrade must remain €5.00');
assert.match(source,/const OFFER_CODES = new Set<AiOfferCode>\(\['text', 'live', 'upgrade_live'\]\)/,'only allow the three canonical offer codes');
assert.match(source,/TOKEN_HASH_RE = \/\^\[0-9a-f\]\{64\}\$\//,'entitlement grant accepts only hashed access tokens');
assert.doesNotMatch(source,/accessToken\s*:/,'shared grant layer must never accept or store a plaintext access token');

assert.match(source,/if \(offer\.kind === 'upgrade'\) \{/,'upgrade needs a dedicated code path');
assert.match(source,/existing\.status !== 'active'\) throw new Error\('ai_upgrade_requires_text_entitlement'\)/,'upgrade must require an active existing entitlement');
assert.match(source,/caseAllowedByMetadata\(existing\.metadata, input\.caseId\)/,'upgrade must be scoped to the same case');
assert.match(source,/if \(aiExperienceTier\(metadata\) === 'live'\) throw new Error\('ai_upgrade_already_live'\)/,'a different order must not sell Live twice');
assert.match(source,/String\(metadata\.live_upgrade_order_id \|\| ''\) === input\.orderId/,'replayed upgrade finalization must be idempotent');
assert.match(source,/\.update\(\{ metadata: nextMetadata, updated_at: now \}\)[\s\S]*\.eq\('id', existing\.id\)/,'upgrade must mutate the existing entitlement instead of replacing it');
assert.match(source,/experience_tier: 'live'/,'upgrade must promote the existing entitlement to Live');
assert.match(source,/allowed_case_ids:[\s\S]*\[input\.caseId\]/,'new and upgraded grants must retain case scope');
assert.match(source,/offer_history: appendOfferHistory/,'upgrade audit history must preserve prior purchase metadata');
assert.match(source,/throw new Error\('ai_purchase_token_in_use'\)/,'an unrelated initial purchase may not silently overwrite an existing token');

assert.match(source,/export const refundAiPaidOffer/,'AI commerce needs refund semantics distinct from volume1');
assert.match(source,/if \(offer\.kind === 'upgrade'\)[\s\S]*experience_tier: 'text'/,'refunding only the €5 upgrade must downgrade Live back to Text');
assert.match(source,/delete nextMetadata\.live_upgrade_order_id/,'upgrade refund must clear the active upgrade marker');
assert.match(source,/status: 'refunded',[\s\S]*revoked_at: now/,'refunding an initial Text or Live purchase must revoke that purchased entitlement');

console.log('AI commerce entitlement contract: ok');
