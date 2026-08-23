#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const expect = (condition, message) => { if (!condition) throw new Error(`Room 407 detective-v4 validation failed: ${message}`); };

const context = { window: {} };
vm.runInNewContext(read('assets/case-407-data.js'), context, { filename: 'case-407-data.js' });
vm.runInNewContext(read('assets/case-407-detective-audit-v4.js'), context, { filename: 'case-407-detective-audit-v4.js' });
const data = context.window.MLCase407;
expect(data?.logicVersion === 4, 'effective story is not logicVersion 4');
expect(data.stages?.length === 3, 'expected three stages');

const s1i = JSON.stringify(data.stages[0].investigator);
const s1a = JSON.stringify(data.stages[0].analyst);
const s2 = JSON.stringify(data.stages[1]);
const s3 = JSON.stringify(data.stages[2]);
const story = JSON.stringify(data);

expect(!data.stages[0].investigator[0].alt.includes('ключ-карта'), 'photo alt still presents Marta key-card in false room');
expect(!s1i.includes('На столе — телефон Марты, её ключ-карта'), 'impossible key-card remains on false-room table');
expect(s1i.includes('Ключ-карты Марты здесь нет'), 'key-card contradiction is not explicitly resolved');

for (const legacy of ['H-409', 'L-409', 'L-407', 'S-407']) expect(!s1a.includes(legacy), `stage1 Analyst leaks numeric legacy identifier ${legacy}`);
for (const publicId of ['L-6B2', 'L-4A8', 'S-8D1']) expect(s1a.includes(publicId), `stage1 Analyst missing opaque identifier ${publicId}`);
expect(s1i.includes('H-7C4'), 'Investigator missing opaque plaque code H-7C4');
expect(!s1a.includes('H-7C4'), 'Analyst sees Investigator-only H-7C4 before exchange');
expect(s1a.includes('физический номер узла закрыт'), 'Analyst registry does not preserve cross-role uncertainty');

expect(data.stages[2].title === 'Последние четыре минуты', 'stage3 title gives away accomplice premise');
expect(!data.stages[2].objective.includes('Елен'), 'stage3 objective names the solution before evidence review');
expect(!data.stages[2].objective.includes('помог'), 'stage3 objective presupposes an accomplice');

expect(s2.includes('последнюю цифру на +1'), 'duress mechanism is not the realistic PIN-variation model');
for (const bad of ['добавить цифру 9', 'код +9', 'цифру 9']) expect(!s2.includes(bad), `obsolete +9 duress mechanic remains: ${bad}`);
expect(s2.includes('само по себе не исключает принуждение'), 'duress clue overclaims voluntary participation');
expect(!s2.includes('Он физически не перемещается'), 'Wi-Fi association overclaims exact phone location');
expect(s2.includes('не даёт точной координаты'), 'Wi-Fi limitation is not stated');
expect(s2.includes('выведена из продажи'), 'vacant-room opportunity is not established');

for (const marker of ['NS-17', '23:50', 'BR-220']) expect(s3.includes(marker), `sealed sapphire chain missing ${marker}`);
expect(s3.includes('фрагмент пломбы NS-17'), 'trolley does not contain unique seal evidence');
expect(s3.includes('в 01:14 она физически не могла держать HK-44'), 'HK-44 transfer is not proven by simultaneous CCTV');
expect(s3.includes('за рулём находится Елена Раева'), 'Elena is not personally identified as driver');
expect(s3.includes('сам по себе не различает человека и предмет'), 'passenger-seat sensor is still overclaimed');
expect(s3.includes('MO-W1'), 'Marta watch is not independently associated with vehicle');
expect(s3.includes('22:48 · Марта') && s3.includes('22:49 · Елена') && s3.includes('22:51 · Марта'), 'pre-event message timestamps are missing');
expect(s3.includes('отправленных вечером до событий'), 'message chronology is not explicitly pre-event');

const messages = data.stages[2].analyst[2].messages.flat().join(' ');
for (const confession of ['HK-44', 'BR-220', 'Северная звезда', 'SVC-407']) expect(!messages.includes(confession), `message thread becomes a confession via ${confession}`);
expect(s3.includes('дубликат экспортной оценки') && s3.includes('без действующего сертификата'), 'specific sapphire monetization motive is missing');
expect(s3.includes('непрерывное алиби исключает'), 'Denis exclusion is not physically grounded');

const finalSequence = data.final.questions.find((question) => question.id === 'sequence');
expect(finalSequence?.answer === 'collusion', 'canonical final sequence changed');
expect(data.final.intro.includes('владельца токена') && data.final.intro.includes('мотив'), 'final does not warn against identity/motive inference errors');
expect(data.reveal.body.some((line) => line.includes('камера G1') && line.includes('лично за рулём')), 'debrief does not distinguish owner evidence from personal identity evidence');
expect(data.reveal.body.some((line) => line.includes('NS-17') && line.includes('сапфир')), 'debrief does not close sapphire custody chain');

const bridge = read('assets/case-407-plaque-code-v2.js');
for (const marker of ["legacy: 'S-407', public: 'S-8D1'", "legacy: 'L-409', public: 'L-6B2'", "legacy: 'L-407', public: 'L-4A8'", "legacy: 'H-409', public: 'H-7C4'"]) expect(bridge.includes(marker), `identifier bridge missing ${marker}`);
expect(bridge.includes('duress-вариация персонального PIN'), 'runtime final-label compatibility does not remove obsolete +9 claim');

const visual = read('assets/case-407-detective-visual-v4.js');
for (const marker of ['•••••6', '•••••7', 'не идентифицирует человека', 'BR-220 / NS-17', 'ВОДИТЕЛЬ: E. RAEVA', 'MO-W1 В САЛОНЕ', 'УДАЛЁННАЯ ПЕРЕПИСКА']) expect(visual.includes(marker), `v4 visual evidence missing ${marker}`);

const postprocess = read('tools/import-mobile/two-player-407-postprocess.mjs');
expect(postprocess.includes("const VERSION = '1.6.0'"), 'production case bundle is not v1.6.0');
for (const marker of ['case-407-data.js', 'case-407-detective-audit-v4.js', 'case-407-plaque-code-v2.js', 'case-407.js', 'case-407-evidence-v2.js', 'case-407-evidence-finalize.js', 'case-407-detective-visual-v4.js']) expect(postprocess.includes(marker), `production page missing ${marker}`);
const order = ['case-407-data.js', 'case-407-detective-audit-v4.js', 'case-407-plaque-code-v2.js', 'case-407.js', 'case-407-evidence-v2.js', 'case-407-evidence-finalize.js', 'case-407-detective-visual-v4.js'].map((marker) => postprocess.indexOf(marker));
expect(order.every((position, i) => position >= 0 && (i === 0 || position > order[i - 1])), 'production script load order is wrong');

console.log(JSON.stringify({
  case: data.title,
  logicVersion: data.logicVersion,
  impossibleKeyCard: false,
  opaqueStage1Ids: true,
  neutralStage3: true,
  realisticDuress: true,
  wifiLocationCaveat: true,
  sealedSapphireChain: 'BR-220 + NS-17',
  tokenTransferProven: true,
  elenaPersonallyIdentified: true,
  passengerSensorNotIdentity: true,
  preEventMessages: true,
  denisExcluded: true,
  productionVersion: '1.6.0'
}, null, 2));