import fs from 'node:fs';
import assert from 'node:assert/strict';

const endpoint=fs.readFileSync('supabase/functions/ai-interrogation-v2/index.ts','utf8');

assert.match(endpoint,/loadPaidAiCaseRuntime/,'endpoint must authenticate case access through the shared paid runtime');
assert.match(endpoint,/loadOrCreateCaseSession/,'endpoint must restore authoritative server progress before acting');
assert.match(endpoint,/const caseId=normalizeCaseId\(body\.case_id\);const accessToken=clean\(body\.access_token,512\)/,'each request must provide explicit paid case scope and opaque access token');
assert.match(endpoint,/if\(!accessToken\)return json\(responseOrigin,403,\{error:"access_required"\}\)/,'paid v2 must never run anonymously');
assert.doesNotMatch(endpoint,/body\.history|body\.discovered_evidence_ids|body\.discovered_note_ids|body\.question_counts/,'browser must not supply authoritative transcript, discoveries or progression');
assert.match(endpoint,/transcriptForPrompt\(input\.runtime,input\.before,input\.suspectId,8\)/,'LLM history must come from server-persisted transcript');
assert.match(endpoint,/appendTranscriptTurn\(runtime,turn\.state/,'successful dialogue must be appended server-side');
assert.match(endpoint,/safeSessionPayload/,'all state responses must use the safe projection');
assert.doesNotMatch(endpoint,/canon_version:|canon:runtime\.canon|theory:runtime\.canon/,'private canon must never be serialized to the browser');

assert.match(endpoint,/digestHex\(`ai-v2-entitlement:\$\{runtime\.entitlement\.id\}`\)/,'daily customer quota must be tied to verified entitlement rather than a browser visitor id');
assert.match(endpoint,/p_session_id:sessionKey/,'quota session must use the server-derived entitlement+case key');
assert.match(endpoint,/p_session_limit:runtime\.publicCase\.max_turns/,'metering must use the same per-case turn limit as authoritative state');
assert.match(endpoint,/p_daily_budget_usd:DAILY_BUDGET_USD/,'paid AI traffic must remain behind a global spend guardrail');
assert.match(endpoint,/releaseClaim\(claimId\)/,'failed model calls must release reserved quota');
assert.match(endpoint,/completeClaim\(claimId,generated\.usage\)/,'successful model spend must be accounted from actual usage');

assert.match(endpoint,/if\(turn\.terminal\)\{/,'terminal confession needs a deterministic no-model path');
assert.match(endpoint,/const reply=clean\(turn\.terminalReply,900\)/,'terminal reply must come from private canon');
assert.match(endpoint,/mode:"canonical_confession",model:null/,'canonical confession must explicitly bypass the text model');
assert.doesNotMatch(endpoint,/modelReply\([^)]*terminalReply/,'the model must not rewrite the canonical confession');

assert.match(endpoint,/suspectKnowledge\(input\.runtime,input\.after,input\.suspectId\)/,'ordinary model replies must receive only suspect-scoped authorized facts');
assert.match(endpoint,/СЛЕДОВАТЕЛЬ ОФИЦИАЛЬНО ПРЕДЪЯВИЛ/,'only explicitly presented evidence should be treated as presented to the suspect');
assert.match(endpoint,/Никаких других конкретных фактов дела тебе не сообщено/,'prompt must forbid invention beyond the generated speaking brief');
assert.doesNotMatch(endpoint,/runtime\.canon\.theory/,'ordinary interrogation prompt must never be given the culprit/theory object');
assert.match(endpoint,/store:false/,'OpenAI responses must not request provider-side conversation storage');

console.log('AI interrogation v2 endpoint contract: ok');
