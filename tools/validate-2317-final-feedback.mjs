import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../assets/case-2317-runtime.js', import.meta.url), 'utf8');

assert.match(source, /FINAL_EVIDENCE = new Set\(\['ilya_camera', 'tracker', 'roman_route'\]\)/, 'final evidence contract is missing');
assert.match(source, /data-final-inline-feedback/, 'inline final feedback container is missing');
assert.match(source, /Заключение пока не принято\./, 'visible wrong-final heading is missing');
assert.match(source, /Ваш выбор сохранён/, 'selection-preservation explanation is missing');
assert.match(source, /event\.stopImmediatePropagation\(\)/, 'wrong final must stop the legacy rerender path');
assert.match(source, /attempt >= 3/, 'progressive final hint is missing');
assert.match(source, /coop:2317:final-wrong/, 'cognitive final-failure telemetry is missing');
assert.match(source, /saveProgress\(progress\);\n\s*}\, true\);/, 'successful final must still fall through to the canonical submit handler');

console.log('23:17 final-feedback regression gate passed');
