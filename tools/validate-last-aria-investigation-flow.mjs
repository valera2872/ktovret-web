import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const loader = read('../assets/case-aria-final-feedback-loader.js');
const finalFeedback = read('../assets/case-aria-final-feedback.js');
const ux = read('../assets/case-aria-investigation-ux-v2.js');
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
const currentScript = { src: 'https://mysterylogic.com/assets/case-aria-final-feedback-loader.js?v=2.0.0' };
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
assert.match(ux, /ariaReviewSignature/, 'Last Aria review navigation must be idempotent');

// Product-hardening gate: evidence summaries stay in the data for QA, but the
// player must read the actual material instead of receiving author conclusions.
assert.match(ux, /\.casearia-facts\{display:none!important\}/, 'Last Aria author fact summaries must be hidden from players');
assert.match(ux, /neutralCrosschecks/, 'Last Aria cross-role results must be observation-first');
assert.match(ux, /Совмещённые данные:/, 'Last Aria cross-check must present merged observations');

// Stage-two decision is evidence-gated but deliberately NOT graded. A wrong
// provisional theory is allowed to survive into the next package so players,
// not the interface, discover whether it holds up.
assert.match(ux, /progress\.handoffs\?\.\[data\.decision\.stage\]/, 'Last Aria decision must wait for the cross-role handoff');
assert.match(ux, /const chosen = Boolean\(progress\.decision\)/, 'Last Aria must recognize any recorded working hypothesis');
assert.match(ux, /next\.disabled = !handoffDone \|\| !chosen/, 'Last Aria must allow any evidence-backed working hypothesis to advance');
assert.match(ux, /Рабочая версия зафиксирована/, 'Last Aria must label the intermediate choice as provisional');
assert.match(ux, /Это рабочая гипотеза, а не ответ системы/, 'Last Aria must explicitly avoid validating the intermediate suspect');
assert.doesNotMatch(ux, /choice === data\.decision\.correct/, 'Last Aria UX must not reveal the correct suspect mid-case');
assert.doesNotMatch(ux, /decisionMistakes/, 'Last Aria must not score provisional theories as mistakes');
assert.doesNotMatch(ux, /decisionPenaltyApplied/, 'Last Aria must not penalize provisional theories');

// Package three is a falsification pass, not a victory lap. It must reflect the
// saved theory without telling players whether that theory is correct.
assert.match(ux, /const ensureTheoryCheck = \(\) =>/, 'Last Aria package-three theory check is missing');
assert.match(ux, /current !== 3/, 'Last Aria theory check must be scoped to package three');
assert.match(ux, /progress\.decision/, 'Last Aria theory check must use the players saved hypothesis');
assert.match(ux, /Теперь попробуйте опровергнуть самих себя/, 'Last Aria package three must frame evidence as a stress test');
assert.match(ux, /Не защищайте её/, 'Last Aria package three must invite falsification rather than confirmation');
assert.match(ux, /Ищите материал, который сильнее всего ей противоречит/, 'Last Aria package three must ask players to seek disconfirming evidence');
assert.doesNotMatch(ux, /selected\?\.id === data\.decision\.correct/, 'Last Aria package-three framing must never validate the saved suspect');
assert.match(ux, /ensureTheoryCheck\(\)/, 'Last Aria theory check must run with dynamic screen updates');
assert.match(ux, /MutationObserver/, 'Last Aria investigation UX must survive dynamic game boot');

// Reveal payoff must land emotionally first, then preserve the full forensic
// audit below it. It also reflects whether the pair kept or changed its theory.
assert.match(finalFeedback, /const enhanceReveal = \(\) =>/, 'Last Aria reveal payoff enhancer is missing');
assert.match(finalFeedback, /ariaRevealPayoff/, 'Last Aria reveal payoff must be idempotent');
assert.match(finalFeedback, /Михаил Карев/, 'Last Aria reveal must lead with the culprit');
assert.match(finalFeedback, /заранее записанный собственный голос в алиби/, 'Last Aria reveal must explain the central trick immediately');
assert.match(finalFeedback, /casearia-reveal-chain/, 'Last Aria reveal proof chain is missing');
assert.match(finalFeedback, /Саботаж/, 'Last Aria reveal must include sabotage as a proof link');
assert.match(finalFeedback, /Ложное присутствие/, 'Last Aria reveal must include the false-presence mechanism');
assert.match(finalFeedback, /Маршрут и доступ/, 'Last Aria reveal must include route and access');
assert.match(finalFeedback, /Оригинал/, 'Last Aria reveal must close on the recovered original');
assert.match(finalFeedback, /progress\.decision/, 'Last Aria reveal must reflect the saved working theory');
assert.match(finalFeedback, /Ваша рабочая версия выдержала стресс-тест/, 'Last Aria reveal must reward a theory that survived');
assert.match(finalFeedback, /Вы изменили версию по новым данным/, 'Last Aria reveal must normalize revising a failed theory');
assert.match(finalFeedback, /Проверить полную доказательную реконструкцию/, 'Last Aria full forensic reconstruction must remain available');
assert.match(finalFeedback, /for \(const paragraph of originalParagraphs\) audit\.appendChild\(paragraph\)/, 'Last Aria reveal must preserve original forensic paragraphs inside the audit');
assert.match(finalFeedback, /if \(originalQuote\) audit\.appendChild\(originalQuote\)/, 'Last Aria reveal must preserve the original closing quote');
assert.match(finalFeedback, /const apply = \(\) => \{ repairFinal\(\); enhanceReveal\(\); \}/, 'Last Aria reveal payoff must survive dynamic final rendering');

// Production-critical regression: the installed observer must only watch root-level
// screen replacements. Watching the whole subtree makes our own nav/note edits
// re-trigger the observer indefinitely and can starve the browser main thread.
assert.match(ux, /observer\.observe\(root, \{ childList: true \}\)/, 'Last Aria installed UX observer must be root-level only');
assert.doesNotMatch(ux, /const observer = new MutationObserver\(schedule\);\s*observer\.observe\(root, \{ childList: true, subtree: true \}\)/, 'Last Aria installed UX observer must never observe its own subtree mutations');

// Resumed sessions must preserve any valid provisional choice and only remove
// obsolete grading metadata from older builds.
assert.match(resilience, /const allowed = new Set/, 'Last Aria resilience must validate saved hypothesis ids');
assert.match(resilience, /decision && !allowed\.has\(decision\)/, 'Last Aria resilience must clear only corrupt hypothesis ids');
assert.doesNotMatch(resilience, /decision !== data\.decision\.correct/, 'Last Aria resilience must not erase a valid provisional theory');
assert.match(resilience, /\['decisionHistory', 'decisionMistakes', 'decisionPenaltyApplied'\]/, 'Last Aria resilience must remove obsolete theory-grading metadata');
assert.match(resilience, /document\.addEventListener\('submit'/, 'Last Aria resilience must survive final submission order');
assert.match(resilience, /MutationObserver/, 'Last Aria resilience guard must survive dynamic game boot');

// Production generator must ship delayed final protection, stable v2 investigation UX and resilience migration.
assert.match(coopPost, /finalFeedbackLoader:'case-aria-final-feedback-loader\.js'/, 'Last Aria final-feedback loader is not registered for production');
assert.match(coopPost, /investigationUx:'case-aria-investigation-ux-v2\.js'/, 'Last Aria stable investigation UX v2 is not registered for production');
assert.doesNotMatch(coopPost, /investigationUx:'case-aria-investigation-ux\.js'/, 'Last Aria production must not inject the looping investigation UX v1');
assert.match(coopPost, /resilience:'case-aria-resilience\.js'/, 'Last Aria resilience guard is not registered for production');
assert.match(coopPost, /addScript\(html,root,finalFeedbackLoader,LAST_ARIA_UX_VERSION\)/, 'Last Aria final-feedback loader is not injected');
assert.match(coopPost, /addScript\(html,root,investigationUx,LAST_ARIA_UX_VERSION\)/, 'Last Aria investigation UX is not injected');
assert.match(coopPost, /addScript\(html,root,resilience,LAST_ARIA_RESILIENCE_VERSION\)/, 'Last Aria resilience guard is not injected');

console.log('Last Aria player-owned hypothesis, falsification, reveal payoff and resumed-progress regression gate passed');