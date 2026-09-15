#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const route='realnye-dela/pozharnaya-lestnica-1991/index.html';
const html=fs.readFileSync(path.join(root,route),'utf8');
const js=fs.readFileSync(path.join(root,'assets','real-case-moreno-sandbox.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets','real-case-moreno-sandbox.css'),'utf8');
for(const marker of ['real-case-moreno-sandbox.css?v=0.4.0','real-case-moreno-sandbox.js?v=0.4.0','noindex,follow'])if(!html.includes(marker))throw new Error(`route missing ${marker}`);
for(const marker of ["const VERSION='0.4.0'",'Ваше следственное действие','Следственная группа не поняла распоряжение','Запрос в лабораторию не принят','Рабочая версия зафиксирована'])if(!js.includes(marker))throw new Error(`engine missing ${marker}`);
for(const old of ['real-case-moreno-investigator-v3.js?v=0.3.0','real-case-moreno-investigator-v3.css?v=0.3.0'])if(html.includes(old))throw new Error(`legacy active asset leaked ${old}`);
if(!css.includes('.v4-composer'))throw new Error('composer styles missing');
const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);const chrome=chromeCandidates.find(fs.existsSync);if(!chrome)throw new Error('Chrome not found');
const types=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml']]);
const baseState={view:'desk',completed:[],journal:[],hypothesis:'',suspect:'',submitted:false};
const harness=(commands=[],state=baseState)=>`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/mysterylogic.css"><link rel="stylesheet" href="/assets/real-case-moreno-sandbox.css"></head><body class="moreno-body"><main data-moreno-app></main><script>localStorage.setItem('ml-realcase-moreno-sandbox-v4',JSON.stringify(${JSON.stringify(state)}))</script><script src="/assets/real-case-moreno-sandbox.js"></script><script>const cmds=${JSON.stringify(commands)};let i=0;function go(){if(i>=cmds.length)return;const box=document.querySelector('[data-command]');if(!box){setTimeout(go,40);return}box.value=cmds[i++];document.querySelector('[data-command-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));setTimeout(go,90)}setTimeout(go,80)</script></body></html>`;
const server=http.createServer((req,res)=>{const u=new URL(req.url||'/','http://127.0.0.1');if(u.pathname==='/__harness'){const cmds=JSON.parse(u.searchParams.get('cmds')||'[]');res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(harness(cmds));}const rel=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';const fp=path.resolve(root,rel);if(!fp.startsWith(root+path.sep)||!fs.existsSync(fp)){res.writeHead(404);return res.end('missing')}res.setHeader('Content-Type',types.get(path.extname(fp))||'application/octet-stream');res.end(fs.readFileSync(fp));});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const dump=url=>new Promise((resolve,reject)=>{const c=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--virtual-time-budget=2600','--dump-dom',url]);let out='',err='';c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>err+=d);c.on('close',code=>code===0?resolve(out):reject(new Error(err)))});
const chk=(label,dom,must=[],mustNot=[])=>{for(const x of must)if(!dom.includes(x))throw new Error(`${label} missing ${x}`);for(const x of mustNot)if(dom.toLowerCase().includes(x.toLowerCase()))throw new Error(`${label} leaked ${x}`)};
try{
 const opening=await dump(`http://127.0.0.1:${port}/${route}`);chk('opening',opening,['ДЕВУШКА НА','Принять дело'],['схема здания','ЗОНА A','Rodney Daniels']);
 const empty=await dump(`http://127.0.0.1:${port}/__harness`);chk('empty desk',empty,['Что вы делаете?','Ваше следственное действие'],['Осмотреть место происшествия','Установить, кто находился рядом','Провести поквартирный обход','Назначить экспертизы','бойфренд','алиби','.38','Проверить оружие']);
 const vague=await dump(`http://127.0.0.1:${port}/__harness?cmds=${encodeURIComponent(JSON.stringify(['назначить экспертизу']))}`);chk('vague expert',vague,['Запрос в лабораторию не принят','Нужно указать объект исследования'],['Баллистическое исследование','.38']);
 const people=await dump(`http://127.0.0.1:${port}/__harness?cmds=${encodeURIComponent(JSON.stringify(['установить кто был в квартире']))}`);chk('people command',people,['Установлен круг лиц в квартире','бойфренд старшей дочери']);
 const interview=await dump(`http://127.0.0.1:${port}/__harness?cmds=${encodeURIComponent(JSON.stringify(['установить кто был в квартире','опросить всех кто был в квартире']))}`);chk('interview command',interview,['Сводка опросов находившихся в квартире','спал в кресле']);
 const ballistics=await dump(`http://127.0.0.1:${port}/__harness?cmds=${encodeURIComponent(JSON.stringify(['исследовать пулю на калибр']))}`);chk('ballistics command',ballistics,['Баллистическое исследование','.38']);
 const noEarlyAlibi=await dump(`http://127.0.0.1:${port}/__harness?cmds=${encodeURIComponent(JSON.stringify(['проверить алиби']))}`);chk('early alibi',noEarlyAlibi,['Проверять пока нечего'],['спрятал оружие в кресле']);
 const full=await dump(`http://127.0.0.1:${port}/__harness?cmds=${encodeURIComponent(JSON.stringify(['установить кто был в квартире','опросить всех кто был в квартире','опросить соседей кто что видел','исследовать пулю на калибр','реконструировать траекторию выстрела','проверить у бойфренда оружие','моя версия: стрелял бойфренд старшей дочери','передать дело прокурору']))}`);chk('full solve',full,['RODNEY DANIELS','16 августа 2023']);
}finally{await new Promise(r=>server.close(r))}
const report={version:'0.4.0',noMenu:true,freeTextCommands:true,vagueRequestsDoNotRevealEvidence:true,earnedPeople:true,earnedInterview:true,earnedBallistics:true,prematureAlibiBlocked:true,freeTextSolve:true};
fs.mkdirSync(path.join(root,'artifacts','real-case-moreno-v4'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts','real-case-moreno-v4','smoke.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));