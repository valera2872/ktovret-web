import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('ai-investigation/index.html','utf8');
const js=fs.readFileSync('assets/ai-case-player-v2.js','utf8');
const live=fs.readFileSync('assets/ai-case-live-v2.js','utf8');
const css=fs.readFileSync('assets/ai-case-player-v2.css','utf8');

assert.match(html,/meta name="robots" content="noindex,nofollow"/i,'generic paid player must stay out of search');
assert.match(html,/data-ai-v2-player/,'generic v2 player root missing');
assert.match(html,/ai-case-player-v2\.js/,'generic v2 client not loaded');
assert.match(html,/ai-case-live-v2\.js/,'verified Live loader not loaded');
assert.doesNotMatch(html,/ai-avatar-provider\.js/,'generic HTML must not preload LiveAvatar provider for Text purchases');
assert.doesNotMatch(html,/ai-detective-vslice\.js/,'AI-01 case-specific client must not be loaded by generic player');
assert.doesNotMatch(html,/AI-0[12]|Марина|Антон|Лев|Павел|culprit|виновник/i,'generic HTML must not embed a case or solution');

assert.match(js,/functions\/v1\/case-access/,'paid payload must come through the existing entitlement boundary');
assert.match(js,/functions\/v1\/ai-interrogation-v2/,'interrogation must use v2 endpoint');
assert.match(js,/authorization:`Bearer \$\{PUBLIC_ANON\}`/,'v2 platform JWT must be sent as Authorization');
assert.match(js,/apikey:PUBLIC_ANON/,'v2 request must include public Supabase apikey');
assert.match(js,/access_token:ui\.token/,'opaque purchase token must be sent separately to v2 runtime');
assert.match(js,/action\.\.\.payload|action,\.\.\.payload/,'runtime action contract missing');
assert.match(js,/ai\('state'\)/,'player must hydrate from server state');
assert.match(js,/ui\.state=result\.state/,'interrogation response must replace local state with server state');
assert.match(js,/ui\.state=response\.state/,'theory response must preserve server-authoritative state');
assert.match(js,/ui\.state\?\.evidence/,'evidence must render from server state');
assert.match(js,/ui\.state\?\.notes/,'notes must render from server state');
assert.match(js,/ui\.state\?\.transcripts/,'transcripts must render from server state');
assert.match(js,/ui\.access\.config\.ai_case/,'public suspects must come from paid public payload');

for(const forbidden of [
  'culprit_id','success_explanation','terminal_reply','base_facts','admissions',
  'discovered_note_ids','discovered_evidence_ids','question_counts:',
  'sessionStorage','ml_ai_demo_state','INITIAL_EVIDENCE'
]){
  assert.ok(!js.includes(forbidden),`generic player leaks or owns server state: ${forbidden}`);
}
assert.doesNotMatch(js,/AI-0[12]|Марина|Антон|Лев|Павел|preview_3|E0[1-9]/i,'generic client must remain case-agnostic');
assert.doesNotMatch(js,/\b(?:suspects|evidence)\s*=\s*\[/,'generic client must not hardcode case arrays');

assert.match(js,/experienceTier==='live'/,'player must respect server-authoritative experience tier');
assert.match(js,/features\?\.liveAvatar===true/,'Live availability must require server feature flag');
assert.match(css,/data-tier="text"\]\{display:none!important\}/,'Text mode must remove the LiveAvatar surface');
assert.match(css,/data-tier="live"\]\{display:grid\}/,'Live mode must have an explicit visual contract');

assert.match(live,/if\(!isLive\(\)\)/,'Live loader must short-circuit Text purchases');
assert.match(live,/ai-avatar-provider\.js\?v=0\.0\.3/,'provider must be loaded lazily only by the verified Live loader');
assert.match(live,/experienceTier:'live'/,'verified Live context must be handed to AvatarBridge');
assert.match(live,/liveAvatar:true/,'Live feature context must be explicit');
assert.match(live,/publicAnon:PUBLIC_ANON/,'Live provider must receive the valid public Supabase JWT explicitly');
assert.match(live,/accessToken:token/,'Live provider must receive the opaque paid token separately');
assert.match(live,/caseId:id/,'Live provider must receive the paid case scope');
assert.match(live,/localStorage\.getItem\(STORAGE_KEY\)/,'Live loader must reuse the already verified paid token');
assert.doesNotMatch(live,/SUPABASE_SERVICE_ROLE_KEY|LIVEAVATAR_API_KEY|OPENAI_API_KEY|AI_AVATAR_SIGNING_KEY/,'browser Live loader must never contain provider or server secrets');
assert.doesNotMatch(live,/AI-0[12]|Марина|Антон|Лев|Павел/i,'Live loader must be case-agnostic');

console.log('AI v2 generic player contract: ok');
