import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const gateMigration = read('supabase/migrations/20260915013000_partner_v2_gate_checkpoint.sql');
const config = read('supabase/functions/_shared/partner-cases/zero-container.ts');
const edge = read('supabase/functions/coop-case-v2/index.ts');
const client = read('assets/partner-v2-checkpoints.js');
const page = read('detektivnye-igry-dlya-dvoih/nulevoy-konteyner/index.html');

test('generic gate checkpoint is revision protected and atomic', () => {
  assert.match(gateMigration, /partner_v2_submit_gate_checkpoint/);
  assert.match(gateMigration, /for update/);
  assert.match(gateMigration, /p_expected_revision/);
  assert.match(gateMigration, /state_conflict/);
  assert.match(gateMigration, /v_both_correct/);
});

test('server config defines photo and T-04391 cross-role rules', () => {
  assert.match(config, /photo_observation/);
  assert.match(config, /t04391_link/);
  assert.match(config, /photoComparisonSolved/);
  assert.match(config, /t04391Linked/);
  assert.match(config, /unlockChapter: 3/);
  assert.match(config, /unlockChapter: 4/);
});

test('chapter 4 evidence exists for both roles', () => {
  for (const id of ['M07', 'M08', 'G07', 'G08', 'G09']) {
    assert.match(config, new RegExp(`\\b${id}:`));
  }
  assert.match(config, /title: 'Операция'/);
  assert.match(config, /Endpoint 184 = рабочее место L-14/);
  assert.match(config, /около 8,4 т/);
});

test('correct gate answers remain in server config and are not hardcoded in browser plugin', () => {
  assert.match(config, /creator: \{ patch: 'absent', scratch: 'absent' \}/);
  assert.match(config, /guest: \{ patch: 'present', scratch: 'present' \}/);
  assert.match(config, /creator: 'rybakov_r4'/);
  assert.match(config, /guest: 'tk0'/);
  assert.doesNotMatch(client, /rybakov_r4|creator:\s*\{\s*patch|guest:\s*\{\s*patch/);
});

test('Edge Function validates gates server-side and exposes only safe checkpoint UI', () => {
  assert.match(edge, /matchesExpected/);
  assert.match(edge, /caseConfig\.checkpointRules/);
  assert.match(edge, /partner_v2_submit_gate_checkpoint/);
  assert.match(edge, /checkpointUi: publicCheckpointUi/);
  assert.doesNotMatch(edge, /checkpointRules:\s*caseConfig\.checkpointRules/);
});

test('case page loads checkpoint UI after the base engine', () => {
  assert.match(page, /partner-v2-checkpoints\.css/);
  assert.match(page, /partner-v2-engine\.js[\s\S]*partner-v2-checkpoints\.js/);
});
