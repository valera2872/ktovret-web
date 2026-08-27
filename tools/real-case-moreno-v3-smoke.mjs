#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const route='realnye-dela/pozharnaya-lestnica-1991/index.html';
const htmlPath=path.join(root,route);
const jsPath=path.join(root,'assets/real-case-moreno-investigator-v3.js');
const cssPath=path.join(root,'assets/real-case-moreno-investigator-v3.css');
for(const f of [htmlPath,jsPath,cssPath]) if(!fs.existsSync(f)) throw new Error(`missing ${f}`);
const html=fs.readFileSync(htmlPath,'utf8');
const js=fs.readFileSync(jsPath,'utf8');
for(const m of ['real-case-moreno-investigator-v3.css?v=0.3.0','real-case-moreno-investigator-v3.js?v=0.3.0','noindex,follow']) if(!html.includes(m)) throw new Error(`route missing ${m}`);
for(const m of ["const VERSION='0.3.0'",'Осмотреть место происшествия','Установить, кто находился рядом','Провести поквартирный обход','Назначить экспертизы','Проверить доступ к оружию нужного калибра','Проверить утверждения из опросов','ml-realcase-moreno-investigator-v3']) if(!js.includes(m)) throw new Error(`engine missing ${m}`);
for(const banned of ['Ход 1 ·','Ход 2 ·','ЗОНА A','ЗОНА B','ЗОНА C','Свидетель A','Свидетель B']) if(js.includes(banned)) throw new Error(`guided legacy marker leaked: ${banned}`);

const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(fs.existsSync);if(!chrome)throw new Error('Chrome not found');
const typeMap=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml']]);
const seedHtml=(state)=>`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/mysterylogic.css"><link rel="stylesheet" href="/assets/real-case-moreno-investigator-v3.css"></head><body class="moreno-body"><main data-moreno-app></main><script>localStorage.setItem('ml-realcase-moreno-investigator-v3',JSON.stringify(${JSON.stringify(state)}))</script><script src="/assets/real-case-moreno-investigator-v3.js"></script></body></html>`;
const scenarios={
 initial:{view:'desk',completed:[]},
 people:{view:'desk',completed:['people']},
 interviewed:{view:'desk',completed:['people','interview']},
 caliber:{view:'desk',completed:['people','ballistics']},
 full:{view:'desk',completed:['scene','people','interview','canvass','ballistics','trajectory','weaponAccess','claimSleep'],forensicInterpretation:'door',theoryOrigin:'door',theoryPerson:'boyfriend'},
 deadend:{view:'deadend',completed:['people','interview','canvass'],deadendReason:'forensics'},
 reveal:{view:'reveal',completed:['scene','people','interview','canvass','ballistics','trajectory','weaponAccess','claimSleep'],theoryOrigin:'door',theoryPerson:'boyfriend',finalAction:'arrest'}
};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 if(u.pathname.startsWith('/__scenario/')){const key=u.pathname.split('/').pop().replace('.html','');const state=scenarios[key];if(!state){res.writeHead(404);return res.end('missing');}res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(seedHtml(state));}
 const rel=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';const fp=path.resolve(root,rel);if(!fp.startsWith(root+path.sep)||!fs.existsSync(fp)){res.writeHead(404);return res.end('missing');}res.setHeader('Content-Type',typeMap.get(path.extname(fp))||'application/octet-stream');res.end(fs.readFileSync(fp));
});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const run=(url)=>new Promise((resolve,reject)=>{const c=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--virtual-time-budget=1300','--dump-dom',url]);let out='',err='';c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>err+=d);c.on('close',code=>code===0?resolve(out):reject(new Error(err)));});
const check=(label,dom,must=[],mustNot=[])=>{for(const m of must)if(!dom.includes(m))throw new Error(`${label} missing ${m}`);for(const m of mustNot)if(dom.includes(m))throw new Error(`${label} leaked ${m}`);};
try{
 const opening=await run(`http://127.0.0.1:${port}/${route}`);check('opening',opening,['ДЕВУШКА НА ПОЖАРНОЙ ЛЕСТНИЦЕ','Принять дело'],['Родни Дэниелс','Rodney Daniels','Бойфренд старшей дочери','Проверить доступ к оружию']);
 const initial=await run(`http://127.0.0.1:${port}/__scenario/initial.html`);check('initial desk',initial,['ЧТО ДЕЛАТЬ ДАЛЬШЕ?','Осмотреть место происшествия','Установить, кто находился рядом','Провести поквартирный обход','Назначить экспертизы'],['Бойфренд старшей дочери','Проверить утверждения из опросов','Проверить доступ к оружию нужного калибра','.38']);
 const people=await run(`http://127.0.0.1:${port}/__scenario/people.html`);check('after people',people,['Опросить находившихся в квартире','Бойфренд старшей дочери'],['Проверить утверждения из опросов','Проверить доступ к оружию нужного калибра']);
 const interviewed=await run(`http://127.0.0.1:${port}/__scenario/interviewed.html`);check('after interview',interviewed,['Проверить утверждения из опросов','спал в кресле'],['Проверить доступ к оружию нужного калибра']);
 const caliber=await run(`http://127.0.0.1:${port}/__scenario/caliber.html`);check('after caliber',caliber,['Проверить доступ к оружию нужного калибра','.38']);
 const deadend=await run(`http://127.0.0.1:${port}/__scenario/deadend.html`);check('deadend',deadend,['ВЕРСИЯ НЕ ОТВЕЧАЕТ НА ФИЗИЧЕСКИЙ ВОПРОС','откуда шла пуля']);
 const reveal=await run(`http://127.0.0.1:${port}/__scenario/reveal.html`);check('reveal',reveal,['РОДНИ ДЭНИЕЛС','Rodney Daniels','16 августа 2023']);
}finally{await new Promise(r=>server.close(r));}
const report={version:'0.3.0',neutralInitialDesk:true,relationshipUnlock:true,claimUnlock:true,caliberUnlock:true,deadEnds:true,spoilerBoundary:true};
fs.mkdirSync(path.join(root,'artifacts','real-case-moreno-v3'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts','real-case-moreno-v3','smoke.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));