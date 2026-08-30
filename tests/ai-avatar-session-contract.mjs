import fs from 'node:fs';
import assert from 'node:assert/strict';

const edge=fs.readFileSync('supabase/functions/ai-avatar-session/index.ts','utf8');

assert.match(edge,/ALLOWED_ORIGINS=new Set\(\["https:\/\/mysterylogic\.com","https:\/\/valera2872\.github\.io"\]\)/,'avatar broker must use the same explicit browser origin boundary');
assert.match(edge,/LIVEAVATAR_API_KEY=Deno\.env\.get\("LIVEAVATAR_API_KEY"\)/,'provider API key must stay server-side');
assert.match(edge,/AI_AVATAR_ENABLED/,'avatar rollout must be protected by a server-side kill switch');
assert.match(edge,/AI_AVATAR_SANDBOX/,'provider sandbox mode must be configurable and default-safe');
assert.match(edge,/AI_AVATAR_MARINA_ID/,'Marina avatar must be server allowlisted');
assert.match(edge,/AI_AVATAR_ANTON_ID/,'Anton avatar must be server allowlisted before rollout');
assert.match(edge,/AI_AVATAR_LEV_ID/,'Lev avatar must be server allowlisted before rollout');
assert.match(edge,/requestedAvatarId&&requestedAvatarId!==allowedAvatarId/,'browser must never be able to select arbitrary billable avatars');
assert.match(edge,/provider!=="heygen"&&provider!=="liveavatar"/,'provider input must be allowlisted');
assert.match(edge,/requestedMode&&requestedMode!=="lite"/,'Mystery Logic must keep its own AI brain via LITE mode');
assert.match(edge,/\/v1\/sessions\/token/,'broker must use the current LiveAvatar session-token API');
assert.match(edge,/"X-API-KEY":LIVEAVATAR_API_KEY/,'upstream API key must be sent only from the Edge function');
assert.match(edge,/mode:"LITE"/,'upstream session must be LITE mode');
assert.match(edge,/is_sandbox:AVATAR_SANDBOX/,'initial rollout must support zero-credit sandbox testing');
assert.match(edge,/max_session_duration:MAX_SESSION_SECONDS/,'session duration must have a server-controlled ceiling');
assert.doesNotMatch(edge,/LIVEAVATAR_API_KEY\s*=\s*["'][^"']{8,}["']/,'no permanent provider credential may be committed');
assert.doesNotMatch(edge,/context_id|llm_configuration_id|voice_agent/,'LITE broker must not silently move story logic into LiveAvatar');
console.log('avatar session broker contract: ok');
