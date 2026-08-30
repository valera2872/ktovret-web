import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration=fs.readFileSync('supabase/migrations/20260830132613_ai_case_avatar_profiles.sql','utf8');
const loader=fs.readFileSync('supabase/functions/_shared/ai-avatar-profile.ts','utf8');
const session=fs.readFileSync('supabase/functions/ai-avatar-session/index.ts','utf8');
const tts=fs.readFileSync('supabase/functions/ai-avatar-tts/index.ts','utf8');
const player=fs.readFileSync('assets/ai-case-player-v2.js','utf8');
const live=fs.readFileSync('assets/ai-case-live-v2.js','utf8');
const manifest=fs.readFileSync('content/ai-cases/AI-02.manifest.json','utf8');

assert.match(migration,/create table public\.ai_case_avatar_profiles/i,'avatar profile table migration missing');
assert.match(migration,/primary key \(case_id, suspect_id\)/i,'profile identity must be case + suspect');
assert.match(migration,/enable row level security/i,'avatar profiles must have RLS');
assert.match(migration,/revoke all on table public\.ai_case_avatar_profiles from anon, authenticated/i,'browser roles must have no avatar-profile grants');
assert.match(migration,/grant select, insert, update, delete on table public\.ai_case_avatar_profiles to service_role/i,'service role must own profile access');
assert.match(migration,/status in \('draft','published','retired'\)/i,'profile publication state missing');

assert.match(loader,/\.from\("ai_case_avatar_profiles"\)/,'profile loader must use server-only table');
assert.match(loader,/\.eq\("case_id",caseId\)/,'profile lookup must be case scoped');
assert.match(loader,/\.eq\("suspect_id",suspectId\)/,'profile lookup must be suspect scoped');
assert.match(loader,/\.eq\("status","published"\)/,'runtime must ignore draft/retired avatar profiles');
assert.match(loader,/const LEGACY_CASE_ID="AI-01"/,'AI-01 compatibility fallback must be explicitly scoped');
assert.match(loader,/if\(caseId!==LEGACY_CASE_ID\)return null/,'new cases must not inherit AI-01 identities');

assert.match(session,/loadAiAvatarProfile/,'avatar session broker must use data-driven profile loader');
assert.match(session,/profile\?\.avatarId/,'LiveAvatar identity must come from server profile');
assert.doesNotMatch(session,/SUSPECT_AVATARS|AI_AVATAR_MARINA_ID|AI_AVATAR_ANTON_ID|AI_AVATAR_LEV_ID/,'session broker must not hardcode AI-01 identities');
assert.match(session,/requestedAvatarId&&requestedAvatarId!==allowedAvatarId/,'browser must not be able to override server avatar identity');

assert.match(tts,/loadAiAvatarProfile/,'TTS broker must use the same case profile');
assert.match(tts,/caseId:speechClaim\.cid/,'TTS profile scope must come from signed speech token');
assert.match(tts,/profile\.ttsVoice/,'TTS voice must come from server profile');
assert.match(tts,/profile\.ttsInstructions/,'TTS delivery style must come from server profile');
assert.doesNotMatch(tts,/const VOICES|AI_AVATAR_MARINA_VOICE|AI_AVATAR_ANTON_VOICE|AI_AVATAR_LEV_VOICE/,'TTS endpoint must not hardcode AI-01 voices');

for(const publicSurface of [player,live,manifest]){
  assert.doesNotMatch(publicSurface,/avatar_id|avatarId|tts_voice|ttsVoice|tts_instructions|ttsInstructions/i,'server-only avatar profile leaked into a public case/browser surface');
}

console.log('AI avatar profile contract: ok');
