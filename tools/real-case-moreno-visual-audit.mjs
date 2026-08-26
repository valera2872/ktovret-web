#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=process.env.SITE_ROOT?path.resolve(process.env.SITE_ROOT):path.resolve(here,'..');
const route='realnye-dela/pozharnaya-lestnica-1991/index.html';
const outDir=path.join(root,'artifacts','real-case-moreno','visual-audit');fs.mkdirSync(outDir,{recursive:true});
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);if(!chrome)throw new Error('chrome missing');
const types=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml']]);
const server=http.createServer((req,res)=>{const u=new URL(req.url||'/','http://127.0.0.1');const rel=decodeURIComponent(u.pathname).replace(/^\/+/, '');const file=path.resolve(root,rel||'index.html');if(!file.startsWith(`${root}${path.sep}`)||!fs.existsSync(file))return res.writeHead(404).end('Not found');res.setHeader('Content-Type',types.get(path.extname(file))||'application/octet-stream');res.end(fs.readFileSync(file));});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const run=(args)=>new Promise((resolve,reject)=>{const p=spawn(chrome,args,{stdio:['ignore','ignore','pipe']});let err='';p.stderr.on('data',c=>err+=c);p.on('error',reject);p.on('close',code=>code===0?resolve():reject(new Error(err.slice(-1200))));});
const stages=['opening','desk','forensics','forensicsResult','witness','weapons','alibi','conclusion','deadend','reveal'];const viewports=[['desktop',1440,1100],['mobile',390,844]];const results=[];
try{for(const [name,w,h] of viewports){for(const stage of stages){const file=path.join(outDir,`${stage}-${name}.png`);await run(['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1',`--window-size=${w},${h}`,'--virtual-time-budget=2200',`--screenshot=${file}`,`http://127.0.0.1:${port}/${route}?smokeStage=${stage}`]);const stat=fs.statSync(file);if(stat.size<15000)throw new Error(`${stage}/${name} screenshot too small`);results.push({stage,viewport:name,bytes:stat.size});}}}finally{await new Promise(r=>server.close(r));}
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({version:'0.2.0',screenshots:results.length,stages,viewports:viewports.map(([name,width,height])=>({name,width,height})),results},null,2));console.log(JSON.stringify({version:'0.2.0',screenshots:results.length},null,2));
