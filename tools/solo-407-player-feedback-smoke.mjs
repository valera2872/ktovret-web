#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const outDir = path.join(repo, 'artifacts', 'solo-407-player-feedback');
fs.mkdirSync(outDir, { recursive: true });
const candidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const chrome = candidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${candidates.join(', ')}`);

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="../../assets/mysterylogic.css"><link rel="stylesheet" href="../../assets/case-407-solo.css"><link rel="stylesheet" href="../../assets/case-407-solo-player-feedback.css"></head><body class="solo407-body"><main class="solo407-shell" data-solo407-app></main><script src="../../assets/case-407-data.js"></script><script src="../../assets/case-407-solo.js"></script><script src="../../assets/case-407-solo-player-feedback.js"></script><script>
(async()=>{
  const wait=(ms=45)=>new Promise(r=>setTimeout(r,ms));
  const click=async(sel)=>{const el=document.querySelector(sel);if(!el)throw new Error('missing '+sel);el.click();await wait();};
  const openClosed=async()=>{let guard=0;while(document.querySelector('[data-open][aria-expanded="false"]')&&guard++<12){await click('[data-open][aria-expanded="false"]');}};
  const openAll=async()=>{let guard=0;while((document.querySelector('[data-request]')||document.querySelector('[data-open][aria-expanded="false"]'))&&guard++<30){const req=document.querySelector('[data-request]');if(req){req.click();await wait();continue;}await click('[data-open][aria-expanded="false"]');}};
  const checkpoint=async(value)=>{const input=document.querySelector('[data-checkpoint] input[value="'+value+'"]');if(!input)throw new Error('checkpoint '+value);input.checked=true;input.closest('form').requestSubmit();await wait(90);};
  try{
    localStorage.removeItem('ml:solo:407:v1');
    await wait(80);
    const entry=document.querySelector('[data-solo407-context]')?.textContent||'';
    if(!entry.includes('Марта Орлова')||!entry.includes('Хранительница сапфира')||!entry.includes('Елена Раева'))throw new Error('character context missing');
    if(!document.querySelector('.solo407-scene'))throw new Error('scene diagram missing');
    const entryButton=document.querySelector('[data-start]');
    const entryButtonStyle=getComputedStyle(entryButton);
    if(entryButtonStyle.cursor!=='pointer'||entryButtonStyle.borderTopWidth==='0px'||entryButtonStyle.backgroundImage==='none')throw new Error('primary button not visually prominent');

    await click('[data-start]');
    const firstGuide=document.querySelector('[data-solo407-guidance="first"]');
    if(!firstGuide||!firstGuide.textContent.includes('Начните с места происшествия'))throw new Error('guided first action missing');
    if(!firstGuide.querySelector('[data-solo407-first-action]'))throw new Error('guided first-action CTA missing');
    await click('[data-solo407-first-action]');
    if(document.querySelector('[data-open="s1-i0"]')?.getAttribute('aria-expanded')!=='true')throw new Error('guided first action did not open the scene evidence');
    await click('[data-open="s1-i1"]');
    await click('[data-open="s1-a0"]');
    await wait(80);
    const nextGuide=document.querySelector('[data-solo407-guidance="requests"]');
    if(!nextGuide||!nextGuide.textContent.includes('Правильного порядка нет'))throw new Error('next-action guidance missing after initial evidence');

    await openAll();
    await checkpoint('ids');

    await click('[data-stage-nav="1"]');
    const forward=document.querySelector('[data-stage-nav="2"]');
    if(!forward||forward.disabled)throw new Error('forward stage locked after going back');
    await click('[data-stage-nav="2"]');

    await openClosed();
    await click('[data-request="s2-a2"]');
    await click('[data-request="s2-i1"]');
    await wait(100);
    const ids=[...document.querySelectorAll('.solo407-evidence-list [data-evidence]')].map(el=>el.dataset.evidence);
    const a2=ids.indexOf('s2-a2'),i1=ids.indexOf('s2-i1');
    if(a2<0||i1<0||a2>i1)throw new Error('requested evidence order not preserved: '+ids.join(','));
    const requestButton=document.querySelector('[data-request]');
    if(requestButton){const style=getComputedStyle(requestButton);if(style.cursor!=='pointer'||style.borderTopWidth==='0px')throw new Error('request button not visually prominent');}

    await openAll();
    await wait(100);
    const stage2Text=document.querySelector('[data-solo407-app]')?.textContent||'';
    if(!stage2Text.includes('служебная Wi‑Fi зона STAFF‑4'))throw new Error('stage-2 Wi-Fi code is not human-readable');
    if(/\b\d{2}:\d{2}:\d{2}\b/.test(stage2Text))throw new Error('seconds still visible on stage 2');

    await checkpoint('zones');
    await wait(100);
    const recallNode=document.querySelector('[data-solo407-recall]');
    const recall=recallNode?.textContent||'';
    if(!recall.includes('Напоминание из этапа 2')||!recall.includes('бельевую тележку')||!recall.includes('01:05'))throw new Error('linen cart recall missing');
    if(document.querySelector('[data-open="s3-i0"]')?.getAttribute('aria-expanded')==='false')await click('[data-open="s3-i0"]');
    await wait(80);
    const recallStyle=getComputedStyle(recallNode);
    const recallStrongStyle=getComputedStyle(recallNode.querySelector('strong'));
    if(recallStyle.color!=='rgb(63, 53, 39)'||recallStrongStyle.color!=='rgb(107, 79, 34)')throw new Error('linen cart recall contrast regressed: '+recallStyle.color+' / '+recallStrongStyle.color);
    if(recallStyle.backgroundColor==='rgba(0, 0, 0, 0)')throw new Error('linen cart recall background missing');
    await openAll();
    await wait(100);
    const text=document.querySelector('[data-solo407-app]')?.textContent||'';
    if(/\b\d{2}:\d{2}:\d{2}\b/.test(text))throw new Error('seconds still visible');
    for(const marker of ['мастер‑токен HK‑44','погрузочная зона LOADING‑B1'])if(!text.includes(marker))throw new Error('human-readable code missing '+marker);
    if(!text.includes('К пройденным этапам можно возвращаться'))throw new Error('navigation explanation missing');
    document.body.dataset.playerFeedback='pass';
  }catch(error){document.body.dataset.playerFeedback='fail';document.body.dataset.error=error.message;}
})();
</script></body></html>`;

const htmlFile=path.join(outDir,'index.html');
fs.writeFileSync(htmlFile,html);
const types=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.webp','image/webp']]);
const server=http.createServer((request,response)=>{const url=new URL(request.url||'/','http://127.0.0.1');const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');const filePath=path.resolve(repo,relative);if(!filePath.startsWith(`${repo}${path.sep}`)||!fs.existsSync(filePath))return response.writeHead(404).end('Not found');response.setHeader('Content-Type',types.get(path.extname(filePath))||'application/octet-stream');response.end(fs.readFileSync(filePath));});
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const runChrome=(args)=>new Promise((resolve,reject)=>{const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',c=>stdout+=c);child.stderr.on('data',c=>stderr+=c);child.on('error',reject);child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1200)}`)));});
try{
  const url=`http://127.0.0.1:${port}/artifacts/solo-407-player-feedback/index.html`;
  const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--virtual-time-budget=8000'];
  const {stdout:dom}=await runChrome([...common,'--window-size=1440,1800','--dump-dom',url]);
  if(!dom.includes('data-player-feedback="pass"')){
    const error=dom.match(/data-error="([^"]*)"/)?.[1]||'unknown feedback smoke failure';
    throw new Error(error);
  }
  const screenshot=path.join(outDir,'solo-407-feedback-desktop.png');
  await runChrome([...common,'--window-size=1440,1800',`--screenshot=${screenshot}`,url]);
  if(fs.statSync(screenshot).size<35_000)throw new Error('feedback screenshot too small');
  fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({solo407PlayerFeedback:true,characterContext:true,sceneDiagram:true,guidedFirstAction:true,nextActionGuidance:true,forwardNavigation:true,requestOrder:true,secondsRemoved:true,humanReadableCodes:true,linenCartRecall:true,linenCartRecallContrast:true,prominentButtons:true},null,2));
  console.log(JSON.stringify({solo407PlayerFeedback:true,guidedFirstAction:true,nextActionGuidance:true,forwardNavigation:true,requestOrder:true,secondsRemoved:true,humanReadableCodes:true,linenCartRecall:true,linenCartRecallContrast:true,prominentButtons:true},null,2));
}finally{await new Promise(resolve=>server.close(resolve));}