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
  const readState = () => { try { return JSON.parse(localStorage.getItem('ml:solo:407:v1') || '{}') || {}; } catch { return {}; } };
  const click = async (selector) => { const el=document.querySelector(selector); if(!el) throw new Error('missing '+selector); el.click(); await wait(); };
  const hintText = () => document.querySelector('.solo407-hint-panel p')?.textContent || '';
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
  const finalSelect = (values) => { for(const [name,value] of Object.entries(values)){ const input=document.querySelector('[data-final] input[name="'+name+'"][value="'+value+'"]'); if(!input) throw new Error('final '+name+' '+value); input.checked=true; input.dispatchEvent(new Event('change',{bubbles:true})); } };
  const expectHint = async (fragment) => { await click('[data-hint]'); const text=hintText(); if(!text.includes(fragment)) throw new Error('unexpected hint: '+text); await click('[data-hint-close]'); };
  const markCommon = () => { const text=appText(); document.body.dataset.roomless=String(!text.includes('Создать комнату')&&!text.includes('Пригласить')); };
  const run = async () => {
    const params=new URL(location.href).searchParams;
    const mode=params.get('mode')||'entry';
    if(mode==='resume-wrong'){
      const state=readState();
      const text=appText();
      document.body.dataset.checkpointHypotheses=String(state.checkpointAnswers?.['1']==='camera'&&state.checkpointAnswers?.['2']==='forced'&&state.checkpointAnswers?.['3']==='route');
      document.body.dataset.wrongFinalAccepted=String(state.solved===true&&state.finalAnswers?.room==='407'&&state.finalAnswers?.alarm==='force'&&state.finalAnswers?.route==='window'&&state.finalAnswers?.sequence==='denis'&&text.includes('Дело закрыто'));
      document.body.dataset.revealComparison=String(text.includes('не выдержал')&&text.includes('Пять звеньев, на которых держится дело')&&text.includes('Ваша версия:'));
      document.body.dataset.refreshPreserved=String(state.solved===true&&state.finalAnswers?.room==='407'&&text.includes('Физический 407:'));
      markCommon();
      document.body.dataset.ready='solved';
      return;
    }
    localStorage.removeItem('ml:solo:407:v1');
    if(mode==='entry'){ document.body.dataset.ready='entry'; return; }
    await click('[data-start]');
    await openAll();
    if(mode==='desk'){ document.querySelector('[data-pin]')?.click(); await wait(); document.querySelector('[data-hint]')?.click(); await wait(); markCommon(); document.body.dataset.ready='desk'; return; }
    await expectHint('Разведите четыре идентификатора');
    await expectHint('Сравните, что фиксирует камера');
    if(mode==='solve-wrong') await checkpoint('camera'); else await checkpoint('ids');
    await openAll();
    await expectHint('Отделите маршрут устройства');
    if(mode==='solve-wrong') await checkpoint('forced'); else await checkpoint('zones');
    await openAll();
    await expectHint('Принадлежность пропуска');
    document.body.dataset.hintsProgressive='true';
    if(mode==='solve-wrong') await checkpoint('route'); else await checkpoint('owner');
    if(mode==='final'){
      const final=document.querySelector('.solo407-final');
      if(!final) throw new Error('final screen missing');
      const brief=document.querySelector('.solo407-brief');
      const stage=document.querySelector('.solo407-stage-card');
      if(brief) brief.style.display='none';
      if(stage) stage.style.display='none';
      window.scrollTo(0,0);
      await wait(120);
      if(final.getBoundingClientRect().top > 80) throw new Error('final visual framing failed');
      document.body.dataset.ready='final';
      return;
    }
    if(mode==='solve-correct'){
      finalSelect({room:'409',alarm:'duress',route:'service',sequence:'collusion'}); document.querySelector('[data-final]').requestSubmit(); await wait(100);
      const state=readState(), text=appText();
      document.body.dataset.canonicalSolve=String(state.solved===true&&text.includes('Ваша реконструкция выдержала проверку по всем ключевым звеньям'));
      markCommon();
      document.body.dataset.ready='solved';
      return;
    }
    finalSelect({room:'407',alarm:'force',route:'window',sequence:'denis'}); document.querySelector('[data-final]').requestSubmit(); await wait(100);
    const state=readState(), text=appText();
    if(!state.solved || !text.includes('Дело закрыто')) throw new Error('wrong final did not complete');
    if(!text.includes('не выдержал') || !text.includes('Пять звеньев, на которых держится дело')) throw new Error('wrong final reveal did not compare theory');
    const url=new URL(location.href); url.searchParams.set('mode','resume-wrong'); location.replace(url.toString());
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
  const common=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1','--virtual-time-budget=6500'];
  const shots=[
    ['entry-desktop.png','entry','--window-size=1440,1000'],
    ['entry-mobile.png','entry','--window-size=390,1100'],
    ['desk-desktop.png','desk','--window-size=1440,1400'],
    ['desk-mobile.png','desk','--window-size=390,1800'],
    ['final-desktop.png','final','--window-size=1440,1800'],
    ['final-mobile.png','final','--window-size=390,2600'],
  ];
  for(const [name,mode,size] of shots){ const file=path.join(outDir,name); await runChrome([...common,size,`--screenshot=${file}`,`${base}?mode=${mode}`]); if(fs.statSync(file).size<35_000) throw new Error(`${name} too small`); }
  const {stdout:wrongDom}=await runChrome([...common,'--window-size=1440,1800','--dump-dom',`${base}?mode=solve-wrong`]);
  for(const marker of ['data-ready="solved"','data-wrong-final-accepted="true"','data-checkpoint-hypotheses="true"','data-reveal-comparison="true"','data-refresh-preserved="true"','data-roomless="true"','Охрана раскрыла не ту дверь']) if(!wrongDom.includes(marker)) throw new Error(`solo wrong-theory DOM missing ${marker}`);
  const {stdout:correctDom}=await runChrome([...common,'--window-size=1440,1800','--dump-dom',`${base}?mode=solve-correct`]);
  for(const marker of ['data-ready="solved"','data-canonical-solve="true"','data-roomless="true"','Охрана раскрыла не ту дверь']) if(!correctDom.includes(marker)) throw new Error(`solo canonical DOM missing ${marker}`);
  fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify({solo407:true,entry:true,desk:true,final:true,roomless:true,hintsProgressive:true,playerOwnedCheckpoints:true,wrongFinalAccepted:true,revealComparison:true,refreshPreserved:true,canonicalSolve:true,fullSolve:true,screenshots:shots.map(x=>x[0])},null,2));
  console.log(JSON.stringify({solo407:true,roomless:true,hintsProgressive:true,playerOwnedCheckpoints:true,wrongFinalAccepted:true,revealComparison:true,refreshPreserved:true,canonicalSolve:true,fullSolve:true,visualStates:['entry','desk','final']},null,2));
}finally{await new Promise(resolve=>server.close(resolve));}
