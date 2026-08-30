#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const siteRoot=path.resolve(here,'..');
const outDir=path.join(siteRoot,'artifacts','logic-visual-smoke');
fs.mkdirSync(outDir,{recursive:true});

for(const file of [
  'assets/logic-hub.css',
  'assets/logic-expert-seo.css',
  'assets/logic-expert.js',
  'assets/logic-sitewide.css',
  'assets/logic-sitewide.js',
  'assets/premium-surface-v2.css',
  'golovolomki-onlayn/index.html',
  'zagadki-na-logiku-dlya-vzroslyh/index.html',
  'logicheskie-zadachi/index.html',
  'logicheskie-zadachi/protokol-shesti-cifr/index.html',
  'logicheskie-zadachi/nonogramma-10x10/index.html',
  'logicheskie-zadachi/domino-razbienie-4x5/index.html',
]){
  const full=path.join(siteRoot,file);
  if(!fs.existsSync(full)) throw new Error(`Logic visual smoke prerequisite missing: ${file}`);
}

const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(candidate=>fs.existsSync(candidate));
if(!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const contentTypes=new Map([
  ['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],
  ['.json','application/json; charset=utf-8'],['.svg','image/svg+xml'],['.webp','image/webp'],['.png','image/png'],
]);
const server=http.createServer((request,response)=>{
  const requestUrl=new URL(request.url||'/','http://127.0.0.1');
  let relative=decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
  if(!relative||relative.endsWith('/')) relative+='index.html';
  const filePath=path.resolve(siteRoot,relative);
  if(!filePath.startsWith(`${siteRoot}${path.sep}`)&&filePath!==siteRoot) return response.writeHead(403).end('Forbidden');
  if(!fs.existsSync(filePath)||!fs.statSync(filePath).isFile()) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type',contentTypes.get(path.extname(filePath).toLowerCase())||'application/octet-stream');
  response.setHeader('Cache-Control','no-store');
  response.end(fs.readFileSync(filePath));
});
const listen=()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const runChrome=(args)=>new Promise((resolve,reject)=>{
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
  child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);child.on('error',reject);
  child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1800)}`)));
});
const pngDimensions=(filePath)=>{const bytes=fs.readFileSync(filePath);if(bytes.length<24||bytes.toString('hex',0,8)!=='89504e470d0a1a0a')throw new Error(`${filePath} is not a PNG`);return{width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};};

const captures=[
  {name:'puzzles-main-desktop',path:'/golovolomki-onlayn/',width:1440,height:1400,required:['logic-premium-hub','mlp-puzzle-hero','Логические игры','20 быстрых','Expert-коллекция','data-expert-card="expert:001"','https://t.me/mysterylogic']},
  {name:'puzzles-main-mobile',path:'/golovolomki-onlayn/',width:390,height:844,required:['logic-premium-hub','mlp-puzzle-hero','Логические игры','Выберите свой формат','Головоломки']},
  {name:'puzzles-adult-desktop',path:'/zagadki-na-logiku-dlya-vzroslyh/',width:1440,height:1300,required:['Загадки на логику для взрослых с ответами','Сложные задачи для самостоятельного решения','data-expert-card']},
  {name:'puzzles-expert-desktop',path:'/logicheskie-zadachi/',width:1440,height:1400,required:['Сложные логические задачи уровня Expert','data-expert-total="20"','data-expert-card="expert:020"']},
  {name:'puzzle-001-desktop',path:'/logicheskie-zadachi/protokol-shesti-cifr/',width:1440,height:1300,required:['logic-task-hero','Протокол шести цифр','data-expert-input','Показать ответ и разбор','https://t.me/mysterylogic']},
  {name:'puzzle-001-mobile',path:'/logicheskie-zadachi/protokol-shesti-cifr/',width:390,height:844,required:['logic-task-hero','Протокол шести цифр','data-expert-input']},
  {name:'puzzle-nonogram-desktop',path:'/logicheskie-zadachi/nonogramma-10x10/',width:1440,height:1300,required:['Нонограмма 10×10','Я решил — показать разбор','1 1 1','data-expert-mode="reveal"']},
  {name:'home-puzzles-long',path:'/',width:1440,height:3000,required:['data-premium-cases-v2','Премиальные дела Mystery Logic','Номер 407','Последняя ария','data-logic-family-home','Для детей','Для мозга','Детективные','Математические','>Головоломки</a>']},
];
const results=[];
const port=await listen();
try{
  for(const capture of captures){
    const target=`http://127.0.0.1:${port}${capture.path}`;
    const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',`--window-size=${capture.width},${capture.height}`,'--virtual-time-budget=2200'];
    const screenshot=path.join(outDir,`${capture.name}.png`);
    await runChrome([...common,`--screenshot=${screenshot}`,target]);
    const {stdout:dom}=await runChrome([...common,'--dump-dom',target]);
    for(const marker of capture.required) if(!dom.includes(marker)) throw new Error(`${capture.name}: missing marker ${marker}`);
    if(dom.includes('ReferenceError')||dom.includes('TypeError:')) throw new Error(`${capture.name}: runtime failure detected`);
    const dim=pngDimensions(screenshot);
    if(dim.width!==capture.width||dim.height!==capture.height) throw new Error(`${capture.name}: unexpected ${dim.width}x${dim.height}`);
    if(dim.bytes<18000) throw new Error(`${capture.name}: screenshot suspiciously small (${dim.bytes})`);
    results.push({name:capture.name,path:capture.path,width:dim.width,height:dim.height,bytes:dim.bytes,screenshot:path.relative(siteRoot,screenshot)});
  }
} finally {
  await new Promise(resolve=>server.close(resolve));
}
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({chrome,results},null,2));
console.log(JSON.stringify({chrome,results},null,2));
