#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const expect = (ok, label) => { if (!ok) throw new Error(`Solo 407 Release Gate: ${label}`); };
const includesAll = (text, markers, label) => markers.forEach((marker) => expect(text.includes(marker), `${label}: missing ${marker}`));
const excludesAll = (text, markers, label) => markers.forEach((marker) => expect(!text.includes(marker), `${label}: forbidden ${marker}`));
const extractObject = (text, name, nextMarker) => {
  const start = text.indexOf(`const ${name} = `);
  const end = text.indexOf(nextMarker, start);
  expect(start >= 0 && end > start, `${name} object bounds`);
  const source = text.slice(start + `const ${name} = `.length, end).trim().replace(/;\s*$/, '');
  return Function(`"use strict"; return (${source});`)();
};
const balance = (options, ratio, label) => {
  const lengths = options.map(([, text]) => text.length);
  const min = Math.min(...lengths), max = Math.max(...lengths);
  expect(max / min <= ratio, `${label}: option-length giveaway ${min}..${max}`);
};

const solo = read('assets/case-407-solo.js');
const feedback = read('assets/case-407-solo-player-feedback.js');
const progressive = read('assets/case-407-solo-progressive-entry.js');
const data = read('assets/case-407-data.js');
const css = read('assets/case-407-solo.css');
const progressiveCss = read('assets/case-407-solo-progressive-entry.css');
const post = read('tools/import-mobile/solo-407-postprocess.mjs');
const feedbackPost = read('tools/import-mobile/solo-407-player-feedback-postprocess.mjs');
const browserSmoke = read('tools/solo-407-browser-smoke.mjs');
const progressiveSmoke = read('tools/solo-407-progressive-smoke.mjs');
const checkpoints = extractObject(solo, 'checkpoints', '\n  const hints =');
const stages = extractObject(solo, 'soloStages', '\n\n  const checkpoints =');
const final = extractObject(solo, 'soloFinal', '\n\n  const cleanState =');

// G0 — content freeze / exact solo product boundary.
expect((data.match(/type: '/g) || []).length >= 18, 'G0 source evidence payload missing');
expect(Object.keys(stages).length === 3, 'G0 must have exactly 3 solo stages');
expect(Object.keys(checkpoints).length === 3, 'G0 must have exactly 3 checkpoints');
expect(final.questions.length === 4, 'G0 must have exactly 4 final links');
expect(feedbackPost.includes("const VERSION = '1.3.0'"), 'G0 expected Solo feedback/progressive revision 1.3.0');
includesAll(feedbackPost, ['case-407-solo-progressive-entry.css','case-407-solo-progressive-entry.js'], 'G0 progressive production wiring');

// G1 — fair-play evidence chain: every canonical final link is present in player materials.
includesAll(data, [
  'На обратной стороне таблички «407» выгравировано H-409',
  'контроллеры L-407 и L-409 не переименовывали',
  'последовательность «верный код хранителя + 9»',
  'SVC-407 открыта мастер-токеном HK-44',
  'микрочастицы ювелирного воска',
  'Команда отправлена NIGHT-MGR с телефона ER-02',
  'два билета на рейс в Белград на 06:40',
  'Если сигнал уйдёт в 01:12, сколько у нас до лифта?'
], 'G1 fair-play evidence');
expect(final.questions.map((q) => q.answer).join('|') === '409|duress|service|collusion', 'G1 canonical reconstruction changed');

// G2 — adversarial countertheories receive explicit evidence, not author fiat.
includesAll(data, [
  'Окно закрыто изнутри, следов борьбы нет',
  'Камера исправна; пропусков в гостевом коридоре нет',
  'сам журнал не доказывает, кто держал его в руке',
  'не даёт ему физической возможности оказаться в служебной зоне отеля после 01:12',
  'сами по себе ещё не отвечают, добровольно ли Марта участвовала',
  'Сам по себе текст не доказывает кражу'
], 'G2 countertheory controls');

// G3 — blind spoiler boundary in all pre-reveal Solo presentation.
includesAll(solo, [
  "title: 'Первые двадцать минут'",
  "title: 'След после тревоги'",
  "title: 'Последние подтверждения'",
  'чьи действия независимо подтверждаются материалами'
], 'G3 neutral progression');
excludesAll(solo, [
  "title: 'Кто помог Марте'",
  'роль Елены в вывозе Марты и сапфира',
  'score} из ${soloFinal.questions.length}',
  'score} из ${data.final.questions.length}'
], 'G3 answer-leading runtime');
excludesAll(post, [
  'физический 409',
  'переставленная табличка',
  'цифру 9',
  'Елена Раева',
  'Марта добровольно'
], 'G3 public acquisition boundary');
expect(!solo.includes('stageData = data.stages'), 'G3 source stage titles must not drive Solo UI');
expect(!solo.includes('data.final.intro') && !solo.includes('data.final.questions.map'), 'G3 source answer-leading final copy must not drive Solo UI');

// G4 — solvability/difficulty: option length cannot reveal correct answers; final feedback cannot support score-probing.
Object.entries(checkpoints).forEach(([id, cp]) => balance(cp.options, 1.20, `G4 checkpoint ${id}`));
final.questions.forEach((q) => balance(q.options, 1.50, `G4 final ${q.id}`));
expect(solo.includes('Версия пока не выдерживает все материалы.'), 'G4 neutral wrong-final copy');
expect(browserSmoke.includes('wrongScoreHidden') && browserSmoke.includes('data-wrong-score-hidden="true"'), 'G4 browser test must prove score hiding');

// G5 — first-time UX: one clean entry, one natural action, then real investigative choice before desk exposure.
includesAll(solo, [
  'Большое расследование · 1 игрок · бесплатно',
  'Вы расследуете дело один.',
  '50–70 минут',
  '18 материалов',
  'без регистрации',
  'прогресс сохраняется',
  'Начать расследование'
], 'G5 first-time cover');
expect((solo.match(/data-start/g) || []).length >= 2, 'G5 start CTA wiring missing');
includesAll(progressive, [
  '01:19',
  'Вы вошли в номер.',
  'Осмотреть номер',
  'Опросить охрану',
  'Осмотреть дверь',
  'Запросить журнал замка',
  "completedNext(state).length >= 2",
  "const EXISTING_ON_LOAD = Boolean(INITIAL_STATE.started)"
], 'G5 progressive entry');
includesAll(progressiveCss, [
  '.solo407-progressive-active > .solo407-desk',
  '.solo407-entry-copy [data-solo407-context]',
  '.solo407-progressive-actions'
], 'G5 progressive hierarchy styling');
includesAll(progressiveSmoke, [
  'sceneFirst:true',
  'existing-pass',
  'existingPlayerBypass:true',
  'desk not revealed',
  'threeDirections:true'
], 'G5 browser proof contract');

// G6 — black-box full game-flow contract remains unchanged after progressive entry.
includesAll(browserSmoke, [
  "await checkpoint('ids')",
  "await checkpoint('zones')",
  "await checkpoint('owner')",
  "room:'409'",
  "alarm:'duress'",
  "route:'service'",
  "sequence:'collusion'",
  'data-hints-progressive="true"',
  'fullSolve:true'
], 'G6 black-box flow');

// G7 — free/local solo access and abuse boundaries.
excludesAll(solo.toLowerCase(), [
  'создать комнату',
  'код комнаты',
  'пригласить напарника',
  '/api/payment',
  'purchase_started'
], 'G7 room/payment coupling');
expect(solo.includes("localStorage.setItem(STORAGE_KEY"), 'G7 local progress persistence');
expect(post.includes('<meta name="robots" content="noindex,follow">'), 'G7 runtime noindex');
expect(post.includes('indexableRoutes:[`${HUB}/`]'), 'G7 only hub enters indexable routes');

// G8 — regression/stuck-player safeguards remain available after the progressive hand-off.
expect(solo.includes('hintsByStage:{}'), 'G8 per-stage hint state');
expect(solo.includes('state.hintsByStage = { ...(state.hintsByStage || {}), [state.stage]: used + 1 }'), 'G8 per-stage hint progression');
includesAll(post, ['solo407-format-switch','solo407-home-switch'], 'G8 format routing');
expect(css.includes('@media') && css.includes('.solo407-desk'), 'G8 responsive premium shell');
expect(feedback.includes("const openedAnyInitial = plans[1].initial.some"), 'G8 first-action guidance state guard');
expect(feedback.includes("const openedAllInitial = plans[1].initial.every"), 'G8 next-action guidance state guard');

const result = {
  verdict: 'SOLO_407_G0_G8_PASS',
  revision: '1.3.0',
  gates: {
    G0:'PASS', G1:'PASS', G2:'PASS', G3:'PASS', G4:'PASS',
    G5:'CONTRACT_PASS_BROWSER_REQUIRED', G6:'CONTRACT_PASS_BROWSER_REQUIRED', G7:'PASS', G8:'CONTRACT_PASS_BRANCH_CI_REQUIRED',
    G9:'PENDING_EXACT_MAIN_ARTIFACT'
  },
  adversarialRoles: ['investigator','defense-countertheory','spoiler-hunter','stuck-player','qa-abuser','first-time-user','returning-player'],
  finalOptionsBalanced: true,
  wrongFinalScoreHidden: true,
  spoilerNeutral: true,
  progressiveEntry: true,
  existingPlayerBypassRequired: true
};
console.log(JSON.stringify(result, null, 2));
