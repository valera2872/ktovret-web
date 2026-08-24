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
expect(s1a.includes('Личность водителя на этом пакете не установлена'), 'Analyst packet no longer preserves car/person uncertainty');
expect(!s1a.includes('Илья Кравцов лично выходит'), 'Analyst receives personal Ilya identity before partner exchange');

expect(s2i.includes('23:44:36 — Вера всё ещё остаётся в кадре кафе'), 'Investigator lost personal Vera timestamp');
expect(!s2i.includes('SP-3'), 'Investigator also sees car location and can solve stage 2 alone');
expect(s2a.includes('23:44:36 — камера SP-3'), 'Analyst lost exact car timestamp');
expect(!s2a.includes('идентифицирует Марину Соболеву и Веру Лебедеву'), 'Analyst also sees personal Vera identification and can solve stage 2 alone');
expect(s2a.includes('Личность второй посетительницы — у Следователя'), 'Analyst is not directed to the partner-owned identity fact');
expect(!s2i.includes('RB-17'), 'Investigator receives Analyst service credential without exchange/context');
expect(s2a.includes('Владение меткой не устанавливает'), 'Analyst packet pre-solves RB-17 owner/carrier inference');

expect(s3i.includes('Серийный номер — 4F-7719'), 'Investigator no longer owns physical tracker serial');
expect(!s3i.includes('4F-7719 = «CAR-V»'), 'Investigator receives Analyst device lookup before exchange');
expect(!s3a.includes('4F-7719'), 'Analyst sees physical tracker serial before partner handoff');
expect(!s3a.includes('23:05:48'), 'Analyst sees targeted tracker history before partner handoff');
expect(s3a.includes('Для совпадения нужен серийный номер от Следователя'), 'Analyst packet does not require partner serial');
expect(!s3a.includes('садится за руль автомобиля Веры'), 'Analyst receives service-camera conclusion belonging to Investigator exchange');
expect(s3a.includes('Начало маршрута и передача ключа — у Следователя'), 'Analyst does not know a partner-owned start/coordination proof exists');
expect(s3i.includes('серую надо увезти отдельно') && s3i.includes('Марина сказала, что с машиной разберутся'), 'Investigator lacks pre-event decoy-car rationale');

for (const banned of [
  'Отгоню её машину, маяк пусть едет отдельно',
  'Маршрут согласуется с тем, что он отогнал автомобиль Веры',
  'ложная картина похищения вообще возникла',
  'машину парковал более высокий водитель',
  'оставлю серую до утра',
  'если маяк настоящий, он покажет, куда я уехала'
]) {
  expect(!JSON.stringify(data).includes(banned), `author conclusion or contradiction leaked into v3 materials: ${banned}`);
}

expect(ux.includes('точное время этого звука'), 'stage1 audio handoff is not based on an observable fact');
expect(ux.includes('23:17:43.6'), 'stage1 timestamp cross-check does not return matching event');
expect(ux.includes('Q7-29: личность водителя установлена'), 'stage1 camera exchange has no meaningful cross-role payoff');
expect(ux.includes('CAM-S1 · 23:27:14'), 'stage3 exchange does not prove key transfer');
expect(ux.includes('CAM-S2 · 23:30:52'), 'stage3 exchange does not prove Roman at car');
expect(ux.includes('CAM-S1/S2: ключ передан, Роман лично у автомобиля'), 'stage3 handoff payoff does not establish coordination plus identity');
expect(ux.includes('Точный поиск по 4F-7719'), 'Analyst serial handoff has no targeted lookup payoff');
expect(ux.includes('запрос координат в 23:05:48'), 'Analyst serial handoff does not expose tracking history');
expect(ux.includes('4F-7719: физический маяк совпал с «CAR-V»'), 'Analyst serial handoff result is weak');
expect(ux.includes('Одна линия даст наиболее сильный новый факт'), 'stage2 decision still tells players which request is correct');
expect(!ux.includes('Алиби Ильи уже разрушено камерами и системой доступа'), 'old forced decision feedback remains in v3 UX');

for (const marker of [
  'Илья лично у дома и физический маяк совпадает с его «CAR-V»',
  'Вера лично с Мариной и подтверждает безопасность',
  'ключ передан Роману, он лично связан с началом и концом маршрута машины'
]) expect(ux.includes(marker), `final evidence categories missing: ${marker}`);

expect(legacy.includes("const EVIDENCE_CORRECT = new Set(['ilya_camera', 'tracker', 'roman_route'])"), 'legacy evidence IDs changed unexpectedly');
expect(legacy.includes('<input type="checkbox" name="evidence"'), 'real final form no longer renders checkbox evidence controls');
expect(data.final.questions.some((q) => q.id === 'vera'), 'final does not explicitly ask Vera outcome');
expect(data.final.questions.find((q) => q.id === 'sequence')?.answer === 'escape', 'canonical reconstruction changed');

console.log(JSON.stringify({
  case: data.title,
  roleLeakStage1: false,
  stage2RequiresBothRoles: true,
  trackerSerialRequiresPartner: true,
  roleLeakStage3: false,
  handoffCausality: true,
  decoyCarMotivationCoherent: true,
  romanCoordinationProved: true,
  forcedDecisionCopy: false,
  preSolvedRoman: false,
  realFinalUsesCheckboxes: true,
  finalEvidenceCoversThreeClaims: true
}, null, 2));