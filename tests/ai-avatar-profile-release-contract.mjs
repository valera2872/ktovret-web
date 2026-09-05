import fs from 'node:fs';
import assert from 'node:assert/strict';

const profile=fs.readFileSync('supabase/functions/_shared/ai-avatar-profile.ts','utf8');
const session=fs.readFileSync('supabase/functions/ai-avatar-session/index.ts','utf8');
const tts=fs.readFileSync('supabase/functions/ai-avatar-tts/index.ts','utf8');
const adminPreview=fs.readFileSync('admin/ai01-live-preview/index.html','utf8');
const schema=fs.readFileSync('supabase/migrations/20260830132613_ai_case_avatar_profiles.sql','utf8');
const draftIdentity=fs.readFileSync('supabase/migrations/20260830144423_allow_draft_avatar_profiles_without_identity.sql','utf8');

// Normal runtime must never select draft or retired identities.
assert.match(profile,/\.eq\("status","published"\)/,'runtime profile lookup must select only published rows');
assert.doesNotMatch(profile,/\.eq\("status","draft"\)/,'draft avatar rows must never be runtime-selectable');
assert.match(profile,/provider!=="liveavatar"\|\|!avatarId\|\|!ttsVoice/,'published database profiles must have a LiveAvatar id and TTS voice');

// AI-01 legacy fallback stays scoped to AI-01; it is not a generic bypass for future cases.
assert.match(profile,/if\(caseId!==LEGACY_CASE_ID\)return null;/,'legacy fallback must stay scoped to AI-01');

// Temporary owner preset cast is a narrow layer before published/Wayne resolution.
assert.match(session,/function ownerPreviewAvatar\(metadata:any,suspectId:string\)/,'owner preset resolver must be explicit');
assert.match(session,/if\(suspectId!=="anton"&&suspectId!=="lev"\)return "";/,'owner preset resolver must be limited to Anton and Lev');
assert.match(session,/const isOwnerPreview=caseId==="AI-01"&&clean\(metadata\?\.source,64\)==="owner_preview"/,'owner preset path must require the verified AI-01 owner entitlement');
assert.match(session,/const previewOverride=isOwnerPreview\?ownerPreviewAvatar\(metadata,suspectId\):""/,'preset override must be unreachable outside owner preview');
assert.match(session,/const publishedAvatarId=clean\(profile\?\.avatarId,256\)/,'published avatar must remain a distinct server-side source');
assert.match(session,/const sandboxFallbackAllowed=isOwnerPreview&&AVATAR_SANDBOX/,'Wayne fallback must require owner preview and sandbox');
assert.match(session,/const allowedAvatarId=previewOverride\|\|publishedAvatarId\|\|\(sandboxFallbackAllowed\?LIVEAVATAR_SANDBOX_AVATAR_ID:""\)/,'owner preset may override only the owner preview; otherwise published identity wins before Wayne');
assert.match(session,/const isSandboxSession=Boolean\(!previewOverride&&!publishedAvatarId&&sandboxFallbackAllowed&&allowedAvatarId===LIVEAVATAR_SANDBOX_AVATAR_ID\)/,'only the dedicated fallback identity may use sandbox mode');
assert.match(session,/const sessionSeconds=isOwnerPreview\?Math\.min\(MAX_SESSION_SECONDS,60\):MAX_SESSION_SECONDS/,'owner preview must remain one-minute capped even when public presets require non-sandbox sessions');
assert.match(session,/if\(!allowedAvatarId\)return json\(origin,404,\{error:"suspect_avatar_unavailable"\}\)/,'missing production avatar must fail closed');
assert.match(session,/if\(requestedAvatarId&&requestedAvatarId!==allowedAvatarId\)return json\(origin,403,\{error:"avatar_not_allowed"\}\)/,'browser must not be able to substitute another avatar id');

// Readiness diagnostics are owner-only, secret-safe and do not start an upstream session.
assert.match(session,/if\(!isOwnerPreview\)return \{status:403,body:\{error:"owner_preview_required"\}\}/,'readiness diagnostics must require owner preview');
assert.match(session,/if\(action==="readiness"\)\{\s*const readiness=await avatarReadiness\(caseId,suspectId,isOwnerPreview,metadata\);\s*return json\(origin,readiness\.status,readiness\.body\);\s*\}/s,'readiness must return before the normal LiveAvatar session path');
assert.match(session,/liveavatar_api_key_configured:Boolean\(LIVEAVATAR_API_KEY\)/,'readiness may expose only whether the LiveAvatar API key exists');
assert.match(session,/owner_preview_override:Boolean\(previewOverride\)/,'readiness may report only whether an owner preset override exists');
assert.match(session,/ready_for_session:readyForSession/,'readiness must report a derived session-ready boolean');
assert.doesNotMatch(session,/liveavatar_api_key\s*:\s*LIVEAVATAR_API_KEY/,'readiness must never return the LiveAvatar API key value');
assert.match(adminPreview,/action:'readiness'/,'admin preview must use the non-consuming readiness action');
assert.match(adminPreview,/mysterylogic:ai01:owner-live-token/,'admin preview must share the same owner token storage boundary as the AI-01 iframe');
assert.match(adminPreview,/LIVEAVATAR_API_KEY в Supabase пока не установлен/,'admin preview must explain the actual external blocker without exposing a secret');
assert.doesNotMatch(adminPreview,/X-API-KEY/,'admin preview must never send the LiveAvatar provider key from the browser');
const adminScript=adminPreview.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1]||'';
assert.ok(adminScript,'admin preview must contain its controller script');
assert.doesNotThrow(()=>new Function(adminScript),'admin Live diagnostics script must compile');

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
