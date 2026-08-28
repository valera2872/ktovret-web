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
  'assets/logic-hub.js',
  'assets/logic-sitewide.css',
  'assets/logic-sitewide.js',
  'logicheskie-zadachi/index.html',
  'logicheskie-zadachi/kod-507/index.html',
  'logicheskie-zadachi/poryadok-pyati-papok/index.html',
  'logicheskie-zadachi/seyf-5074/index.html',
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
  {name:'logic-hub-desktop',path:'/logicheskie-zadachi/',width:1440,height:1200,required:['logic-hero','Логика<br>без догадок','data-logic-puzzle="logic:lock-507"','Стартовая коллекция','Тематические тома','https://t.me/mysterylogic']},
  {name:'logic-hub-mobile',path:'/logicheskie-zadachi/',width:390,height:844,required:['logic-hero','Логика<br>без догадок','data-logic-puzzle="logic:lock-507"']},
  {name:'logic-task-desktop',path:'/logicheskie-zadachi/kod-507/',width:1440,height:1200,required:['logic-task-hero','Трёхзначный замок','data-logic-answer-input','Показать пошаговый разбор','https://t.me/mysterylogic']},
  {name:'logic-task-mobile',path:'/logicheskie-zadachi/kod-507/',width:390,height:844,required:['logic-task-hero','Трёхзначный замок','data-logic-answer-input']},
  {name:'logic-folders-desktop',path:'/logicheskie-zadachi/poryadok-pyati-papok/',width:1440,height:1200,required:['Пять папок','EDACB','data-logic-answer-input']},
  {name:'logic-vault-desktop',path:'/logicheskie-zadachi/seyf-5074/',width:1440,height:1200,required:['Сейф: четыре цифры','5074','data-logic-answer-input']},
  {name:'home-logic-long',path:'/',width:1440,height:3000,required:['data-logic-home-launch','Логические задачи и головоломки','Новые задачи в Telegram','data-nav-logic']},
];
const results=[];
const port=await listen();
try{
  for(const capture of captures){
    const url=`http://127.0.0.1:${port}${capture.path}`;
    const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',`--window-size=${capture.width},${capture.height}`,'--virtual-time-budget=2200'];
    const screenshot=path.join(outDir,`${capture.name}.png`);
    await runChrome([...common,`--screenshot=${screenshot}`,url]);
    const {stdout:dom}=await runChrome([...common,'--dump-dom',url]);
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
