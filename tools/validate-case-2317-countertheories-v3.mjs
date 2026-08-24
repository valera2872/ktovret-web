#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const expect = (condition, message) => { if (!condition) throw new Error(`23:17 counter-theory validation failed: ${message}`); };
const ctx = { window: {} };
vm.runInNewContext(read('assets/case-2317-data.js'), ctx);
vm.runInNewContext(read('assets/case-2317-detective-v3.js'), ctx);
vm.runInNewContext(read('assets/case-2317-timeline-v31.js'), ctx);
const data = ctx.window.MLCase2317;
const all = JSON.stringify(data);
const ux = read('assets/case-2317-ux-v3.js');

const theories = {
  ilyaCarWithoutIlya: {
    claim: 'Машина Ильи была у дома, но самого Ильи там не было.',
    blockers: [
      ['Q7-29 лично показывает Илью', ux.includes('Илья Кравцов лично выходит из водительской двери')],
      ['физический маяк после обмена совпадает с CAR-V и запросом Ильи', ux.includes('Точный поиск по 4F-7719') && ux.includes('запрос координат в 23:05:48')]
    ]
  },
  veraDroveOwnCar: {
    claim: 'Вера сама переставила автомобиль и потом вернулась к Марине.',
    blockers: [
      ['Следователь лично видит Веру в кафе в 23:44:36', all.includes('В 23:44:36 Вера всё ещё остаётся в кадре кафе')],
      ['Аналитик одновременно видит автомобиль на SP-3', all.includes('23:44:36 — камера SP-3')]
    ]
  },
  romanCredentialTransfer: {
    claim: 'RB-17 использовал другой человек, а Роман оказался рядом позже.',
    blockers: [
      ['CAM-S2 лично показывает Романа у автомобиля до поездки', ux.includes('CAM-S2 · 23:30:52') && ux.includes('автомобиль Веры мигает габаритами и отпирается')],
      ['после поездки Роман лично виден на пешеходной камере', all.includes('23:55:04') && all.includes('Романа Белова')]
    ]
  },
  unrelatedKeyFob: {
    claim: 'Марина передала Роману посторонний брелок, не связанный с автомобилем Веры.',
    blockers: [
      ['CAM-S1 фиксирует отличительный оранжевый хлястик на переданном брелоке', ux.includes('чёрный ключ-брелок с оранжевым тканевым хлястиком')],
      ['CAM-S2 показывает тот же хлястик и отпирание автомобиля Веры', ux.includes('брелок с тем же оранжевым хлястиком') && ux.includes('автомобиль Веры мигает габаритами и отпирается')]
    ]
  },
  romanActedIndependently: {
    claim: 'Роман действительно переставил машину, но это не было частью плана Веры и Марины.',
    blockers: [
      ['черновик Веры заранее требует увести отслеживаемую машину отдельным ложным маршрутом', all.includes('серую надо увезти отдельно') && all.includes('Марина сказала, что с машиной разберутся')],
      ['CAM-S1 лично фиксирует передачу ключа Мариной Роману', ux.includes('CAM-S1 · 23:27:14') && ux.includes('Марина Соболева') && ux.includes('передаёт Роману Белову')]
    ]
  },
  marinaAbductedVera: {
    claim: 'Марина могла увезти Веру против её воли, а план Б был прикрытием.',
    blockers: [
      ['план с Мариной существовал заранее', all.includes('План существовал до звонка')],
      ['Вера лично видна вместе с Мариной в кафе', all.includes('23:43:51–23:45:12') && all.includes('идентифицирует Марину Соболеву и Веру Лебедеву')],
      ['Вера сама подтверждает безопасность в 00:18', all.includes('00:18:32') && all.includes('безопасном месте')]
    ]
  },
  laterHarmAfterPhoneOff: {
    claim: 'Вера была с Мариной в 23:44, но после выключения телефона с ней могло что-то произойти.',
    blockers: [
      ['00:16 дорожная камера лично показывает Веру', all.includes('00:16') && all.includes('Веру на пассажирском месте')],
      ['00:18 подтверждённый звонок Веры', all.includes('00:18:32') && all.includes('Голос совпадает с записью 23:17')]
    ]
  },
  randomServiceWorker: {
    claim: 'Машину Веры переставил случайный сотрудник технической службы.',
    blockers: [
      ['CAM-S1/S2 связывают конкретный ключ и Романа до начала поездки', ux.includes('CAM-S1 · 23:27:14') && ux.includes('CAM-S2 · 23:30:52') && ux.includes('автомобиль Веры мигает габаритами и отпирается')],
      ['Роман лично возвращается от места оставленной машины', all.includes('23:49:16') && all.includes('23:55:04')]
    ]
  }
};

for (const [id, theory] of Object.entries(theories)) {
  const failed = theory.blockers.filter(([, ok]) => !ok).map(([label]) => label);
  expect(failed.length === 0, `${id} remains viable; missing: ${failed.join('; ')}`);
}

console.log(JSON.stringify({
  logicVersion: data.logicVersion,
  proofRevision: data.proofRevision,
  theoriesRejected: Object.fromEntries(Object.entries(theories).map(([id, t]) => [id, { claim: t.claim, blockers: t.blockers.length }])),
  verdict: 'principal alternate explanations, including unrelated Roman action and unrelated key fob, are contradicted by independent evidence'
}, null, 2));