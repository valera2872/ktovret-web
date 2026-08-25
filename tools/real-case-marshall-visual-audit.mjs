#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const siteRoot=process.env.SITE_ROOT?path.resolve(process.env.SITE_ROOT):path.resolve(here,'..');
const route='realnye-dela/arhiv-71-05/index.html';
const outDir=path.join(siteRoot,'artifacts','real-case-marshall','visual-audit');
fs.mkdirSync(outDir,{recursive:true});

const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(candidate=>fs.existsSync(candidate));
if(!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const contentTypes=new Map([
  ['.html','text/html; charset=utf-8'],
  ['.js','text/javascript; charset=utf-8'],
  ['.css','text/css; charset=utf-8'],
  ['.svg','image/svg+xml'],
  ['.webp','image/webp'],
  ['.png','image/png'],
  ['.jpg','image/jpeg'],
  ['.jpeg','image/jpeg'],
]);

const server=http.createServer((request,response)=>{
  const url=new URL(request.url||'/','http://127.0.0.1');
  const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath=path.resolve(siteRoot,relative||'index.html');
  if(!filePath.startsWith(`${siteRoot}${path.sep}`)||!fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type',contentTypes.get(path.extname(filePath).toLowerCase())||'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});

const port=await new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>resolve(server.address().port));
});

const runChrome=(args)=>new Promise((resolve,reject)=>{
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';
  child.stdout.on('data',chunk=>stdout+=chunk);
  child.stderr.on('data',chunk=>stderr+=chunk);
  child.on('error',reject);
  child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1800)}`)));
});

const dimensions=(file)=>{
  const bytes=fs.readFileSync(file);
  return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length};
};

const viewports=[
  {name:'desktop',width:1440,height:1200},
  {name:'mobile',width:390,height:844},
];
const results=[];

try{
  for(const viewport of viewports){
    const common=[
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--force-device-scale-factor=1',
      `--window-size=${viewport.width},${viewport.height}`,
      '--virtual-time-budget=2400',
    ];
    for(let screen=0;screen<=25;screen++){
      const id=`S${String(screen).padStart(2,'0')}`;
      const url=`http://127.0.0.1:${port}/${route}?smokeScreen=${screen}`;
      const screenshot=path.join(outDir,`${id}-${viewport.name}.png`);
      await runChrome([...common,`--screenshot=${screenshot}`,url]);
      const size=dimensions(screenshot);
      if(size.width!==viewport.width||size.height!==viewport.height||size.bytes<18_000) throw new Error(`${id}/${viewport.name}: bad screenshot ${JSON.stringify(size)}`);
      results.push({screen:id,viewport:viewport.name,...size,screenshot:path.basename(screenshot)});
    }
  }
}finally{
  await new Promise(resolve=>server.close(resolve));
}

const report={
  version:'1.0.0',
  route,
  purpose:'full premium visual review',
  screens:26,
  viewports:viewports.map(({name,width,height})=>({name,width,height})),
  screenshots:results.length,
  results,
};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({version:report.version,screens:report.screens,screenshots:report.screenshots,viewports:report.viewports},null,2));
