import fs from 'node:fs';
import assert from 'node:assert/strict';

const edge=fs.readFileSync('supabase/functions/ai-avatar-tts/index.ts','utf8');
const factory=fs.readFileSync('assets/ai-liveavatar-factory.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

assert.equal(pkg.dependencies['@heygen/liveavatar-web-sdk'],'0.0.18','LiveAvatar SDK must be pinned');
assert.match(edge,/AI_AVATAR_ENABLED/,'speech bridge must share the server-side avatar kill switch');
assert.match(edge,/OPENAI_API_KEY=Deno\.env\.get\("OPENAI_API_KEY"\)/,'speech provider credential must remain server-side');
assert.match(edge,/AI_AVATAR_SIGNING_KEY/,'speech requests need a server-side signing boundary');
assert.match(edge,/verifySpeechToken/,'speech endpoint must reject unbound browser requests');
assert.match(edge,/payload\.exp<now\|\|payload\.exp>now\+420/,'speech capabilities must be short lived');
assert.match(edge,/https:\/\/api\.openai\.com\/v1\/audio\/speech/,'speech must use the server-side OpenAI speech endpoint');
assert.match(edge,/response_format:"pcm"/,'LiveAvatar LITE must receive raw PCM');
assert.match(edge,/"x-audio-sample-rate"\]="24000"/,'PCM bridge must declare the 24 kHz sample rate expected by LiveAvatar');
assert.match(edge,/text=clean\(body\?\.text,900\)/,'speech payload length must be bounded');
assert.match(edge,/marina:Deno\.env\.get\("AI_AVATAR_MARINA_VOICE"\)\|\|"marin"/,'Marina voice must be independently tunable');
assert.doesNotMatch(edge,/console\.(log|info)\([^\n]*(text|speechToken)/,'player dialogue and speech capabilities must not be logged');
assert.match(factory,/response\.arrayBuffer\(\)/,'browser must forward binary PCM, not provider-generated text');
assert.match(factory,/live\.repeatAudio\(toBase64\(pcm\)\)/,'browser must hand PCM to LiveAvatar LITE');
console.log('avatar TTS contract: ok');
