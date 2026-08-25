#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const siteRoot=process.env.SITE_ROOT?path.resolve(process.env.SITE_ROOT):path.resolve(here,'..');
const route='realnye-dela/arhiv-71-05/index.html';
const outDir=path.join(siteRoot,'artifacts','real-case-marshall','visual-audit');
fs.mkdirSync(outDir,{recursive:true});
const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(candidate=>fs.existsSync(candidate));
if(!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);
const types=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml'],['.webp','image/webp'],['.png','image/png']]);
const server=http.createServer((request,response)=>{
  const url=new URL(request.url||'/','http://127.0.0.1');
  const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath=path.resolve(siteRoot,relative||'index.html');
  if(!filePath.startsWith(`${siteRoot}${path.sep}`)||!fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type',types.get(path.extname(filePath).toLowerCase())||'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const runChrome=(args)=>new Promise((resolve,reject)=>{
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stderr='';
  child.stderr.on('data',chunk=>stderr+=chunk);child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1800)}`)));
});
const dimensions=(file)=>{const bytes=fs.readFileSync(file);return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};};
const viewports=[{name:'desktop',width:1440,height:1200},{name:'mobile',width:390,height:844}];
const states=[
  {name:'opening',query:''},
  {name:'desk',query:'desk'},
  {name:'witnesses',query:'witnesses'},
  {name:'june4',query:'june4'},
  {name:'contradictions',query:'contradictions'},
  {name:'decision',query:'decision'},
  {name:'later',query:'later'},
  {name:'commission',query:'commission'},
  {name:'reveal',query:'reveal'},
  {name:'sources',query:'sources'},
  {name:'epilogue',query:'epilogue'}
];
const results=[];
try{
  for(const viewport of viewports){
    const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1',`--window-size=${viewport.width},${viewport.height}`,'--virtual-time-budget=2000'];
    for(const state of states){
      const url=`http://127.0.0.1:${port}/${route}${state.query?`?smokeStage=${state.query}`:''}`;
      const screenshot=path.join(outDir,`v2-${state.name}-${viewport.name}.png`);
      await runChrome([...common,`--screenshot=${screenshot}`,url]);
      const size=dimensions(screenshot);
      if(size.width!==viewport.width||size.height!==viewport.height||size.bytes<15_000) throw new Error(`${state.name}/${viewport.name}: bad screenshot ${JSON.stringify(size)}`);
      results.push({state:state.name,viewport:viewport.name,...size,screenshot:path.basename(screenshot)});
    }
  }
}finally{await new Promise(resolve=>server.close(resolve));}
const report={version:'2.0.0',route,purpose:'investigator-driven graph visual audit',states:states.map(item=>item.name),viewports,screenshots:results.length,results};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({version:report.version,states:report.states.length,screenshots:report.screenshots,viewports},null,2));
