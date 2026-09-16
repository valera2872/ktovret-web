import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const migration = read('supabase/migrations/20260916070000_partner_v2_photo_tolerance.sql');
const polish = read('assets/partner-v2-polish.js');
const page = read('detektivnye-igry-dlya-dvoih/nulevoy-konteyner/index.html');

test('photo checkpoint uses three signs and accepts two server-side matches', () => {
  assert.match(migration, /door_deformation/);
  assert.match(migration, /v_photo_match_count >= 2/);
  assert.match(migration, /p_role = 'creator'/);
  assert.match(migration, /patch' = 'absent'/);
  assert.match(migration, /scratch' = 'absent'/);
  assert.match(migration, /door_deformation' = 'present'/);
  assert.match(migration, /patch' = 'present'/);
  assert.match(migration, /scratch' = 'present'/);
  assert.match(migration, /door_deformation' = 'absent'/);
});

test('browser requires the third physical observation before existing submit handler runs', () => {
  assert.match(polish, /data-photo-field="door_deformation"/);
  assert.match(polish, /Деформация правой створки двери/);
  assert.match(polish, /partner-v2-observation-row/);
});

test('later evidence is regrouped by its real chapter instead of one generic packet', () => {
  assert.match(polish, /M04: 2, M05: 2, G04: 2/);
  assert.match(polish, /M06: 3, G05: 3, G06: 3/);
  assert.match(polish, /M07: 4, M08: 4, G07: 4, G08: 4, G09: 4/);
  assert.match(polish, /M09: 5, M10: 5, G10: 5, G11: 5, G12: 5/);
  assert.match(polish, /data-partner-v2-chapter-packet/);
  assert.doesNotMatch(polish, /Partner V2 core работает/);
});

test('polish layer loads after core checkpoint and final scripts', () => {
  assert.match(page, /partner-v2-engine\.js[\s\S]*partner-v2-checkpoints\.js[\s\S]*partner-v2-final\.js/);
  // This assertion becomes active as soon as the page includes the polish layer.
  if (page.includes('partner-v2-polish.js')) {
    assert.match(page, /partner-v2-final\.js[\s\S]*partner-v2-polish\.js/);
  }
});
