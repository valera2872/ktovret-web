#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const expect = (condition, message) => { if (!condition) throw new Error(`Room 407 identifier validation failed: ${message}`); };

const bridge = read('assets/case-407-plaque-code-v2.js');
const runtime = read('assets/case-407.js');
const postprocess = read('tools/import-mobile/two-player-407-postprocess.mjs');
const smoke = read('tools/room-407-evidence-visual-smoke.mjs');

for (const marker of [
  "{ legacy: 'H-409', public: 'H-7C4' }",
  "{ legacy: 'L-409', public: 'L-6B2' }",
  "{ legacy: 'L-407', public: 'L-4A8' }",
  'migrateStory', 'translateInputForLegacyRuntime', 'sanitizeRegistry', 'physicalNode.textContent = \'LOCKED\'',
  'MutationObserver', 'ML407PlaqueCode'
]) expect(bridge.includes(marker), `identifier bridge missing ${marker}`);

for (const marker of ["expected: 'H-409'", "expected: 'L-409'"]) expect(runtime.includes(marker), `legacy runtime alias changed unexpectedly: ${marker}`);
expect(postprocess.includes("const VERSION = '1.5.3'"), 'case bundle version is not v1.5.3');
for (const marker of ['case-407-data.js', 'case-407-plaque-code-v2.js', 'case-407.js']) expect(postprocess.includes(marker), `case page missing ${marker}`);
const dataPos = postprocess.indexOf('case-407-data.js');
const bridgePos = postprocess.indexOf('case-407-plaque-code-v2.js');
const runtimePos = postprocess.indexOf('case-407.js');
expect(dataPos >= 0 && dataPos < bridgePos && bridgePos < runtimePos, 'identifier migration must load after data and before runtime');

expect(smoke.includes('case-407-plaque-code-v2.js'), 'role visual smoke does not exercise identifier migration');
for (const marker of ["'1-investigator':['L-409','L-407','H-409','L-6B2','L-4A8']", "'1-analyst':['H-409','H-7C4','L-409','L-407']", "dom.includes('H-7C4')", "dom.includes('L-6B2')", "dom.includes('L-4A8')", "dom.includes('LOCKED')"]) expect(smoke.includes(marker), `role smoke missing identifier assertion: ${marker}`);

console.log(JSON.stringify({
  publicPlaqueCode: 'H-7C4',
  publicLockCodes: ['L-4A8', 'L-6B2'],
  physicalNodeHiddenUntilCrosscheck: true,
  legacyAliasesHidden: true,
  loadOrder: 'data -> identifier bridge -> runtime',
  roleVisualChecks: true
}, null, 2));
