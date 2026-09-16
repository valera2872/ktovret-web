import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const hints = read('assets/partner-v2-hints.js');
const page = read('detektivnye-igry-dlya-dvoih/nulevoy-konteyner/index.html');

test('progressive photo hint script parses as browser JavaScript', () => {
  assert.doesNotThrow(() => new Function(hints));
});

test('photo hints escalate only after complete three-sign submissions', () => {
  assert.match(hints, /data-partner-v2-action="photo-submit"/);
  assert.match(hints, /fields\.length < 3/);
  assert.match(hints, /fields\.some\(\(field\) => !field\.value\)/);
  assert.match(hints, /setAttempts\(attempts\(\) \+ 1\)/);
});

test('second and third failed attempts use the approved non-answering hints', () => {
  assert.match(hints, /count >= 2/);
  assert.match(hints, /Вы пока не доказали, что перед вами разные физические объекты/);
  assert.match(hints, /Номер контейнера в этой проверке бесполезен/);
  assert.match(hints, /count >= 3/);
  assert.match(hints, /Сравните нижнюю правую часть корпуса и область под номером/);
  assert.doesNotMatch(hints, /Неверно/);
});

test('photo attempt state is room-scoped and cleared after the checkpoint', () => {
  assert.match(hints, /mysterylogic:partner-v2:\$\{roomCode\(\)\}:photo-attempts/);
  assert.match(hints, /chapter\(\) >= 3/);
  assert.match(hints, /sessionStorage\.removeItem\(storageKey\(\)\)/);
});

test('chapter five board keeps WHY open until the final reconstruction', () => {
  assert.match(hints, /clarifyFinalBoard/);
  assert.match(hints, /Кто был исполнителем, кто организатором и зачем понадобился настоящий груз/);
});

test('hints load after checkpoint and polish layers', () => {
  assert.match(page, /partner-v2-checkpoints\.js[\s\S]*partner-v2-polish\.js[\s\S]*partner-v2-hints\.js/);
});