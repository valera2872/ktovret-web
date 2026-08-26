#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const outDir = path.join(repo, 'artifacts', 'solo-407');
fs.mkdirSync(outDir, { recursive: true });
const chromeCandidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="../../assets/mysterylogic.css"><link rel="stylesheet" href="../../assets/case-407-solo.css"></head><body class="solo407-body"><main class="solo407-shell" data-solo407-app></main><script src="../../assets/case-407-data.js"></script><script src="../../assets/case-407-solo.js"></script><script>
(() => {
  const wait = (ms=35) => new Promise(r=>setTimeout(r,ms));
  const appText = () => document.querySelector('[data-solo407-app]')?.textContent || '';
  const click = async (selector) => { const el=document.querySelector(selector); if(!el) throw new Error('missing '+selector); el.click(); await wait(); };
  const openAll = async () => {
    let guard=0;
    while(document.querySelector('[data-open][aria-expanded="false"], [data-request]') && guard++<30){
      const request=document.querySelector('[data-request]');
      if(request){request.click(); await wait(); continue;}
      const closed=document.querySelector('[data-open][aria-expanded="false"]');
      if(closed){closed.click(); await wait();}
    }
  };
  const checkpoint = async (value) => { const input=document.querySelector('[data-checkpoint] input[value="'+value+'"]'); if(!input) throw new Error('checkpoint '+value); input.checked=true; input.closest('form').requestSubmit(); await wait(80); };
  const finalSelect = (values) => { for(const [name,value] of Object.entries(values)){ const input=document.querySelector('[data-final] input[name="'+name+'"][value="'+value+'"]'); if(!input) throw new Error('final '+name+' '+value); input.checked=true; } };
  const run = async () => {
    localStorage.removeItem('ml:solo:407:v1');
    const mode=new URL(location.href).searchParams.get('mode')||'entry';
    if(mode==='entry'){ document.body.dataset.ready='entry'; return; }
    await click('[data-start]');
    await openAll();
    if(mode==='desk'){ document.querySelector('[data-pin]')?.click(); await wait(); document.querySelector('[data-hint]')?.click(); await wait(); const text=appText(); document.body.dataset.roomless=String(!text.includes('Создать комнату')&&!text.includes('Пригласить')); document.body.dataset.ready='desk'; return; }
    await checkpoint('ids'); await openAll(); await checkpoint('zones'); await openAll(); await checkpoint('owner');
    finalSelect({room:'407',alarm:'force',route:'window',sequence:'denis'}); document.querySelector('[data-final]').requestSubmit(); await wait(60);
    const feedback=document.querySelector('.solo407-final-feedback')?.textContent||'';
    document.body.dataset.wrongNeutral=String(feedback.includes('Я не покажу, какое именно слабое')&&!appText().includes('Дело закрыто'));
    finalSelect({room:'409',alarm:'duress',route:'service',sequence:'collusion'}); document.querySelector('[data-final]').requestSubmit(); await wait(100);
    const solvedText=appText();
    document.body.dataset.solved=String(solvedText.includes('Дело закрыто'));
    document.body.dataset.roomless=String(!solvedText.includes('Создать комнату')&&!solvedText.includes('Пригласить'));
    document.body.dataset.ready='solved';
  };
  run().catch(e=>{document.body.dataset.error=e.message;document.body.dataset.ready='error';});
})();
</script></body></html>`;
const htmlFile=path.join(outDir,'index.html'); fs.writeFileSync(htmlFile,html);
const types=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.webp','image/webp'],['.svg','image/svg+xml']]);
const server=http.createServer((request,response)=>{ const url=new URL(request.url||'/','http://127.0.0.1'); const relative=decodeURIComponent(url.pathname).replace(/^\/+/, ''); const filePath=path.resolve(repo,relative); if(!filePath.startsWith(`${repo}${path.sep}`)||!fs.existsSync(filePath)) return response.writeHead(404).end('Not found'); response.setHeader('Content-Type',types.get(path.extname(filePath))||'application/octet-stream'); response.end(fs.readFileSync(filePath)); });
const port=await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const runChrome=(args)=>new Promise((resolve,reject)=>{const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',c=>stdout+=c);child.stderr.on('data',c=>stderr+=c);child.on('error',reject);child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1200)}`)));});
try{
  const base=`http://127.0.0.1:${port}/artifacts/solo-407/index.html`;
  const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1','--virtual-time-budget=4000'];
  const shots=[
    ['entry-desktop.png','entry','--window-size=1440,1000'],
    ['entry-mobile.png','entry','--window-size=390,1100'],
    ['desk-desktop.png','desk','--window-size=1440,1400'],
    ['desk-mobile.png','desk','--window-size=390,1800'],
  ];
  for(const [name,mode,size] of shots){ const file=path.join(outDir,name); await runChrome([...common,size,`--screenshot=${file}`,`${base}?mode=${mode}`]); if(fs.statSync(file).size<35_000) throw new Error(`${name} too small`); }
  const {stdout:dom}=await runChrome([...common,'--window-size=1440,1800','--dump-dom',`${base}?mode=solve`]);
  for(const marker of ['data-ready="solved"','data-solved="true"','data-wrong-neutral="true"','data-roomless="true"','Охрана раскрыла не ту дверь']) if(!dom.includes(marker)) throw new Error(`solo solve DOM missing ${marker}`);
  fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({solo407:true,entry:true,desk:true,roomless:true,wrongFinalNonNudging:true,fullSolve:true,screenshots:shots.map(x=>x[0])},null,2));
  console.log(JSON.stringify({solo407:true,roomless:true,wrongFinalNonNudging:true,fullSolve:true},null,2));
}finally{await new Promise(resolve=>server.close(resolve));}