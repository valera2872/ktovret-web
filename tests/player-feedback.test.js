const fs=require('fs');
const assert=require('assert');

const js=fs.readFileSync('assets/player-feedback.js','utf8');
const css=fs.readFileSync('assets/player-feedback.css','utf8');
const endpoint=fs.readFileSync('supabase/functions/player-feedback/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20260907190000_universal_player_feedback_v1.sql','utf8');
const post=fs.readFileSync('tools/import-mobile/player-feedback-postprocess.mjs','utf8');
const importer=fs.readFileSync('tools/import-mobile-cases.mjs','utf8');

for(const phrase of ['Как прошло расследование?','Что понравилось?','Что мешало или не понравилось?','Хотели бы ещё такие расследования?','publicationConsent']) assert(js.includes(phrase),`missing ${phrase}`);
for(const tag of ['plot','evidence','logic','atmosphere','characters','technical','navigation']) assert(js.includes(tag),`missing feedback tag ${tag}`);
for(const route of ['2317','poslednyaya-ariya','detektivnye-igry-dlya-odnogo','detektivnaya-igra-s-ii']) assert(js.includes(route)&&post.includes(route),`feedback route missing: ${route}`);
assert(js.includes("ml:solo_complete"));
assert(js.includes('game_complete'));
assert(css.includes('.ml-feedback__stars'));
assert(css.includes('@media(max-width:640px)'));
assert(endpoint.includes("moderation_status: 'pending'"));
assert(endpoint.includes('publication_consent: publicationConsent'));
assert(endpoint.includes('liked_tags: likedTags'));
assert(endpoint.includes('disliked_tags: dislikedTags'));
assert(endpoint.includes('more_cases_interest: moreCasesInterest'));
assert(migration.includes('liked_tags text[]'));
assert(migration.includes('more_cases_interest'));
assert(importer.includes('applyPlayerFeedback(siteRoot)'));
assert(importer.includes('playerFeedbackVersion'));
console.log('player-feedback contract OK');
