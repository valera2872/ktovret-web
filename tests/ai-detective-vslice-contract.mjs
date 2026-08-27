import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const client=fs.readFileSync('assets/ai-detective-vslice.js','utf8');
const edge=fs.readFileSync('supabase/functions/ai-interrogation-v1/index.ts','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');

assert.match(html,/name="robots" content="noindex,follow"/,'experimental route must stay noindex');
assert.match(html,/data-ai-detective/,'AI detective root missing');
assert.match(html,/ai-detective-vslice\.js\?v=0\.1\.0/,'client asset version missing');
assert.match(client,/ai-interrogation-v1/,'client must use isolated Edge Function');
assert.match(client,/MAX_TURNS=12/,'turn cap must remain explicit');
assert.doesNotMatch(client,/вынесла письмо через служебный коридор/i,'solution leaked into public client');
assert.doesNotMatch(client,/использовала заранее известное окно перезапуска/i,'solution leaked into public client');
assert.match(edge,/AI_DETECTIVE_ENABLED/,'AI model must be behind explicit server flag');
assert.match(edge,/OPENAI_API_KEY/,'model key must remain server-side');
assert.match(edge,/speakingBrief/,'canon firewall builder missing');
assert.match(edge,/Игрок не предъявил документ/,'unverified player claims must not become evidence');
assert.match(edge,/suspect!=="marina"/,'final verdict must remain server-side');
assert.doesNotMatch(sitemap,/detektivnaya-igra-s-ii/,'experimental route must not enter sitemap before approval');

console.log('AI detective vertical slice contract: PASS');
