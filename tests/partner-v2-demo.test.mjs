import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const demo = read('assets/partner-v2-demo.js');
const demoPage = read('detektivnye-igry-dlya-dvoih/nulevoy-konteyner/demo.html');
const livePage = read('detektivnye-igry-dlya-dvoih/nulevoy-konteyner/index.html');

test('demo is isolated from the live player page', () => {
  assert.match(demoPage, /data-partner-endpoint="\/__partner-v2-demo"/);
  assert.match(demoPage, /partner-v2-demo\.js/);
  assert.match(demoPage, /noindex,nofollow/);
  assert.doesNotMatch(livePage, /partner-v2-demo\.js/);
  assert.doesNotMatch(livePage, /__partner-v2-demo/);
});

test('demo exposes two switchable role screens without a second device', () => {
  assert.match(demo, /data-demo-role="creator"/);
  assert.match(demo, /data-demo-role="guest"/);
  assert.match(demo, /ДЕМО-РЕЖИМ/);
  assert.match(demo, /location\.reload\(\)/);
  assert.match(demo, /mysterylogic:partner-v2:demo-role/);
  assert.match(demo, /mysterylogic:partner-v2:zero-container:demo-state:v1/);
});

test('demo keeps the real asymmetric progression and final proof classes', () => {
  for (const checkpoint of ['photo_observation','t04391_link','physical_operation','endpoint_link']) {
    assert.match(demo, new RegExp(checkpoint));
  }
  assert.match(demo, /photoScore\(value,rule\.expected\[role\]\) >= 2/);
  assert.match(demo, /motive_egress/);
  assert.match(demo, /motive_market/);
  assert.match(demo, /finalSolved/);
  assert.match(demo, /Правильный номер на неправильном контейнере/);
});

test('demo still isolates evidence by active role and chapter', () => {
  assert.match(demo, /item\.role === role && Number\(item\.chapter\) <= Number\(demo\.chapter\)/);
  assert.match(demo, /role:'creator'/);
  assert.match(demo, /role:'guest'/);
  assert.match(demo, /M09/);
  assert.match(demo, /G13/);
});