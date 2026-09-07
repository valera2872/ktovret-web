const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('admin/reviews/index.html','utf8');
const js=fs.readFileSync('assets/review-admin.js','utf8');
const css=fs.readFileSync('assets/feedback-insights.css','utf8');
const endpoint=fs.readFileSync('supabase/functions/review-moderation/index.ts','utf8');

for(const marker of ['data-tab="feedback"','data-feedback-panel','data-feedback-cards','data-feedback-disliked','data-feedback-red-flags','data-feedback-cases']) {
  assert(html.includes(marker),`missing dashboard marker: ${marker}`);
}
for(const phrase of ['Что нравится','Что мешает','Что болит','Хотят ещё']) assert(html.includes(phrase),`missing dashboard phrase: ${phrase}`);
assert(html.includes('noindex,nofollow,noarchive'));
assert(html.includes('feedback-insights.css'));
assert(js.includes('?mode=feedback&days='));
assert(js.includes('data-feedback-days'));
assert(js.includes('dislikeLabel'));
assert(js.includes('wantMoreYesRate'));
assert(!js.includes('reviewer_key_hash'),'reviewer hash must never be exposed to owner frontend');
assert(css.includes('.mla-insight-cards'));
assert(css.includes('.mla-bar-track'));
assert(endpoint.includes("url.searchParams.get('mode') === 'feedback'"));
assert(endpoint.includes("!caseId.startsWith('audit_review_pr_')"));
assert(endpoint.includes("!caseId.startsWith('ci:')"));
assert(endpoint.includes('hasFeedbackContext(row?.feedback_context)'));
assert(endpoint.includes('liked_tags,disliked_tags,more_cases_interest,feedback_context'));
assert(endpoint.includes('redFlags'));
assert(endpoint.includes('summarizeFeedback'));
assert(!endpoint.includes("select('reviewer_key_hash"),'feedback response must not return reviewer hashes');
console.log('feedback insights dashboard contract OK');
