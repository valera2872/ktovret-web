import fs from 'node:fs';
import assert from 'node:assert/strict';

const adapter=fs.readFileSync('assets/ai-avatar-provider.js','utf8');
const waitResume=fs.readFileSync('assets/ai-avatar-wait-resume.js','utf8');
const factory=fs.readFileSync('assets/ai-liveavatar-factory.js','utf8');
const tts=fs.readFileSync('supabase/functions/ai-avatar-tts/index.ts','utf8');
const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');

assert.match(adapter,/ml:avatar-connection-lost/,'SDK disconnects must reach the bridge');
assert.match(adapter,/visibilitychange/,'returning to a browser tab must trigger Live recovery');
assert.match(adapter,/pageshow/,'page restoration must trigger Live recovery');
assert.match(adapter,/window\.addEventListener\("focus"/,'focus restoration must trigger Live recovery');
assert.match(adapter,/async recoverVisibleSession\(\)/,'bridge needs an explicit visible-session recovery path');
assert.match(adapter,/async providerHealthy\(\)/,'cached connected flags must not be trusted without a health check');
assert.match(adapter,/RECONNECTABLE_LIVE_ERRORS/,'dead-session speech must get one controlled reconnect path');
assert.match(adapter,/await this\.provider\.disconnect\(\);await this\.ensureConnected\(\);return await this\.speakOnce\(text\)/,'a question against a stale session must reconnect and retry once');

assert.match(waitResume,/Подозреваемый приглашён/,'initial LiveAvatar wait must explain that the suspect is being connected');
assert.match(waitResume,/Возвращаем подозреваемого в комнату/,'tab resume must show an explicit reconnect state instead of frozen initials');
assert.match(waitResume,/const delays=\[0,120,180,260,360\]/,'returning to the tab must allow a short media-resume grace window before full reconnect');
assert.match(waitResume,/sameSession=.*provider\?\.connected.*provider\?\.suspectId===this\.activeSuspect/s,'visible recovery must detect an existing session for the current suspect');
assert.match(waitResume,/if\(sameSession&&typeof this\.provider\.resume==="function"\)healthy=await this\.provider\.resume\(\)/,'visible recovery must try to resume the current LiveAvatar session before replacing it');
assert.match(waitResume,/await this\.provider\.disconnect\(\);[\s\S]*return await this\.ensureConnected\(\)/,'full reconnect must remain the fallback after resume fails');
assert.ok(html.indexOf('ai-avatar-provider.js')<html.indexOf('ai-avatar-wait-resume.js'),'resume patch must load after the provider classes exist');
assert.ok(html.indexOf('ai-avatar-wait-resume.js')<html.indexOf('ai-detective-vslice.js'),'resume patch must be active before the interrogation client starts');

assert.match(factory,/SESSION_DISCONNECTED/,'factory must observe LiveAvatar SDK disconnect events');
assert.match(factory,/async isHealthy\(\)/,'factory must expose session health');
assert.match(factory,/async resume\(\)/,'factory must reattach and resume media after backgrounding');
assert.match(factory,/hasLiveVideoTrack/,'visible-session health must include the actual video track');
assert.match(factory,/onDisconnected/,'factory must notify the provider when LiveKit\/LiveAvatar drops');

assert.match(tts,/OWNER_PREVIEW_TTS_MODEL=.*"tts-1"/,'owner preview must trial the realtime-optimized TTS model');
assert.match(tts,/if\(suspectId==="marina"\)return "nova"/,'Marina owner preview must trial a neutral female voice');
assert.match(tts,/const model=isOwnerPreview\?OWNER_PREVIEW_TTS_MODEL:TTS_MODEL/,'fast TTS trial must stay owner-preview-only');
assert.match(tts,/voice:profile\.ttsVoice/,'server profile must remain the base TTS identity');
assert.match(tts,/if\(isOwnerPreview\)payload\.voice=ownerPreviewVoice\(suspectId,profile\.ttsVoice\)/,'voice override must stay owner-preview-only');
assert.match(tts,/avatar_tts_ok/,'TTS timings must be observable in Edge logs');

assert.match(html,/ai-avatar-provider\.js\?v=0\.0\.5-streamready1/,'stream-readiness fix must use a fresh provider/factory cache key so stale media-race code cannot survive browser cache');
assert.match(html,/ai-avatar-wait-resume\.js\?v=0\.0\.1/,'visible-session UX and resume behavior must use a fresh cache key');
console.log('AI-01 Live tab resume contract: ok');
