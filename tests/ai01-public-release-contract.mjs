import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const promo=fs.readFileSync('assets/ai01-launch-promo.js','utf8');
const promoCss=fs.readFileSync('assets/ai01-launch-promo.css','utf8');
const analytics=fs.readFileSync('assets/ai01-public-analytics.js','utf8');
const postprocess=fs.readFileSync('tools/import-mobile/logic-sitewide-postprocess.mjs','utf8');
const production=fs.readFileSync('.github/workflows/production-beget.yml','utf8');

assert.ok(html.includes('<meta name="robots" content="noindex,follow">'),'AI-01 must stay noindex during closed preview');
assert.ok(html.includes('AI-расследование · бесплатно'),'public Text positioning missing');
assert.ok(html.includes('Хочу ещё AI-дело'),'more-AI interest CTA missing');
assert.ok(html.includes('Хочу попробовать Live'),'Live interest CTA missing');
assert.ok(html.includes('../assets/ai01-public-analytics.js?v=0.1.0'),'AI-01 analytics asset missing');
assert.ok(!html.includes('href="../admin/ai01-live-preview/"'),'public Text page must not link to owner Live preview');

assert.match(promo,/const PUBLIC_LAUNCH = false;/,'sitewide AI promo must remain OFF before explicit launch');
assert.ok(promo.includes("params.get(PREVIEW_PARAM) === '1'"),'owner preview query gate missing');
assert.ok(promo.includes('Новое · AI-расследование · бесплатно'),'sitewide launch copy missing');
assert.ok(promoCss.includes('.ml-ai01-launch-promo'),'sitewide promo styles missing');
assert.ok(postprocess.includes('data-ai01-launch-promo-style'),'sitewide promo stylesheet is not injected');
assert.ok(postprocess.includes('data-ai01-launch-promo-script'),'sitewide promo script is not injected');
assert.ok(postprocess.includes("'admin'"),'admin must stay outside public sitewide injection');

for(const eventName of ['ai01_case_started','ai01_first_question','ai01_three_questions','ai01_suspect_switched','ai01_evidence_selected','ai01_theory_submitted','ai01_case_completed','ai01_more_case_interest','ai01_live_interest']) {
  assert.ok(analytics.includes(eventName),`missing AI-01 analytics event: ${eventName}`);
}

assert.ok(production.includes('production-web/admin/ai01-live-preview'),'production must keep stripping owner Live preview');
assert.ok(production.includes('production-web/assets/ai-liveavatar-factory.js'),'production must keep stripping LiveAvatar factory');

console.log('AI-01 closed public-release contract OK');