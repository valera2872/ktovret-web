#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {logicAudiencePuzzles as puzzles,logicAudienceCollections as collections} from './import-mobile/logic-audience-data.mjs';
import {applyLogicAudienceExpansion} from './import-mobile/logic-audience-postprocess.mjs';

const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const byId=id=>puzzles.find(p=>p.id===id);
const count=c=>puzzles.filter(p=>p.collections.includes(c)).length;

assert(puzzles.length===37,`expected 37 quick puzzles, got ${puzzles.length}`);
assert(new Set(puzzles.map(p=>p.id)).size===37,'duplicate quick id');
assert(new Set(puzzles.map(p=>p.slug)).size===37,'duplicate quick slug');
assert(new Set(puzzles.map(p=>p.title)).size===37,'duplicate quick title');
for(const p of puzzles){
  assert(/^quick:\d{3}$/.test(p.id),`bad id ${p.id}`);
  assert(/^Q\d{2}$/.test(p.number),`bad number ${p.number}`);
  assert(/^[a-z0-9-]+$/.test(p.slug),`bad slug ${p.slug}`);
  assert(p.choices.length>=3,`too few choices ${p.id}`);
  assert(p.choices.includes(p.answer),`answer missing from choices ${p.id}`);
  assert(p.prompt.length>=70,`prompt too thin ${p.id}`);
  assert(p.explanation.length>=60,`explanation too thin ${p.id}`);
}
assert(count('kids')===26,'kids corpus mismatch');
assert(count('brain')===33,'brain corpus mismatch');
assert(count('detective')===8,'detective corpus mismatch');
assert(count('math')===18,'math corpus mismatch');
assert(count('matches')===12,'matchstick source corpus mismatch');
assert(collections.matches.slug==='golovolomki-so-spichkami','matchstick route mismatch');
assert(collections.matches.h1==='Головоломки со спичками онлайн','matchstick H1 mismatch');
assert(/с ответами и подсказками/.test(collections.matches.title),'matchstick title intent missing');
assert(/Спички уже лежат/.test(collections.matches.lead),'visual-first matchstick copy missing');
for(const cfg of Object.values(collections)){
  assert(cfg.title.length>=38&&cfg.title.length<=90,`title length ${cfg.slug}: ${cfg.title.length}`);
  assert(cfg.description.length>=90&&cfg.description.length<=190,`description length ${cfg.slug}: ${cfg.description.length}`);
}

// Fair-play boundary for detective mini-puzzles remains unchanged.
const q09=byId('quick:009');
assert(q09.prompt.includes('видеозаписи')&&q09.explanation.includes('входит именно Вера'),'Q09 identity evidence missing');
const q12=byId('quick:012');
assert(q12.prompt.includes('Кому по журналу была выдана карта №31')&&q12.explanation.includes('не то, кто физически воспользовался'),'Q12 card assignment boundary missing');
const q33=byId('quick:033');
assert(q33.answer==='В 19:07 использовали карту, выданную Роману'&&q33.explanation.includes('Кто физически держал карту'),'Q33 evidence boundary regressed');

// Every matchstick equation must have one and only one legal move in the current rule set.
const seg={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
const back=new Map(Object.entries(seg).map(([d,s])=>[[...s].sort().join(''),Number(d)]));
function matchSolutions(eq){
  const m=eq.match(/^(\d)\+(\d)=(\d)$/);assert(m,`bad match equation ${eq}`);
  const nums=m.slice(1).map(Number),out=new Set();
  for(let i=0;i<3;i++){
    const src=new Set(seg[nums[i]]);
    for(const removed of src){
      const left=new Set(src);left.delete(removed);const dl=back.get([...left].sort().join(''));if(dl===undefined)continue;
      for(let j=0;j<3;j++){
        if(i===j)continue;
        const target=new Set(seg[nums[j]]);
        for(const added of 'abcdefg'){
          if(target.has(added))continue;
          const right=new Set(target);right.add(added);const dr=back.get([...right].sort().join(''));if(dr===undefined)continue;
          const a=[...nums];a[i]=dl;a[j]=dr;if(a[0]+a[1]===a[2])out.add(`${a[0]} + ${a[1]} = ${a[2]}`);
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
for(const id of ['quick:034','quick:035','quick:036','quick:037'])assert(byId(id)?.match,`${id} new visual match puzzle missing`);

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-logic-audience-'));
try{
  fs.mkdirSync(path.join(tmp,'golovolomki-onlayn'),{recursive:true});
  fs.mkdirSync(path.join(tmp,'zagadki-na-logiku-dlya-vzroslyh'),{recursive:true});
  fs.writeFileSync(path.join(tmp,'golovolomki-onlayn/index.html'),'<!doctype html><html><head><title>Головоломки онлайн для взрослых — бесплатно | Mystery Logic</title><meta name="description" content="20 сложных логических головоломок онлайн бесплатно и без регистрации: коды, графы, нонограммы, криптарифмы, матрицы и задачи уровня Expert с ответами."></head><body><main><h1>Сложные головоломки онлайн для взрослых</h1><p>Бесплатная коллекция сложных головоломок без регистрации. Не школьные упражнения и не загадки с подвохом: здесь коды, графы, логические сетки, криптарифмы, маршруты и другие задачи с единственным проверяемым решением.</p><section class="logic-section" id="puzzles"></section></main></body></html>');
  fs.writeFileSync(path.join(tmp,'zagadki-na-logiku-dlya-vzroslyh/index.html'),'<!doctype html><html><head><title>Загадки на логику для взрослых с ответами | Mystery Logic</title></head><body><main><h1>Загадки на логику для взрослых с ответами</h1><section class="logic-section" id="puzzles"></section></main></body></html>');
  fs.writeFileSync(path.join(tmp,'index.html'),'<!doctype html><html><body><main><section class="ref-logic-launch" data-logic-home-launch><p>old</p></section></main></body></html>');
  const result=applyLogicAudienceExpansion(tmp);
  assert(result.puzzles===37,'source QA should render all 37 task pages');
  assert(result.routes.length===5,'five source collection routes should be generated');
  assert(result.taskRoutes.length===37,'task route count mismatch');
  assert(result.generatedRoutes.length===42,'generated route count mismatch');
  assert(result.collections===5,'source collection count mismatch');
  assert(result.matches===12,'matchstick generated count mismatch');
  assert(result.mainPatched&&result.adultPatched&&result.homePatched,'hub patch failed');

  const main=fs.readFileSync(path.join(tmp,'golovolomki-onlayn/index.html'),'utf8');
  assert(main.includes('golovolomki-so-spichkami')&&main.includes('Со спичками'),'matchstick route missing from source hub');
  const matchHub=fs.readFileSync(path.join(tmp,`${collections.matches.slug}/index.html`),'utf8');
  assert(matchHub.includes('<h1>Головоломки со спичками онлайн</h1>'),'matchstick H1 missing');
  assert(matchHub.includes('Головоломки со спичками с ответами'),'matchstick SEO copy missing');
  assert(matchHub.includes('data-match-equation=')&&matchHub.includes('matchstick-visual.css')&&matchHub.includes('matchstick-visual.js'),'matchstick visual runtime missing');
  assert(matchHub.includes('0 из 12 решено'),'matchstick progress count mismatch');
  const matchTask=fs.readFileSync(path.join(tmp,'golovolomki/spichki-1-6-5/index.html'),'utf8');
  assert(matchTask.includes('data-match-equation="1+6=5"')&&matchTask.includes('name="robots" content="noindex,follow"'),'match task visual/noindex contract missing');
  const newTask=fs.readFileSync(path.join(tmp,'golovolomki/spichki-0-3-8/index.html'),'utf8');
  assert(newTask.includes('data-quick-puzzle="quick:034"'),'new match task route missing');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}

console.log(JSON.stringify({ok:true,puzzles:puzzles.length,sourceCollections:{kids:count('kids'),brain:count('brain'),detective:count('detective'),math:count('math'),matches:count('matches')},indexableSourceCollections:5,taskPagesNoindex:true,matchstickCollectionPublishedInEditorial:true,visualMatchsticks:true},null,2));