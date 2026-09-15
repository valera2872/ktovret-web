import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const migration = read('supabase/migrations/20260915020000_partner_v2_final_consensus.sql');
const config = read('supabase/functions/_shared/partner-cases/zero-container-final.ts');
const edge = read('supabase/functions/coop-case-v2/index.ts');
const client = read('assets/partner-v2-final.js');
const page = read('detektivnye-igry-dlya-dvoih/nulevoy-konteyner/index.html');

test('final drafts are persisted atomically and consensus compares semantic answers', () => {
  assert.match(migration, /partner_v2_submit_final_draft/);
  assert.match(migration, /for update/);
  assert.match(migration, /p_expected_revision/);
  assert.match(migration, /v_consensus/);
  assert.match(migration, /otherDraft/);
});

test('correct final reconstruction exists only in server config', () => {
  assert.match(config, /finalTruth/);
  assert.match(config, /replacement: 'tk0'/);
  assert.match(config, /method: 'whole_container_swap'/);
  assert.match(config, /executor: 'rybakov'/);
  assert.match(config, /organizer: 'markova'/);
  assert.doesNotMatch(client, /whole_container_swap|organizer:\s*'markova'|executor:\s*'rybakov'/);
});

test('final proof requires independent evidence categories', () => {
  assert.match(config, /requiredEvidenceCategories: \['identity', 'physical_execution', 'preparation', 'coordination'\]/);
  assert.match(edge, /missingEvidenceCategory/);
  assert.match(edge, /evidence_gap/);
  assert.match(edge, /minEvidencePerPlayer/);
});

test('server does not reveal the correct answer on failed final', () => {
  assert.match(edge, /BODY_IDENTITY_UNEXPLAINED/);
  assert.match(edge, /ORGANIZER_LACKS_PREPARATION_ACCESS/);
  assert.match(edge, /status: 'contradiction'/);
  assert.doesNotMatch(edge, /correctAnswer/);
});

test('resolution stays server-side until the room is solved', () => {
  assert.match(edge, /sharedState\.finalSolved \? ZERO_CONTAINER_FINAL\.reveal : null/);
  assert.match(migration, /partner_v2_mark_solved/);
  assert.doesNotMatch(client, /GPS контролировал локомотив|Маркова изучает параметры CAXU/);
});

test('case page wires the final reconstruction after the checkpoint layer', () => {
  assert.match(page, /partner-v2-final\.css/);
  assert.match(page, /partner-v2-checkpoints\.js[\s\S]*partner-v2-final\.js/);
});
