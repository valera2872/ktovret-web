#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const outDir = path.join(siteRoot, 'artifacts', 'room-2317-detective-v3');
fs.mkdirSync(outDir, { recursive: true });
const chrome = [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean).find(fs.existsSync);
if (!chrome) throw new Error('Chrome/Chromium not found');

const ctx = { window: {} };
for (const file of ['assets/case-2317-data.js','assets/case-2317-detective-v3.js','assets/case-2317-timeline-v31.js']) vm.runInNewContext(fs.readFileSync(path.join(siteRoot,file),'utf8'), ctx, { filename:file });
const data = ctx.window.MLCase2317;
if (data.logicVersion !== 3 || data.proofRevision !== '3.4' || data.coopRevision !== '3.4') throw new Error('23:17 v3.4 overlays did not apply');

const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const card=(item,index)=>`<article class="case2317-evidence" data-index="${String(index+1).padStart(2,'0')}"><span class="tag">${esc(item.tag)}</span><h3>${esc(item.title)}</h3>${(item.body||[]).map(t=>`<p>${esc(t)}</p>`).join('')}${(item.messages||[]).map(([n,t])=>`<div class="case2317-message"><b>${esc(n)}</b>${esc(t)}</div>`).join('')}${item.quote?`<blockquote>${esc(item.quote)}</blockquote>`:''}${(item.facts||[]).length?`<div class="case2317-facts">${item.facts.map(f=>`<span>${esc(f)}</span>`).join('')}</div>`:''}${item.stamp?`<span class="case2317-stamp">${esc(item.stamp)}</span>`:''}</article>`;
const roleMeta={investigator:'СЛЕДОВАТЕЛЬ',analyst:'АНАЛИТИК'};
const page=(stage,role)=>`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="../../assets/mysterylogic.css"><link rel="stylesheet" href="../../assets/premium.css"><link rel="stylesheet" href="../../assets/case-2317.css"><link rel="stylesheet" href="../../assets/case-2317-v2.css"><style>body{margin:0}.preview{max-width:1180px;margin:auto;padding:28px 18px 80px}.head{margin-bottom:18px;padding:18px;border:1px solid rgba(213,164,86,.22);background:#06131c}.head small{color:#b98741}.head h1{margin:6px 0;color:#ead8bb;font:400 36px Georgia,serif}.head p{color:#a89b89}.case2317-evidence-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}@media(max-width:760px){.preview{padding:16px 10px 60px}.case2317-evidence-grid{grid-template-columns:1fr}.head h1{font-size:30px}}</style></head><body class="case2317-body"><main class="preview"><section class="head"><small>ЭТАП ${stage.id} · ${roleMeta[role]}</small><h1>${esc(stage.title)}</h1><p>${esc(stage.objective)}</p></section><div class="case2317-evidence-grid">${stage[role].map(card).join('')}</div></main><script>setTimeout(()=>document.body.dataset.overflow=String(document.documentElement.scrollWidth>window.innerWidth+1),300)</script></body></html>`;
for(const stage of data.stages) for(const role of ['investigator','analyst']) fs.writeFileSync(path.join(outDir,`stage-${stage.id}-${role}.html`),page(stage,role));

const types=new Map([['.html','text/html; charset=utf-8'],['.css','text/css; charset=utf-8'],['.js','text/javascript; charset=utf-8']]);
const server=http.createServer((req,res)=>{const u=new URL(req.url||'/','http://127.0.0.1');const rel=decodeURIComponent(u.pathname).replace(/^\/+/, '');const fp=path.resolve(siteRoot,rel);if(!fp.startsWith(`${siteRoot}${path.sep}`)||!fs.existsSync(fp))return res.writeHead(404).end('Not found');res.setHeader('Content-Type',types.get(path.extname(fp))||'application/octet-stream');res.end(fs.readFileSync(fp));});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const run=(args)=>new Promise((resolve,reject)=>{const c=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let out='',err='';c.stdout.on('data',x=>out+=x);c.stderr.on('data',x=>err+=x);c.on('error',reject);c.on('close',code=>code===0?resolve({out,err}):reject(new Error(err.slice(-1200))));});
const dims=(f)=>{const b=fs.readFileSync(f);return{width:b.readUInt32BE(16),height:b.readUInt32BE(20),bytes:b.length}};
const viewports=[{name:'desktop',width:1440,height:1900},{name:'mobile',width:390,height:2200}];
const results=[];
try{
 for(const stage of data.stages) for(const role of ['investigator','analyst']) for(const vp of viewports){
  const url=`http://127.0.0.1:${port}/artifacts/room-2317-detective-v3/stage-${stage.id}-${role}.html`;
  const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1',`--window-size=${vp.width},${vp.height}`,'--virtual-time-budget=1000'];
  const shot=path.join(outDir,`stage-${stage.id}-${role}-${vp.name}.png`);
  await run([...common,`--screenshot=${shot}`,url]); const {out:dom}=await run([...common,'--dump-dom',url]);
  if(!dom.includes('data-overflow="false"'))throw new Error(`${stage.id}/${role}/${vp.name}: horizontal overflow`);
  if((dom.match(/case2317-evidence/g)||[]).length < 2)throw new Error(`${stage.id}/${role}/${vp.name}: evidence missing`);
  if(stage.id===1&&role==='analyst'&&(!dom.includes('Личность водителя на этом пакете не установлена')||dom.includes('Илья Кравцов лично выходит')))throw new Error('stage1 analyst identity leak');
  if(stage.id===2&&role==='investigator'&&(!dom.includes('23:44:36 — Вера всё ещё остаётся в кадре кафе')||dom.includes('SP-3')))throw new Error('stage2 investigator does not own only Vera half of overlap');
  if(stage.id===2&&role==='analyst'&&(!dom.includes('23:44:36 — камера SP-3')||!dom.includes('Личность второй посетительницы — у Следователя')||dom.includes('идентифицирует Марину Соболеву и Веру Лебедеву')))throw new Error('stage2 analyst does not own only car half of overlap');
  if(stage.id===3&&role==='investigator'&&(!dom.includes('Марина сказала, что с машиной разберутся отдельно')||dom.includes('оставлю серую до утра')))throw new Error('stage3 plan rationale missing or contradictory');
  if(stage.id===3&&role==='analyst'&&(!dom.includes('00:18:32')||!dom.includes('23:55:04')||!dom.includes('повторный звонок по карточке обращения')))throw new Error('stage3 closing proof missing or title leading');
  const d=dims(shot);if(d.width!==vp.width||d.height!==vp.height||d.bytes<24000)throw new Error(`${stage.id}/${role}/${vp.name}: bad screenshot`);
  results.push({stage:stage.id,role,viewport:vp.name,...d,screenshot:path.basename(shot)});
 }
}finally{await new Promise(r=>server.close(r));}
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({logicVersion:data.logicVersion,proofRevision:data.proofRevision,coopRevision:data.coopRevision,results},null,2));
console.log(JSON.stringify({logicVersion:data.logicVersion,proofRevision:data.proofRevision,coopRevision:data.coopRevision,screenshots:results.length,results},null,2));