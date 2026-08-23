#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const fail = (message) => { throw new Error(`Room 407 evidence validation failed: ${message}`); };
const expect = (condition, message) => { if (!condition) fail(message); };

const js = read('assets/case-407-evidence-v2.js');
const finalizer = read('assets/case-407-evidence-finalize.js');
const css = read('assets/case-407-evidence-v2.css');
const overrides = read('assets/case-407-evidence-v3.css');
const postprocess = read('tools/import-mobile/two-player-407-postprocess.mjs');
const context = { window: {} };
vm.runInNewContext(read('assets/case-407-data.js'), context, { filename: 'case-407-data.js' });
const data = context.window.MLCase407;

expect(js.length > 14_000, 'visual evidence renderer is unexpectedly small');
expect(finalizer.length > 3_000, 'visual evidence finalizer is unexpectedly small');
expect(css.length > 18_000, 'base visual evidence stylesheet is unexpectedly small');
expect(overrides.length > 2_000, 'readability override stylesheet is unexpectedly small');
for (const marker of ['statementArtifact', 'plaqueArtifact', 'logArtifact', 'cctvArtifact', 'registryArtifact', 'planArtifact', 'labArtifact', 'manualArtifact', 'wearableArtifact', 'serviceMapArtifact', 'auditArtifact', 'alibiArtifact', 'accessCameraArtifact', 'telemetryArtifact', 'chatArtifact', 'MutationObserver', 'Расшифровка материала']) expect(js.includes(marker), `renderer missing ${marker}`);
for (const marker of ['directParagraphs', 'fillArtifact', 'case407-transcript', 'case407-log-table', 'case407-cctv-strip', 'case407-lab-data', 'case407-request-grid', 'data.evidenceFinalized', 'Расшифровка материала']) expect(finalizer.includes(marker), `finalizer missing ${marker}`);
for (const marker of ['.case407-plaque-grid', '.case407-cctv-strip', '.case407-plan-canvas', '.case407-code-line', '.case407-network-grid', '.case407-audit-row', '.case407-access-path', '.case407-car-dash', '.case407-phone', '@media(max-width:760px)']) expect(css.includes(marker), `stylesheet missing ${marker}`);
for (const marker of ['grid-template-columns:repeat(2,minmax(0,1fr))', 'font-size:11px', '.case407-access-camera']) expect(overrides.includes(marker), `readability overrides missing ${marker}`);

for (const marker of ['case-407-evidence-v2.css', 'case-407-evidence-v3.css', 'case-407-evidence-v2.js', 'case-407-evidence-finalize.js', "const VERSION = '1.5.2'"]) expect(postprocess.includes(marker), `generated case page does not load ${marker}`);
expect(!postprocess.includes('case-407-evidence-v2-hydrate.js'), 'removed legacy hydration layer is still loaded');

const story = JSON.stringify(data);
for (const marker of ['Первичный рапорт', 'Осмотр двери', 'Фрагмент журнала замков', 'Камера C4', 'Реестр оборудования', 'Архивный план', 'Опрос персонала', 'Чай и стекло', 'Инструкция сейфа S-400', 'Сеть носимых устройств', 'Карта служебной сети', 'Бельевая тележка', 'Внутренняя проверка', 'Проверка подозреваемого', 'Служебный доступ + камера B1', 'Телематика автомобиля', 'Удалённый черновик']) expect(story.includes(marker), `current story no longer contains material expected by renderer: ${marker}`);

const registryStart = js.indexOf('const registryArtifact');
const registryEnd = js.indexOf('const planArtifact', registryStart);
const registrySource = js.slice(registryStart, registryEnd);
expect(registrySource.includes('L-409'), 'Analyst registry must contain L-409');
expect(!registrySource.includes('H-409'), 'Analyst registry leaks Investigator-only H-409');
expect(registrySource.includes('LOOKUP'), 'Analyst registry must require plaque-code lookup');
const serviceStart = js.indexOf('const serviceMapArtifact');
const serviceEnd = js.indexOf('const auditArtifact', serviceStart);
const serviceSource = js.slice(serviceStart, serviceEnd);
for (const telegraph of ['requires priority request', 'требуется срочный запрос доступа', 'Нужны журналы доступа']) expect(!serviceSource.includes(telegraph), `service map telegraphs the operational answer: ${telegraph}`);
expect(serviceSource.includes('маршрут не определён'), 'service map should preserve route uncertainty');

expect(js.includes("details.appendChild(factsNode)"), 'fact chips must be assigned to interpretation details');
expect(finalizer.includes('details.insertBefore(node, anchor)'), 'visible narrative must move behind interpretation details');
expect(!js.includes('fetch(') && !finalizer.includes('fetch('), 'evidence layer must not depend on external runtime fetches');
expect(!js.includes('innerHTML = card.textContent') && !finalizer.includes('innerHTML = card.textContent'), 'renderer contains unsafe blanket HTML conversion');
expect(js.includes("replaceAll('&', '&amp;')") && finalizer.includes("replaceAll('&', '&amp;')"), 'evidence scripts must HTML-escape text');

console.log(JSON.stringify({ case: data.title, rendererBytes: Buffer.byteLength(js), finalizerBytes: Buffer.byteLength(finalizer), stylesheetBytes: Buffer.byteLength(css) + Buffer.byteLength(overrides), visualLanguages: 15, materializedEvidence: 18, roleSafeRegistry: true, collapsedInterpretation: true, mobileReadable: true, externalRuntimeDependencies: 0 }, null, 2));