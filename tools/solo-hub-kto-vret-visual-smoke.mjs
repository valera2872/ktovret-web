#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { applySolo407 } from './import-mobile/solo-407-postprocess.mjs';
import { polishSoloKtoVret } from './import-mobile/solo-hub-kto-vret-polish.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const outDir = path.join(repo, 'artifacts', 'solo-407');
const renderRoot = path.join(outDir, 'hub-render');
fs.mkdirSync(outDir, { recursive:true });
fs.rmSync(renderRoot, { recursive:true, force:true });
fs.mkdirSync(path.join(renderRoot, 'assets'), { recursive:true });

const cssFile = path.join(repo, 'assets', 'solo-hub-kto-vret.css');
if (!fs.existsSync(cssFile)) throw new Error('Who Lies showcase CSS missing');
const css = fs.readFileSync(cssFile, 'utf8');
for (const marker of ['.solo407-kv{','.solo407-kv-head','.solo407-kv-cases','.solo407-kv-cta','@media(max-width:900px)']) {
  if (!css.includes(marker)) throw new Error(`showcase CSS marker missing: ${marker}`);
}

applySolo407(renderRoot);
polishSoloKtoVret(renderRoot);
for (const asset of ['mysterylogic.css','case-407-solo.css','solo-hub-kto-vret.css','room-407-evidence.webp','ml-mark.svg']) {
  fs.copyFileSync(path.join(repo, 'assets', asset), path.join(renderRoot, 'assets', asset));
}

const hubFile = path.join(renderRoot, 'detektivnye-igry-dlya-odnogo', 'index.html');
let hubHtml = fs.readFileSync(hubFile, 'utf8');
for (const marker of ['<h2 id="solo407-kv-title"><em>«Кто врёт?»</em></h2>','Играть в 15 дел бесплатно','Четыре входа в архив']) {
  if (!hubHtml.includes(marker)) throw new Error(`generated solo hub missing: ${marker}`);
}
if (hubHtml.includes('А ещё здесь есть')) throw new Error('generated solo hub still frames Who Lies as secondary');
hubHtml = hubHtml.replace('</body>', `<script>
requestAnimationFrame(() => {
  const block = document.querySelector('.solo407-kv');
  if (block) window.scrollTo(0, Math.max(0, block.offsetTop - 20));
  document.body.dataset.overflow = String(document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
});
</script></body>`);
fs.writeFileSync(hubFile, hubHtml);

const chromeCandidates = [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found: ${chromeCandidates.join(', ')}`);
const types = new Map([['.html','text/html; charset=utf-8'],['.css','text/css; charset=utf-8'],['.webp','image/webp'],['.svg','image/svg+xml']]);
const server = http.createServer((request,response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath = path.resolve(repo, relative);
  if (!filePath.startsWith(`${repo}${path.sep}`) || !fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type', types.get(path.extname(filePath)) || 'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});
const port = await new Promise((resolve,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',() => resolve(server.address().port)); });
const runChrome = (args) => new Promise((resolve,reject) => {
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';
  child.stdout.on('data',c=>stdout+=c);
  child.stderr.on('data',c=>stderr+=c);
  child.on('error',reject);
  child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1200)}`)));
});
try {
  const pagePath = path.relative(repo, hubFile).split(path.sep).join('/');
  const url = `http://127.0.0.1:${port}/${pagePath}`;
  const common = ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1','--virtual-time-budget=1800'];
  for (const [name,size] of [['hub-showcase-desktop.png','--window-size=1440,1800'],['hub-showcase-mobile.png','--window-size=390,3200']]) {
    const file = path.join(outDir,name);
    await runChrome([...common,size,`--screenshot=${file}`,url]);
    if (fs.statSync(file).size < 35_000) throw new Error(`${name} too small`);
  }
  const {stdout:dom} = await runChrome([...common,'--window-size=390,3200','--dump-dom',url]);
  if (!dom.includes('data-overflow="false"')) throw new Error('Who Lies showcase horizontal overflow');
  for (const marker of ['Кто врёт?','Играть в 15 дел бесплатно','Четыре входа в архив','100 коротких расследований']) {
    if (!dom.includes(marker)) throw new Error(`Who Lies showcase DOM missing: ${marker}`);
  }
  if (dom.includes('А ещё здесь есть')) throw new Error('Who Lies showcase secondary framing returned');
  console.log(JSON.stringify({ktoVretShowcase:true,generatedHub:true,desktop:true,mobile:true,horizontalOverflow:false,secondaryFraming:false},null,2));
} finally {
  await new Promise((resolve) => server.close(resolve));
}
