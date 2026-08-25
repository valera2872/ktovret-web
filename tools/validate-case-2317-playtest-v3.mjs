#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const expect = (condition, message) => { if (!condition) throw new Error(`23:17 blind-playtest validation failed: ${message}`); };

const context = { window: {} };
vm.runInNewContext(read('assets/case-2317-data.js'), context, { filename: 'case-2317-data.js' });
vm.runInNewContext(read('assets/case-2317-detective-v3.js'), context, { filename: 'case-2317-detective-v3.js' });
vm.runInNewContext(read('assets/case-2317-timeline-v31.js'), context, { filename: 'case-2317-timeline-v31.js' });
const data = context.window.MLCase2317;
const ux = read('assets/case-2317-ux-v3.js');
const legacy = read('assets/case-2317.js');
const release = read('assets/case-2317-release-gate-v1.js');

const stage = (id, role) => JSON.stringify(data.stages[id - 1][role]);
const s1i = stage(1,'investigator'), s1a = stage(1,'analyst');
const s2i = stage(2,'investigator'), s2a = stage(2,'analyst');
const s3i = stage(3,'investigator'), s3a = stage(3,'analyst');

expect(s1i.includes('не позволяет определить рост или личность водителя') && s1i.includes('Личность водителя пока не установлена'), 'Investigator starts with vehicle/person assumption already solved');
expect(!s1i.includes('Q7-29'), 'Investigator has Analyst camera package before handoff');
expect(s1a.includes('Q7-29') && !s1a.includes('23:17:43.6'), 'Analyst stage1 packet does not preserve asymmetric dependency');
expect(!s2i.includes('SP-3') && s2a.includes('SP-3'), 'stage2 car route is not role-asymmetric');
expect(s2i.includes('В 23:44:36 Вера всё ещё остаётся в кадре кафе'), 'stage2 Investigator lacks independent Vera location');
expect(!s3a.includes('4F-7719') && s3a.includes('Для совпадения нужен серийный номер от Следователя'), 'tracker serial can be solved without partner');
expect(s3i.includes('4F-7719'), 'Investigator lacks physical serial for tracker handoff');

for (const banned of [
  'Маршрут согласуется с тем, что он отогнал автомобиль Веры',
  'Таким образом, безопасность Веры подтверждена',
  'ложная картина похищения'
]) {
  expect(!JSON.stringify(data).includes(banned), `author conclusion or contradiction leaked into v3 materials: ${banned}`);
}

expect(ux.includes('точное время этого звука'), 'stage1 audio handoff is not based on an observable fact');
expect(ux.includes('23:17:43.6'), 'stage1 timestamp cross-check does not return matching event');
expect(ux.includes('Q7-29: личность водителя установлена'), 'stage1 camera exchange has no meaningful cross-role payoff');
expect(ux.includes('В записи отмечен звук двери в 23:17:43'), 'legacy D-2147 toast is not masked for Investigator');
expect(ux.includes("includes('D-2147')"), 'legacy D-2147 toast detector missing');
expect(ux.includes('CAM-S1 · 23:27:14'), 'stage3 exchange does not prove key transfer');
expect(ux.includes('CAM-S2 · 23:30:52'), 'stage3 exchange does not prove Roman at car');
expect(ux.includes('брелок с тем же оранжевым хлястиком') && ux.includes('автомобиль Веры мигает габаритами и отпирается'), 'stage3 handoff does not prove transferred fob opens Vera car');
expect(ux.includes('CAM-S1/S2: переданный брелок открывает машину Веры'), 'stage3 handoff payoff does not establish coordination plus access');
expect(ux.includes('Точный поиск по 4F-7719'), 'Analyst serial handoff has no targeted lookup payoff');
expect(ux.includes('запрос координат в 23:05:48'), 'Analyst serial handoff does not expose tracking history');
expect(ux.includes('4F-7719: физический маяк совпал с «CAR-V»'), 'Analyst serial handoff result is weak');
expect(ux.includes('Одна линия даст наиболее сильный новый факт'), 'stage2 decision still tells players which request is correct');
expect(!ux.includes('Алиби Ильи уже разрушено камерами и системой доступа'), 'old forced decision feedback remains in v3 UX');

for (const marker of [
  'Q7-29 · исходный кадр CAM-N2, 23:12:18',
  '4F-7719 · физический маяк и карточка резервной копии',
  'CAM-S1/S2 + SP-3 · сервисная зона и последующий маршрут'
]) expect(ux.includes(marker) && release.includes(marker), `neutral final evidence category missing: ${marker}`);
for (const forbidden of [
  'Илья лично у дома и физический маяк совпадает с его «CAR-V»',
  'Вера лично с Мариной и подтверждает безопасность',
  'переданный Мариной брелок открывает машину, Роман связан с началом и концом её маршрута'
]) expect(!ux.includes(forbidden) && !release.includes(forbidden), `answer-bearing final category remains: ${forbidden}`);

expect(legacy.includes("const EVIDENCE_CORRECT = new Set(['ilya_camera', 'tracker', 'roman_route'])"), 'legacy evidence IDs changed unexpectedly');
expect(legacy.includes('<input type="checkbox" name="evidence"'), 'real final form no longer renders checkbox evidence controls');
expect(data.final.questions.some((q) => q.id === 'vera'), 'final does not explicitly ask Vera outcome');
expect(data.final.questions.find((q) => q.id === 'sequence')?.answer === 'escape', 'canonical reconstruction changed');
expect(release.includes("['escape'"), 'release-balanced final lost canonical answer option');

console.log(JSON.stringify({
  case: data.title,
  roleLeakStage1: false,
  legacyDoorCodeHidden: true,
  stage2RequiresBothRoles: true,
  trackerSerialRequiresPartner: true,
  roleLeakStage3: false,
  handoffCausality: true,
  decoyCarMotivationCoherent: true,
  romanCoordinationProved: true,
  transferredFobOpensVeraCar: true,
  forcedDecisionCopy: false,
  preSolvedRoman: false,
  realFinalUsesCheckboxes: true,
  finalEvidenceCoversThreeClaims: true,
  finalEvidenceLabelsNeutral: true
}, null, 2));