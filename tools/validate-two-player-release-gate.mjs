#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const expect = (ok, message) => { if (!ok) throw new Error(message); };
const includesAll = (text, markers, label) => markers.forEach((marker) => expect(text.includes(marker), `${label}: missing ${marker}`));
const excludesAll = (text, markers, label) => markers.forEach((marker) => expect(!text.includes(marker), `${label}: forbidden ${marker}`));

const p2317 = read('tools/import-mobile/two-player-2317-postprocess.mjs');
const p407 = read('tools/import-mobile/two-player-407-postprocess.mjs');
const r2317 = read('assets/case-2317-release-gate-v1.js');
const r407 = read('assets/case-407-release-gate-v1.js');
const ux407 = read('assets/case-407-playtest-ux-v42.js');

excludesAll(p2317, [
  'телефон и автомобиль расходятся'
], '23:17 public boundary');
includesAll(p2317, [
  'цифровой след требует сверки',
  'case-2317-release-gate-v1.js',
  "23:17 public spoiler boundary regressed"
], '23:17 public boundary');
expect(p2317.indexOf('case-2317-release-gate-v1.js') > p2317.indexOf('case-2317-runtime.js'), '23:17 release layer must load last');

includesAll(r2317, [
  'Сверка хронологии',
  'Последние подтверждения',
  'Выберите 3 опорных материала',
  'Q7-29 · исходный кадр CAM-N2, 23:12:18',
  '4F-7719 · физический маяк и карточка резервной копии',
  'balancedFinalOptions: true'
], '23:17 release runtime');
excludesAll(r2317, [
  'Нужна одна независимая цепочка на каждый критический тезис: Илья',
  'Илья лично у дома и физический маяк совпадает с его «CAR-V»',
  'Вера лично с Мариной и подтверждает безопасность',
  'Разделите три маршрута: телефон Веры'
], '23:17 release runtime');

excludesAll(p407, [
  'Из какого номера на самом деле исчезла Марта',
  'охрана искала не за той дверью'
], '407 public boundary');
includesAll(p407, [
  'Почему камера, электронные журналы и осмотр комнаты не складываются',
  'case-407-release-gate-v1.js',
  '407 public spoiler boundary regressed'
], '407 public boundary');
expect(p407.indexOf('case-407-release-gate-v1.js') > p407.indexOf('case-407-detective-visual-v4.js'), '407 release layer must load last');

includesAll(r407, [
  'Первые двадцать минут',
  'След после тревоги',
  'Выберите 5 опорных материалов',
  'H-код таблички + реестр L-кодов · сверка оборудования',
  'NIGHT-MGR + ER-02 · команда режима камеры B1',
  'balancedFinalOptions: true'
], '407 release runtime');
excludesAll(r407, [
  'Набор должен закрывать пять разных звеньев: физический номер, намеренность Марты, маршрут, футляр и участие Елены',
  'CAM G1 + действия Елены',
  'общий план, но не личное действие Елены'
], '407 release runtime');

excludesAll(ux407, [
  'В наборе нет независимого доказательства личного действия Елены',
  'общий план, но не личное действие Елены'
], '407 playtest feedback');
includesAll(ux407, [
  'В наборе не хватает независимого материала, который подтверждает личное действие в критическое окно',
  "revision: '4.3'"
], '407 playtest feedback');

console.log(JSON.stringify({
  verdict: 'TWO_PLAYER_SPOILER_BOUNDARY_PASS',
  cases: ['23:17', '407'],
  publicTeasersNeutral: true,
  prefinalProofNeutral: true,
  finalOptionsBalanced: true,
  releaseLayersLast: true
}, null, 2));
