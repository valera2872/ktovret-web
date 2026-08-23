#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const fail = (message) => { throw new Error(`Room 407 evidence-v2 validation failed: ${message}`); };
const expect = (condition, message) => { if (!condition) fail(message); };

const js = read('assets/case-407-evidence-v2.js');
const hydrate = read('assets/case-407-evidence-v2-hydrate.js');
const css = read('assets/case-407-evidence-v2.css');
const postprocess = read('tools/import-mobile/two-player-407-postprocess.mjs');
const context = { window: {} };
vm.runInNewContext(read('assets/case-407-data.js'), context, { filename: 'case-407-data.js' });
const data = context.window.MLCase407;

expect(js.length > 12_000, 'visual evidence renderer is unexpectedly small');
expect(hydrate.length > 3_000, 'visual evidence hydration layer is unexpectedly small');
expect(css.length > 18_000, 'visual evidence stylesheet is unexpectedly small');
for (const marker of [
  'statementArtifact', 'plaqueArtifact', 'logArtifact', 'cctvArtifact', 'registryArtifact', 'planArtifact',
  'labArtifact', 'manualArtifact', 'networkArtifact', 'preliminaryArtifact', 'auditArtifact', 'alibiArtifact',
  'accessArtifact', 'telemetryArtifact', 'chatArtifact', 'MutationObserver', 'Комментарий эксперта'
]) expect(js.includes(marker), `renderer missing ${marker}`);

for (const marker of ['evidenceHydrated', ':scope > p', 'case407-log-row', 'case407-cctv-frame', 'case407-lab-data', 'case407-request-grid', 'КАРТА СЛУЖЕБНОЙ СЕТИ', 'СЛУЖЕБНЫЙ ДОСТУП + CAM B1']) {
  expect(hydrate.includes(marker), `hydration layer missing ${marker}`);
}

for (const marker of [
  '.case407-plaque-grid', '.case407-cctv-strip', '.case407-plan-canvas', '.case407-code-line',
  '.case407-network-grid', '.case407-audit-row', '.case407-access-path', '.case407-car-dash', '.case407-phone',
  '@media(max-width:760px)'
]) expect(css.includes(marker), `stylesheet missing ${marker}`);

for (const marker of ['case-407-evidence-v2.css', 'case-407-evidence-v2.js', 'case-407-evidence-v2-hydrate.js', "const VERSION = '1.4.1'"]) {
  expect(postprocess.includes(marker), `generated case page does not load ${marker}`);
}

const story = JSON.stringify(data);
for (const marker of [
  'Павел Зорин', 'Осмотр двери', 'Фрагмент журнала замков', 'Камера C4', 'Реестр оборудования',
  'Архивный план', 'Нина Круглова', 'Чай и стекло', 'Инструкция сейфа S-400', 'Сеть носимых устройств',
  'Карта служебной сети', 'Бельевая тележка', 'Внутренняя проверка', 'Проверка подозреваемого',
  'Служебный доступ + камера B1', 'Телематика автомобиля', 'Удалённый черновик'
]) expect(story.includes(marker), `current story no longer contains material expected by renderer: ${marker}`);

expect(!js.includes('fetch(') && !hydrate.includes('fetch('), 'evidence layer must not depend on external runtime fetches');
expect(!js.includes('innerHTML = card.textContent') && !hydrate.includes('innerHTML = card.textContent'), 'renderer contains unsafe blanket HTML conversion');
expect(js.includes("replaceAll('&', '&amp;')") && hydrate.includes("replaceAll('&', '&amp;')"), 'renderer must HTML-escape evidence text');

console.log(JSON.stringify({
  case: data.title,
  rendererBytes: Buffer.byteLength(js),
  hydrationBytes: Buffer.byteLength(hydrate),
  stylesheetBytes: Buffer.byteLength(css),
  visualLanguages: 15,
  materializedEvidence: 17,
  existingPhotoEvidence: 1,
  mobileResponsive: true,
  externalRuntimeDependencies: 0
}, null, 2));
