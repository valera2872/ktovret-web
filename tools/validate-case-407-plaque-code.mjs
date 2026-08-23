#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const expect = (condition, message) => { if (!condition) throw new Error(`Room 407 plaque-code validation failed: ${message}`); };

const bridge = read('assets/case-407-plaque-code-v2.js');
const runtime = read('assets/case-407.js');
const postprocess = read('tools/import-mobile/two-player-407-postprocess.mjs');
const smoke = read('tools/room-407-evidence-visual-smoke.mjs');

for (const marker of ["PUBLIC_CODE = 'H-7C4'", "LEGACY_CODE = 'H-409'", 'migrateStory', 'translateInputForLegacyRuntime', 'MutationObserver', 'ML407PlaqueCode']) {
  expect(bridge.includes(marker), `bridge missing ${marker}`);
}
expect(runtime.includes("expected: 'H-409'"), 'legacy runtime alias changed without removing migration bridge');
expect(postprocess.includes("const VERSION = '1.5.3'"), 'case bundle version was not bumped');
for (const marker of ['case-407-data.js', 'case-407-plaque-code-v2.js', 'case-407.js']) expect(postprocess.includes(marker), `case page missing ${marker}`);
const dataPos = postprocess.indexOf('case-407-data.js');
const bridgePos = postprocess.indexOf('case-407-plaque-code-v2.js');
const runtimePos = postprocess.indexOf('case-407.js');
expect(dataPos >= 0 && dataPos < bridgePos && bridgePos < runtimePos, 'plaque-code migration must load after data and before runtime');
expect(smoke.includes('case-407-plaque-code-v2.js'), 'role visual smoke does not exercise plaque-code migration');
expect(smoke.includes("'1-investigator':['L-409','H-409']"), 'investigator smoke does not forbid legacy H-409');
expect(smoke.includes("'1-analyst':['H-409','H-7C4']"), 'analyst smoke does not forbid both private plaque codes');
expect(smoke.includes("!dom.includes('H-7C4')"), 'investigator smoke does not require opaque H-7C4');

console.log(JSON.stringify({ publicPlaqueCode: 'H-7C4', legacyAliasHidden: true, loadOrder: 'data -> plaque bridge -> runtime', roleVisualChecks: true }, null, 2));
