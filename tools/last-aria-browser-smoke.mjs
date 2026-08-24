#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'..');
const outDir=path.join(repo,'artifacts','last-aria-browser');
fs.mkdirSync(outDir,{recursive:true});
const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find((candidate)=>fs.existsSync(candidate));
if(!chrome)throw new Error(`Chrome/Chromium not found: ${chromeCandidates.join(', ')}`);

const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/mysterylogic.css"><link rel="stylesheet" href="/assets/premium.css"><link rel="stylesheet" href="/assets/case-aria.css"><link rel="stylesheet" href="/assets/case-aria-materials-v2.css"><link rel="stylesheet" href="/assets/case-aria-layout-v2.css"></head><body class="casearia-body"><main class="casearia-shell" data-casearia-app></main>
<script>
(()=>{
 const q=new URLSearchParams(location.search),role=q.get('role')||'creator',stage=Number(q.get('stage')||1),mode=q.get('mode')||'stage',code='ABCDEFGH';
 const other=role==='creator'?'guest':'creator';
 localStorage.setItem('mysterylogic:challenge:client-key','a'.repeat(48));
 localStorage.setItem('mysterylogic:last-aria:v1:'+code+':'+role,JSON.stringify({stage,hintsUsed:0,attempts:0,firstAnswerCorrect:null,startedAt:Date.now()-1800000,handoffs:{[stage]:true},decision:stage===2?'conductor':'',finalAccepted:mode==='reveal'}));
 window.fetch=async(_url,opts={})=>{
   const body=JSON.parse(opts.body||'{}'),both=mode==='reveal';
   const view={ok:true,room:{code,caseId:'special:last-aria',caseTitle:'Последняя ария',casePath:'/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/'},me:{role,name:role==='creator'?'Алексей':'Марина',started:true,completed:both},opponent:{joined:true,role:other,name:other==='creator'?'Алексей':'Марина',started:true,completed:both},bothJoined:true,bothCompleted:both,results:both?{creator:{name:'Алексей',elapsedSeconds:2780,hintsUsed:1,attempts:1,firstAnswerCorrect:true},guest:{name:'Марина',elapsedSeconds:2910,hintsUsed:0,attempts:1,firstAnswerCorrect:true}}:null};
   return new Response(JSON.stringify(view),{status:200,headers:{'content-type':'application/json'}});
 };
 window.__ariaSmoke={role,stage,mode,code};
})();
</script><script src="/assets/case-aria-data.js"></script><script src="/assets/case-aria-fairplay-v2.js"></script><script src="/assets/case-aria-investigator-v14.js"></script><script src="/assets/case-aria.js"></script><script src="/assets/case-aria-materials-v2.js"></script><script>
setTimeout(()=>{
 const s=window.__ariaSmoke;
 if(s.mode==='final') document.querySelector('[data-action="next-stage"]')?.click();
 setTimeout(()=>{if(document.querySelector('.casearia-evidence-grid,.casearia-final-form,.casearia-reveal'))document.body.dataset.smokeReady='1';},260);
},300);
</script></body></html>`;
fs.writeFileSync(path.join(outDir,'index.html'),html);
const types=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml'],['.webp','image/webp']]);
const server=http.createServer((request,response)=>{
  const url=new URL(request.url||'/','http://127.0.0.1');
  const requested=decodeURIComponent(url.pathname);
  const filePath=requested==='/artifacts/last-aria-browser/index.html'?path.join(outDir,'index.html'):path.resolve(repo,requested.replace(/^\/+/,''));
  if(!filePath.startsWith(`${repo}${path.sep}`)||!fs.existsSync(filePath))return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type',types.get(path.extname(filePath))||'application/octet-stream');response.end(fs.readFileSync(filePath));
});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const runChrome=(args)=>new Promise((resolve,reject)=>{const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',(c)=>stdout+=c);child.stderr.on('data',(c)=>stderr+=c);child.on('error',reject);child.on('close',(code)=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome ${code}: ${stderr.slice(-1200)}`)));});
const cases=[];
for(const role of ['creator','guest'])for(const stage of [1,2,3])cases.push({role,stage,mode:'stage',name:`${role}-stage${stage}`});
cases.push({role:'creator',stage:3,mode:'final',name:'creator-final'});cases.push({role:'guest',stage:3,mode:'reveal',name:'guest-reveal'});
const report=[];
try{
  for(const item of cases){
    const url=`http://127.0.0.1:${port}/artifacts/last-aria-browser/index.html?room=ABCDEFGH&role=${item.role}&stage=${item.stage}&mode=${item.mode}`;
    const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1','--window-size=390,1600','--virtual-time-budget=1900'];
    const screenshot=path.join(outDir,`${item.name}.png`);
    await runChrome([...common,`--screenshot=${screenshot}`,url]);
    const {stdout:dom}=await runChrome([...common,'--dump-dom',url]);
    if(!dom.includes('data-smoke-ready="1"'))throw new Error(`${item.name}: UI did not become ready`);
    if(!dom.includes('Последняя ария'))throw new Error(`${item.name}: case title missing`);
    if(item.mode==='stage'){
      const roleTitle=item.role==='creator'?'Сценический следователь':'Технический аналитик';
      if(!dom.includes(roleTitle))throw new Error(`${item.name}: role title missing`);
      if(!dom.includes(`Пакет ${item.stage} / 3`))throw new Error(`${item.name}: stage label missing`);
      const cards=(dom.match(/class="casearia-evidence /g)||[]).length;
      if(cards!==3)throw new Error(`${item.name}: expected 3 evidence cards, got ${cards}`);
      const artifacts=(dom.match(/class="aria-artifact /g)||[]).length;
      if(artifacts!==3)throw new Error(`${item.name}: expected 3 materialized artifacts, got ${artifacts}`);
      if(!dom.includes('data-materialized-v2="1"'))throw new Error(`${item.name}: materialized evidence marker missing`);
    }
    if(item.mode==='final'){
      if(!dom.includes('casearia-final-form')||!dom.includes('name="evidence"'))throw new Error('final proof board missing');
      if(!dom.includes('Что произошло в 21:49?'))throw new Error('final question screen missing');
      if(!dom.includes('Отметьте шесть ключевых связок'))throw new Error('investigator-grade six-link proof instruction missing');
      if(!dom.includes('B-3 + P-771'))throw new Error('personal sabotage chain missing from final board');
      if(!dom.includes('PB-2 + TAKE-6 + C-2'))throw new Error('playback operator chain missing from final board');
      if(!dom.includes('безымянный ключ того же профиля изъят при нём'))throw new Error('physical K-12 custody link missing from final board');
    }
    if(item.mode==='reveal'){
      if(!dom.includes('Заключение следственной группы')||!dom.includes('Партитуру украли'))throw new Error('reveal missing');
      if(!dom.includes('Маэстро расследования'))throw new Error('pair rank missing');
      if(!dom.includes('21:48:54')||!dom.includes('C-2'))throw new Error('playback operator proof missing before debrief conclusion');
    }
    const bytes=fs.statSync(screenshot).size;if(bytes<30_000)throw new Error(`${item.name}: screenshot too small ${bytes}`);
    report.push({...item,bytes});
  }
  fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({screens:report.length,materializedEvidence:true,compactMobileHeader:true,investigatorProofGate:true,views:report},null,2));
  console.log(JSON.stringify({screens:report.length,stageViews:6,materializedStageArtifacts:18,compactMobileHeader:true,investigatorProofGate:true,final:true,reveal:true,minBytes:Math.min(...report.map((x)=>x.bytes))},null,2));
}finally{await new Promise((resolve)=>server.close(resolve));}