#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const siteRoot=process.env.SITE_ROOT?path.resolve(process.env.SITE_ROOT):path.resolve(here,'..');
const route='realnye-dela/arhiv-71-05/index.html';
const htmlFile=path.join(siteRoot,route);
const jsFile=path.join(siteRoot,'assets/real-case-marshall-investigation.js');
const cssFile=path.join(siteRoot,'assets/real-case-marshall-investigation.css');
const outDir=path.join(siteRoot,'artifacts','real-case-marshall');
fs.mkdirSync(outDir,{recursive:true});

for(const file of [htmlFile,jsFile,cssFile]) if(!fs.existsSync(file)) throw new Error(`missing v2 file: ${path.relative(siteRoot,file)}`);
const html=fs.readFileSync(htmlFile,'utf8');
const js=fs.readFileSync(jsFile,'utf8');
const css=fs.readFileSync(cssFile,'utf8');

for(const marker of ['name="robots" content="noindex,follow"','data-realcase-app','real-case-marshall-investigation.css?v=2.0.0','real-case-marshall-investigation.js?v=2.0.0','Архивное дело №71-05']) if(!html.includes(marker)) throw new Error(`route missing v2 marker: ${marker}`);
for(const forbidden of ['real-case-marshall.js?v=','real-case-marshall-v13-guards.js','real-case-marshall-presentation.js','sitemap.xml','data-seo-prerender']) if(html.includes(forbidden)) throw new Error(`route still loads legacy surface: ${forbidden}`);
for(const marker of ["const VERSION='2.0.0'",'ml-realcase-71-05-investigation-v2','Ваши действия?','Осмотреть место происшествия','Допросить выжившего','Найти свидетелей в районе парка','Допросить свидетеля A','Допросить свидетеля B','Допросить свидетелей C/D','Что вы хотите уточнить','Запоминать ничего не нужно','Crown Statement of Facts','Мужчина X','Royal Commission','Donald Marshall Jr.','Roy Ebsary','window.MLRealCase7105Investigation','smokeStage']) if(!js.includes(marker)) throw new Error(`engine missing marker: ${marker}`);
for(const forbidden of ['Проверить классификацию','2+ источника','Статус изменения','Для перехода нужно подтвердить минимум четыре изменения']) if(js.includes(forbidden)) throw new Error(`legacy quiz language leaked into v2 engine: ${forbidden}`);
for(const marker of ['.ri-action-grid','.ri-action-card','.ri-board','.ri-topic-list','.ri-decision','.ri-reveal','@media(max-width:780px)']) if(!css.includes(marker)) throw new Error(`v2 styles missing marker: ${marker}`);

const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(candidate=>fs.existsSync(candidate));
if(!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);
const contentTypes=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml']]);
const server=http.createServer((request,response)=>{
  const url=new URL(request.url||'/','http://127.0.0.1');
  const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath=path.resolve(siteRoot,relative||'index.html');
  if(!filePath.startsWith(`${siteRoot}${path.sep}`)||!fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type',contentTypes.get(path.extname(filePath).toLowerCase())||'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const runChrome=(args)=>new Promise((resolve,reject)=>{
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
  child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);child.on('error',reject);
  child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1800)}`)));
});
const dimensions=(file)=>{const bytes=fs.readFileSync(file);return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};};
const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1','--virtual-time-budget=1800'];
const dump=async(stage='')=>{
  const query=stage?`?smokeStage=${stage}`:'';
  const {stdout}=await runChrome([...common,'--dump-dom',`http://127.0.0.1:${port}/${route}${query}`]);
  return stdout;
};
const requireMarkers=(label,dom,markers,forbidden=[])=>{
  for(const marker of markers) if(!dom.includes(marker)) throw new Error(`${label}: DOM missing ${marker}`);
  for(const marker of forbidden) if(dom.includes(marker)) throw new Error(`${label}: spoiler/legacy marker visible: ${marker}`);
  if(dom.includes('data-rc-overflow="true"')||dom.includes('data-rc-overflow="true"')) throw new Error(`${label}: horizontal overflow marker`);
};

try{
  const opening=await dump();
  requireMarkers('opening',opening,['НОЧЬ. ПАРК.','Принять дело','Вы ведёте проверку.'],['Donald Marshall','Roy Ebsary','Рой Эбсари','Проверить классификацию']);
  const desk=await dump('desk');
  requireMarkers('desk',desk,['Ваши действия?','Осмотреть место происшествия','Допросить выжившего','Найти свидетелей в районе парка','ДОСКА ДЕЛА','Запоминать ничего не нужно'],['Donald Marshall','Roy Ebsary','Рой Эбсари','2+ источника']);
  const witnesses=await dump('witnesses');
  requireMarkers('witnesses',witnesses,['Допросить свидетеля A','Допросить свидетеля B','Допросить свидетелей C/D'],['Donald Marshall','Roy Ebsary','Рой Эбсари']);
  const june4=await dump('june4');
  requireMarkers('june4',june4,['ИСТОРИЧЕСКОЕ СОБЫТИЕ','В деле появились новые показания','Повторно допросить свидетеля B','Повторно допросить свидетеля A'],['Donald Marshall','Roy Ebsary','Рой Эбсари']);
  const decision=await dump('decision');
  requireMarkers('decision',decision,['Что вы делаете с этим файлом?','Поддержать обвинительную версию','Вернуть дело на дополнительную проверку','Не закрывать линию двух других мужчин'],['Donald Marshall','Roy Ebsary','Рой Эбсари']);
  const later=await dump('later');
  requireMarkers('later',later,['Приговор вынесен','Проверить сообщение нового очевидца','Проверить сообщение о ноже','Открыть материалы RCMP 1982'],['Donald Marshall','Roy Ebsary','Рой Эбсари']);
  const reveal=await dump('reveal');
  requireMarkers('reveal',reveal,['Donald Marshall Jr.','Sandy Seale','Roy Ebsary','11 лет','manslaughter']);

  for(const viewport of [{name:'desktop',width:1440,height:1200},{name:'mobile',width:390,height:844}]){
    for(const stage of ['desk','june4','decision','later','reveal']){
      const screenshot=path.join(outDir,`v2-${stage}-${viewport.name}.png`);
      await runChrome([...common,`--window-size=${viewport.width},${viewport.height}`,`--screenshot=${screenshot}`,`http://127.0.0.1:${port}/${route}?smokeStage=${stage}`]);
      const size=dimensions(screenshot);
      if(size.width!==viewport.width||size.height!==viewport.height||size.bytes<15_000) throw new Error(`${stage}/${viewport.name}: bad screenshot ${JSON.stringify(size)}`);
    }
  }
}finally{
  await new Promise(resolve=>server.close(resolve));
}

const report={version:'2.0.0',route,mode:'investigator-graph',agency:true,memorizationGate:false,quizClassification:false,spoilerBoundary:true,stages:['opening','desk','witnesses','june4','decision','later','reveal'],screenshots:10};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
