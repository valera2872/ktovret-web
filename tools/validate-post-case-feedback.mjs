import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const ui = read('assets/post-case-feedback.js');
const css = read('assets/post-case-feedback.css');
const fn = read('supabase/functions/case-feedback/index.ts');
const migration = read('supabase/migrations/20260907133000_unified_case_feedback.sql');
const shortShim = read('ktovret-game/assets/review-discount.js');
const coop = read('assets/cognitive-coop-analytics.js');
const ai = read('assets/ai01-public-analytics.js');
const funnel = read('assets/funnel-analytics.js');

for (const marker of [
  'data-feedback-rating', 'data-feedback-difficulty', 'data-feedback-more',
  'data-feedback-liked', 'data-feedback-improve', 'publicationConsent',
  "caseId:'coop:last-aria'", "caseId:'coop:2317'", "caseId:'coop:407'",
  "caseId:'solo:407'", "caseId:'AI-01'", "caseKind:'short'",
]) assert(ui.includes(marker), `missing UI contract: ${marker}`);

assert(ui.includes('rating < 1'), 'rating must be required before submit');
assert(ui.includes('Что стоит улучшить?'), 'improvement prompt missing');
assert(ui.includes('Хотите ещё таких расследований?'), 'repeat-interest prompt missing');
assert(ui.includes('после модерации'), 'publication consent must mention moderation');
assert(!ui.includes('discountRub') && !ui.includes('50 ₽'), 'feedback must not bias ratings with a positive-review reward');

for (const marker of ['ml-feedback-card','ml-feedback-stars','ml-feedback-pill','@media(max-width:720px)'])
  assert(css.includes(marker), `missing CSS contract: ${marker}`);

for (const marker of ['liked_tags','improvement_tags','want_more','feedback_version','completion_verified','publication_consent'])
  assert(fn.includes(marker), `missing backend field: ${marker}`);
assert(fn.includes("upsert(row, { onConflict: 'case_id,reviewer_key_hash' })"), 'one feedback row per browser/case required');
assert(fn.includes("moderation_status: 'pending'"), 'new feedback must enter moderation pending');

for (const marker of ['case_feedback_overview','case_feedback_tag_counts','feedback_version >= 2','case_id not like \'audit_review_%\''])
  assert(migration.includes(marker), `missing analytics migration contract: ${marker}`);
assert(migration.includes("check (char_length(btrim(comment)) between 0 and 2000)"), 'optional comment DB contract missing');

assert(shortShim.includes('post-case-feedback.js'), 'short-case compatibility loader missing');
assert(coop.includes('post-case-feedback.js'), 'co-op feedback loader missing');
assert(ai.includes('post-case-feedback.js'), 'AI feedback loader missing');
assert(funnel.includes('loadPostCaseFeedback'), 'shared game-route feedback loader missing');

console.log(JSON.stringify({
  verdict: 'POST_CASE_FEEDBACK_STATIC_PASS',
  coverage: ['short cases','Solo 407','23:17','Partner 407','Last Aria','AI-01'],
  questions: ['1-5 stars','difficulty','want more','liked tags','improvement tags','optional text','publication consent'],
  analytics: ['case_feedback_overview','case_feedback_tag_counts'],
  productionWrites: false,
}, null, 2));
