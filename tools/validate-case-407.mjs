#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (relative) => fs.readFileSync(path.join(repo, relative), 'utf8');
const fail = (message) => { throw new Error(`Room 407 validation failed: ${message}`); };
const expect = (condition, message) => { if (!condition) fail(message); };

const context = { window: {} };
vm.runInNewContext(read('assets/case-407-data.js'), context, { filename: 'case-407-data.js' });
const data = context.window.MLCase407;
expect(data && data.id === 'special:407', 'canonical case id is missing');
expect(data.duration === '50–70 минут', 'premium duration changed');
expect(Array.isArray(data.stages) && data.stages.length === 3, 'the case must have exactly three stages');

const titles = new Set();
let materialCount = 0;
for (const [index, stage] of data.stages.entries()) {
  expect(stage.id === index + 1, `stage ${index + 1} id/order mismatch`);
  expect(stage.objective?.length > 80, `stage ${stage.id} needs a clear objective`);
  for (const role of ['investigator', 'analyst']) {
    const materials = stage[role];
    expect(Array.isArray(materials) && materials.length === 3, `stage ${stage.id}/${role} must contain three materials`);
    for (const material of materials) {
      materialCount += 1;
      expect(material.title && material.tag && material.type, `stage ${stage.id}/${role} contains an incomplete material`);
      expect(!titles.has(material.title), `duplicate evidence title: ${material.title}`);
      titles.add(material.title);
      const substance = [...(material.body || []), ...(material.facts || []), ...(material.messages || []).flat()].join(' ');
      expect(substance.length > 110, `material “${material.title}” is too thin`);
    }
  }
}
expect(materialCount === 18, `expected 18 materials, got ${materialCount}`);

expect(data.final?.questions?.length === 4, 'the final must contain four reconstruction questions');
const expectedAnswers = new Map([['room', '409'], ['alarm', 'duress'], ['route', 'service'], ['sequence', 'collusion']]);
for (const question of data.final.questions) {
  const values = new Set(question.options.map(([value]) => value));
  expect(values.has(question.answer), `answer for “${question.id}” is not present in its options`);
  expect(expectedAnswers.get(question.id) === question.answer, `canonical answer changed for “${question.id}”`);
}
expect(data.hints?.length === 6, 'hint ladder must contain exactly two hints per stage');
expect(data.reveal?.body?.length >= 5 && data.reveal.closing, 'fair-play debrief is incomplete');

const stageRole = (stage, role) => JSON.stringify(data.stages[stage - 1][role]);
const handoffs = [
  ['Следователь получает L-409 от Аналитика', stageRole(1, 'analyst'), 'L-409'],
  ['Аналитик получает H-409 от Следователя', stageRole(1, 'investigator'), 'H-409'],
  ['Следователь получает HK-44 от Аналитика', stageRole(3, 'analyst'), 'HK-44'],
  ['Аналитик получает BR-220 от Следователя', stageRole(3, 'investigator'), 'BR-220'],
];
for (const [label, source, token] of handoffs) expect(source.includes(token), `${label}: source token is absent`);
for (const [label, source, token] of [
  ['stage1 investigator must need Analyst for L-409', stageRole(1, 'investigator'), 'L-409'],
  ['stage1 analyst must need Investigator for H-409', stageRole(1, 'analyst'), 'H-409'],
  ['stage3 investigator must need Analyst for HK-44', stageRole(3, 'investigator'), 'HK-44'],
  ['stage3 analyst must need Investigator for BR-220', stageRole(3, 'analyst'), 'BR-220'],
]) expect(!source.includes(token), `${label}: partner-only token leaked into local evidence`);

const stage1 = JSON.stringify(data.stages[0]);
for (const earlySpoiler of ['SVC-407', 'HK-44', 'LOADING-B1', 'цифру 9', 'служебный лифт']) expect(!stage1.includes(earlySpoiler), `stage 1 reveals escape mechanism too early: ${earlySpoiler}`);
expect(stage1.includes('H-409') && stage1.includes('L-409'), 'stage 1 must contain complementary room identifiers across roles');

const stage2 = JSON.stringify(data.stages[1]);
for (const marker of ['LOADING-B1', 'STAFF-4', 'цифру 9', 'несколько внутренних маршрутов', 'Двери и пропуска не показаны']) expect(stage2.includes(marker), `stage 2 missing indirect route/intent marker: ${marker}`);
for (const prematureExact of ['SVC-407', 'HK-44', '01:18:41', 'служебный лифт']) expect(!stage2.includes(prematureExact), `stage 2 reveals exact requested route too early: ${prematureExact}`);
for (const telegraph of ['Нужны журналы доступа', 'нужен отдельный срочный запрос к системе служебного доступа', 'Точный журнал служебного доступа пока не запрошен']) expect(!stage2.includes(telegraph), `stage 2 telegraphs operational choice: ${telegraph}`);

const stage3 = JSON.stringify(data.stages[2]);
for (const marker of ['BR-220', 'HK-44', 'SVC-407', 'LOADING-B1', 'NIGHT-MGR', 'ER-02', '94 секунды', '31 800 евро', 'ЛОЖЬ ≠ ВИНОВНОСТЬ', 'Владелец токена ≠ обязательно его носитель']) expect(stage3.includes(marker), `stage 3 missing route/accomplice/sapphire marker: ${marker}`);
for (const confession of ['HK-44 у меня', 'Футляр BR-220 войдёт', 'В аэропорту разделимся', 'масса в багажном отсеке']) expect(!stage3.includes(confession), `stage 3 contains over-explicit or implausible clue: ${confession}`);

const allStory = JSON.stringify(data);
for (const marker of ['COPY-2', 'S-407', 'SVC-407', 'NIGHT-MGR', '94 секунды', 'ЛОЖЬ ≠ ВИНОВНОСТЬ']) expect(allStory.includes(marker), `fair-play marker is missing: ${marker}`);
for (const stale of ['D-2147', 'Q7-29', 'RB-17', '4F-7719', 'special:2317', 'Вера', 'Илья']) expect(!allStory.includes(stale), `stale material from another case remains: ${stale}`);
for (const overAnsweringTitle of ['чужой служебный код', 'подтверждает невозможную', 'только у физического', 'собирали заранее', 'вызвали осознанно', 'в тележке был футляр', 'общий риск разоблачения', 'не мог участвовать', 'проходит весь маршрут', 'уезжает с двумя людьми', 'согласовывали время']) expect(![...titles].some((title) => title.toLowerCase().includes(overAnsweringTitle)), `evidence title gives away deduction: ${overAnsweringTitle}`);
expect(!data.reveal.body.join(' ').includes('До полуночи Елена'), 'reveal contradicts screwdriver timeline');
expect(data.reveal.body[0].includes('Между 00:30 и 00:51'), 'plaque-swap timing is not bounded by evidence');
expect(allStory.includes('около 00:45–00:55'), 'tea estimate should stay plausibly broad');
expect(data.brief.lead.includes('COPY-2'), 'brief must distinguish demo cassette from real jewelry case');

const runtime = read('assets/case-407.js');
for (const marker of ['functions/v1/coop-407', "expected: 'L-409'", "expected: 'H-409'", "expected: 'HK-44'", "expected: 'BR-220'", "correct: 'service'", "new Set(['room', 'intent', 'route', 'sapphire', 'accomplice'])", 'mysterylogic:407:v3:', 'HINTS_BY_STAGE', 'hintUsage', 'usedStageHints >= stageHints.length', 'Полный журнал служебного доступа открыт в этапе 3', 'Выберите 5 опорных доказательств', 'reconstruction + evidence + coordination + discipline', 'не доказывает, кто именно нёс токен', 'data-case407-app']) expect(runtime.includes(marker), `runtime contract is missing: ${marker}`);
expect(!runtime.includes("new Set(['room_swap', 'duress', 'service_route'])"), 'old rigid three-evidence final still exists');
expect(!runtime.includes('teamwork = 25'), 'teamwork score must not be hard-coded');
expect(!runtime.includes("mysterylogic:407:v2:"), 'stale v2 progress key remains');

const postprocess = read('tools/import-mobile/two-player-407-postprocess.mjs');
for (const marker of ['noindex,follow', 'case407-catalog', 'room-407-evidence.webp', 'href="407/"', 'case-407-evidence-v3.css', "const VERSION = '1.5.1'"]) expect(postprocess.includes(marker), `page generator is missing: ${marker}`);
expect(!postprocess.includes('case-407-evidence-v2-hydrate.js'), 'redundant evidence hydration runtime is still loaded');

const edge = read('supabase/functions/coop-407/index.ts');
for (const marker of ["const CASE_ID = 'special:407'", "const CASE_PATH = '/detektivnye-igry-dlya-dvoih/407/'", "const CASE_TITLE = 'Номер 407'"]) expect(edge.includes(marker), `isolated room server is missing: ${marker}`);
const migration = read('supabase/migrations/20260823172500_allow_room_407_case_path.sql');
for (const marker of ['duel_rooms_case_path_format', '/detektivnye-igry-dlya-dvoih/2317/', '/detektivnye-igry-dlya-dvoih/407/']) expect(migration.includes(marker), `room path allowlist migration is missing: ${marker}`);

const image = fs.readFileSync(path.join(repo, 'assets/room-407-evidence.webp'));
expect(image.length > 30_000, 'evidence image is suspiciously small');
expect(image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP', 'evidence image is not WebP');

console.log(JSON.stringify({ case: data.title, logicVersion: 3, stages: data.stages.length, materials: materialCount, finalQuestions: data.final.questions.length, handoffs: handoffs.length, roleLeakChecks: 4, stageScopedHints: 6, finalEvidenceGroups: 5, imageBytes: image.length, fairPlay: 'passed' }, null, 2));