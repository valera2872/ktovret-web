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
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean).find(fs.existsSync);
if(!chrome)throw new Error('Chrome/Chromium not found');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ct=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml'],['.png','image/png'],['.webp','image/webp']]);
const server=http.createServer((req,res)=>{const u=new URL(req.url||'/','http://127.0.0.1');let rel=decodeURIComponent(u.pathname).replace(/^\/+/, '');if(!rel||rel.endsWith('/'))rel+='index.html';const file=path.resolve(siteRoot,rel);if((!file.startsWith(`${siteRoot}${path.sep}`)&&file!==siteRoot)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end('Not found');return}res.setHeader('Content-Type',ct.get(path.extname(file).toLowerCase())||'application/octet-stream');res.end(fs.readFileSync(file))});
const listen=()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port))});

class CDP{
  constructor(ws){this.ws=new WebSocket(ws);this.id=0;this.pending=new Map();this.events=new Map()}
  async ready(){if(this.ws.readyState!==WebSocket.OPEN)await new Promise((resolve,reject)=>{this.ws.addEventListener('open',resolve,{once:true});this.ws.addEventListener('error',reject,{once:true})});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}else for(const fn of this.events.get(m.method)||[])fn(m.params)})}
  send(method,params={}){const id=++this.id;this.ws.send(JSON.stringify({id,method,params}));return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}))}
  once(method,timeout=8000){return new Promise((resolve,reject)=>{const list=this.events.get(method)||[];const timer=setTimeout(()=>reject(new Error(`Timeout ${method}`)),timeout);const fn=p=>{clearTimeout(timer);this.events.set(method,(this.events.get(method)||[]).filter(x=>x!==fn));resolve(p)};list.push(fn);this.events.set(method,list)})}
  close(){this.ws.close()}
}
async function evalJs(cdp,expression){const r=await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function shot(cdp,name){const r=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});const file=path.join(outDir,name);fs.writeFileSync(file,Buffer.from(r.data,'base64'));if(fs.statSync(file).size<10000)throw new Error(`${name}: suspicious screenshot`)}
async function stopChrome(ctx){if(!ctx)return;const exited=ctx.proc.exitCode===null?new Promise(resolve=>ctx.proc.once('exit',resolve)):Promise.resolve();if(ctx.proc.exitCode===null)ctx.proc.kill('SIGTERM');await Promise.race([exited,sleep(1200)]);try{fs.rmSync(ctx.profile,{recursive:true,force:true,maxRetries:6,retryDelay:100})}catch{}}
async function startChrome(){let last='';for(const debugPort of [9222,9223,9224,9225,9226]){const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ml-ai-smoke-'));const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});let err='';proc.stderr.on('data',d=>err+=d.toString());for(let i=0;i<60;i++){try{const r=await fetch(`http://127.0.0.1:${debugPort}/json/version`);if(r.ok)return{proc,profile,debugPort,getErr:()=>err}}catch{}if(proc.exitCode!==null)break;await sleep(100)}last=`port ${debugPort}: ${err.slice(-1200)}`;await stopChrome({proc,profile})}throw new Error(`Chrome DevTools startup failed after retries. ${last}`)}

const port=await listen();
const pageUrl=`http://127.0.0.1:${port}/detektivnaya-igra-s-ii/`;
let chromeCtx;const results=[];
try{
  chromeCtx=await startChrome();
  const created=await fetch(`http://127.0.0.1:${chromeCtx.debugPort}/json/new?${encodeURIComponent(pageUrl)}`,{method:'PUT'}).then(async r=>{if(!r.ok)throw new Error(`DevTools new page ${r.status}`);return r.json()});
  const cdp=new CDP(created.webSocketDebuggerUrl);await cdp.ready();await cdp.send('Page.enable');await cdp.send('Runtime.enable');
  for(const vp of [{name:'desktop',width:1440,height:1000,mobile:false},{name:'mobile',width:390,height:844,mobile:true}]){
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:vp.width,height:vp.height,deviceScaleFactor:1,mobile:vp.mobile,screenWidth:vp.width,screenHeight:vp.height});
    let load=cdp.once('Page.loadEventFired');await cdp.send('Page.navigate',{url:pageUrl});await load;await sleep(220);
    const intro=await evalJs(cdp,`(()=>{const h=document.querySelector('.aid-intro h1');const r=h?.getBoundingClientRect();return{h1:h?.innerText.trim(),lead:document.querySelector('.aid-lead')?.innerText.trim(),start:document.querySelector('[data-action="start"]')?.innerText.trim(),visible:!document.querySelector('[data-view="intro"]')?.hidden,overflow:document.documentElement.scrollWidth-window.innerWidth,h1Left:r?.left,h1Right:r?.right}})()`);
    if(intro.h1!=='Восемь минут\nбез камеры.'||!intro.lead?.includes('исчез оригинал письма 1912 года')||intro.start!=='Принять дело'||!intro.visible)throw new Error(`${vp.name}: intro contract failed ${JSON.stringify(intro)}`);
    if(intro.overflow>1||intro.h1Left<0||intro.h1Right>vp.width+1)throw new Error(`${vp.name}: intro viewport failed ${JSON.stringify(intro)}`);
    await shot(cdp,`${vp.name}-01-intro.png`);

    await evalJs(cdp,`document.querySelector('[data-action="start"]').click()`);await sleep(150);
    const ws=await evalJs(cdp,`(()=>({visible:!document.querySelector('[data-view="workspace"]')?.hidden,evidence:document.querySelectorAll('[data-evidence-list] .aid-evidence-card').length,suspects:document.querySelectorAll('[data-suspect-strip] .aid-suspect-tab').length,placeholder:document.querySelector('#aid-question')?.getAttribute('placeholder'),counter:document.querySelector('[data-turn-counter]')?.innerText.trim(),theory:document.querySelector('[data-action="theory"]')?.innerText.trim(),overflow:document.documentElement.scrollWidth-window.innerWidth}))()`);
    if(!ws.visible||ws.evidence!==3||ws.suspects!==3||ws.placeholder!=='Задайте свой вопрос…'||ws.counter!=='0 / 14 вопросов'||ws.theory!=='Собрать версию'||ws.overflow>1)throw new Error(`${vp.name}: workspace contract failed ${JSON.stringify(ws)}`);
    await shot(cdp,`${vp.name}-02-workspace.png`);

    await evalJs(cdp,`document.querySelector('#aid-question').scrollIntoView({block:'center'})`);await sleep(80);
    const composer=await evalJs(cdp,`(()=>{const q=document.querySelector('#aid-question').getBoundingClientRect(),s=document.querySelector('.aid-send').getBoundingClientRect();return{qTop:q.top,qBottom:q.bottom,sendTop:s.top,sendBottom:s.bottom,innerHeight:window.innerHeight}})()`);
    if(composer.qTop<0||composer.qBottom>composer.innerHeight||composer.sendTop<0||composer.sendBottom>composer.innerHeight)throw new Error(`${vp.name}: composer viewport failed ${JSON.stringify(composer)}`);
    await shot(cdp,`${vp.name}-03-composer.png`);

    load=cdp.once('Page.loadEventFired');await cdp.send('Page.reload',{ignoreCache:true});await load;await sleep(160);
    const restored=await evalJs(cdp,`(()=>({workspace:!document.querySelector('[data-view="workspace"]')?.hidden,intro:!document.querySelector('[data-view="intro"]')?.hidden,evidence:document.querySelectorAll('[data-evidence-list] .aid-evidence-card').length}))()`);
    if(!restored.workspace||restored.intro||restored.evidence!==3)throw new Error(`${vp.name}: refresh persistence failed ${JSON.stringify(restored)}`);
    await evalJs(cdp,`document.querySelector('[data-action="theory"]').click()`);await sleep(80);
    const theory=await evalJs(cdp,`(()=>({visible:!document.querySelector('[data-view="theory"]')?.hidden,h2:document.querySelector('.aid-theory h2')?.innerText.trim(),radios:document.querySelectorAll('[data-theory-suspects] input[type="radio"]').length,overflow:document.documentElement.scrollWidth-window.innerWidth}))()`);
    if(!theory.visible||theory.h2!=='Кто ответственен за исчезновение письма?'||theory.radios!==3||theory.overflow>1)throw new Error(`${vp.name}: theory contract failed ${JSON.stringify(theory)}`);
    await shot(cdp,`${vp.name}-04-theory.png`);
    results.push({viewport:vp.name,width:vp.width,height:vp.height,intro:true,workspace:true,composerReachable:true,reloadPersistence:true,theory:true});
    await evalJs(cdp,`sessionStorage.removeItem('ml_ai_demo_state_v2')`);
  }
  cdp.close();
}finally{await stopChrome(chromeCtx);await new Promise(resolve=>server.close(resolve))}
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({pageUrl,chrome,debugPort:chromeCtx?.debugPort,results},null,2));
console.log(JSON.stringify({results},null,2));
