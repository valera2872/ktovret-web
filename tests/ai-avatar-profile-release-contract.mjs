import fs from 'node:fs';
import assert from 'node:assert/strict';

const profile=fs.readFileSync('supabase/functions/_shared/ai-avatar-profile.ts','utf8');
const session=fs.readFileSync('supabase/functions/ai-avatar-session/index.ts','utf8');
const tts=fs.readFileSync('supabase/functions/ai-avatar-tts/index.ts','utf8');
const schema=fs.readFileSync('supabase/migrations/20260830132613_ai_case_avatar_profiles.sql','utf8');
const draftIdentity=fs.readFileSync('supabase/migrations/20260830144423_allow_draft_avatar_profiles_without_identity.sql','utf8');

// Runtime must never select draft or retired identities.
assert.match(profile,/\.eq\("status","published"\)/,'runtime profile lookup must select only published rows');
assert.doesNotMatch(profile,/\.eq\("status","draft"\)/,'draft avatar rows must never be runtime-selectable');
assert.match(profile,/provider!=="liveavatar"\|\|!avatarId\|\|!ttsVoice/,'published database profiles must have a LiveAvatar id and TTS voice');

// AI-01 legacy fallback stays scoped to AI-01; it is not a generic bypass for future cases.
assert.match(profile,/if\(caseId!==LEGACY_CASE_ID\)return null;/,'legacy fallback must stay scoped to AI-01');

// Wayne is a narrow owner-preview sandbox fallback, never a customer fallback.
assert.match(session,/const sandboxFallbackAllowed=isOwnerPreview&&AVATAR_SANDBOX/,'Wayne fallback must require owner preview and sandbox');
assert.match(session,/const allowedAvatarId=profile\?\.avatarId\|\|\(sandboxFallbackAllowed\?LIVEAVATAR_SANDBOX_AVATAR_ID:""\)/,'real published profile must win before Wayne fallback');
assert.match(session,/if\(!allowedAvatarId\)return json\(origin,404,\{error:"suspect_avatar_unavailable"\}\)/,'missing production avatar must fail closed');
assert.match(session,/if\(requestedAvatarId&&requestedAvatarId!==allowedAvatarId\)return json\(origin,403,\{error:"avatar_not_allowed"\}\)/,'browser must not be able to substitute another avatar id');

// TTS resolves the same server-side profile instead of accepting a browser voice.
assert.match(tts,/loadAiAvatarProfile\(\{supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,caseId:speechClaim\.cid,suspectId\}\)/,'TTS must resolve identity from the signed case/suspect claim');
assert.match(tts,/voice:profile\.ttsVoice/,'TTS voice must come from the server-side avatar profile');
assert.doesNotMatch(tts,/body\?\.voice/,'browser request must not control the TTS voice');

// Database schema must remain server-only and enforce a two-phase draft -> published release.
assert.match(schema,/status in \('draft','published','retired'\)/,'avatar profile lifecycle must stay explicit');
assert.match(schema,/enable row level security/,'avatar profile store must keep RLS enabled');
assert.match(schema,/revoke all on table public\.ai_case_avatar_profiles from anon, authenticated/,'avatar profile store must remain inaccessible to browser roles');
assert.match(draftIdentity,/status = 'published' and char_length\(avatar_id\) between 1 and 256/,'published profiles must require a non-empty avatar id');
assert.match(draftIdentity,/status in \('draft','retired'\) and char_length\(avatar_id\) between 0 and 256/,'draft profiles may exist safely before a LiveAvatar identity is assigned');

console.log('AI avatar profile release contract: ok');
