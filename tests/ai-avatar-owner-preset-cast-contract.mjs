import fs from 'node:fs';

const session=fs.readFileSync('supabase/functions/ai-avatar-session/index.ts','utf8');
const cast=fs.readFileSync('supabase/functions/ai-avatar-preview-cast/index.ts','utf8');
const apply=fs.readFileSync('admin/ai01-live-preview/presets/apply/index.html','utf8');
const beget=fs.readFileSync('.github/workflows/production-beget.yml','utf8');

function must(text,needle,label){if(!text.includes(needle))throw new Error(`Missing ${label}: ${needle}`)}
function mustNot(text,needle,label){if(text.includes(needle))throw new Error(`Forbidden ${label}: ${needle}`)}

must(session,'function ownerPreviewAvatar(metadata:any,suspectId:string)','owner-preview avatar resolver');
must(session,'suspectId!=="anton"&&suspectId!=="lev"','owner override limited to Anton/Lev');
must(session,'metadata?.preview_avatar_overrides','server-side entitlement metadata source');
must(session,'const previewOverride=isOwnerPreview?ownerPreviewAvatar(metadata,suspectId):""','override requires owner preview');
must(session,'const allowedAvatarId=previewOverride||publishedAvatarId||','owner preset precedence');
must(session,'const isSandboxSession=Boolean(isOwnerPreview&&AVATAR_SANDBOX)','all owner-preview identities remain sandboxed');
must(session,'is_sandbox:isSandboxSession','provider sandbox flag follows review state');
must(session,'avatarSource=previewOverride?"owner_preview_preset"','explicit source marker');
must(session,'owner_preview_override:Boolean(previewOverride)','readiness exposes owner override state');
must(session,'provider_status:upstream.status','owner preview exposes sanitized upstream status for diagnostics');

must(cast,'source,64)!=="owner_preview"','cast write requires owner entitlement');
must(cast,'case_id,64)!=="AI-01"','cast write scoped to AI-01');
must(cast,'https://api.liveavatar.com/v1/avatars/public','selected IDs validated against public preset library');
must(cast,'if(!publicIds.has(anton)||!publicIds.has(lev))','both selected IDs must be public');
must(cast,'preview_avatar_overrides:{anton,lev}','only Anton/Lev IDs persisted');
must(cast,'.update({metadata})','cast stored server-side in entitlement metadata');
mustNot(cast,'LIVEAVATAR_API_KEY:', 'provider key must not be written into metadata');

must(apply,'mysterylogic:ai01:preset:${id}','same localStorage selection keys as preset catalog');
must(apply,'mysterylogic:ai01:owner-live-token','owner token required client-side');
must(apply,'ai-avatar-preview-cast','dedicated owner sync endpoint');
must(apply,"if(!anton||!lev)",'both selections required');
must(apply,"if(anton===lev)",'distinct faces required');
must(apply,'noindex,nofollow,noarchive','sync page cannot be indexed');

must(beget,'production-web/admin/ai01-live-preview','production bundle removes complete owner preview tree');

console.log('Owner preset cast contract: OK');
