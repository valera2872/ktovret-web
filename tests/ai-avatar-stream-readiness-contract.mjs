import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const factory=fs.readFileSync('assets/ai-liveavatar-factory.js','utf8');

assert.match(html,/ai-avatar-provider\.js\?v=0\.0\.5-streamready1/,'AI-01 must bust the provider/factory cache for the stream-readiness fix');
assert.match(factory,/SESSION_STREAM_READY/,'LiveAvatar factory must subscribe to the real media-ready event');
assert.match(factory,/await waitForStreamReady\(\)/,'connect must not report success before remote media is ready');
assert.match(factory,/!connected\|\|!live\|\|disconnected\|\|!streamReady/,'health checks must require actual stream readiness');
assert.match(factory,/await waitForStreamReady\(5000\)/,'speech must be queued behind media readiness');
assert.match(factory,/AVATAR_SPEAK_STARTED/,'speech-start telemetry must use the SDK event');
assert.match(factory,/AVATAR_SPEAK_ENDED/,'speech-end telemetry must use the SDK event');
assert.match(factory,/tts_begin/,'TTS latency telemetry must mark request start');
assert.match(factory,/tts_done/,'TTS latency telemetry must mark audio readiness');
assert.match(factory,/repeat_audio_sent/,'renderer must mark when PCM is handed to LiveAvatar');
assert.match(factory,/insufficient\\s\+credits/,'provider credit exhaustion must be recognized explicitly');
assert.match(factory,/failure\.code="avatar_budget_exhausted"/,'provider credit exhaustion must route through the existing terminal text fallback');
assert.match(factory,/try\{await live\.start\(\)\}catch\(error\)/,'SDK startup errors must be normalized before leaving the renderer');

console.log('AI avatar stream readiness contract: ok');
