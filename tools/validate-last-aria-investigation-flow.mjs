import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const loader = read('../assets/case-aria-final-feedback-loader.js');
const ux = read('../assets/case-aria-investigation-ux.js');
const resilience = read('../assets/case-aria-resilience.js');
const coopPost = read('./import-mobile/coop-v4-postprocess.mjs');

// Reproduce the premium page's real load order: the protection layer is parsed
// before MLCaseAria exists, then the dynamically loaded game data appears later.
let bootCallback = null;
let disconnected = false;
const appended = [];
const root = {};
class FakeMutationObserver {
  constructor(callback) { bootCallback = callback; }
  observe(target, options) {
    assert.equal(target, root);
    assert.equal(options.childList, true);
    assert.equal(options.subtree, true);
  }
  disconnect() { disconnected = true; }
}
const currentScript = { src: 'https://mysterylogic.com/assets/case-aria-final-feedback-loader.js?v=1.0.0' };
const sandbox = {
  window: {},
  MutationObserver: FakeMutationObserver,
  document: {
    currentScript,
    querySelector(selector) { return selector === '[data-casearia-app]' ? root : null; },
    createElement(tag) { return { tagName: tag.toUpperCase(), dataset: {}, src: '' }; },
    body: { appendChild(node) { appended.push(node); } },
  },
};
vm.runInNewContext(loader, sandbox, { filename: 'case-aria-final-feedback-loader.js' });
assert.equal(appended.length, 0, 'loader must wait while MLCaseAria is unavailable');
assert.equal(typeof bootCallback, 'function', 'loader must keep a delayed-boot observer alive');
sandbox.window.MLCaseAria = { final: { questions: [] } };
bootCallback();
assert.equal(appended.length, 1, 'loader must activate final feedback after dynamic game data appears');
assert.match(appended[0].src, /case-aria-final-feedback\.js\?v=2$/, 'loader must append the real final-feedback runtime');
assert.equal(appended[0].dataset.caseariaFinalFeedbackRuntime, '1');
assert.equal(disconnected, true, 'delayed-boot observer must stop after activation');

// Opened packages must remain reviewable without rewinding canonical progress.
assert.match(ux, /data-aria-review-stage/, 'Last Aria opened-package navigation is missing');
assert.match(ux, /data-aria-review-package/, 'Last Aria read-only prior-package view is missing');
assert.match(ux, /data\.stages\.slice\(0, opened\)/, 'Last Aria package navigation must expose every opened stage');
assert.match(ux, /Ранее открытый пакет/, 'Last Aria prior-package context label is missing');
assert.match(ux, /Совместная сверка:/, 'Last Aria prior-package review must retain the cross-check result');

// Stage-two decision must actually be evidence-gated and score mistakes.
assert.match(ux, /progress\.handoffs\?\.\[data\.decision\.stage\]/, 'Last Aria decision must wait for the cross-role handoff');
assert.match(ux, /choice === data\.decision\.correct/, 'Last Aria decision must distinguish the correct line');
assert.match(ux, /event\.stopImmediatePropagation\(\)/, 'wrong Last Aria decision must not reach the legacy any-choice handler');
assert.match(ux, /decisionMistakes/, 'Last Aria wrong decision count is missing');
assert.match(ux, /decisionPenaltyApplied/, 'Last Aria decision penalty must be applied exactly once');
assert.match(ux, /progress\.attempts = Number\(progress\.attempts \|\| 0\) \+ mistakes/, 'Last Aria wrong decisions must affect the final score input');
assert.match(ux, /firstAnswerCorrect = false/, 'Last Aria wrong intermediate decision must invalidate a perfect first-pass result');
assert.match(ux, /coop:last-aria:decision-wrong/, 'Last Aria wrong-decision cognitive telemetry is missing');
assert.match(ux, /MutationObserver/, 'Last Aria investigation UX must survive dynamic game boot');

// Already-started sessions from the legacy any-choice runtime must migrate safely.
assert.match(resilience, /decision && decision !== data\.decision\.correct/, 'legacy wrong Last Aria decision is not detected');
assert.match(resilience, /progress\.decision = ''/, 'legacy wrong Last Aria decision must be cleared');
assert.match(resilience, /progress\.decisionHistory = history/, 'legacy wrong Last Aria line must remain visible as rejected history');
assert.match(resilience, /progress\.decisionMistakes = Number\(progress\.decisionMistakes \|\| 0\) \+ 1/, 'legacy wrong Last Aria decision must count once');
assert.match(resilience, /mistakes > 0 && !progress\.decisionPenaltyApplied/, 'Last Aria score normalization must be idempotent');
assert.match(resilience, /document\.addEventListener\('submit'/, 'Last Aria decision score must not depend on root-listener order');
assert.match(resilience, /MutationObserver/, 'Last Aria resilience guard must survive dynamic game boot');

// Production generator must ship delayed final protection, investigation UX and resilience migration.
assert.match(coopPost, /finalFeedbackLoader:'case-aria-final-feedback-loader\.js'/, 'Last Aria final-feedback loader is not registered for production');
assert.match(coopPost, /investigationUx:'case-aria-investigation-ux\.js'/, 'Last Aria investigation UX is not registered for production');
assert.match(coopPost, /resilience:'case-aria-resilience\.js'/, 'Last Aria resilience guard is not registered for production');
assert.match(coopPost, /addScript\(html,root,finalFeedbackLoader,LAST_ARIA_UX_VERSION\)/, 'Last Aria final-feedback loader is not injected');
assert.match(coopPost, /addScript\(html,root,investigationUx,LAST_ARIA_UX_VERSION\)/, 'Last Aria investigation UX is not injected');
assert.match(coopPost, /addScript\(html,root,resilience,LAST_ARIA_RESILIENCE_VERSION\)/, 'Last Aria resilience guard is not injected');

console.log('Last Aria delayed-boot, investigation-flow and resumed-progress regression gate passed');
