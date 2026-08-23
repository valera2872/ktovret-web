#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const expect = (condition, message) => { if (!condition) throw new Error(`Room 407 counter-theory validation failed: ${message}`); };

const context = { window: {} };
vm.runInNewContext(read('assets/case-407-data.js'), context, { filename: 'case-407-data.js' });
vm.runInNewContext(read('assets/case-407-detective-audit-v4.js'), context, { filename: 'case-407-detective-audit-v4.js' });
vm.runInNewContext(read('assets/case-407-detective-proof-v4.js'), context, { filename: 'case-407-detective-proof-v4.js' });
const data = context.window.MLCase407;
const all = JSON.stringify(data);
const stage1 = JSON.stringify(data.stages[0]);
const stage2 = JSON.stringify(data.stages[1]);
const stage3 = JSON.stringify(data.stages[2]);
const reveal = data.reveal.body.join(' ');

const theories = {
  denisEarlyTheft: {
    claim: 'Денис мог забрать сапфир до отъезда в 00:36, а последующая постановка не связана с кражей.',
    blockers: [
      ['23:50 «Северная звезда» помещена в футляр BR-220', stage3.includes('23:50 «Северная звезда» помещена в футляр BR-220')],
      ['сейф закрыт в 23:51', stage3.includes('23:51 сейф с футляром закрыт')],
      ['до 01:12 не было открытия', stage3.includes('ни одного открытия до события 01:12')],
      ['NS-17 из футляра позже найдена в тележке', stage3.includes('фрагмент пломбы NS-17')]
    ]
  },
  martaActedAlone: {
    claim: 'Марта могла одна использовать переданные/украденные токен, телефон и автомобиль Елены.',
    blockers: [
      ['Елена берёт отвёртку до подмены табличек', stage2.includes('Елена попросила отвёртку')],
      ['Елена получает чай и физически готовит ложную комнату', stage2.includes('выдачу одной чашки чая Елене') && stage2.includes('00:51:50')],
      ['вечерний диалог содержит ответ Елены до событий', stage3.includes('22:49 · Елена') && stage3.includes('отправленных вечером до событий')],
      ['Елена лично идентифицирована за рулём', stage3.includes('за рулём находится Елена Раева')],
      ['Елена повторно идентифицирована городской камерой', stage3.includes('дорожная камера вновь фиксирует Елену за рулём')]
    ]
  },
  elenaCoercedMarta: {
    claim: 'Елена могла принудить Марту вызвать тревогу и пройти маршрут против её воли.',
    blockers: [
      ['Марта заранее спрашивает о доступности служебных дверей', stage2.includes('Марта спрашивала, остаются ли служебные двери доступными')],
      ['Марта сама инициирует предсобытийное окно 01:12', stage3.includes('22:48 · Марта') && stage3.includes('Если начинаем в 01:12')],
      ['Марта заранее пишет, что оставляет телефон', stage3.includes('Телефон оставляю')],
      ['за три дня куплены билеты на обеих', stage3.includes('два билета на рейс в Белград на 06:40')],
      ['общий аудит создаёт совместный риск', stage3.includes('обе подписи') || stage3.includes('обеим')]
    ]
  },
  zorinCorridorConspiracy: {
    claim: 'Зорин мог помочь вывести Марту обычным гостевым коридором и скрыть это.',
    blockers: [
      ['C4 непрерывно фиксирует отсутствие открытия двух гостевых дверей', stage1.includes('до 01:16 ни одна из двух дверей') && stage1.includes('Камера исправна')],
      ['архитектура даёт скрытый служебный выход только настоящему 407', stage2.includes('дверь в узкий хозяйственный тамбур')],
      ['часы переходят в STAFF-4 и LOADING-B1', stage2.includes('STAFF-4') && stage2.includes('LOADING-B1')],
      ['HK-44 подтверждает SVC → лифт → B1', stage3.includes('SVC-407') && stage3.includes('01:15:02') && stage3.includes('LOADING-B1')],
      ['разгадка не требует заговора охраны', reveal.includes('не требуют заговора охраны')]
    ]
  }
};

for (const [id, theory] of Object.entries(theories)) {
  const failedBlockers = theory.blockers.filter(([, present]) => !present).map(([label]) => label);
  expect(failedBlockers.length === 0, `${id} remains insufficiently defeated; missing blockers: ${failedBlockers.join('; ')}`);
}

// Also require that the canonical theory itself is not based on one class of evidence.
for (const marker of ['H-7C4','L-4A8','S-8D1','HK-44','NS-17','CAM G1','22:48 · Марта','31 800 евро']) {
  expect(all.includes(marker) || read('assets/case-407-detective-visual-v4.js').includes(marker), `canonical chain lacks independent marker ${marker}`);
}
expect(data.final.questions.find((q) => q.id === 'sequence')?.answer === 'collusion', 'canonical collusion answer changed');

console.log(JSON.stringify({
  logicVersion: data.logicVersion,
  proofRevision: data.proofRevision,
  playtestRevision: data.playtestRevision,
  theoriesRejected: Object.fromEntries(Object.entries(theories).map(([id, theory]) => [id, { claim: theory.claim, independentBlockers: theory.blockers.length }])),
  verdict: 'all four principal counter-theories are contradicted by multiple independent facts'
}, null, 2));
