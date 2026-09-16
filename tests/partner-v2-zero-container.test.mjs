import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const migration = read('supabase/migrations/20260915010000_partner_v2_state.sql');
const edge = read('supabase/functions/coop-case-v2/index.ts');
const config = read('supabase/functions/_shared/partner-cases/zero-container.ts');
const engine = read('assets/partner-v2-engine.js');
const page = read('detektivnye-igry-dlya-dvoih/nulevoy-konteyner/index.html');

const iso6346CheckDigit = (ownerAndSerial) => {
  const letterValues = Object.fromEntries(
    [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((letter, index) => [letter, [10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38][index]])
  );
  const sum = [...ownerAndSerial].reduce((total, char, index) => {
    const value = /\d/.test(char) ? Number(char) : letterValues[char];
    return total + value * (2 ** index);
  }, 0);
  return (sum % 11) % 10;
};

test('Partner V2 uses isolated server state with no browser table grants', () => {
  assert.match(migration, /create table if not exists public\.partner_v2_room_state/);
  assert.match(migration, /create table if not exists public\.partner_v2_player_state/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.partner_v2_room_state from anon, authenticated/);
  assert.match(migration, /revoke all on table public\.partner_v2_player_state from anon, authenticated/);
});

test('two-player path constraint is generic and still accepts numeric legacy slugs', () => {
  assert.match(migration, /\^\/detektivnye-igry-dlya-dvoih\/\[a-z0-9-\]\+\/\$/);
  assert.doesNotMatch(migration, /case_path in\s*\(/);
});

test('P0 checkpoint is atomic and revision protected', () => {
  assert.match(migration, /partner_v2_submit_initial_hypothesis/);
  assert.match(migration, /for update/);
  assert.match(migration, /state_conflict/);
  assert.match(migration, /initialHypothesesComplete/);
});

test('generic Edge Function resolves the case server-side and filters evidence by role', () => {
  assert.match(edge, /const getCase = \(caseId: string\) => caseId === CASE_ID \? ZERO_CONTAINER_CASE : null/);
  assert.match(edge, /visibleEvidence/);
  assert.match(edge, /item\.role === role/);
  assert.match(edge, /Number\(item\.chapter\) <= chapter/);
  assert.match(edge, /partner_v2_submit_initial_hypothesis/);
});

test('Zero Container P0 has separate evidence packs for both roles', () => {
  for (const id of ['M01', 'M02', 'M03', 'G01', 'G02', 'G03', 'M04', 'G04']) {
    assert.match(config, new RegExp(`\\b${id}:`));
  }
  assert.match(config, /role: 'creator'/);
  assert.match(config, /role: 'guest'/);
  assert.match(config, /id: 'partner:zero-container'/);
});

test('CAXU 771204 2 remains a valid ISO 6346 container number', () => {
  const numbers = [...config.matchAll(/\b([A-Z]{4})\s(\d{6})\s(\d)\b/g)]
    .filter((match) => match[1] === 'CAXU');
  assert.ok(numbers.length > 0, 'case config must contain the CAXU container number');
  for (const match of numbers) {
    assert.equal(Number(match[3]), iso6346CheckDigit(`${match[1]}${match[2]}`), `invalid ISO 6346 check digit for ${match[0]}`);
  }
});

test('both players must be ready before either browser enters the evidence board', () => {
  assert.match(engine, /const bothStarted = Boolean\(next\.me\?\.started && next\.opponent\?\.started\)/);
  assert.match(engine, /if \(state\.me\?\.started && state\.opponent\?\.started\) renderGame\(state\)/);
  assert.match(engine, /roomState\.me\?\.started/);
  assert.match(engine, /Вы готовы · ждём напарника/);
  assert.match(engine, /Не показывайте друг другу экран/);
  assert.match(engine, /zero_ready/);
});

test('client contains no hardcoded detective solution or opposite role evidence ids', () => {
  assert.doesNotMatch(engine, /markova|rybakov|saveliev|volkova/i);
  assert.doesNotMatch(engine, /\bM0[1-9]\b|\bG0[1-9]\b/);
  assert.match(engine, /submit_checkpoint/);
  assert.match(engine, /clientRevision/);
});

test('case page is isolated and not indexed before release', () => {
  assert.match(page, /data-partner-case-id="partner:zero-container"/);
  assert.match(page, /functions\/v1\/coop-case-v2/);
  assert.match(page, /meta name="robots" content="noindex,follow"/);
});