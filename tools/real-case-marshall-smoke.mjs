#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const siteRoot=process.env.SITE_ROOT?path.resolve(process.env.SITE_ROOT):path.resolve(here,'..');
const route='realnye-dela/arhiv-71-05/index.html';
const htmlFile=path.join(siteRoot,route);
const jsFile=path.join(siteRoot,'assets/real-case-marshall.js');
const cssFile=path.join(siteRoot,'assets/real-case-marshall.css');
const outDir=path.join(siteRoot,'artifacts','real-case-marshall');
fs.mkdirSync(outDir,{recursive:true});

for(const file of [htmlFile,jsFile,cssFile]) if(!fs.existsSync(file)) throw new Error(`missing prototype file: ${path.relative(siteRoot,file)}`);
const html=fs.readFileSync(htmlFile,'utf8');
const js=fs.readFileSync(jsFile,'utf8');
const css=fs.readFileSync(cssFile,'utf8');

for(const marker of ['name="robots" content="noindex,follow"','data-realcase-app','real-case-marshall.css','real-case-marshall.js','Архивное дело №71-05']) if(!html.includes(marker)) throw new Error(`route missing marker: ${marker}`);
for(const forbidden of ['<img','sitemap.xml','data-seo-prerender']) if(html.includes(forbidden)) throw new Error(`prototype route unexpectedly contains ${forbidden}`);
for(const marker of ['MLRealCase7105','STORAGE_KEY','sourceIds','S00','S25','ВЕРСИЯ ОБВИНЕНИЯ','ВЫВОД КОМИССИИ','транскрипц']) if(!js.includes(marker)) throw new Error(`runtime missing marker: ${marker}`);
const screenIds=[...js.matchAll(/\{id:'(S\d\d)'/g)].map(match=>match[1]);
if(screenIds.length!==26||screenIds[0]!=='S00'||screenIds.at(-1)!=='S25') throw new Error(`expected S00..S25, got ${screenIds.length}: ${screenIds.join(',')}`);
for(const marker of ['.rc-screen','.rc-document','.rc-split','@media(max-width:620px)']) if(!css.includes(marker)) throw new Error(`styles missing marker: ${marker}`);

const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(candidate=>fs.existsSync(candidate));
if(!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);
const contentTypes=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml']]);
const server=http.createServer((request,response)=>{
  const url=new URL(request.url||'/','http://127.0.0.1');
  const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath=path.resolve(siteRoot,relative||'index.html');
  if(!filePath.startsWith(`${siteRoot}${path.sep}`)||!fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type',contentTypes.get(path.extname(filePath))||'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const runChrome=(args)=>new Promise((resolve,reject)=>{
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
  child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);child.on('error',reject);
  child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1800)}`)));
});
const dimensions=(file)=>{const bytes=fs.readFileSync(file);return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};};
const viewports=[{name:'desktop',width:1440,height:1200},{name:'mobile',width:390,height:844}];
const results=[];

try{
  for(const viewport of viewports){
    const url=`http://127.0.0.1:${port}/${route}`;
    const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1',`--window-size=${viewport.width},${viewport.height}`,'--virtual-time-budget=1600'];
    const screenshot=path.join(outDir,`opening-${viewport.name}.png`);
    await runChrome([...common,`--screenshot=${screenshot}`,url]);
    const {stdout:dom}=await runChrome([...common,'--dump-dom',url]);
    for(const marker of ['data-screen="S00"','АРХИВНОЕ ДЕЛО №71-05','Начать расследование','data-rc-overflow="false"']) if(!dom.includes(marker)) throw new Error(`${viewport.name}: DOM missing ${marker}`);
    for(const spoiler of ['Дональд Маршалл','Рой Эбсари','Сэнди Сил','manslaughter']) if(dom.includes(spoiler)) throw new Error(`${viewport.name}: opening spoiler leaked into rendered DOM: ${spoiler}`);
    if(dom.includes('rc-document">')) throw new Error(`${viewport.name}: evidence document rendered before start`);
    const size=dimensions(screenshot);
    if(size.width!==viewport.width||size.height!==viewport.height||size.bytes<18_000) throw new Error(`${viewport.name}: bad screenshot ${JSON.stringify(size)}`);
    results.push({viewport:viewport.name,...size,screenshot:path.basename(screenshot)});
  }
}finally{
  await new Promise(resolve=>server.close(resolve));
}

const report={version:'0.1.0',route,screens:screenIds.length,chrome,results};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
