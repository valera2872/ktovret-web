import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const map = read('assets/partner-v2-map.js');
const css = read('assets/partner-v2-map.css');
const page = read('detektivnye-igry-dlya-dvoih/nulevoy-konteyner/index.html');

test('Vector-12 map renderer parses as browser JavaScript', () => {
  assert.doesNotThrow(() => new Function(map));
});

test('M01 technical map contains all investigation-critical locations', () => {
  assert.match(map, /data-evidence-id="M01"/);
  assert.match(map, /ГЛАВНЫЙ ПУТЬ/);
  assert.match(map, /ПЕТЛЯ Б/);
  assert.match(map, /ПРОМЫШЛЕННАЯ ВЕТКА/);
  assert.match(map, /ТЕХНИЧЕСКАЯ ПЛОЩАДКА Б/);
  assert.match(map, /СЕРВИСНЫЙ/);
  assert.match(map, /БОКС 3/);
  assert.match(map, /ВОРОТА 2/);
  assert.match(map, /состав №214/);
  assert.match(map, />06</);
});

test('map makes the key route deduction visible without revealing the culprit', () => {
  assert.match(map, /контейнер можно снять с вагона/);
  assert.match(map, /не уводя состав на другую ветку/);
  assert.doesNotMatch(map, /Маркова|Рыбаков|винов/iu);
});

test('map preserves readable scale on narrow screens with horizontal pan', () => {
  assert.match(map, /partner-v2-vector-map-scroll/);
  assert.match(map, /На узком экране двигайте схему влево и вправо/);
  assert.match(css, /\.partner-v2-vector-map-scroll\{overflow:hidden\}/);
  assert.match(css, /overflow-x:auto/);
  assert.match(css, /width:680px;min-width:680px;max-width:none/);
  assert.match(css, /\.partner-v2-vector-map-pan-hint\{display:none\}/);
  assert.match(css, /\.partner-v2-vector-map-pan-hint\{display:block/);
});

test('mobile map starts on the investigation zone instead of the empty left edge', () => {
  assert.match(map, /centerMobileMap/);
  assert.match(map, /matchMedia\('\(max-width: 680px\)'\)/);
  assert.match(map, /scrollWidth - scroller\.clientWidth/);
  assert.match(map, /scrollLeft = Math\.round\(overflow \* 0\.42\)/);
});

test('mobile technical labels remain legible without scaling the whole SVG down', () => {
  assert.match(css, /\.pv2-label\{font-size:12px\}/);
  assert.match(css, /\.pv2-zone-title\{font-size:10px\}/);
  assert.match(css, /\.pv2-tiny,\.partner-v2-vector-map \.pv2-note-text\{font-size:9\.5px\}/);
  assert.match(css, /\.pv2-gate-label\{font-size:8px\}/);
});

test('map has dedicated technical-system styling', () => {
  assert.match(css, /\.partner-v2-vector-map/);
  assert.match(css, /\.pv2-loop-track/);
  assert.match(css, /\.pv2-tech-zone/);
  assert.match(css, /\.pv2-service-road/);
  assert.match(css, /\.pv2-train/);
});

test('case page loads technical map after base/polish and before hints', () => {
  assert.match(page, /partner-v2-map\.css/);
  assert.match(page, /partner-v2-polish\.js[\s\S]*partner-v2-map\.js[\s\S]*partner-v2-hints\.js/);
});
