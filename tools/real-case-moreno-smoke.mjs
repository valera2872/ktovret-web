#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=process.env.SITE_ROOT?path.resolve(process.env.SITE_ROOT):path.resolve(here,'..');
const route='realnye-dela/pozharnaya-lestnica-1991/index.html';
const htmlFile=path.join(root,route);
const jsFile=path.join(root,'assets','real-case-moreno-slice.js');
const polishJsFile=path.join(root,'assets','real-case-moreno-polish.js');
const cssFile=path.join(root,'assets','real-case-moreno-slice.css');
const polishCssFile=path.join(root,'assets','real-case-moreno-polish.css');
const outDir=path.join(root,'artifacts','real-case-moreno');
fs.mkdirSync(outDir,{recursive:true});

for(const file of [htmlFile,jsFile,polishJsFile,cssFile,polishCssFile]) if(!fs.existsSync(file)) throw new Error(`missing slice file: ${path.relative(root,file)}`);
const html=fs.readFileSync(htmlFile,'utf8');
const js=fs.readFileSync(jsFile,'utf8');
const polishJs=fs.readFileSync(polishJsFile,'utf8');
const css=fs.readFileSync(cssFile,'utf8');
const polishCss=fs.readFileSync(polishCssFile,'utf8');

for(const marker of ['name="robots" content="noindex,follow"','data-moreno-app','real-case-moreno-slice.css?v=0.1.0','real-case-moreno-polish.css?v=0.1.0','real-case-moreno-slice.js?v=0.1.0','real-case-moreno-polish.js?v=0.1.0','Дело на пожарной лестнице']) if(!html.includes(marker)) throw new Error(`route missing marker: ${marker}`);
for(const marker of ["const VERSION='0.1.0'",'ml-realcase-moreno-slice-v1','initialTheory','trajectoryZone','occupantsAssessment','alibiAssessment','lineInterpretations','strongestEvidence','finalDecision','КАК ЭТО МОГЛО ПРОИЗОЙТИ?','ОТКУДА МОГЛИ СТРЕЛЯТЬ?','КОГО МОЖНО ИСКЛЮЧИТЬ?','Я СПАЛ В КРЕСЛЕ','КАКИЕ ДВЕ ЛИНИИ ВЫ ПРОВЕРИТЕ?','СОБЕРИТЕ ВЕРСИЮ','РОДНИ ДЭНИЕЛС','window.MLMorenoSlice']) if(!js.includes(marker)) throw new Error(`engine missing marker: ${marker}`);
for(const marker of ['data.sceneIntro','ms-scene-intro','Патриция Морено · 17 лет','4 человека','следов нет']) if(!polishJs.includes(marker.replace('data.sceneIntro','data.sceneIntro'))&&!(marker==='data.sceneIntro'&&polishJs.includes('dataset.sceneIntro'))) throw new Error(`polish missing marker: ${marker}`);
for(const forbidden of ['Свидетель A','Свидетель B','Свидетель C','Свидетель D','2+ источника','Проверить классификацию','Статус изменения','минимум пять материалов']) if(js.includes(forbidden)) throw new Error(`legacy archive-quiz language leaked: ${forbidden}`);
for(const marker of ['.ms-opening','.ms-scene','.ms-zone','.ms-interstitial','.ms-people','.ms-alibi','.ms-line-grid','.ms-board','.ms-evidence-pick','.ms-reveal','@media(max-width:780px)']) if(!css.includes(marker)) throw new Error(`styles missing marker: ${marker}`);
for(const marker of ['.ms-scene-intro','.ms-scene-intro-photo','.ms-scene-intro-facts','.ms-opening-visual{order:-1']) if(!polishCss.includes(marker)) throw new Error(`polish styles missing marker: ${marker}`);

const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(candidate=>fs.existsSync(candidate));
if(!chrome) throw new Error(`Chrome/Chromium not found: ${chromeCandidates.join(', ')}`);
const types=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml']]);
const server=http.createServer((request,response)=>{
  const url=new URL(request.url||'/','http://127.0.0.1');
  const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath=path.resolve(root,relative||'index.html');
  if(!filePath.startsWith(`${root}${path.sep}`)||!fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type',types.get(path.extname(filePath).toLowerCase())||'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const runChrome=(args)=>new Promise((resolve,reject)=>{
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
  child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);child.on('error',reject);
  child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1800)}`)));
});
const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1','--virtual-time-budget=1800'];
const dump=async(stage='')=>{
  const query=stage?`?smokeStage=${stage}`:'';
  const {stdout}=await runChrome([...common,'--dump-dom',`http://127.0.0.1:${port}/${route}${query}`]);
  return stdout;
};
const check=(label,dom,markers,forbidden=[])=>{
  for(const marker of markers) if(!dom.includes(marker)) throw new Error(`${label}: missing ${marker}`);
  for(const marker of forbidden) if(dom.includes(marker)) throw new Error(`${label}: forbidden/spoiler ${marker}`);
  if(dom.includes('data-rc-overflow="true"')) throw new Error(`${label}: horizontal overflow`);
};

try{
  const opening=await dump();
  check('opening',opening,['ДЕВУШКА НА ПОЖАРНОЙ ЛЕСТНИЦЕ','Патрицию Морено','Войти в квартиру','capture_3.jpg'],['Rodney Daniels','РОДНИ ДЭНИЕЛС']);
  const scene=await dump('scene');
  check('scene',scene,['КАК ЭТО МОГЛО ПРОИЗОЙТИ?','data-scene-intro="true"','Патриция Морено · 17 лет','4 человека','Линия снаружи','Линия из квартиры','Несчастный случай / самострел','Проверить версию по сцене'],['Rodney Daniels','РОДНИ ДЭНИЕЛС']);
  const trajectory=await dump('trajectory');
  check('trajectory',trajectory,['ОТКУДА МОГЛИ СТРЕЛЯТЬ?','ЗОНА A','дверной проём','нисходящее направление пули','Материалы на столе'],['Rodney Daniels','РОДНИ ДЭНИЕЛС']);
  const trajectoryResult=await dump('trajectoryResult');
  check('trajectoryResult',trajectoryResult,['ТРАЕКТОРИЯ ВЕДЁТ К ДВЕРИ','требует пересмотреть исходную версию','Кто мог быть у двери?'],['Rodney Daniels','РОДНИ ДЭНИЕЛС']);
  const occupants=await dump('occupants');
  check('occupants',occupants,['КОГО МОЖНО ИСКЛЮЧИТЬ?','Приёмная мать','Старшая дочь','Младшая дочь','Бойфренд старшей дочери','Пока не исключать никого из квартиры'],['Свидетель A','Rodney Daniels','РОДНИ ДЭНИЕЛС']);
  const alibi=await dump('alibi');
  check('alibi',alibi,['Я СПАЛ В КРЕСЛЕ','Версия пока возможна, но ничем не подтверждена','Выбрать две линии проверки'],['Rodney Daniels','РОДНИ ДЭНИЕЛС']);
  const investigate=await dump('investigate');
  check('investigate',investigate,['КАКИЕ ДВЕ ЛИНИИ ВЫ ПРОВЕРИТЕ?','Сосед этажом ниже','Оружие и угрозы','Женщина, которая давала алиби','Что это меняет?','Насколько это сильный вывод?','Что ломается прежде всего?'],['Rodney Daniels','РОДНИ ДЭНИЕЛС']);
  const synthesis=await dump('synthesis');
  check('synthesis',synthesis,['СОБЕРИТЕ ВЕРСИЮ','Выберите главное доказательство','Что вы делаете с делом?','Открыть реальный исход'],['Rodney Daniels','РОДНИ ДЭНИЕЛС']);
  const reveal=await dump('reveal');
  check('reveal',reveal,['РОДНИ ДЭНИЕЛС','Rodney Daniels','32 ГОДА ДО ПРИГОВОРА','16 августа 2023','Арест и реконструкция','Приговор 2023']);
}finally{
  await new Promise(resolve=>server.close(resolve));
}

const report={version:'0.1.0',route,mode:'deduction-vertical-slice',stages:9,coreLoop:['hypothesis','spatial deduction','constraint','alibi evaluation','selective evidence checks','pre-reveal decision'],legacyArchiveQuiz:false,spoilerBoundary:true,firstContactVisuals:true};
fs.writeFileSync(path.join(outDir,'smoke-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
