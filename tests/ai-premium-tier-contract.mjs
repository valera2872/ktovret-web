import fs from 'node:fs';
import assert from 'node:assert/strict';

const plan=fs.readFileSync('docs/ai-premium-tier-plan.md','utf8');
const access=fs.readFileSync('supabase/functions/case-access/index.ts','utf8');
const client=fs.readFileSync('assets/paid-access-client.js','utf8');
const avatar=fs.readFileSync('supabase/functions/ai-avatar-session/index.ts','utf8');

assert.match(plan,/`text` \| €4\.90/,'text launch price must be documented');
assert.match(plan,/`live` \| €9\.90/,'live launch price must be documented');
assert.match(plan,/upgrade \| €5\.00/,'text-to-live upgrade must charge only the difference');
assert.match(access,/experienceTier/,'case access must expose a normalized experience tier');
assert.match(access,/=== 'live' \? 'live' : 'text'/,'missing or unknown entitlement tiers must remain backward-compatible text access');
assert.match(access,/liveAvatar: tier === 'live'/,'only live entitlements may advertise realtime avatar access');
assert.match(access,/\.eq\('product_id', paidCase\.product_id\)/,'entitlement lookup must follow each paid case product rather than hard-code volume1');
assert.match(access,/allowed_case_ids/,'case-scoped entitlements must be enforced');
assert.match(client,/window\.MysteryLogicPaidAccess/,'verified entitlement context must be made available to optional premium renderers');
assert.match(client,/experienceTier: access\.experienceTier === 'live' \? 'live' : 'text'/,'client must preserve text/live tier without trusting arbitrary values');
assert.match(client,/root\.dataset\.experienceTier/,'unlocked game shell must expose the verified tier to UI/runtime layers');
assert.match(avatar,/requireLiveEntitlement/,'avatar broker must independently verify the purchase before spend');
assert.match(avatar,/live_tier_required/,'text purchases must never reach LiveAvatar upstream');
assert.match(avatar,/entitlementAllowsCase/,'live avatar rights must remain scoped to the purchased case when configured');
console.log('AI premium tier contract: ok');
