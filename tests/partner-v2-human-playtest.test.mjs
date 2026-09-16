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

test('default playtest keeps Supabase on loopback and rewrites browser API to same-origin proxy', () => {
  assert.match(source, /const LOCAL_FUNCTION = 'http:\/\/127\.0\.0\.1:54321\/functions\/v1\/coop-case-v2'/);
  assert.match(source, /const API_PATH = '\/__partner-v2-api'/);
  assert.ok(source.includes('/data-partner-endpoint="[^"]+"/'));
  assert.ok(source.includes('`data-partner-endpoint="${API_PATH}"`'));
  assert.match(source, /const HOST = LAN_MODE \? '0\.0\.0\.0' : '127\.0\.0\.1'/);
  assert.doesNotMatch(source, /orknvuwknvsedjgqcfwc\.supabase\.co/);
});

test('LAN mode is explicit and proxies phone requests back to loopback Supabase', () => {
  assert.match(source, /args\.has\('--lan'\)/);
  assert.match(source, /networkInterfaces/);
  assert.match(source, /192\\\.168|10\\\.|172/);
  assert.match(source, /url\.pathname === API_PATH/);
  assert.match(source, /await fetch\(LOCAL_FUNCTION/);
  assert.match(source, /Общий адрес для компьютера и второго устройства/);
  assert.match(source, /В режиме --lan страница доступна устройствам вашей локальной сети/);
});

test('LAN address selection prefers real adapters and supports an explicit private-IP override', () => {
  assert.match(source, /PARTNER_V2_LAN_IP/);
  assert.match(source, /privateIpScore/);
  assert.match(source, /192\\\.168/);
  assert.match(source, /docker\|wsl\|vethernet\|virtual\|vmware\|hyper-v\|tailscale\|zerotier\|vbox/);
  assert.match(source, /score -= 80/);
  assert.match(source, /candidates\.sort/);
});

test('LAN mode opens the shared LAN origin so copied invitation links work on the second device', () => {
  assert.match(source, /const primaryUrl = LAN_MODE \? lanUrl : localUrl/);
  assert.match(source, /openBrowser\(primaryUrl\)/);
  assert.match(source, /Скопировать приглашение/);
  assert.match(source, /работающую на телефоне/);
});

test('LAN static server exposes only the case page and assets, not the repository', () => {
  assert.match(source, /const isCase = decoded === CASE_PATH/);
  assert.match(source, /const isAsset = decoded\.startsWith\('\/assets\/'\)/);
  assert.match(source, /if \(!isCase && !isAsset\) return null/);
  assert.match(source, /response\.writeHead\(404\)\.end\('Not found'\)/);
});

test('playtest runner uses the same pinned free local Supabase stack as CI', () => {
  assert.match(source, /SUPABASE_CLI_VERSION = '2\.117\.0'/);
  assert.match(source, /supabase@\$\{SUPABASE_CLI_VERSION\}/);
  assert.match(source, /'start'/);
  assert.match(source, /functions', 'serve', 'coop-case-v2', '--no-verify-jwt'/);
  assert.match(source, /stop', '--no-backup'/);
});

test('playtest cleanup is safe before the web server exists and destroys local data', () => {
  assert.match(source, /const cleanup = async/);
  assert.match(source, /if \(webServer\)/);
  assert.match(source, /webServer\.close/);
  assert.match(source, /SIGINT/);
  assert.match(source, /SIGTERM/);
  assert.match(source, /--no-backup/);
  assert.doesNotMatch(source, /['"]deploy['"]|['"]push['"]|['"]link['"]|project-ref/i);
});

test('human instructions preserve separate player identities', () => {
  assert.match(source, /режиме инкогнито или в другом браузере/);
  assert.match(source, /Первый игрок создаёт комнату и передаёт код или ссылку второму/);
});
