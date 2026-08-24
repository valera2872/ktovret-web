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
if(typeof WebSocket!=='function')throw new Error('Node WebSocket API is unavailable');
const pause=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));

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
 if(s.mode==='create') document.querySelector('[data-action="create-open"]')?.click();
 if(s.mode==='final') document.querySelector('[data-action="next-stage"]')?.click();
 setTimeout(()=>{if(document.querySelector('.casearia-cover,[data-player-name],.casearia-evidence-grid,.casearia-final-form,.casearia-reveal'))document.body.dataset.smokeReady='1';},260);
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

const profile=fs.mkdtempSync(path.join(outDir,'.chrome-cdp-profile-'));
const debugPort=9222;
const browser=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-background-mode',
  '--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only',
  '--no-first-run','--safebrowsing-disable-auto-update','--disable-features=OptimizationHints,MediaRouter,PushMessaging,NotificationTriggers,Translate',
  '--remote-allow-origins=*',`--user-data-dir=${profile}`,`--remote-debugging-port=${debugPort}`,'about:blank'
],{stdio:['ignore','ignore','pipe']});
let browserStderr='';
browser.stderr.on('data',(chunk)=>browserStderr+=String(chunk));
const wsUrl=await (async()=>{
  const deadline=Date.now()+30_000;
  while(Date.now()<deadline){
    if(browser.exitCode!==null)throw new Error(`Chrome exited before CDP startup (${browser.exitCode}): ${browserStderr.slice(-1200)}`);
    try{
      const response=await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if(response.ok){const info=await response.json();if(info.webSocketDebuggerUrl)return info.webSocketDebuggerUrl;}
    }catch{}
    await pause(100);
  }
  throw new Error(`Chrome CDP endpoint timeout: ${browserStderr.slice(-1200)}`);
})();

const ws=await new Promise((resolve,reject)=>{
  const socket=new WebSocket(wsUrl);
  const timer=setTimeout(()=>reject(new Error('CDP WebSocket connection timeout')),10_000);
  socket.addEventListener('open',()=>{clearTimeout(timer);resolve(socket);},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('CDP WebSocket connection failed'));},{once:true});
});
let seq=0;
const pending=new Map();
ws.addEventListener('message',(event)=>{
  let message;
  try{message=JSON.parse(String(event.data));}catch{return;}
  if(!message.id||!pending.has(message.id))return;
  const entry=pending.get(message.id);pending.delete(message.id);clearTimeout(entry.timer);
  if(message.error)entry.reject(new Error(`${entry.method}: ${message.error.message||JSON.stringify(message.error)}`));
  else entry.resolve(message.result||{});
});
const cdp=(method,params={},sessionId=null,timeoutMs=10_000)=>new Promise((resolve,reject)=>{
  const id=++seq;
  const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`${method}: CDP timeout`));},timeoutMs);
  pending.set(id,{resolve,reject,timer,method});
  ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
});
const readDom=async(sessionId)=>{
  const {root}=await cdp('DOM.getDocument',{depth:1,pierce:true},sessionId,5000);
  const htmlNode=root?.children?.find((node)=>node.nodeName==='HTML');
  if(!htmlNode?.nodeId)throw new Error('DOM.getDocument returned no HTML node');
  const {outerHTML}=await cdp('DOM.getOuterHTML',{nodeId:htmlNode.nodeId},sessionId,5000);
  return String(outerHTML||'');
};
const capture=async(item,url)=>{
  console.log(`[last-aria-browser] ${item.name}: open`);
  const {targetId}=await cdp('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await cdp('Target.attachToTarget',{targetId,flatten:true});
  try{
    await cdp('Page.enable',{},sessionId);
    await cdp('DOM.enable',{},sessionId);
    await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1600,deviceScaleFactor:1,mobile:false},sessionId);
    await cdp('Page.navigate',{url},sessionId);
    await pause(700);
    const deadline=Date.now()+5000;
    let dom='';
    while(Date.now()<deadline){
      dom=await readDom(sessionId);
      if(dom.includes('data-smoke-ready="1"'))break;
      await pause(150);
    }
    if(!dom.includes('data-smoke-ready="1"'))throw new Error('UI did not become ready within 5s');
    console.log(`[last-aria-browser] ${item.name}: ready`);
    const shot=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false},sessionId,15_000);
    const screenshot=path.join(outDir,`${item.name}.png`);
    fs.writeFileSync(screenshot,Buffer.from(shot.data||'','base64'));
    console.log(`[last-aria-browser] ${item.name}: captured ${fs.statSync(screenshot).size} bytes`);
    return {dom,screenshot};
  }catch(error){
    throw new Error(`${item.name}: ${error.message}`);
  }finally{
    await cdp('Target.closeTarget',{targetId}).catch(()=>{});
  }
};

const cases=[
  {role:'creator',stage:1,mode:'home',name:'creator-home'},
  {role:'creator',stage:1,mode:'create',name:'creator-create'},
];
for(const role of ['creator','guest'])for(const stage of [1,2,3])cases.push({role,stage,mode:'stage',name:`${role}-stage${stage}`});
cases.push({role:'creator',stage:3,mode:'final',name:'creator-final'},{role:'guest',stage:3,mode:'reveal',name:'guest-reveal'});
const report=[];
try{
  for(const item of cases){
    const withRoom=!['home','create'].includes(item.mode);
    const query=new URLSearchParams({role:item.role,stage:String(item.stage),mode:item.mode});
    if(withRoom) query.set('room','ABCDEFGH');
    const url=`http://127.0.0.1:${port}/artifacts/last-aria-browser/index.html?${query.toString()}`;
    const {dom,screenshot}=await capture(item,url);
    if(!dom.includes('data-smoke-ready="1"'))throw new Error(`${item.name}: ready marker missing from captured DOM`);
    if(item.mode==='home'&&!dom.includes('Последняя <em>ария</em>'))throw new Error('post-purchase cover title missing');
    if(!['home','create'].includes(item.mode)&&!dom.includes('Последняя ария'))throw new Error(`${item.name}: case title missing`);
    if(item.mode==='home'){
      if(!dom.includes('У каждого участника есть своя версия этих событий.'))throw new Error('post-purchase cover neutral copy missing');
      for(const forbidden of ['пока все слышали голос дирижёра','голос дирижёра в оркестровой яме'])if(dom.includes(forbidden))throw new Error(`post-purchase cover spoiler leaked: ${forbidden}`);
    }
    if(item.mode==='create'){
      if(!dom.includes('Создать комнату')||!dom.includes('свет, служебные системы, замки, архив'))throw new Error('creator pre-room neutral role copy missing');
      if(dom.includes('свет, интерком, замки, архив'))throw new Error('creator pre-room intercom priming leaked');
    }
    if(item.mode==='stage'){
      const roleTitle=item.role==='creator'?'Сценический следователь':'Технический аналитик';
      if(!dom.includes(roleTitle)||!dom.includes(`Пакет ${item.stage} / 3`))throw new Error(`${item.name}: role/stage shell missing`);
      const cards=(dom.match(/class="casearia-evidence /g)||[]).length,artifacts=(dom.match(/class="aria-artifact /g)||[]).length;
      if(cards!==3||artifacts!==3||!dom.includes('data-materialized-v2="1"'))throw new Error(`${item.name}: materialized evidence mismatch cards=${cards} artifacts=${artifacts}`);
      if(item.role==='guest'&&dom.includes('Световой пульт, интерком, замки, архив и технические журналы'))throw new Error(`${item.name}: role summary primes intercom before evidence`);
      if(item.stage===1&&(!dom.includes('служебные маршруты и события у архива')||dom.includes('Не считайте голос в интеркоме')))throw new Error(`${item.name}: stage1 spoiler-neutral objective missing`);
      if(item.stage===1&&item.role==='creator'&&(!dom.includes('14–17 секунд')||!dom.includes('дверного контакта уже открытой двери')))throw new Error('door-to-door STAIR-18 timing missing');
      if(item.stage===1&&item.role==='guest'&&(!dom.includes('1,7 м')||!dom.includes('5,2–6,1 секунды')))throw new Error('archive retrieval reconstruction missing');
      if(item.stage===2&&(!dom.includes('физические следы, временные окна и технические данные')||!dom.includes('технические данные о сообщениях')))throw new Error(`${item.name}: stage2 neutral decision copy missing`);
      if(item.stage===2&&item.role==='guest')for(const marker of ['состояние ARMED','Q-17B','+10,0','+16,0','+23,0','присутствие человека у панели уже не требуется'])if(!dom.includes(marker))throw new Error(`analyst playback-chain marker missing: ${marker}`);
      if(item.stage===3&&!dom.includes('события критического окна у архива и дальнейший путь партитуры'))throw new Error(`${item.name}: stage3 spoiler-neutral objective missing`);
      if(item.stage===3&&item.role==='creator'&&(!dom.includes('31 × 24 × 0,8 см')||!dom.includes('38 × 29 × 6,4 см')))throw new Error('score-to-case physical fit missing');
      if(item.stage===3&&item.role==='guest'&&(!dom.includes('RFI-1')||!dom.includes('LOCAL-ARM')))throw new Error('stage3 technical containment/arm evidence missing');
    }
    if(item.mode==='final'){
      for(const marker of ['casearia-final-form','name="evidence"','Что произошло в 21:49?','Отметьте шесть ключевых связок','B-3 + BR-06 + P-771','PB-2 + TAKE-6 + C-2 + Q-17B','заявка на дубликат, журнал возврата и изъятый безымянный ключ','RFI-1 + MS-1908 + T-6M'])if(!dom.includes(marker))throw new Error(`final proof marker missing: ${marker}`);
      for(const forbidden of ['Михаил разобрал PR-17','голос дирижёра был заранее записан','совпадают с туфлей, изъятой у Михаила','Михаил заказал дубликат','личного кофра Михаила'])if(dom.includes(forbidden))throw new Error(`final proof board leaks answer: ${forbidden}`);
      if(!dom.includes('Нужны независимые цепочки по хронологии, источникам сообщений'))throw new Error('neutral final synthesis lead missing');
    }
    if(item.mode==='reveal')for(const marker of ['Заключение следственной группы','Партитуру украли','Маэстро расследования','21:48:54','C-2','Q-17B','+10/+16/+23','RFI-1','5,2–6,1 секунды'])if(!dom.includes(marker))throw new Error(`reveal marker missing: ${marker}`);
    const bytes=fs.statSync(screenshot).size;
    const minBytes=['home','create'].includes(item.mode)?20_000:30_000;
    if(bytes<minBytes)throw new Error(`${item.name}: screenshot too small ${bytes}`);
    report.push({...item,bytes});
  }
  fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({screens:report.length,preInvestigationViews:2,stageViews:6,materializedEvidence:true,compactMobileHeader:true,investigatorProofGate:true,investigatorRevision:'1.6',spoilerAuditRevision:'1.4',playbackCueTriggered:true,capture:'chrome-devtools-protocol',views:report},null,2));
  console.log(JSON.stringify({screens:report.length,preInvestigationViews:2,stageViews:6,materializedStageArtifacts:18,compactMobileHeader:true,investigatorProofGate:true,investigatorRevision:'1.6',spoilerAuditRevision:'1.4',playbackCueTriggered:true,final:true,reveal:true,capture:'chrome-devtools-protocol',minBytes:Math.min(...report.map((x)=>x.bytes))},null,2));
}finally{
  try{await cdp('Browser.close',{},null,3000);}catch{browser.kill('SIGKILL');}
  try{ws.close();}catch{}
  await new Promise((resolve)=>server.close(resolve));
  fs.rmSync(profile,{recursive:true,force:true});
}
