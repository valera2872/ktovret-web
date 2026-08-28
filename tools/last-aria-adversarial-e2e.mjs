#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const chromeCandidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found: ${chromeCandidates.join(', ')}`);
if (typeof WebSocket !== 'function') throw new Error('Node WebSocket API unavailable');
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fixture = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/assets/mysterylogic.css"><link rel="stylesheet" href="/assets/premium.css"><link rel="stylesheet" href="/assets/case-aria.css"><link rel="stylesheet" href="/assets/case-aria-materials-v2.css"><link rel="stylesheet" href="/assets/case-aria-layout-v2.css"><link rel="stylesheet" href="/assets/case-aria-storefront.css"></head>
<body class="casearia-body"><main class="casearia-shell" data-casearia-app><section class="casearia-paywall-status"><strong>Загружаем дело…</strong></section></main>
<script>
(() => {
  const code='ABCDEFGH', role='creator', other='guest';
  localStorage.setItem('mysterylogic:challenge:client-key','a'.repeat(48));
  const progressKey='mysterylogic:last-aria:v1:'+code+':'+role;
  if(!localStorage.getItem(progressKey)) localStorage.setItem(progressKey,JSON.stringify({stage:2,hintsUsed:0,attempts:0,firstAnswerCorrect:null,startedAt:Date.now()-1800000,handoffs:{1:true,2:true},decision:'manager',finalAccepted:false}));
  window.__ariaServer={meCompleted:false,opponentCompleted:false,lastComplete:null};
  const view=()=>{
    const both=window.__ariaServer.meCompleted&&window.__ariaServer.opponentCompleted;
    const mine=window.__ariaServer.lastComplete||{elapsedSeconds:1800,hintsUsed:0,attempts:1,firstAnswerCorrect:true};
    return {ok:true,room:{code,caseId:'special:last-aria',caseTitle:'Последняя ария',casePath:'/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/'},me:{role,name:'QA Creator',started:true,completed:window.__ariaServer.meCompleted},opponent:{joined:true,role:other,name:'QA Guest',started:true,completed:window.__ariaServer.opponentCompleted},bothJoined:true,bothCompleted:both,results:both?{creator:{name:'QA Creator',...mine,completedAt:new Date().toISOString()},guest:{name:'QA Guest',elapsedSeconds:1900,hintsUsed:0,attempts:1,firstAnswerCorrect:true,completedAt:new Date().toISOString()}}:null};
  };
  window.fetch=async(input,init={})=>{
    let body={}; try{body=JSON.parse(init.body||'{}')}catch{}
    if(body.action==='complete'){
      window.__ariaServer.meCompleted=true;
      window.__ariaServer.lastComplete={elapsedSeconds:Number(body.elapsedSeconds),hintsUsed:Number(body.hintsUsed),attempts:Number(body.attempts),firstAnswerCorrect:Boolean(body.firstAnswerCorrect)};
    }
    return new Response(JSON.stringify(view()),{status:200,headers:{'content-type':'application/json'}});
  };
})();
</script>
<script src="/assets/case-aria-paid-auth.js"></script><script src="/assets/case-aria-storefront.js"></script>
<script src="/assets/case-aria-final-feedback.js"></script><script src="/assets/case-aria-final-feedback-loader.js"></script><script src="/assets/case-aria-investigation-ux.js"></script><script src="/assets/case-aria-resilience.js"></script>
</body></html>`;

const types = new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml'],['.webp','image/webp']]);
const server = http.createServer((request,response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  if (url.pathname === '/last-aria-adversarial') {
    response.setHeader('content-type','text/html; charset=utf-8');
    response.end(fixture);
    return;
  }
  const filePath = path.resolve(repo, decodeURIComponent(url.pathname).replace(/^\/+/,''));
  if (!filePath.startsWith(`${repo}${path.sep}`) || !fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('content-type', types.get(path.extname(filePath)) || 'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});
const port = await new Promise((resolve,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',() => resolve(server.address().port)); });

const profile = fs.mkdtempSync(path.join(repo,'.last-aria-e2e-profile-'));
const debugPort = 9333;
const browser = spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--disable-sync','--no-first-run','--remote-allow-origins=*',`--user-data-dir=${profile}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr=''; browser.stderr.on('data',(chunk)=>stderr+=String(chunk));
const wsUrl = await (async()=>{
  const deadline=Date.now()+30_000;
  while(Date.now()<deadline){
    if(browser.exitCode!==null) throw new Error(`Chrome exited ${browser.exitCode}: ${stderr.slice(-1000)}`);
    try{const response=await fetch(`http://127.0.0.1:${debugPort}/json/version`); if(response.ok){const info=await response.json(); if(info.webSocketDebuggerUrl)return info.webSocketDebuggerUrl;}}catch{}
    await pause(100);
  }
  throw new Error(`Chrome CDP startup timeout: ${stderr.slice(-1000)}`);
})();
const ws = await new Promise((resolve,reject)=>{const socket=new WebSocket(wsUrl);const timer=setTimeout(()=>reject(new Error('CDP connect timeout')),10_000);socket.addEventListener('open',()=>{clearTimeout(timer);resolve(socket);},{once:true});socket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('CDP connect failed'));},{once:true});});
let seq=0; const pending=new Map();
ws.addEventListener('message',(event)=>{let message;try{message=JSON.parse(String(event.data));}catch{return;}if(!message.id||!pending.has(message.id))return;const p=pending.get(message.id);pending.delete(message.id);clearTimeout(p.timer);if(message.error)p.reject(new Error(`${p.method}: ${message.error.message}`));else p.resolve(message.result||{});});
const cdp=(method,params={},sessionId=null,timeoutMs=10_000)=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`${method}: timeout`));},timeoutMs);pending.set(id,{resolve,reject,timer,method});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});

const {targetId}=await cdp('Target.createTarget',{url:'about:blank'});
const {sessionId}=await cdp('Target.attachToTarget',{targetId,flatten:true});
const evaluate=async(expression)=>{
  const result=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId,10_000);
  if(result.exceptionDetails) throw new Error(`evaluate failed: ${result.exceptionDetails.text || expression}`);
  return result.result?.value;
};
const waitFor=async(expression,label,timeout=8000)=>{
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline){try{if(await evaluate(expression))return;}catch{}await pause(100);}
  throw new Error(`Timed out waiting for ${label}`);
};
const click=async(selector)=>evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)return false;n.click();return true;})()`);
const progress=()=>evaluate(`JSON.parse(localStorage.getItem('mysterylogic:last-aria:v1:ABCDEFGH:creator')||'{}')`);

try {
  await cdp('Page.enable',{},sessionId);
  await cdp('Runtime.enable',{},sessionId);
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},sessionId);
  await cdp('Page.navigate',{url:`http://127.0.0.1:${port}/last-aria-adversarial?room=ABCDEFGH`},sessionId);
  await waitFor(`document.querySelector('.casearia-decision') && document.querySelector('[data-casearia-app]')?.dataset.caseariaResilienceInstalled==='1'`,'stage 2 + resilience');

  // A save created by the old any-choice runtime must not remain accepted.
  let p=await progress();
  assert.equal(p.stage,2);
  assert.equal(p.decision,'','legacy wrong decision must be cleared');
  assert.deepEqual(p.decisionHistory,['manager']);
  assert.equal(p.decisionMistakes,1);
  assert.equal(p.decisionPenaltyApplied,true);
  assert.equal(p.attempts,1,'legacy wrong decision must count once');
  assert.equal(p.firstAnswerCorrect,false);
  assert.equal(await evaluate(`document.querySelector('[data-action="next-stage"]').disabled`),true,'legacy wrong decision must not unlock stage 3');

  // Earlier packages stay reviewable without rewinding progress.
  assert.equal(await click('[data-aria-review-stage="1"]'),true);
  await waitFor(`document.querySelector('[data-aria-review-package="1"]')`,'package 1 review');
  assert.equal((await progress()).stage,2,'review must not rewind canonical stage');
  await click('[data-aria-review-close]');

  // Correct stage-two line unlocks the next package.
  await click('[data-decision="conductor"]');
  await waitFor(`document.querySelector('[data-action="next-stage"]') && !document.querySelector('[data-action="next-stage"]').disabled`,'correct decision unlock');
  p=await progress(); assert.equal(p.decision,'conductor');
  await click('[data-action="next-stage"]');
  await waitFor(`document.body.textContent.includes('Пакет 3 / 3')`,'stage 3');

  // Complete stage-three handoff and enter the final.
  await evaluate(`(()=>{const i=document.querySelector('[data-handoff-input]');i.value='K-12';document.querySelector('[data-action="handoff-check"]').click();})()`);
  await waitFor(`document.querySelector('.casearia-handoff.is-complete')`,'stage 3 handoff');
  await click('[data-action="next-stage"]');
  await waitFor(`document.querySelector('.casearia-final-form[data-final-form]')`,'final form');

  // Submit a plausible but wrong reconstruction. No selection may disappear.
  await evaluate(`(()=>{
    const f=document.querySelector('[data-final-form]');
    const set=(name,value)=>{const n=f.querySelector('input[name="'+name+'"][value="'+value+'"]');n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}));};
    set('final-culprit','ilya');set('final-anton','victim');set('final-voice','recording');set('final-sequence','canonical');
    for(const id of ['checkout','playback','footprint','key','tag'])set('evidence',id);
    f.requestSubmit();
  })()`);
  await waitFor(`document.querySelector('[data-final-inline-feedback]')`,'inline wrong-final feedback');
  assert.equal(await evaluate(`document.querySelector('input[name="final-culprit"][value="ilya"]').checked`),true,'wrong final radio was lost');
  assert.equal(await evaluate(`document.querySelectorAll('input[name="evidence"]:checked').length`),5,'wrong final evidence was lost');
  p=await progress();
  assert.equal(p.finalAnswers.culprit,'ilya');
  assert.equal(p.evidencePicks.length,5);
  assert.equal(p.attempts,2,'decision penalty + first wrong final must count exactly twice');

  // Refresh in the middle of the final: draft must survive and restore when final reopens.
  await cdp('Page.reload',{ignoreCache:true},sessionId);
  await waitFor(`document.body.textContent.includes('Пакет 3 / 3') && document.querySelector('[data-action="next-stage"]')`,'resumed stage 3');
  await click('[data-action="next-stage"]');
  await waitFor(`document.querySelector('.casearia-final-form[data-final-form]') && document.querySelector('input[name="final-culprit"][value="ilya"]')?.checked`,'restored final draft');
  assert.equal(await evaluate(`document.querySelectorAll('input[name="evidence"]:checked').length`),5,'evidence draft did not restore after refresh');

  // Correct only the bad answer. Completion should preserve the earlier mistake in score.
  await evaluate(`(()=>{const n=document.querySelector('input[name="final-culprit"][value="mikhail"]');n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-final-form]').requestSubmit();})()`);
  await waitFor(`document.body.textContent.includes('Ваше обвинение выдержало проверку')`,'accepted final waiting screen');
  const completed=await evaluate(`window.__ariaServer.lastComplete`);
  assert.equal(completed.attempts,2,'server completion must receive the decision/final mistake score');
  assert.equal(completed.firstAnswerCorrect,false);

  // Once the partner completes, the same client must reveal the joint result.
  await evaluate(`window.__ariaServer.opponentCompleted=true`);
  await click('[data-action="refresh-room"]');
  await waitFor(`document.querySelector('.casearia-reveal') && document.body.textContent.includes('Заключение следственной группы')`,'joint reveal');

  console.log(JSON.stringify({verdict:'LAST_ARIA_ADVERSARIAL_E2E_PASS',legacySaveMigrated:true,reviewWithoutRewind:true,wrongDecisionBlocked:true,wrongFinalPreserved:true,refreshDraftRestored:true,scorePreserved:true,partnerReveal:true,viewport:'390x844'},null,2));
} finally {
  try{await cdp('Target.closeTarget',{targetId});}catch{}
  try{await cdp('Browser.close',{},null,3000);}catch{browser.kill('SIGKILL');}
  try{ws.close();}catch{}
  await new Promise((resolve)=>server.close(resolve));
  fs.rmSync(profile,{recursive:true,force:true});
}
