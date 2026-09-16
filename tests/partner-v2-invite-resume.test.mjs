import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine = fs.readFileSync(new URL('../assets/partner-v2-engine.js', import.meta.url), 'utf8');

test('fresh invitation previews before any authenticated status probe', () => {
  const previewRoom = engine.match(/const previewRoom = async \(code\) => \{([\s\S]*?)\n  \};\n\n  const joinRoom/);
  assert.ok(previewRoom, 'previewRoom implementation must exist');
  const body = previewRoom[1];
  assert.match(body, /if \(wasJoined\(code\)\)[\s\S]*action: 'status'/);
  assert.match(body, /action: 'preview'/);
  assert.ok(body.indexOf("action: 'preview'") > body.indexOf('if (wasJoined(code))'), 'preview remains the default path after the guarded resume branch');
});

test('successful create and join remember browser membership for clean resume', () => {
  assert.match(engine, /const membershipKey = \(code\) =>/);
  assert.match(engine, /const wasJoined = \(code\) =>/);
  assert.match(engine, /const markJoined = \(code\) =>/);
  assert.match(engine, /const forgetJoined = \(code\) =>/);
  assert.match(engine, /action: 'create'[\s\S]*markJoined\(state\.room\.code\)/);
  assert.match(engine, /action: 'join'[\s\S]*markJoined\(code\)/);
});

test('stale local membership marker is self-healing', () => {
  assert.match(engine, /error\.message === 'not_joined'\) forgetJoined\(code\)/);
});
