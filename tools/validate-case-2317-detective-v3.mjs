#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const expect = (condition, message) => { if (!condition) throw new Error(`23:17 detective-v3 validation failed: ${message}`); };

const context = { window: {} };
vm.runInNewContext(read('assets/case-2317-data.js'), context, { filename: 'case-2317-data.js' });
vm.runInNewContext(read('assets/case-2317-detective-v3.js'), context, { filename: 'case-2317-detective-v3.js' });
vm.runInNewContext(read('assets/case-2317-timeline-v31.js'), context, { filename: 'case-2317-timeline-v31.js' });
const data = context.window.MLCase2317;
const all = JSON.stringify(data);
const ux = read('assets/case-2317-ux-v3.js');
const generator = read('tools/import-mobile/two-player-2317-postprocess.mjs');

expect(data.logicVersion === 3, 'logicVersion is not 3');
expect(data.proofRevision === '3.2', 'proofRevision is not 3.2');
expect(data.stages.length === 3, 'stage count changed');
expect(data.final.questions.length === 4, 'final must ask four independent conclusions');

const s1 = JSON.stringify(data.stages[0]);
const s2 = JSON.stringify(data.stages[1]);
const s3 = JSON.stringify(data.stages[2]);

expect(s1.includes('23:17:43'), '112 door sound timestamp missing');
expect(s2.includes('23:17:43.6') && s2.includes('23:21:06'), 'door events are not separated into two timestamps');
expect(!s2.includes('23:21:06 — служебная дверь внутреннего двора открыта гостевым QR Марины Соболевой. Звуковой профиль совпадает'), 'old impossible sound-to-door mapping returned');
expect(s1.includes('Личность водителя на этом пакете не установлена'), 'vehicle/person uncertainty missing');
expect(s1.includes('не позволяет определить рост или личность водителя'), 'seat-position overclaim returned');
expect(s2.includes('Владение меткой не устанавливает'), 'credential-owner caveat missing');
expect(s2.includes('23:43:51–23:45:12') && s2.includes('23:44:36'), 'Vera/car simultaneous overlap missing');
expect(s2.includes('одновременная фиксация автомобиля') && s2.includes('Сопоставьте два источника по времени'), 'overlap facts no longer leave deduction to players');
expect(s3.includes('00:18:32') && s3.includes('00:16'), 'post-23:47 Vera safety proof missing before final');
expect(s3.includes('повторный звонок по карточке обращения'), 'safety material title is still conclusion-leading');
expect(!s3.includes('Таким образом, безопасность Веры подтверждена'), 'safety material still pre-solves its own conclusion');
expect(s3.includes('LTE/GNSS') && s3.includes('BLE'), 'tracker technology remains internally ambiguous');
expect(data.stages[2].title === 'Последний маршрут', 'stage 3 title is still leading');
expect(!data.stages[2].objective.includes('ложная картина похищения'), 'stage 3 objective still spoils conclusion');
expect(!all.includes('Маршрут согласуется с тем, что он отогнал автомобиль Веры'), 'analyst material still pre-solves Roman deduction');
expect(!ux.includes('Отгоню её машину, маяк пусть едет отдельно'), 'user-facing v3 still contains Roman confession');
expect(ux.includes('CAM-S2 · 23:30:52'), 'independent Roman-at-car visual proof missing');
expect(ux.includes('Q7-29 / CAM-N2 · 23:12:18'), 'personal Ilya identification missing');
expect(ux.includes("input.value = 'D-2147'"), 'timestamp-to-legacy handoff bridge missing');
expect(ux.includes("'23:17:43'"), 'real timestamp handoff missing');

const reveal = JSON.stringify(data.reveal);
for (const marker of ['Иль', 'Марин', 'Роман', '00:18']) expect(reveal.includes(marker), `reveal lost ${marker}`);
for (const marker of ['Q7-29', '4F-7719', '00:16', '00:18', '23:55:04']) {
  expect(all.includes(marker) || ux.includes(marker), `reveal-critical marker not available to players before final: ${marker}`);
}

for (const hint of data.hints) {
  expect(!/4F-7719|RB-17|00:18|CAM-S2|Роман/.test(hint), `global hint leaks later-stage answer: ${hint}`);
}

expect(generator.includes('case-2317-detective-v3.js'), 'production generator does not load detective v3');
expect(generator.includes('case-2317-timeline-v31.js'), 'production generator does not load timeline/proof overlay');
expect(generator.includes('case-2317-ux-v3.js'), 'production generator does not load UX v3');
expect(generator.indexOf('case-2317-data.js') < generator.indexOf('case-2317-detective-v3.js'), 'data/v3 load order wrong');
expect(generator.indexOf('case-2317-detective-v3.js') < generator.indexOf('case-2317.js'), 'v3 must patch data before runtime');
expect(generator.indexOf('case-2317.js') < generator.indexOf('case-2317-ux-v3.js'), 'UX v3 must load after legacy runtime shell');
expect(generator.indexOf('case-2317-ux-v3.js') < generator.indexOf('case-2317-runtime.js'), 'UX v3 speech bridge must load before audio runtime');

console.log(JSON.stringify({
  case: data.title,
  logicVersion: data.logicVersion,
  proofRevision: data.proofRevision,
  impossibleDoorMapping: false,
  vehicleOwnerEqualsPerson: false,
  credentialOwnerEqualsPerson: false,
  veraCarOverlap: true,
  veraSafetyBeforeFinal: true,
  deductionCopyNeutral: true,
  stage3Spoiler: false,
  romanConfessionRemovedFromV3: true,
  productionLoadOrder: 'passed'
}, null, 2));