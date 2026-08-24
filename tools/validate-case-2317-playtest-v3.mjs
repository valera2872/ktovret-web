#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const expect = (condition, message) => { if (!condition) throw new Error(`23:17 blind-playtest validation failed: ${message}`); };
const ctx = { window: {} };
vm.runInNewContext(read('assets/case-2317-data.js'), ctx);
vm.runInNewContext(read('assets/case-2317-detective-v3.js'), ctx);
vm.runInNewContext(read('assets/case-2317-timeline-v31.js'), ctx);
const data = ctx.window.MLCase2317;
const ux = read('assets/case-2317-ux-v3.js');
const legacy = read('assets/case-2317.js');

const s1i = JSON.stringify(data.stages[0].investigator);
const s1a = JSON.stringify(data.stages[0].analyst);
const s2i = JSON.stringify(data.stages[1].investigator);
const s2a = JSON.stringify(data.stages[1].analyst);
const s3i = JSON.stringify(data.stages[2].investigator);
const s3a = JSON.stringify(data.stages[2].analyst);

expect(!s1i.includes('Илья Кравцов лично выходит'), 'Investigator receives Q7-29 identity before partner exchange');
expect(s1a.includes('Пока доказано присутствие автомобиля Ильи'), 'Analyst packet no longer preserves car/person uncertainty');
expect(!s1a.includes('Илья Кравцов лично выходит'), 'Analyst receives personal Ilya identity before partner exchange');
expect(!s2i.includes('RB-17'), 'Investigator receives Analyst service credential without exchange/context');
expect(s2a.includes('Владение меткой не устанавливает'), 'Analyst packet pre-solves RB-17 owner/carrier inference');
expect(!s3a.includes('садится за руль автомобиля Веры'), 'Analyst receives CAM-S2 conclusion belonging to Investigator exchange');
expect(s3a.includes('CAM-S2 у Следователя'), 'Analyst knows partner has independent start-of-trip proof without receiving its content');
expect(!s3i.includes('4F-7719 = «CAR-V»'), 'Investigator receives Analyst device lookup before exchange');

for (const banned of [
  'Отгоню её машину, маяк пусть едет отдельно',
  'Маршрут согласуется с тем, что он отогнал автомобиль Веры',
  'ложная картина похищения вообще возникла',
  'машину парковал более высокий водитель'
]) {
  expect(!JSON.stringify(data).includes(banned), `author conclusion leaked into v3 materials: ${banned}`);
}

expect(ux.includes('точное время этого звука'), 'stage1 audio handoff is not based on an observable fact');
expect(ux.includes('23:17:43.6'), 'stage1 timestamp cross-check does not return matching event');
expect(ux.includes('Q7-29: личность водителя установлена'), 'stage1 camera exchange has no meaningful cross-role payoff');
expect(ux.includes('CAM-S2: Роман лично у автомобиля'), 'stage3 credential exchange has no personal-identity payoff');
expect(ux.includes('Одна линия даст наиболее сильный новый факт'), 'stage2 decision still tells players which request is correct');
expect(!ux.includes('Алиби Ильи уже разрушено камерами и системой доступа'), 'old forced decision feedback remains in v3 UX');

for (const marker of [
  'Илья лично у дома и независимо связан с маяком',
  'Вера лично с Мариной и подтверждает безопасность',
  'Роман лично связан с началом и концом маршрута машины'
]) expect(ux.includes(marker), `final evidence categories missing: ${marker}`);

expect(legacy.includes("const EVIDENCE_CORRECT = new Set(['ilya_camera', 'tracker', 'roman_route'])"), 'legacy evidence IDs changed unexpectedly');
expect(data.final.questions.some((q) => q.id === 'vera'), 'final does not explicitly ask Vera outcome');
expect(data.final.questions.find((q) => q.id === 'sequence')?.answer === 'escape', 'canonical reconstruction changed');

console.log(JSON.stringify({
  case: data.title,
  roleLeakStage1: false,
  roleLeakStage2: false,
  roleLeakStage3: false,
  handoffCausality: true,
  forcedDecisionCopy: false,
  preSolvedRoman: false,
  finalEvidenceCoversThreeClaims: true
}, null, 2));