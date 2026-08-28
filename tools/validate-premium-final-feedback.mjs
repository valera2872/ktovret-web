import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const ariaFix = read('../assets/case-aria-final-feedback.js');
const room407 = read('../assets/case-407.js');
const room2317Runtime = read('../assets/case-2317-runtime.js');
const coopPost = read('./import-mobile/coop-v4-postprocess.mjs');

// 23:17: the already-fixed case must keep its inline, non-rerender contract.
assert.match(room2317Runtime, /data-final-inline-feedback/, '23:17 inline final feedback contract disappeared');
assert.match(room2317Runtime, /event\.stopImmediatePropagation\(\)/, '23:17 must block the legacy wrong-final rerender');
assert.match(room2317Runtime, /Ваш выбор сохранён/, '23:17 must explain that the selection is preserved');

// Room 407: its canonical runtime already persists and restores the final draft.
assert.match(room407, /progress\.finalAnswers = values; progress\.evidencePicks = picks; saveProgress/, '407 must persist final answers and evidence before validation');
assert.match(room407, /progress\.finalAnswers\?\.\[question\.id\] === value \? 'checked' : ''/, '407 must restore radio answers after a rerender');
assert.match(room407, /progress\.evidencePicks\.includes\(item\.id\) \? 'checked' : ''/, '407 must restore evidence picks after a rerender');
assert.match(room407, /coop_407_final_wrong/, '407 wrong-final telemetry is missing');

// Last Aria: wrong conclusions must stay on the current form, preserve the draft,
// give progressive feedback, and still allow a correct conclusion to reach the canonical handler.
assert.match(ariaFix, /finalAnswers/, 'Last Aria final answer draft persistence is missing');
assert.match(ariaFix, /evidencePicks/, 'Last Aria evidence draft persistence is missing');
assert.match(ariaFix, /data-final-inline-feedback/, 'Last Aria inline final feedback container is missing');
assert.match(ariaFix, /Заключение пока не принято\./, 'Last Aria visible wrong-final heading is missing');
assert.match(ariaFix, /ответы и выбранные материалы сохранены/, 'Last Aria preservation explanation is missing');
assert.match(ariaFix, /event\.stopImmediatePropagation\(\)/, 'Last Aria wrong final must block the legacy rerender');
assert.match(ariaFix, /attempt >= 3/, 'Last Aria progressive final hint is missing');
assert.match(ariaFix, /coop:last-aria:final-wrong/, 'Last Aria cognitive wrong-final telemetry is missing');
assert.match(ariaFix, /if \(state\.allAnswered && state\.answersCorrect && state\.proofComplete\) return;/, 'correct Last Aria final must fall through to canonical submit');
assert.match(ariaFix, /MutationObserver/, 'Last Aria must restore the final draft after a server-side rerender');

// Production generator must actually ship the protection layer.
assert.match(coopPost, /finalFeedback:'case-aria-final-feedback\.js'/, 'Last Aria final feedback asset is not registered in the co-op production generator');
assert.match(coopPost, /FINAL_FEEDBACK_VERSION/, 'Last Aria final feedback cache version is missing');
assert.match(coopPost, /addScript\(html,root,finalFeedback,FINAL_FEEDBACK_VERSION\)/, 'Last Aria final feedback asset is not injected into generated production HTML');

console.log('Premium/co-op final-feedback regression gate passed');
