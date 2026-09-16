import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const migration = read('supabase/migrations/20260916070000_partner_v2_photo_tolerance.sql');
const polish = read('assets/partner-v2-polish.js');
const polishCss = read('assets/partner-v2-polish.css');
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

test('G02 and M05 are rendered as comparable forensic camera frames', () => {
  assert.match(polish, /forensicPhotoHtml/);
  assert.match(polish, /id === 'G02'/);
  assert.match(polish, /partner-v2-weld-patch/);
  assert.match(polish, /partner-v2-body-scratch/);
  assert.match(polish, /partner-v2-door-deformation/);
  assert.match(polish, /CAXU/);
  assert.match(polish, /771204/);
  assert.match(polishCss, /\.partner-v2-forensic-photo/);
  assert.match(polishCss, /\.partner-v2-weld-patch/);
  assert.match(polishCss, /\.partner-v2-body-scratch/);
  assert.match(polishCss, /\.partner-v2-door-deformation/);
});

test('editorial polish removes answer-like fact chips before final reconstruction', () => {
  assert.match(polish, /editorialFacts/);
  assert.match(polish, /Инициатор перемещения в бокс: I\. MARKOVA/);
  assert.match(polish, /После предъявления телеметрии Рыбаков изменил объяснение операции/);
  assert.doesNotMatch(polish, /Маркова заранее переместила ТК-0 в сервисный бокс/);
  assert.doesNotMatch(polish, /Рыбаков сознательно скрывает характер операции/);
});

test('solved case explicitly teaches that lying is not equivalent to guilt', () => {
  assert.match(polish, /Почему ложь не равнялась вине/);
  assert.match(polish, /Николай Савельев/);
  assert.match(polish, /Анна Волкова/);
  assert.match(polish, /Павел Нестеров/);
  assert.match(polish, /Денис Рыбаков/);
  assert.match(polish, /не связывают этот визит ни с ТК-0, ни с Вектором-12, ни с R-4/);
});

test('polish assets are required after core checkpoint and final scripts', () => {
  assert.match(page, /partner-v2-polish\.css/);
  assert.match(page, /partner-v2-engine\.js[\s\S]*partner-v2-checkpoints\.js[\s\S]*partner-v2-final\.js[\s\S]*partner-v2-polish\.js/);
});
