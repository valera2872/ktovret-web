import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const must = (file, markers) => {
  const text = read(file);
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${file}: missing ${marker}`);
  }
};
const mustNot = (file, markers) => {
  const text = read(file);
  for (const marker of markers) {
    if (text.includes(marker)) throw new Error(`${file}: forbidden ${marker}`);
  }
};

must('assets/catalog-experience.js', [
  "STARTER_CASE_ID='first_r3_001_four_archive_entries'",
  "field_r3_006_code_285:'Среднее'",
  "field_r4_009_calendar_month:'Лёгкое'",
  'Начать с детективного дела',
]);

must('assets/cognitive-short-case.js', [
  'first_r3_002_unsynced_logs',
  "time: '19:08 → 19:12'",
  "time: '19:16 → 19:14'",
  "time: '19:14 → 19:18'",
  'first_r3_004_laptop_two_exits',
  "time: '16:04 → 16:06'",
  'field_r3_006_code_285',
  "difficulty: 'Среднее'",
  "chips.slice(2)",
]);

must('tools/import-mobile/case-v4-postprocess.mjs', [
  'cognitive-short-case.js',
  "const COGNITIVE_VERSION='1.1.0'",
  "path.join(siteRoot,'ru','cases')",
]);

must('assets/cognitive-solo-analytics.js', [
  "ml:solo_evidence_open",
  "ml:solo_request",
  "ml:solo_hint",
  "ml:solo_checkpoint",
  "diagnostic_choice",
]);

must('assets/case-407-solo-player-feedback.js', [
  'data-solo407-first-action',
  "choice: 'guidance:first-material'",
  'Правильного порядка нет',
]);

must('tools/import-mobile/solo-407-player-feedback-postprocess.mjs', [
  "const VERSION = '1.2.0'",
  'case-407-solo-player-feedback.js',
  'cognitive-solo-analytics.js',
]);

must('assets/cognitive-coop-407.js', [
  'Как читать технические обозначения',
  'Напоминание из предыдущего этапа',
  'HK‑44',
  'ER‑02',
]);

must('assets/cognitive-last-aria.js', [
  'Что означают служебные коды',
  'PR‑17',
  'K‑12',
  'PB‑2',
  'T‑6M',
  'MS‑1908',
]);

must('assets/cognitive-coop-analytics.js', [
  'coop:2317',
  'coop:407',
  'coop:last-aria',
  'final-submit',
  'diagnostic_choice',
]);

must('assets/funnel-analytics.js', [
  "node?.matches?.('[data-aria-buy]')",
  "product: 'last_aria'",
  "track('checkout_open'",
  "track('checkout_success'",
  'Internal co-op gameplay buttons are intentionally NOT counted here.',
]);
mustNot('assets/funnel-analytics.js', [
  "pageGroup() === 'coop-case' && node?.tagName === 'BUTTON'",
  "'coop-case-button'",
]);

must('tools/import-mobile/coop-v4-postprocess.mjs', [
  'cognitive-coop-analytics.js',
  'cognitive-coop-407.js',
  'cognitive-last-aria.js',
]);

must('tools/import-mobile/site-origin-postprocess.mjs', [
  'Disallow: /admin/',
  "path.join(siteRoot, 'robots.txt')",
]);

console.log('Cognitive Release Gate static contracts: OK');