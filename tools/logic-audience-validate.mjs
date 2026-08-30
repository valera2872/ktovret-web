#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {logicAudiencePuzzles as puzzles,logicAudienceCollections as collections} from './import-mobile/logic-audience-data.mjs';
import {applyLogicAudienceExpansion} from './import-mobile/logic-audience-postprocess.mjs';

const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const byId=id=>puzzles.find(p=>p.id===id);

assert(puzzles.length===33,`expected 33 quick puzzles, got ${puzzles.length}`);
assert(new Set(puzzles.map(p=>p.id)).size===33,'duplicate quick id');
assert(new Set(puzzles.map(p=>p.slug)).size===33,'duplicate quick slug');
assert(new Set(puzzles.map(p=>p.title)).size===33,'duplicate quick title');
for(const p of puzzles){
  assert(/^quick:\d{3}$/.test(p.id),`bad id ${p.id}`);
  assert(/^Q\d{2}$/.test(p.number),`bad number ${p.number}`);
  assert(/^[a-z0-9-]+$/.test(p.slug),`bad slug ${p.slug}`);
  assert(p.choices.length>=3,`too few choices ${p.id}`);
  assert(p.choices.includes(p.answer),`answer missing from choices ${p.id}`);
  assert(p.prompt.length>=70,`prompt too thin ${p.id}`);
  assert(p.explanation.length>=60,`explanation too thin ${p.id}`);
}

const count=c=>puzzles.filter(p=>p.collections.includes(c)).length;
assert(count('kids')===22,'kids corpus mismatch');
assert(count('brain')===29,'brain corpus mismatch');
assert(count('detective')===8,'detective corpus mismatch');
assert(count('math')===14,'math corpus mismatch');
assert(count('matches')===8,'matchstick source corpus mismatch');
for(const age of ['5–6 лет','7–8 лет','9–10 лет','10–12 лет']){
  assert(puzzles.filter(p=>p.collections.includes('kids')&&p.age===age).length>=3,`thin kids age ${age}`);
}

assert(collections.kids.slug==='golovolomki-dlya-detei','kids route mismatch');
assert(collections.brain.slug==='igry-dlya-mozga','brain route mismatch');
assert(collections.detective.slug==='detektivnye-golovolomki','detective route mismatch');
assert(collections.math.slug==='matematicheskie-golovolomki','math route mismatch');
assert(collections.matches.slug==='golovolomki-so-spichkami','matchstick reserve route mismatch');
for(const cfg of Object.values(collections)){
  assert(cfg.title.length>=38&&cfg.title.length<=82,`title length ${cfg.slug}: ${cfg.title.length}`);
  assert(cfg.description.length>=90&&cfg.description.length<=190,`description length ${cfg.slug}: ${cfg.description.length}`);
}
assert(/не медицинский тренажёр/.test(collections.brain.note)&&/не обещаем/.test(collections.brain.note),'brain disclaimer missing');
assert(!/спичк/i.test(collections.kids.lead),'kids public copy still promises matchsticks');
assert(!/спичк/i.test(collections.math.description),'math public copy still promises matchsticks');

// Fair-play boundary: an access-card identifier must never be silently promoted to a person's identity.
const q09=byId('quick:009');
assert(q09.prompt.includes('видеозаписи')&&q09.explanation.includes('входит именно Вера'),'Q09 identity evidence missing');
const q12=byId('quick:012');
assert(q12.prompt.includes('Кому по журналу была выдана карта №31')&&q12.explanation.includes('не то, кто физически воспользовался'),'Q12 card assignment boundary missing');
const q18=byId('quick:018');
assert(q18.prompt.includes('Все выходы из здания проходят через турникет')&&q18.prompt.includes('впервые фиксирует выход Марины'),'Q18 exit-log uniqueness missing');
const q32=byId('quick:032');
assert(q32.prompt.includes('Кому по журналу был выдан ключ G5')&&q32.explanation.includes('не личность человека'),'Q32 key assignment boundary missing');
const q33=byId('quick:033');
assert(q33.answer==='В 19:07 использовали карту, выданную Роману'&&q33.explanation.includes('Кто физически держал карту'),'Q33 evidence boundary regressed');

const seg={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
const back=new Map(Object.entries(seg).map(([d,s])=>[[...s].sort().join(''),Number(d)]));
function matchSolutions(eq){
  const m=eq.match(/^(\d)\+(\d)=(\d)$/);
  assert(m,`bad match equation ${eq}`);
  const nums=m.slice(1).map(Number),out=new Set();
  for(let i=0;i<3;i++){
    const src=new Set(seg[nums[i]]);
    for(const removed of src){
      const left=new Set(src);left.delete(removed);
      const dl=back.get([...left].sort().join(''));
      if(dl===undefined)continue;
      for(let j=0;j<3;j++){
        if(i===j)continue;
        const target=new Set(seg[nums[j]]);
        for(const added of 'abcdefg'){
          if(target.has(added))continue;
          const right=new Set(target);right.add(added);
          const dr=back.get([...right].sort().join(''));
          if(dr===undefined)continue;
          const a=[...nums];a[i]=dl;a[j]=dr;
          if(a[0]+a[1]===a[2])out.add(`${a[0]} + ${a[1]} = ${a[2]}`);
        }
      }
    }
  }
  return [...out];
}
for(const p of puzzles.filter(p=>p.match)){
  const sols=matchSolutions(p.match);
  assert(sols.length===1,`${p.id} match solutions=${JSON.stringify(sols)}`);
  assert(sols[0]===p.answer,`${p.id} match answer mismatch ${sols[0]} != ${p.answer}`);
}

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-logic-audience-'));
try{
  fs.mkdirSync(path.join(tmp,'golovolomki-onlayn'),{recursive:true});
  fs.mkdirSync(path.join(tmp,'zagadki-na-logiku-dlya-vzroslyh'),{recursive:true});
  fs.writeFileSync(path.join(tmp,'golovolomki-onlayn/index.html'),'<!doctype html><html><head><title>Головоломки онлайн для взрослых — бесплатно | Mystery Logic</title><meta name="description" content="20 сложных логических головоломок онлайн бесплатно и без регистрации: коды, графы, нонограммы, криптарифмы, матрицы и задачи уровня Expert с ответами."></head><body><main><h1>Сложные головоломки онлайн для взрослых</h1><p>Бесплатная коллекция сложных головоломок без регистрации. Не школьные упражнения и не загадки с подвохом: здесь коды, графы, логические сетки, криптарифмы, маршруты и другие задачи с единственным проверяемым решением.</p><section class="logic-section" id="puzzles"></section></main></body></html>');
  fs.writeFileSync(path.join(tmp,'zagadki-na-logiku-dlya-vzroslyh/index.html'),'<!doctype html><html><head><title>Загадки на логику для взрослых с ответами | Mystery Logic</title></head><body><main><h1>Загадки на логику для взрослых с ответами</h1><section class="logic-section" id="puzzles"></section></main></body></html>');
  fs.writeFileSync(path.join(tmp,'index.html'),'<!doctype html><html><body><main><section class="ref-logic-launch" data-logic-home-launch><p>old</p></section></main></body></html>');
  const result=applyLogicAudienceExpansion(tmp);
  assert(result.puzzles===33,'source QA should render all 33 task pages');
  assert(result.routes.length===4,'only four public collection routes should be indexable');
  assert(result.taskRoutes.length===33,'task route count mismatch');
  assert(result.generatedRoutes.length===37,'generated route count mismatch');
  assert(result.collections===4,'public collection count mismatch');
  assert(result.mainPatched&&result.adultPatched&&result.homePatched,'hub patch failed');
  const main=fs.readFileSync(path.join(tmp,'golovolomki-onlayn/index.html'),'utf8');
  assert(main.includes('Логические игры и головоломки онлайн')&&main.includes('data-logic-audience-routes'),'primary Wordstat hub not expanded');
  assert(!main.includes('golovolomki-so-spichkami'),'matchstick route leaked into main hub');
  const adult=fs.readFileSync(path.join(tmp,'zagadki-na-logiku-dlya-vzroslyh/index.html'),'utf8');
  assert(adult.includes('Загадки на логику для взрослых с ответами')&&adult.includes('data-logic-approved-adult'),'adult SEO intent or quick block regressed');
  const kids=fs.readFileSync(path.join(tmp,`${collections.kids.slug}/index.html`),'utf8');
  assert(kids.includes('data-age-filter="5–6 лет"')&&kids.includes('data-age-filter="10–12 лет"')&&kids.includes('0 из 22 решено'),'kids age UX missing');
  const brain=fs.readFileSync(path.join(tmp,`${collections.brain.slug}/index.html`),'utf8');
  assert(brain.includes('не медицинский тренажёр')&&brain.includes('Expert-каталог'),'brain safety/product copy missing');
  const detective=fs.readFileSync(path.join(tmp,`${collections.detective.slug}/index.html`),'utf8');
  assert(detective.includes('15 дел бесплатно')&&detective.includes('detektivnye-igry-dlya-odnogo'),'detective crossover missing');
  const math=fs.readFileSync(path.join(tmp,`${collections.math.slug}/index.html`),'utf8');
  assert(math.includes('kriptarifm-logic-puzzle'),'math Expert bridge missing');
  assert(!fs.existsSync(path.join(tmp,`${collections.matches.slug}/index.html`)),'matchstick collection must stay unpublished');
  const matchTask=fs.readFileSync(path.join(tmp,'golovolomki/spichki-1-6-5/index.html'),'utf8');
  assert(matchTask.includes('data-match-equation="1+6=5"')&&matchTask.includes('name="robots" content="noindex,follow"'),'match task QA runtime/noindex missing');
  const task=fs.readFileSync(path.join(tmp,'golovolomki/tri-korobki/index.html'),'utf8');
  assert(task.includes('data-quick-puzzle="quick:001"')&&task.includes('data-quick-answer="В синей"'),'quick task contract missing');
  assert(task.includes('name="robots" content="noindex,follow"'),'quick task must not be indexable');
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
}
console.log(JSON.stringify({ok:true,puzzles:puzzles.length,sourceCollections:{kids:count('kids'),brain:count('brain'),detective:count('detective'),math:count('math'),matches:count('matches')},indexableCollections:4,taskPagesNoindex:true,matchstickCollectionPublished:false,matchstickSourceRetained:true,fairPlayCardIdentity:true,ageFirst:true,noClassThinPages:true},null,2));