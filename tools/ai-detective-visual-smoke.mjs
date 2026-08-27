#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const siteRoot=path.resolve(here,'..');
const outDir=path.join(siteRoot,'artifacts','ai-detective-visual-smoke');
fs.mkdirSync(outDir,{recursive:true});

const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(p=>fs.existsSync(p));
if(!chrome)throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const contentTypes=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml'],['.png','image/png'],['.webp','image/webp']]);
const server=http.createServer((req,res)=>{
  const u=new URL(req.url||'/','http://127.0.0.1');
  let rel=decodeURIComponent(u.pathname).replace(/^\/+/, '');
  if(!rel||rel.endsWith('/'))rel+='index.html';
  const file=path.resolve(siteRoot,rel);
  if((!file.startsWith(`${siteRoot}${path.sep}`)&&file!==siteRoot)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end('Not found');return}
  res.setHeader('Content-Type',contentTypes.get(path.extname(file).toLowerCase())||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
const listen=()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port))});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

class CDP {
  constructor(ws){this.ws=new WebSocket(ws);this.id=0;this.pending=new Map();this.events=new Map()}
  async ready(){if(this.ws.readyState===WebSocket.OPEN)return;await new Promise((resolve,reject)=>{this.ws.addEventListener('open',resolve,{once:true});this.ws.addEventListener('error',reject,{once:true})});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method){for(const fn of this.events.get(m.method)||[])fn(m.params)}})}
  send(method,params={}){const id=++this.id;this.ws.send(JSON.stringify({id,method,params}));return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}))}
  once(method,timeout=5000){return new Promise((resolve,reject)=>{const list=this.events.get(method)||[];const timer=setTimeout(()=>reject(new Error(`Timeout waiting ${method}`)),timeout);const fn=p=>{clearTimeout(timer);this.events.set(method,(this.events.get(method)||[]).filter(x=>x!==fn));resolve(p)};list.push(fn);this.events.set(method,list)})}
  close(){this.ws.close()}
}

async function evaluate(cdp,expression){const r=await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(`Runtime exception: ${JSON.stringify(r.exceptionDetails)}`);return r.result.value}
async function capture(cdp,file){const r=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});fs.writeFileSync(file,Buffer.from(r.data,'base64'));if(fs.statSync(file).size<10000)throw new Error(`Suspiciously small screenshot: ${file}`)}

const port=await listen();
const pageUrl=`http://127.0.0.1:${port}/detektivnaya-igra-s-ii/`;
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ml-ai-smoke-'));
const chromeProc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeErr='';chromeProc.stderr.on('data',d=>chromeErr+=d.toString());
async function discoverDebugPort(){for(let i=0;i<120;i++){const m=chromeErr.match(/:(\d+)\/devtools\/browser\//);if(m)return Number(m[1]);if(chromeProc.exitCode!==null)throw new Error(`Chrome exited ${chromeProc.exitCode} before DevTools start:\n${chromeErr.slice(-4000)}`);await sleep(100)}throw new Error(`Chrome DevTools endpoint not announced:\n${chromeErr.slice(-4000)}`)}
const results=[];

try{
  const debugPort=await discoverDebugPort();
  const created=await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(pageUrl)}`,{method:'PUT'}).then(r=>{if(!r.ok)throw new Error(`Cannot create DevTools page: ${r.status}`);return r.json()});
  const cdp=new CDP(created.webSocketDebuggerUrl);await cdp.ready();await cdp.send('Page.enable');await cdp.send('Runtime.enable');

  for(const vp of [{name:'desktop',width:1440,height:1000,mobile:false},{name:'mobile',width:390,height:844,mobile:true}]){
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:vp.width,height:vp.height,deviceScaleFactor:1,mobile:vp.mobile,screenWidth:vp.width,screenHeight:vp.height});
    const load=cdp.once('Page.loadEventFired',8000);await cdp.send('Page.navigate',{url:pageUrl});await load;await sleep(250);

    const intro=await evaluate(cdp,`(()=>({
      h1:document.querySelector('.aid-intro h1')?.innerText.trim(),
      lead:document.querySelector('.aid-lead')?.innerText.trim(),
      start:document.querySelector('[data-action="start"]')?.innerText.trim(),
      introVisible:!document.querySelector('[data-view="intro"]')?.hidden,
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      viewport:[window.innerWidth,window.innerHeight],
      h1Rect:(()=>{const r=document.querySelector('.aid-intro h1')?.getBoundingClientRect();return r&&{left:r.left,right:r.right,top:r.top,bottom:r.bottom}})()
    }))()`);
    if(intro.h1!=='Восемь минут\nбез камеры.')throw new Error(`${vp.name}: unexpected H1 ${JSON.stringify(intro.h1)}`);
    if(!intro.lead?.includes('исчез оригинал письма 1912 года'))throw new Error(`${vp.name}: incident is not immediately stated`);
    if(intro.start!=='Принять дело'||!intro.introVisible)throw new Error(`${vp.name}: primary entry is unclear or hidden`);
    if(intro.overflow>1)throw new Error(`${vp.name}: horizontal overflow on intro: ${intro.overflow}px`);
    if(!intro.h1Rect||intro.h1Rect.left<0||intro.h1Rect.right>vp.width+1)throw new Error(`${vp.name}: H1 leaves viewport`);
    await capture(cdp,path.join(outDir,`${vp.name}-01-intro.png`));

    await evaluate(cdp,`document.querySelector('[data-action="start"]').click()`);await sleep(180);
    const workspace=await evaluate(cdp,`(()=>({
      workspaceVisible:!document.querySelector('[data-view="workspace"]')?.hidden,
      evidenceCount:document.querySelectorAll('[data-evidence-list] .aid-evidence-card').length,
      suspectCount:document.querySelectorAll('[data-suspect-strip] .aid-suspect-tab').length,
      placeholder:document.querySelector('#aid-question')?.getAttribute('placeholder'),
      counter:document.querySelector('[data-turn-counter]')?.innerText.trim(),
      theory:document.querySelector('[data-action="theory"]')?.innerText.trim(),
      overflow:document.documentElement.scrollWidth-window.innerWidth
    }))()`);
    if(!workspace.workspaceVisible)throw new Error(`${vp.name}: workspace did not open`);
    if(workspace.evidenceCount!==3)throw new Error(`${vp.name}: expected 3 neutral initial evidence cards, got ${workspace.evidenceCount}`);
    if(workspace.suspectCount!==3)throw new Error(`${vp.name}: expected 3 suspects, got ${workspace.suspectCount}`);
    if(workspace.placeholder!=='Задайте свой вопрос…')throw new Error(`${vp.name}: composer contains authored question hint`);
    if(workspace.counter!=='0 / 14 вопросов')throw new Error(`${vp.name}: unexpected turn counter ${workspace.counter}`);
    if(workspace.theory!=='Собрать версию')throw new Error(`${vp.name}: theory action unavailable`);
    if(workspace.overflow>1)throw new Error(`${vp.name}: horizontal overflow in workspace: ${workspace.overflow}px`);
    await capture(cdp,path.join(outDir,`${vp.name}-02-workspace.png`));

    await evaluate(cdp,`document.querySelector('#aid-question').scrollIntoView({block:'center'})`);await sleep(80);
    const composer=await evaluate(cdp,`(()=>{const q=document.querySelector('#aid-question').getBoundingClientRect();const send=document.querySelector('.aid-send').getBoundingClientRect();return {qTop:q.top,qBottom:q.bottom,sendTop:send.top,sendBottom:send.bottom,innerHeight:window.innerHeight}})()`);
    if(composer.qTop<0||composer.qBottom>composer.innerHeight||composer.sendTop<0||composer.sendBottom>composer.innerHeight)throw new Error(`${vp.name}: composer cannot be brought fully into viewport`);
    await capture(cdp,path.join(outDir,`${vp.name}-03-composer.png`));

    const reload=cdp.once('Page.loadEventFired',8000);await cdp.send('Page.reload',{ignoreCache:true});await reload;await sleep(180);
    const restored=await evaluate(cdp,`(()=>({workspace:!document.querySelector('[data-view="workspace"]')?.hidden,intro:!document.querySelector('[data-view="intro"]')?.hidden,evidenceCount:document.querySelectorAll('[data-evidence-list] .aid-evidence-card').length}))()`);
    if(!restored.workspace||restored.intro||restored.evidenceCount!==3)throw new Error(`${vp.name}: investigation state not restored after reload`);

    await evaluate(cdp,`document.querySelector('[data-action="theory"]').click()`);await sleep(100);
    const theory=await evaluate(cdp,`(()=>({visible:!document.querySelector('[data-view="theory"]')?.hidden,h2:document.querySelector('.aid-theory h2')?.innerText.trim(),radios:document.querySelectorAll('[data-theory-suspects] input[type="radio"]').length,overflow:document.documentElement.scrollWidth-window.innerWidth}))()`);
    if(!theory.visible||theory.h2!=='Кто ответственен за исчезновение письма?'||theory.radios!==3)throw new Error(`${vp.name}: theory form is incomplete or leading`);
    if(theory.overflow>1)throw new Error(`${vp.name}: horizontal overflow in theory view: ${theory.overflow}px`);
    await capture(cdp,path.join(outDir,`${vp.name}-04-theory.png`));

    results.push({viewport:vp.name,width:vp.width,height:vp.height,intro:true,workspace:true,initialEvidence:3,suspects:3,composerReachable:true,reloadPersistence:true,theory:true});
    await evaluate(cdp,`sessionStorage.removeItem('ml_ai_demo_state_v2')`);
  }
  cdp.close();
} finally {
  chromeProc.kill('SIGTERM');
  await new Promise(resolve=>server.close(resolve));
  fs.rmSync(profile,{recursive:true,force:true});
}

fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({pageUrl,chrome,results},null,2));
console.log(JSON.stringify({pageUrl,results},null,2));
