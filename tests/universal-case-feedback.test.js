import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const ui = read('assets/player-feedback.js');
const auto = read('assets/player-feedback-auto.js');
const api = read('supabase/functions/case-feedback/index.ts');
const migration = read('supabase/migrations/20260907183000_universal_case_feedback.sql');
const shortShim = read('ktovret-game/assets/review-discount.js');
const coop = read('assets/cognitive-coop-analytics.js');
const postprocess = read('tools/import-mobile/player-feedback-postprocess.mjs');
const importer = read('tools/import-mobile-cases.mjs');

test('feedback UI captures rating and actionable product signals', () => {
  assert.match(ui, /Как вам это дело\?/);
  assert.match(ui, /Ваша оценка/);
  assert.match(ui, /По сложности/);
  assert.match(ui, /Хотите ещё таких расследований\?/);
  assert.match(ui, /Что понравилось\?/);
  assert.match(ui, /Что стоило бы улучшить\?/);
  assert.match(ui, /publicationConsent/);
  assert.match(ui, /feedback_version:2/);
});

test('text is optional while star rating remains mandatory', () => {
  assert.match(api, /rating < 1 \|\| rating > 5/);
  assert.match(api, /comment = String\(body\.comment \|\| ''\)/);
  assert.doesNotMatch(api, /comment\.length < 20/);
  assert.match(migration, /char_length\(btrim\(comment\)\) <= 2000/);
  assert.doesNotMatch(migration, />= 20/);
});

test('internal feedback and public review consent are separated', () => {
  assert.match(api, /publicationConsent = body\.publicationConsent === true && comment\.length >= 5/);
  assert.match(api, /feedback_source: 'post_case'/);
  assert.match(api, /liked_tags/);
  assert.match(api, /improve_tags/);
  assert.match(api, /more_intent/);
});

test('short cases wait for visible result before opening survey', () => {
  assert.match(shortShim, /getClientRects\(\)\.length > 0/);
  assert.match(shortShim, /MysteryLogicFeedback/);
  assert.match(shortShim, /mode: 'short'/);
});

test('long and AI investigations have completion detectors', () => {
  assert.match(auto, /casearia-reveal/);
  assert.match(auto, /case2317-reveal/);
  assert.match(auto, /data-view="resolution"/);
  assert.match(auto, /solo:407/);
  assert.match(coop, /casearia-reveal/);
  assert.match(coop, /case2317-reveal/);
});

test('feedback bootstrap is injected across generated runtime pages', () => {
  assert.match(postprocess, /data-ml-player-feedback-auto/);
  assert.match(postprocess, /detektivnaya-igra-s-ii\/index\.html/);
  assert.match(postprocess, /detektivnye-igry-dlya-odnogo\/407\/index\.html/);
  assert.match(postprocess, /detektivnye-igry-dlya-dvoih\/2317\/index\.html/);
  assert.match(postprocess, /poslednyaya-ariya\/index\.html/);
  assert.match(importer, /applyPlayerFeedback\(siteRoot\)/);
});
