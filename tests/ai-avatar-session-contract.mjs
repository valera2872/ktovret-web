import fs from 'node:fs';
import assert from 'node:assert/strict';

const edge=fs.readFileSync('supabase/functions/ai-avatar-session/index.ts','utf8');
const profiles=fs.readFileSync('supabase/functions/_shared/ai-avatar-profile.ts','utf8');

assert.match(edge,/ALLOWED_ORIGINS=new Set\(\["https:\/\/mysterylogic\.com","https:\/\/valera2872\.github\.io"\]\)/,'avatar broker must use the same explicit browser origin boundary');
assert.match(edge,/LIVEAVATAR_API_KEY=Deno\.env\.get\("LIVEAVATAR_API_KEY"\)/,'provider API key must stay server-side');
assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/,'paid entitlement validation must stay server-side');
assert.match(edge,/access_entitlements/,'avatar spend must be gated by the paid entitlement table');
assert.match(edge,/experience_tier/,'avatar broker must distinguish text and live purchases');
assert.match(edge,/live_tier_required/,'text purchases must be rejected before provider spend');
assert.match(edge,/live_wrong_case/,'case-scoped live purchases must not unlock other cases');
assert.match(edge,/token_hash/,'opaque purchase tokens must be hashed before entitlement lookup');
assert.match(edge,/AI_AVATAR_ENABLED/,'avatar rollout must be protected by a server-side kill switch');
assert.match(edge,/AI_AVATAR_SANDBOX/,'provider sandbox mode must be configurable and default-safe');
assert.match(edge,/loadAiAvatarProfile/,'avatar identity must come from the server-only case profile layer');
assert.match(edge,/profile\?\.avatarId/,'broker must use the resolved case+suspect avatar identity');
assert.doesNotMatch(edge,/AI_AVATAR_MARINA_ID|AI_AVATAR_ANTON_ID|AI_AVATAR_LEV_ID|SUSPECT_AVATARS/,'generic broker must not hardcode AI-01 identities');
assert.match(profiles,/const LEGACY_CASE_ID="AI-01"/,'legacy identity support must be isolated in the shared profile loader');
assert.match(profiles,/\.eq\("status","published"\)/,'new case identities must be explicitly published before Live use');
assert.match(edge,/requestedAvatarId&&requestedAvatarId!==allowedAvatarId/,'browser must never be able to select arbitrary billable avatars');
assert.match(edge,/provider!=="heygen"&&provider!=="liveavatar"/,'provider input must be allowlisted');
assert.match(edge,/requestedMode&&requestedMode!=="lite"/,'Mystery Logic must keep its own AI brain via LITE mode');
assert.match(edge,/\/v1\/sessions\/token/,'broker must use the current LiveAvatar session-token API');
assert.match(edge,/"X-API-KEY":LIVEAVATAR_API_KEY/,'upstream API key must be sent only from the Edge function');
assert.match(edge,/mode:"LITE"/,'upstream session must be LITE mode');
assert.match(edge,/is_sandbox:AVATAR_SANDBOX/,'initial rollout must support zero-credit sandbox testing');
assert.match(edge,/max_session_duration:MAX_SESSION_SECONDS/,'session duration must have a server-controlled ceiling');
assert.match(edge,/speech_token:signedSpeechToken/,'successful avatar session must issue a short-lived signed speech capability');
assert.match(edge,/cid:caseId/,'speech capability must remain bound to the paid case');
assert.match(edge,/eid:entitlementId/,'speech capability must remain bound to the verified paid entitlement for budget accounting');
assert.match(edge,/live_entitlement_invalid/,'invalid entitlement identities must fail before issuing a speech capability');
assert.match(edge,/HMAC/,'speech capability must be integrity-protected server-side');
assert.match(edge,/speechExpiresAt=Math\.floor\(Date\.now\(\)\/1000\)\+MAX_SESSION_SECONDS\+60/,'speech capability must expire with the realtime session');
assert.doesNotMatch(edge,/LIVEAVATAR_API_KEY\s*=\s*["'][^"']{8,}["']/,'no permanent provider credential may be committed');
assert.doesNotMatch(edge,/context_id|llm_configuration_id|voice_agent/,'LITE broker must not silently move story logic into LiveAvatar');

const entitlementCheckIndex=edge.indexOf('const liveAccess=await requireLiveEntitlement(accessToken,caseId);');
const ownerPreviewIndex=edge.indexOf('const isOwnerPreview=caseId==="AI-01"&&clean(liveAccess.entitlement?.metadata?.source,64)==="owner_preview";');
const killSwitchIndex=edge.indexOf('if(!AVATAR_ENABLED&&!isOwnerPreview)return json(origin,503,{error:"avatar_disabled"});');
assert.ok(entitlementCheckIndex>=0,'owner preview must still start with a real live entitlement check');
assert.ok(ownerPreviewIndex>entitlementCheckIndex,'owner preview identity must come from verified server-side entitlement metadata');
assert.ok(killSwitchIndex>ownerPreviewIndex,'kill-switch bypass must only be evaluated after the scoped owner preview entitlement is verified');
assert.match(edge,/caseId==="AI-01"&&clean\(liveAccess\.entitlement\?\.metadata\?\.source,64\)==="owner_preview"/,'temporary preview bypass must be restricted to AI-01 owner_preview entitlements');

console.log('avatar session broker contract: ok');
