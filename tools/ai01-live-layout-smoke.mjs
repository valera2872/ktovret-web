#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const siteRoot=path.resolve(here,'..');
const casePath='/detektivnaya-igra-s-ii/';
const viewport={width:1600,height:675};
const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=chromeCandidates.find(candidate=>fs.existsSync(candidate));
if(!chrome)throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const contentTypes=new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.svg','image/svg+xml'],['.webp','image/webp']]);
const probe=`<script>(()=>{const run=()=>{const intro=document.querySelector('[data-view="intro"]');const workspace=document.querySelector('[data-view="workspace"]');const avatar=document.querySelector('[data-avatar-stage]');if(intro)intro.hidden=true;if(workspace)workspace.hidden=false;if(avatar){avatar.hidden=false;avatar.setAttribute('aria-hidden','false')}document.body.classList.add('aid-live-mode');requestAnimationFrame(()=>requestAnimationFrame(()=>{const rect=selector=>{const el=document.querySelector(selector);if(!el)return null;const r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),height:Math.round(r.height),display:getComputedStyle(el).display}};const report={viewport:{width:innerWidth,height:innerHeight},avatar:rect('[data-avatar-stage]'),videoShell:rect('.aid-avatar-video-shell'),transcript:rect('[data-transcript]'),composer:rect('[data-composer]'),textarea:rect('#aid-question'),send:rect('.aid-send'),roomHead:rect('.aid-room-head')};document.body.dataset.ai01LayoutSmoke=btoa(JSON.stringify(report))}))};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run()})();</script>`;

const server=http.createServer((request,response)=>{const requestUrl=new URL(request.url||'/','http://127.0.0.1');let relative=decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');if(!relative||relative.endsWith('/'))relative+='index.html';const filePath=path.resolve(siteRoot,relative);if(!filePath.startsWith(`${siteRoot}${path.sep}`)&&filePath!==siteRoot){response.writeHead(403).end('Forbidden');return}if(!fs.existsSync(filePath)||!fs.statSync(filePath).isFile()){response.writeHead(404).end('Not found');return}response.setHeader('Content-Type',contentTypes.get(path.extname(filePath).toLowerCase())||'application/octet-stream');let body=fs.readFileSync(filePath);if(relative==='detektivnaya-igra-s-ii/index.html'){let html=body.toString('utf8').replace(/<script\s+src="[^"]+"[^>]*><\/script>/g,'');html=html.replace('</body>',`${probe}</body>`);body=Buffer.from(html)}response.end(body)});

const listen=()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port))});
const runChrome=args=>new Promise((resolve,reject)=>{const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stdout='';let stderr='';child.stdout.on('data',chunk=>{stdout+=chunk});child.stderr.on('data',chunk=>{stderr+=chunk});child.on('error',reject);child.on('close',code=>code===0?resolve(stdout):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-2000)}`)))});

const port=await listen();
try{
  const url=`http://127.0.0.1:${port}${casePath}`;
  const dom=await runChrome(['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1',`--window-size=${viewport.width},${viewport.height}`,'--virtual-time-budget=1500','--dump-dom',url]);
  const encoded=dom.match(/data-ai01-layout-smoke="([^"]+)"/)?.[1];
  if(!encoded)throw new Error('AI-01 Live layout probe did not run');
  const report=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
  const inside=(name,rect)=>{if(!rect)throw new Error(`${name} missing`);if(rect.top<0||rect.bottom>report.viewport.height)throw new Error(`${name} outside viewport: ${JSON.stringify(rect)} in ${report.viewport.height}px`)};
  inside('composer',report.composer);inside('textarea',report.textarea);inside('send',report.send);inside('avatar',report.avatar);inside('video shell',report.videoShell);
  if(report.avatar.height<245)throw new Error(`avatar too small at ${report.avatar.height}px`);
  if(report.videoShell.height<200)throw new Error(`avatar video too small at ${report.videoShell.height}px`);
  if(!report.transcript||report.transcript.height<90)throw new Error(`transcript collapsed: ${JSON.stringify(report.transcript)}`);
  if(report.roomHead?.display!=='none')throw new Error(`duplicated room heading still consumes Live viewport: ${JSON.stringify(report.roomHead)}`);
  console.log(JSON.stringify(report,null,2));
}finally{await new Promise(resolve=>server.close(resolve))}
