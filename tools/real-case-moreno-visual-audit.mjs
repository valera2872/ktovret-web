#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=process.env.SITE_ROOT?path.resolve(process.env.SITE_ROOT):path.resolve(here,'..');
const route='realnye-dela/pozharnaya-lestnica-1991/index.html';
const outDir=path.join(root,'artifacts','real-case-moreno','visual-audit');
fs.mkdirSync(outDir,{recursive:true});
const stages=['opening','scene','trajectory','trajectoryResult','occupants','alibi','investigate','synthesis','reveal'];
const viewports=[{name:'desktop',width:1440,height:1200},{name:'mobile',width:390,height:844}];
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
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stderr='';
  child.stderr.on('data',chunk=>stderr+=chunk);child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1400)}`)));
});
const dimensions=(file)=>{const bytes=fs.readFileSync(file);return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};};
const results=[];
try{
  for(const viewport of viewports){
    for(const stage of stages){
      const screenshot=path.join(outDir,`${stage}-${viewport.name}.png`);
      await runChrome(['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1',`--window-size=${viewport.width},${viewport.height}`,'--virtual-time-budget=2300',`--screenshot=${screenshot}`,`http://127.0.0.1:${port}/${route}?smokeStage=${stage}`]);
      const size=dimensions(screenshot);
      if(size.width!==viewport.width||size.height!==viewport.height||size.bytes<14000) throw new Error(`${stage}/${viewport.name}: bad screenshot ${JSON.stringify(size)}`);
      results.push({stage,viewport:viewport.name,...size,file:path.basename(screenshot)});
    }
  }
}finally{
  await new Promise(resolve=>server.close(resolve));
}
const report={version:'0.1.0',route,stages:stages.length,viewports,screenshots:results.length,results};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({version:report.version,stages:report.stages,screenshots:report.screenshots},null,2));
