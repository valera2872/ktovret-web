import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const client=fs.readFileSync('assets/ai-detective-vslice.js','utf8');
const edge=fs.readFileSync('supabase/functions/ai-interrogation-v1/index.ts','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');

assert.match(html,/name="robots" content="noindex,follow"/,'experimental route must stay noindex');
assert.match(html,/data-ai-detective/,'AI detective root missing');
assert.match(html,/Восемь минут<br>без камеры\./,'first-screen incident must be literal and understandable');
assert.doesNotMatch(html,/Архив погас/i,'nonsensical archive wording must not return');
assert.match(html,/placeholder="Задайте свой вопрос…"/,'composer must invite free questioning without a suggested solution path');
assert.doesNotMatch(html,/например:.*Кто знал/i,'first question must not be authored for the player');
assert.doesNotMatch(html,/Кто использовал отключение камеры\?/i,'theory screen must not presuppose the crime mechanism');

assert.match(client,/MAX_TURNS=14/,'turn cap must remain explicit');
assert.match(client,/INITIAL_EVIDENCE=\['E01','E02','E03'\]/,'only neutral evidence may be visible at start');
assert.match(client,/evidenceIds:new Set/,'discovered evidence state is required');
assert.match(client,/discovered_evidence_ids/,'client must send discovered evidence state to server');
assert.match(client,/sessionStorage\.setItem\(STORAGE_KEY/,'refresh must preserve the investigation inside the tab');
assert.doesNotMatch(client,/ответ · защищённый сценарий/i,'implementation mode must not break player immersion');
assert.doesNotMatch(client,/Ответственная — Марина/i,'solution must remain server-side');

assert.match(edge,/MODEL=Deno\.env\.get\("AI_DETECTIVE_MODEL"\)\|\|"gpt-5\.6-luna"/,'Luna must be the default dialogue model');
assert.match(edge,/OPENAI_API_KEY/,'model key must remain server-side');
assert.doesNotMatch(edge,/AI_DETECTIVE_ENABLED/,'a stale feature flag must not silently force scripted dialogue');
assert.doesNotMatch(edge,/function fallbackReply/,'production interrogation must not silently fall back to canned character replies');
assert.match(edge,/ai_not_configured/,'missing AI configuration must fail explicitly');
assert.match(edge,/mode:"ai"/,'successful interrogation must report real AI mode');
assert.match(edge,/Манера поведения:/,'each witness must receive a persona, not only fact bullets');
assert.match(edge,/Учитывай историю разговора/,'model must maintain conversational continuity');
assert.match(edge,/Не повторяй одну и ту же универсальную фразу/,'generic repeated replies must be explicitly prohibited');
assert.match(edge,/INITIAL_EVIDENCE=new Set\(\["E01","E02","E03"\]\)/,'server must share the same initial evidence boundary');
assert.match(edge,/evidenceId==="E05"\)notes\.push\(\{id:"N-MARINA-LOCATION"/,'location contradiction must require the actual network log');
assert.match(edge,/evidenceId==="E03"&&discoveredEvidence\.has\("E04"\)/,'access contradiction must require both door log and established credential ownership');
assert.match(edge,/discoveredNotes\.has\("N-ANTON-WINDOW"\)/,'Marina cannot be confronted with Anton knowledge before Anton reveals it');
assert.match(edge,/requiredEvidence=\["E04","E05","E06","E07"\]/,'final theory must include independent checks of all suspects');
assert.match(edge,/requiredNotes=\["N-ANTON-WINDOW","N-MARINA-ACCESS","N-MARINA-LOCATION"\]/,'final theory must require actual interrogation discoveries');
assert.doesNotMatch(edge,/21:29.*Марин|Марин.*21:29/i,'Lev cannot observe Marina after his 21:23 exit');
assert.match(edge,/примерно в 21:21.*Марин/i,'Lev observation must remain before his exit');
assert.match(edge,/Игрок не предъявил документ/,'unverified player claims must not become evidence');
assert.match(edge,/origin_not_allowed/,'unknown browser origins must be rejected');
assert.doesNotMatch(sitemap,/detektivnaya-igra-s-ii/,'experimental route must not enter sitemap before approval');

console.log('AI detective live-dialogue contract: PASS');
