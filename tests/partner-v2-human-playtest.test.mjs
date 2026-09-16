import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.resolve(here, '../scripts/partner-v2-human-playtest.mjs');
const source = fs.readFileSync(scriptPath, 'utf8');

test('local human playtest runner parses as an ES module', () => {
  const result = spawnSync(process.execPath, ['--check', scriptPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('playtest runner is loopback-only and rewrites the game endpoint locally', () => {
  assert.match(source, /const LOCAL_FUNCTION = 'http:\/\/127\.0\.0\.1:54321\/functions\/v1\/coop-case-v2'/);
  assert.match(source, /const HOST = '127\.0\.0\.1'/);
  assert.ok(source.includes('/data-partner-endpoint="[^"]+"/'));
  assert.ok(source.includes('`data-partner-endpoint="${LOCAL_FUNCTION}"`'));
  assert.doesNotMatch(source, /orknvuwknvsedjgqcfwc\.supabase\.co/);
  assert.doesNotMatch(source, /0\.0\.0\.0/);
});

test('playtest runner uses the same pinned free local Supabase stack as CI', () => {
  assert.match(source, /SUPABASE_CLI_VERSION = '2\.117\.0'/);
  assert.match(source, /supabase@\$\{SUPABASE_CLI_VERSION\}/);
  assert.match(source, /'start'/);
  assert.match(source, /functions', 'serve', 'coop-case-v2', '--no-verify-jwt'/);
  assert.match(source, /stop', '--no-backup'/);
});

test('playtest cleanup destroys local test data and contains no deploy/link command', () => {
  assert.match(source, /cleanup/);
  assert.match(source, /SIGINT/);
  assert.match(source, /SIGTERM/);
  assert.match(source, /--no-backup/);
  assert.doesNotMatch(source, /['"]deploy['"]|['"]push['"]|['"]link['"]|project-ref/i);
});

test('human instructions require a separate browser identity for player two', () => {
  assert.match(source, /режиме инкогнито или в другом браузере/);
  assert.match(source, /Первый игрок создаёт комнату и передаёт код второму/);
});
