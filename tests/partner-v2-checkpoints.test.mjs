import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const gateMigration = read('supabase/migrations/20260915013000_partner_v2_gate_checkpoint.sql');
const config = read('supabase/functions/_shared/partner-cases/zero-container.ts');
const finalConfig = read('supabase/functions/_shared/partner-cases/zero-container-final.ts');
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

test('server config defines the cross-role checkpoint chain', () => {
  assert.match(config, /photo_observation/);
  assert.match(config, /t04391_link/);
  assert.match(config, /photoComparisonSolved/);
  assert.match(config, /t04391Linked/);
  assert.match(finalConfig, /physical_operation/);
  assert.match(finalConfig, /endpoint_link/);
  assert.match(finalConfig, /physicalSwapProven/);
  assert.match(finalConfig, /endpoint184Linked/);
  assert.match(finalConfig, /requiresShared: \['physicalSwapProven'\]/);
});

test('later evidence exists for both roles', () => {
  for (const id of ['M07', 'M08', 'G07', 'G08', 'G09']) assert.match(config, new RegExp(`\\b${id}:`));
  for (const id of ['M09', 'M10', 'G10', 'G11', 'G12']) assert.match(finalConfig, new RegExp(`\\b${id}:`));
  assert.match(finalConfig, /title: 'Кто создал схему'/);
  assert.match(finalConfig, /Маркова заранее переместила ТК-0/);
});

test('correct gate answers remain server-side', () => {
  assert.match(config, /creator: \{ patch: 'absent', scratch: 'absent' \}/);
  assert.match(config, /guest: \{ patch: 'present', scratch: 'present' \}/);
  assert.match(config, /creator: 'rybakov_r4'/);
  assert.match(config, /guest: 'tk0'/);
  assert.match(finalConfig, /creator: 'two_loaded_objects'/);
  assert.match(finalConfig, /guest: 'mass_compensated'/);
  assert.match(finalConfig, /creator: 'endpoint184_call'/);
  assert.match(finalConfig, /guest: 'l14_markova'/);
  assert.doesNotMatch(client, /rybakov_r4|two_loaded_objects|mass_compensated|endpoint184_call|l14_markova/);
});

test('Edge Function validates gates server-side and respects prerequisites', () => {
  assert.match(edge, /allCheckpointRules/);
  assert.match(edge, /matchesExpected/);
  assert.match(edge, /requiresShared/);
  assert.match(edge, /partner_v2_submit_gate_checkpoint/);
  assert.doesNotMatch(edge, /checkpointRules:\s*ZERO_CONTAINER/);
});

test('case page loads checkpoint UI after the base engine', () => {
  assert.match(page, /partner-v2-checkpoints\.css/);
  assert.match(page, /partner-v2-engine\.js[\s\S]*partner-v2-checkpoints\.js/);
});
