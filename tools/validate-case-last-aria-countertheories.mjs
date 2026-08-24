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
const data=context.window.MLCaseAria;
const s1=JSON.stringify(data.stages[0]),s2=JSON.stringify(data.stages[1]),s3=JSON.stringify(data.stages[2]),reveal=data.reveal.body.join(' ');

const theories={
  managerStoleScore:{
    claim:'Сценический менеджер Илья сам продлил blackout и использовал темноту для кражи.',
    blockers:[
      ['SAFE-L/R требуют непрерывного физического удержания',s1.includes('непрерывное удержание обеих клавиш')&&s3.includes('SAFE-L')&&s3.includes('SAFE-R')],
      ['архив открыт внутри того же окна',s1.includes('21:49:31.604')],
      ['доказанный маршрут в архив связан не с Ильёй, а с HEEL-43C',s2.includes('HEEL-43C')&&s2.includes('Михаил')]
    ]
  },
  archivistDidIt:{
    claim:'Архивист Дарья использовала законный доступ и вынесла партитуру.',
    blockers:[
      ['Дарья непрерывно у стойки фойе',s3.includes('21:48:40')&&s3.includes('21:50:20')&&s3.includes('стационарной линией')],
      ['дверь открыта механическим K-12, а временный дубликат оформлен Михаилом',s1.includes('K-12')&&s2.includes('Михаил Карев')],
      ['личный физический след в архиве совпадает с обувью Михаила',s2.includes('HEEL-43C')&&s2.includes('размер 43')]
    ]
  },
  antonSelfStaged:{
    claim:'Антон инсценировал ранение, чтобы самому уйти в архив.',
    blockers:[
      ['рана объективно реальна',s1.includes('Рана Антона поверхностная')&&s2.includes('реальное повреждение')],
      ['несколько людей непрерывно удерживают и лечат Антона',s2.includes('одновременно удерживают двое артистов')&&s2.includes('21:49:46')],
      ['со сцены архив физически недостижим в окно открытия',s1.includes('не менее 58 секунд')&&s1.includes('21:49:31.604')]
    ]
  },
  lightingOperatorForgedLogs:{
    claim:'Осветитель Максим подделал cue-логи и сам сходил в архив.',
    blockers:[
      ['Максим вводит пять независимых ручных команд на LX-4',s3.includes('пять независимых команд на LX-4')],
      ['его обувь 44, след в архиве 43',s3.includes('обувь 44 размера')&&s2.includes('правый след обуви 43 размера')],
      ['голосовое алиби Михаила разоблачено независимым аудиоканалом',s2.includes('MIC-C')&&s2.includes('TAKE-6')]
    ]
  },
  mikhailVoiceWasLive:{
    claim:'Михаил действительно оставался у дирижёрского подиума: его голос в интеркоме — живое алиби.',
    blockers:[
      ['бумажная схема определяет PB как Playback Bus',s2.includes('PB-1 и PB-2 — две линии воспроизведения')],
      ['цифровой экспорт показывает, что MIC-C молчит',s2.includes('MIC-C в это окно не имеет входного сигнала')],
      ['три фразы совпадают с предсобытийной TAKE-6',s2.includes('TAKE-6')&&s2.includes('сделанной накануне')],
      ['физический след ведёт от архива к обуви Михаила',s2.includes('HEEL-43C')&&s2.includes('концертные туфли дирижёра Михаила')]
    ]
  }
};
for(const [id,theory] of Object.entries(theories)){
  const missing=theory.blockers.filter(([,present])=>!present).map(([label])=>label);
  expect(!missing.length,`${id} survives; missing: ${missing.join('; ')}`);
  expect(theory.blockers.length>=3,`${id} has too few independent blockers`);
}

// Canonical chain must be multi-class, not one magic clue.
for(const marker of ['BR-06','PB-2','TAKE-6','HEEL-43C','K-12','MS-1908','T-6M','42 000 EUR']) expect((s1+s2+s3).includes(marker),`canonical chain lacks ${marker}`);
expect(reveal.includes('совокупности физических и технических доказательств'),'debrief does not state multi-evidence standard');

console.log(JSON.stringify({
  theoriesRejected:Object.fromEntries(Object.entries(theories).map(([id,t])=>[id,{claim:t.claim,independentBlockers:t.blockers.length}])),
  verdict:'five principal alternatives are contradicted by independent pre-final facts'
},null,2));
