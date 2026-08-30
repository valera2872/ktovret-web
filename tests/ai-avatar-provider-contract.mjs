import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const adapter=fs.readFileSync('assets/ai-avatar-provider.js','utf8');

assert.match(html,/ai-avatar-provider\.js\?v=0\.0\.1/,'avatar provider bridge must be loaded explicitly');
assert.ok(html.indexOf('ai-avatar-provider.js')<html.indexOf('ai-detective-vslice.js'),'provider bridge must load before interrogation client');
assert.match(adapter,/enabled:false/,'realtime avatar rollout must remain dark by default');
assert.match(adapter,/provider:"heygen"/,'HeyGen must be the first supported provider without becoming the game engine');
assert.match(adapter,/class AvatarProvider/,'provider-neutral interface missing');
assert.match(adapter,/class HeyGenLiveAvatarProvider extends AvatarProvider/,'HeyGen adapter must implement the neutral contract');
assert.match(adapter,/async connect/,'adapter needs connect lifecycle');
assert.match(adapter,/async setSuspect/,'adapter needs suspect switching');
assert.match(adapter,/async setStage/,'adapter needs interrogation pressure updates');
assert.match(adapter,/async speak/,'adapter needs text-to-avatar speech handoff');
assert.match(adapter,/async disconnect/,'adapter needs cleanup lifecycle');
assert.match(adapter,/mode:"lite"/,'HeyGen integration must preserve our existing LLM/canon in Lite mode');
assert.match(adapter,/avatar_session_endpoint_missing/,'avatar sessions must require an explicit server endpoint');
assert.match(adapter,/MLHeyGenLiveAvatarFactory/,'provider SDK binding must stay behind a replaceable factory');
assert.match(adapter,/MutationObserver/,'bridge must react to suspect/stage/transcript changes without coupling the main game to one provider');
assert.doesNotMatch(adapter,/api[_-]?key|secret|bearer\s+[a-z0-9_-]{8,}/i,'provider credentials must never be embedded in the browser adapter');
console.log('avatar provider contract: ok');
