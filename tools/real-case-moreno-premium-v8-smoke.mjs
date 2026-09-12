#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('Chrome missing');
const out=path.join(root,'artifacts','real-case-moreno-v8');fs.mkdirSync(out,{recursive:true});
const state={view:'desk',completed:['people','interview','witnessLocated','canvass','motive'],journal:[{command:'опросить всех жильцов, проверить конфликты и опросить соседей',items:[{title:'Опрос жильцов квартиры',body:'Получены показания жильцов.','kind':'statement'},{title:'Проверка отношений и конфликтов',body:'Проверены известные конфликтные линии.','kind':'result'},{title:'Поквартирный поиск дал контакт',body:'Найден бывший житель второго этажа.','kind':'result'},{title:'Опрос бывшего жильца второго этажа',body:'Получено независимое наблюдение.','kind':'statement'}]}],hypothesis:'',suspect:'',focus:'',lastTarget:'second_floor_witness',submitted:false,sessionId:'moreno-v8-ci-structural',aiState:'online'};
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/mysterylogic.css"><link rel="stylesheet" href="/assets/real-case-moreno-sandbox.css"><link rel="stylesheet" href="/assets/real-case-moreno-compact.css"><link rel="stylesheet" href="/assets/real-case-moreno-v6.css"><link rel="stylesheet" href="/assets/real-case-moreno-premium-v7.css"><link rel="stylesheet" href="/assets/real-case-moreno-premium-v8.css"></head><body class="moreno-body"><header class="ml-brand-strip"><div class="ml-brand-strip-inner"><span class="ml-brand-copy"><strong>Mystery Logic</strong></span><span class="moreno-header-note">PREMIUM STRUCTURE · v0.8</span></div></header><main data-moreno-app></main><script>window.MLMorenoBudget={visitorId:()=> 'v-moreno-v8-ci'};localStorage.setItem('ml-realcase-moreno-ai-v6',JSON.stringify(${JSON.stringify(state)}));</script><script src="/assets/real-case-moreno-ai-v6.js"></script><script src="/assets/real-case-moreno-premium-v8.js"></script></body></html>`;
const types=new Map([['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8']]);
const server=http.createServer((req,res)=>{const u=new URL(req.url||'/','http://x');if(u.pathname==='/preview.html'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html)}const fp=path.resolve(root,u.pathname.replace(/^\/+/,''));if(!fp.startsWith(root+path.sep)||!fs.existsSync(fp)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types.get(path.extname(fp))||'application/octet-stream');res.end(fs.readFileSync(fp))});
const port=await new Promise(r=>server.listen(0,'127.0.0.1',()=>r(server.address().port)));
function run(args,capture=false){return new Promise((resolve,reject)=>{const c=spawn(chrome,args);let stdout='',stderr='';c.stdout?.on('data',d=>stdout+=d);c.stderr?.on('data',d=>stderr+=d);c.on('close',code=>code===0?resolve(capture?stdout:''):reject(new Error(stderr||`chrome ${code}`)))})}
try{
  const url=`http://127.0.0.1:${port}/preview.html`;
  const dom=await run(['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--virtual-time-budget=1500','--dump-dom',url],true);
  for(const required of ['moreno-v8','v8-scene-rail','PREMIUM STRUCTURE · v0.8','v8-case-status','v8-composer-cap'])if(!dom.includes(required))throw new Error(`premium v0.8 missing ${required}`);
  if((dom.match(/v8-scene-rail/g)||[]).length!==1)throw new Error('scene rail duplication');
  const shot=path.join(out,'premium-v8-desktop.png');
  await run(['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--window-size=1600,1050','--force-device-scale-factor=1','--hide-scrollbars','--virtual-time-budget=1500',`--screenshot=${shot}`,url]);
  if(!fs.existsSync(shot)||fs.statSync(shot).size<50000)throw new Error('premium screenshot missing/small');
  fs.writeFileSync(path.join(out,'smoke.json'),JSON.stringify({version:'0.8.0',structural:true,screenshot:path.basename(shot)},null,2));
  console.log(JSON.stringify({version:'0.8.0',structural:true,status:'ok'},null,2));
}finally{await new Promise(r=>server.close(r))}
