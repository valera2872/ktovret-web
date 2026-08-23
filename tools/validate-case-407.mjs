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
  expect(stage.objective?.length > 60, `stage ${stage.id} needs a clear objective`);
  for (const role of ['investigator', 'analyst']) {
    const materials = stage[role];
    expect(Array.isArray(materials) && materials.length === 3, `stage ${stage.id}/${role} must contain three materials`);
    for (const material of materials) {
      materialCount += 1;
      expect(material.title && material.tag && material.type, `stage ${stage.id}/${role} contains an incomplete material`);
      expect(!titles.has(material.title), `duplicate evidence title: ${material.title}`);
      titles.add(material.title);
      const substance = [...(material.body || []), ...(material.facts || []), ...(material.messages || []).flat()].join(' ');
      expect(substance.length > 90, `material “${material.title}” is too thin`);
    }
  }
}
expect(materialCount === 18, `expected 18 materials, got ${materialCount}`);

expect(data.final?.questions?.length === 3, 'the final must contain three reconstruction questions');
const expectedAnswers = new Map([['room', '409'], ['alarm', 'duress'], ['sequence', 'staged']]);
for (const question of data.final.questions) {
  const values = new Set(question.options.map(([value]) => value));
  expect(values.has(question.answer), `answer for “${question.id}” is not present in its options`);
  expect(expectedAnswers.get(question.id) === question.answer, `canonical answer changed for “${question.id}”`);
}
expect(data.hints?.length >= 5, 'progressive hint ladder is incomplete');
expect(data.reveal?.body?.length >= 5 && data.reveal.closing, 'personalized fair-play debrief is incomplete');

const roleText = (role) => JSON.stringify(data.stages.map((stage) => stage[role]));
const handoffs = [
  ['Следователь получает L-409 от Аналитика', roleText('analyst'), 'L-409'],
  ['Аналитик получает H-409 от Следователя', roleText('investigator'), 'H-409'],
  ['Следователь получает HK-44 от Аналитика', roleText('analyst'), 'HK-44'],
  ['Аналитик получает BR-220 от Следователя', roleText('investigator'), 'BR-220'],
];
for (const [label, source, token] of handoffs) expect(source.includes(token), `${label}: source token is absent`);

const allStory = JSON.stringify(data);
for (const marker of ['COPY-2', 'S-407', 'SVC-407', 'NIGHT-MGR', '94 секунды', 'ЛОЖЬ ≠ ВИНОВНОСТЬ']) {
  expect(allStory.includes(marker), `fair-play marker is missing: ${marker}`);
}
for (const stale of ['D-2147', 'Q7-29', 'RB-17', '4F-7719', 'special:2317', 'Вера', 'Илья']) {
  expect(!allStory.includes(stale), `stale material from another case remains: ${stale}`);
}

const runtime = read('assets/case-407.js');
for (const marker of [
  'functions/v1/coop-407', "expected: 'L-409'", "expected: 'H-409'", "expected: 'HK-44'", "expected: 'BR-220'",
  "correct: 'service'", "new Set(['room_swap', 'duress', 'service_route'])", 'data-case407-app',
]) expect(runtime.includes(marker), `runtime contract is missing: ${marker}`);

const postprocess = read('tools/import-mobile/two-player-407-postprocess.mjs');
for (const marker of ['noindex,follow', 'case407-catalog', 'room-407-evidence.webp', 'href="407/"']) {
  expect(postprocess.includes(marker), `page generator is missing: ${marker}`);
}

const edge = read('supabase/functions/coop-407/index.ts');
for (const marker of ["const CASE_ID = 'special:407'", "const CASE_PATH = '/detektivnye-igry-dlya-dvoih/407/'", "const CASE_TITLE = 'Номер 407'"]) {
  expect(edge.includes(marker), `isolated room server is missing: ${marker}`);
}
const migration = read('supabase/migrations/20260823172500_allow_room_407_case_path.sql');
for (const marker of ['duel_rooms_case_path_format', '/detektivnye-igry-dlya-dvoih/2317/', '/detektivnye-igry-dlya-dvoih/407/']) {
  expect(migration.includes(marker), `room path allowlist migration is missing: ${marker}`);
}

const image = fs.readFileSync(path.join(repo, 'assets/room-407-evidence.webp'));
expect(image.length > 30_000, 'evidence image is suspiciously small');
expect(image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP', 'evidence image is not WebP');

console.log(JSON.stringify({
  case: data.title,
  stages: data.stages.length,
  materials: materialCount,
  finalQuestions: data.final.questions.length,
  handoffs: handoffs.length,
  imageBytes: image.length,
  fairPlay: 'passed',
}, null, 2));
