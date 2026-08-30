#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const token=process.env.SMOKE_TOKEN||'';
if(token.length<32)throw new Error('SMOKE_TOKEN missing');
const pageUrl='https://valera2872.github.io/ktovret-web/ai-investigation/?case=AI-SMOKE-V2';
const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(file=>fs.existsSync(file));
if(!chrome)throw new Error(`Chrome not found: ${chromeCandidates.join(', ')}`);

const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ml-ai-v2-browser-'));
const child=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port=9222','--remote-allow-origins=*',`--user-data-dir=${profile}`,pageUrl
],{stdio:['ignore','pipe','pipe']});
let stderr='';child.stderr.on('data',chunk=>{stderr+=chunk.toString()});

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function targets(){
  for(let i=0;i<80;i++){
    try{const response=await fetch('http://127.0.0.1:9222/json');if(response.ok){const list=await response.json();const page=list.find(item=>item.type==='page'&&item.url.includes('/ai-investigation/'));if(page)return page}}
    catch{}
    await sleep(125);
  }
  throw new Error(`Chrome DevTools target unavailable: ${stderr.slice(-1200)}`);
}

let socket;const pending=new Map();let seq=0;
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const response=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(response.exceptionDetails)throw new Error(response.exceptionDetails.text||'Runtime.evaluate failed');return response.result?.value}
async function waitFor(expression,label,timeout=20000){const start=Date.now();let value;while(Date.now()-start<timeout){try{value=await evaluate(expression);if(value)return value}catch{}await sleep(150)}throw new Error(`Timed out waiting for ${label}`)}

try{
  const target=await targets();
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
  socket.addEventListener('message',event=>{const message=JSON.parse(String(event.data));if(!message.id)return;const item=pending.get(message.id);if(!item)return;pending.delete(message.id);if(message.error)item.reject(new Error(message.error.message||'CDP error'));else item.resolve(message.result)});
  await send('Runtime.enable');
  await waitFor(`document.readyState==='complete' && !!document.querySelector('[data-ai-v2-player]')`,'generic player load');

  const initial=await evaluate(`({title:document.title,accessHidden:document.querySelector('[data-view="access"]').hidden,url:location.href})`);
  if(initial.accessHidden!==false||!initial.url.includes('AI-SMOKE-V2'))throw new Error('access view not visible');

  await evaluate(`(()=>{const input=document.querySelector('[data-access-token]');input.value=${JSON.stringify(token)};document.querySelector('[data-action="unlock"]').click();return true})()`);
  await waitFor(`document.querySelector('[data-view="intro"]')?.hidden===false`,'paid intro');
  const intro=await evaluate(`({title:document.querySelector('[data-case-title]')?.textContent,tier:document.querySelector('[data-case-tier]')?.textContent,suspects:document.querySelector('[data-suspect-count]')?.textContent,liveScript:[...document.scripts].some(s=>s.src.includes('ai-avatar-provider.js'))})`);
  if(intro.title!=='Synthetic v2 smoke'||!/^Text\b/.test(intro.tier||'')||intro.liveScript)throw new Error(`intro contract failed: ${JSON.stringify(intro)}`);

  await evaluate(`document.querySelector('[data-action="start"]').click()`);
  await waitFor(`document.querySelector('[data-view="workspace"]')?.hidden===false`,'workspace');
  const textMode=await evaluate(`({avatarHidden:document.querySelector('[data-avatar-stage]')?.hidden,tier:document.querySelector('[data-avatar-stage]')?.dataset?.tier,evidence:document.querySelector('[data-evidence="S1"]')?.textContent||'',opening:document.querySelector('[data-transcript]')?.textContent||''})`);
  if(textMode.avatarHidden!==true||textMode.tier!=='text'||!textMode.evidence.includes('Synthetic evidence')||!textMode.opening.includes('Synthetic opening alpha.'))throw new Error(`workspace contract failed: ${JSON.stringify(textMode)}`);

  await evaluate(`(()=>{const field=document.querySelector('#aiv2-question');field.value='smoke';document.querySelector('[data-composer]').requestSubmit();return true})()`);
  await waitFor(`document.querySelector('[data-room-status]')?.textContent==='Признание получено'`,'canonical confession');
  const terminal=await evaluate(`({transcript:document.querySelector('[data-transcript]')?.textContent||'',notes:document.querySelector('[data-notes]')?.textContent||'',turns:document.querySelector('[data-turn-counter]')?.textContent||'',liveScript:[...document.scripts].some(s=>s.src.includes('ai-avatar-provider.js'))})`);
  if(!terminal.transcript.includes('Synthetic canonical confession.')||!terminal.notes.includes('Synthetic terminal note.')||!terminal.turns.startsWith('1 / 5')||terminal.liveScript)throw new Error(`terminal UI failed: ${JSON.stringify(terminal)}`);

  await evaluate(`document.querySelector('[data-action="theory"]').click()`);
  await waitFor(`document.querySelector('[data-view="theory"]')?.hidden===false`,'theory view');
  await evaluate(`(()=>{const radio=document.querySelector('input[name="suspect"][value="alpha"]');radio.checked=true;document.querySelector('[data-theory-form] textarea[name="reason"]').value='synthetic smoke mechanism';document.querySelector('[data-theory-form]').requestSubmit();return true})()`);
  await waitFor(`document.querySelector('[data-verdict]')?.hidden===false && document.querySelector('[data-verdict]')?.textContent.includes('Synthetic smoke passed')`,'successful theory');
  const final=await evaluate(`({verdict:document.querySelector('[data-verdict]')?.textContent||'',liveScript:[...document.scripts].some(s=>s.src.includes('ai-avatar-provider.js'))})`);
  if(!final.verdict.includes('Synthetic browser end-to-end path completed.')||final.liveScript)throw new Error(`final UI failed: ${JSON.stringify(final)}`);
  console.log('production generic AI v2 browser smoke: ok');
}finally{
  try{socket?.close()}catch{}
  child.kill('SIGTERM');
  await sleep(250);
  try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
}
