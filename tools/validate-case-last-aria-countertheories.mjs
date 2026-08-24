#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'..');
const read=(file)=>fs.readFileSync(path.join(repo,file),'utf8');
const expect=(condition,message)=>{if(!condition)throw new Error(`Last Aria counter-theory failed: ${message}`);};
const context={window:{}};
vm.runInNewContext(read('assets/case-aria-data.js'),context);
vm.runInNewContext(read('assets/case-aria-fairplay-v2.js'),context);
vm.runInNewContext(read('assets/case-aria-investigator-v16.js'),context);
const data=context.window.MLCaseAria;
const s1=JSON.stringify(data.stages[0]),s2=JSON.stringify(data.stages[1]),s3=JSON.stringify(data.stages[2]),reveal=data.reveal.body.join(' ');

const theories={
  managerStoleScore:{
    claim:'Сценический менеджер Илья сам продлил blackout и использовал темноту для кражи.',
    blockers:[
      ['SAFE-L/R требуют непрерывного физического удержания',s1.includes('непрерывное одновременное давление SAFE-L/R')&&s3.includes('одновременного давления двух рук')],
      ['архив открыт внутри того же окна, когда Илья зафиксирован на SAFE',s1.includes('21:49:31.604')],
      ['индивидуальный след архива и K-12 ведут к Михаилу, а не к Илье',s2.includes('HEEL-43C')&&s2.includes('Михаила Карева')&&s2.includes('K-12')]
    ]
  },
  archivistDidIt:{
    claim:'Архивист Дарья использовала законный доступ и вынесла партитуру.',
    blockers:[
      ['Дарья непрерывно у стойки фойе',s3.includes('21:48:40')&&s3.includes('21:50:20')&&s3.includes('стационарной линией')],
      ['дверь открыта K-12, дубликат заказан Михаилом и безымянный архивный дубликат изъят при нём',s1.includes('K-12')&&s2.includes('Михаил Карев')&&s3.includes('безымянный латунный дубликат')],
      ['след в архиве индивидуально совпадает с изъятой обувью Михаила',s2.includes('треугольный скол')&&s2.includes('поперечный надрез')&&s2.includes('свежая матовая чёрная краска')]
    ]
  },
  antonSelfStaged:{
    claim:'Антон инсценировал ранение, чтобы самому уйти в архив.',
    blockers:[
      ['рана объективно реальна и физически согласуется с PR-17',s1.includes('Рана Антона поверхностная')&&s2.includes('реальное повреждение')&&s2.includes('примерно 9 мм')],
      ['несколько людей непрерывно удерживают и лечат Антона',s2.includes('одновременно удерживают двое артистов')&&s2.includes('21:49:46')],
      ['со сцены архив физически недостижим в окно открытия',s1.includes('не менее 58 секунд')&&s1.includes('21:49:31.604')]
    ]
  },
  lightingOperatorForgedLogs:{
    claim:'Осветитель Максим подделал cue-логи и сам сходил в архив.',
    blockers:[
      ['Максим вводит пять независимых ручных команд на LX-4',s3.includes('пять независимых команд на LX-4')],
      ['его обувь 44, а индивидуальный след и изъятая пара Михаила — 43',s3.includes('обувь 44 размера')&&s2.includes('правый след обуви 43 размера')&&s2.includes('изъятой пары')],
      ['K-12 и изолированный RFI-1/T-6M дают независимые физические цепочки к Михаилу',s2.includes('K-12')&&s3.includes('безымянный латунный дубликат')&&s3.includes('RFI-1')&&s3.includes('MS-1908')]
    ]
  },
  mikhailVoiceWasLive:{
    claim:'Михаил действительно оставался у дирижёрского подиума: его голос в интеркоме — живое алиби.',
    blockers:[
      ['бумажная схема определяет PB как Playback Bus',s2.includes('PB-1 и PB-2 — две линии воспроизведения')],
      ['цифровой экспорт показывает, что MIC-C молчит',s2.includes('MIC-C в это окно не имеет входного сигнала')],
      ['три фразы совпадают с предсобытийной TAKE-6',s2.includes('TAKE-6')&&s2.includes('сделанной накануне')],
      ['индивидуальный след с краской связывает маршрут архива с обувью Михаила',s2.includes('HEEL-43C')&&s2.includes('два индивидуальных дефекта')&&s2.includes('свежая матовая чёрная краска')&&s2.includes('21:49:09')&&s2.includes('21:50:05.6')]
    ]
  },
  unknownSaboteurMikhailOpportunist:{
    claim:'Кинжал испортил неизвестный человек, а Михаил лишь случайно воспользовался неожиданно длинным blackout для отдельной кражи.',
    blockers:[
      ['камера фиксирует Михаила с разобранным PR-17 у ячейки BR-06',s3.includes('18:40:12')&&s3.includes('рукоять PR-17 разобрана')&&s3.includes('ячейку BR-06')],
      ['после Михаила PR-17 опломбирован P-771 и до сцены открытого доступа больше нет',s3.includes('пломбу P-771')&&s3.includes('21:44')&&s3.includes('целостность пломбы')],
      ['BR-06 исчезает сразу после его доступа и находится внутри PR-17',s3.includes('18:47')&&s3.includes('BR-06')&&s1.includes('BR-06')],
      ['Михаил заранее знал 39–43-секундную SAFE-процедуру, а K-12 и TAKE-6 подготовлены до травмы',s1.includes('39–43 секунды')&&s1.includes('Михаил Карев')&&s2.includes('K-12')&&s3.includes('21:48:54')]
    ]
  },
  playbackQueuedByAccomplice:{
    claim:'TAKE-6 поставил в очередь другой человек; Михаил не создавал аудиоалиби.',
    blockers:[
      ['технический журнал связывает постановку TAKE-6 с C-2 и LOCAL-ARM ровно в 21:48:54',s3.includes('21:48:54')&&s3.includes('C-2')&&s3.includes('LOCAL-ARM')],
      ['C-2 закреплена на дирижёрском подиуме, без remote и scheduler',s3.includes('стационарная cue-панель')&&s3.includes('нет сетевого удалённого входа')&&s3.includes('встроенного планировщика')],
      ['камера в 21:48:53–21:48:55 показывает у панели только Михаила и его руку',s3.includes('21:48:53')&&s3.includes('21:48:55')&&s3.includes('только Михаила')]
    ]
  },
  mikhailWasFramedWithTransferredArtifacts:{
    claim:'Михаила подставили: другой человек использовал его обувь и K-12, а затем подложил оригинал в T-6M.',
    blockers:[
      ['та же индивидуализированная пара находится на Михаиле непосредственно до и сразу после blackout и изъята у него с краской из ямы',s2.includes('21:49:09')&&s2.includes('21:50:05.6')&&s2.includes('треугольный скол')&&s2.includes('свежая матовая чёрная краска')],
      ['K-12 заказан Михаилом, а безымянный архивный дубликат физически изъят при нём',s2.includes('Заявку подписал Михаил Карев')&&s3.includes('безымянный латунный дубликат архивного ключа')],
      ['после blackout Михаил сам приносит новую кремовую папку и кладёт её в T-6M; размеры физически совместимы, далее кофр никто не открывает',s3.includes('21:50:07')&&s3.includes('31 × 24 × 0,8 см')&&s3.includes('38 × 29 × 6,4 см')&&s3.includes('21:51:24')&&s3.includes('никто другой его не открывает')],
      ['RFI-1 изолирует T-6M от любых соседних тегов и MS-1908 отвечает только с кофром внутри',s3.includes('экранированный RFID-инспекционный шкаф RFI-1')&&s3.includes('единственным кофром внутри')&&s3.includes('контрольный пустой скан снова даёт ноль')]
    ]
  }
};
for(const [id,theory] of Object.entries(theories)){
  const missing=theory.blockers.filter(([,present])=>!present).map(([label])=>label);
  expect(!missing.length,`${id} survives; missing: ${missing.join('; ')}`);
  expect(theory.blockers.length>=3,`${id} has too few independent blockers`);
}

for(const marker of ['BR-06','P-771','PB-2','TAKE-6','C-2','HEEL-43C','K-12','MS-1908','T-6M','RFI-1','42 000 EUR']) expect((s1+s2+s3).includes(marker),`canonical chain lacks ${marker}`);
expect(s1.includes('дверного контакта уже открытой двери')&&s1.includes('5,2–6,1 секунды'),'route/retrieval reconstruction lacks physical closure');
expect(reveal.includes('совокупности физической, временной и технической цепочек'),'debrief does not state multi-evidence standard');
expect(data.final.requiredGroups.length===6&&data.final.requiredGroups.includes('culprit-sabotage'),'final gate does not require personal sabotage link');

console.log(JSON.stringify({
  theoriesRejected:Object.fromEntries(Object.entries(theories).map(([id,t])=>[id,{claim:t.claim,independentBlockers:t.blockers.length}])),
  doorToDoorTiming:true,
  measuredArchiveRetrieval:true,
  physicalFolderFit:true,
  isolatedRfidContainment:true,
  routeSlackProtected:true,
  verdict:'eight principal alternatives are contradicted by independent pre-final investigator v1.6 facts'
},null,2));