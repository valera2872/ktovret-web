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
 window.fetch=async()=>{
   const both=mode==='reveal';
   const view={ok:true,room:{code,caseId:'special:last-aria',caseTitle:'Последняя ария',casePath:'/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/'},me:{role,name:role==='creator'?'Алексей':'Марина',started:true,completed:both},opponent:{joined:true,role:other,name:other==='creator'?'Алексей':'Марина',started:true,completed:both},bothJoined:true,bothCompleted:both,results:both?{creator:{name:'Алексей',elapsedSeconds:2780,hintsUsed:1,attempts:1,firstAnswerCorrect:true},guest:{name:'Марина',elapsedSeconds:2910,hintsUsed:0,attempts:1,firstAnswerCorrect:true}}:null};
   return new Response(JSON.stringify(view),{status:200,headers:{'content-type':'application/json'}});
 };
 window.__ariaSmoke={role,stage,mode,code};
})();
</script><script src="/assets/case-aria-data.js"></script><script src="/assets/case-aria-fairplay-v2.js"></script><script src="/assets/case-aria-investigator-v16.js"></script><script src="/assets/case-aria.js"></script><script src="/assets/case-aria-materials-v2.js"></script><script>
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
const runChrome=(args,label)=>new Promise((resolve,reject)=>{
  const profile=fs.mkdtempSync(path.join(outDir,'.chrome-profile-'));
  const finalArgs=[`--user-data-dir=${profile}`,...args];
  const child=spawn(chrome,finalArgs,{stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='',settled=false;
  const cleanup=()=>fs.rmSync(profile,{recursive:true,force:true});
  const timer=setTimeout(()=>{
    if(settled)return;
    settled=true;
    child.kill('SIGKILL');
    cleanup();
    reject(new Error(`${label}: Chrome exceeded 25s hard timeout; stderr=${stderr.slice(-1200)}`));
  },25_000);
  child.stdout.on('data',(c)=>stdout+=c);
  child.stderr.on('data',(c)=>stderr+=c);
  child.on('error',(error)=>{
    if(settled)return;
    settled=true;clearTimeout(timer);cleanup();reject(error);
  });
  child.on('close',(code)=>{
    if(settled)return;
    settled=true;clearTimeout(timer);cleanup();
    code===0?resolve({stdout,stderr}):reject(new Error(`${label}: Chrome ${code}: ${stderr.slice(-1200)}`));
  });
});
const cases=[];for(const role of ['creator','guest'])for(const stage of [1,2,3])cases.push({role,stage,mode:'stage',name:`${role}-stage${stage}`});
cases.push({role:'creator',stage:3,mode:'final',name:'creator-final'},{role:'guest',stage:3,mode:'reveal',name:'guest-reveal'});
const report=[];
try{
  for(const item of cases){
    const url=`http://127.0.0.1:${port}/artifacts/last-aria-browser/index.html?room=ABCDEFGH&role=${item.role}&stage=${item.stage}&mode=${item.mode}`;
    const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-background-mode','--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only','--no-first-run','--safebrowsing-disable-auto-update','--disable-features=OptimizationHints,MediaRouter,PushMessaging,NotificationTriggers,Translate','--force-device-scale-factor=1','--window-size=390,1600','--virtual-time-budget=1900'];
    const screenshot=path.join(outDir,`${item.name}.png`);
    await runChrome([...common,`--screenshot=${screenshot}`,url],`${item.name}/screenshot`);
    const {stdout:dom}=await runChrome([...common,'--dump-dom',url],`${item.name}/dom`);
    if(!dom.includes('data-smoke-ready="1"'))throw new Error(`${item.name}: UI did not become ready`);
    if(!dom.includes('Последняя ария'))throw new Error(`${item.name}: case title missing`);
    if(item.mode==='stage'){
      const roleTitle=item.role==='creator'?'Сценический следователь':'Технический аналитик';
      if(!dom.includes(roleTitle)||!dom.includes(`Пакет ${item.stage} / 3`))throw new Error(`${item.name}: role/stage shell missing`);
      const cards=(dom.match(/class="casearia-evidence /g)||[]).length,artifacts=(dom.match(/class="aria-artifact /g)||[]).length;
      if(cards!==3||artifacts!==3||!dom.includes('data-materialized-v2="1"'))throw new Error(`${item.name}: materialized evidence mismatch cards=${cards} artifacts=${artifacts}`);
      if(item.stage===1&&item.role==='creator'&&(!dom.includes('14–17 секунд')||!dom.includes('дверного контакта уже открытой двери')))throw new Error('door-to-door STAIR-18 timing missing');
      if(item.stage===1&&item.role==='guest'&&(!dom.includes('1,7 м')||!dom.includes('5,2–6,1 секунды')))throw new Error('archive retrieval reconstruction missing');
      if(item.stage===2&&item.role==='guest'){
        for(const marker of ['состояние ARMED','Q-17B','+10,0','+16,0','+23,0','присутствие человека у панели уже не требуется'])if(!dom.includes(marker))throw new Error(`analyst playback-chain marker missing: ${marker}`);
      }
      if(item.stage===3&&item.role==='creator'&&(!dom.includes('31 × 24 × 0,8 см')||!dom.includes('38 × 29 × 6,4 см')))throw new Error('score-to-case physical fit missing');
      if(item.stage===3&&item.role==='guest'&&(!dom.includes('RFI-1')||!dom.includes('LOCAL-ARM')))throw new Error('stage3 technical containment/arm evidence missing');
    }
    if(item.mode==='final'){
      for(const marker of ['casearia-final-form','name="evidence"','Что произошло в 21:49?','Отметьте шесть ключевых связок','B-3 + P-771','PB-2 + TAKE-6 + C-2','cue-trigger Q-17B','безымянный ключ того же профиля изъят при нём','RFI-1 + MS-1908 + T-6M'])if(!dom.includes(marker))throw new Error(`final proof marker missing: ${marker}`);
    }
    if(item.mode==='reveal'){
      for(const marker of ['Заключение следственной группы','Партитуру украли','Маэстро расследования','21:48:54','C-2','Q-17B','+10/+16/+23','RFI-1','5,2–6,1 секунды'])if(!dom.includes(marker))throw new Error(`reveal marker missing: ${marker}`);
    }
    const bytes=fs.statSync(screenshot).size;if(bytes<30_000)throw new Error(`${item.name}: screenshot too small ${bytes}`);
    report.push({...item,bytes});
  }
  fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({screens:report.length,materializedEvidence:true,compactMobileHeader:true,investigatorProofGate:true,investigatorRevision:'1.6',playbackCueTriggered:true,views:report},null,2));
  console.log(JSON.stringify({screens:report.length,stageViews:6,materializedStageArtifacts:18,compactMobileHeader:true,investigatorProofGate:true,investigatorRevision:'1.6',playbackCueTriggered:true,final:true,reveal:true,minBytes:Math.min(...report.map((x)=>x.bytes))},null,2));
}finally{await new Promise((resolve)=>server.close(resolve));}
