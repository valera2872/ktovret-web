#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const outDir = path.join(repo, 'artifacts', 'solo-407');
fs.mkdirSync(outDir, { recursive:true });

const cssFile = path.join(repo, 'assets', 'solo-hub-kto-vret.css');
if (!fs.existsSync(cssFile)) throw new Error('Who Lies showcase CSS missing');
const css = fs.readFileSync(cssFile, 'utf8');
for (const marker of ['.solo407-kv{','.solo407-kv-head','.solo407-kv-cases','.solo407-kv-cta','@media(max-width:900px)']) if (!css.includes(marker)) throw new Error(`showcase CSS marker missing: ${marker}`);

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="../../assets/mysterylogic.css"><link rel="stylesheet" href="../../assets/case-407-solo.css"><link rel="stylesheet" href="../../assets/solo-hub-kto-vret.css"></head><body class="solo407-body"><main class="solo407-shell solo407-hub" style="padding-top:40px"><section class="solo407-kv" aria-labelledby="solo407-kv-title"><div class="solo407-kv-head"><div><p class="solo407-kv-label">Короткий формат · можно начать за минуту</p><h2 id="solo407-kv-title">А ещё здесь есть <em>«Кто врёт?»</em></h2><p class="solo407-kv-lead">Короткие законченные детективные дела для одного. Несколько фактов, показаний или журналов — и одно несоответствие, которое нужно не угадать, а доказать.</p></div><div class="solo407-kv-fast"><div><strong>15</strong><span>дел можно пройти бесплатно</span></div><div><strong>5–10 мин</strong><span>одно законченное расследование</span></div><div><strong>1 ответ</strong><span>следует из материалов дела</span></div></div></div><div class="solo407-kv-flow"><article class="solo407-kv-step"><small>01 · ЧИТАЕТЕ</small><strong>Получаете материалы</strong><p>Обстоятельства, показания, время, маршруты и ограничения.</p></article><article class="solo407-kv-step"><small>02 · СВЕРЯЕТЕ</small><strong>Ищете несоответствие</strong><p>Какая деталь не может одновременно быть правдой вместе с остальными?</p></article><article class="solo407-kv-step"><small>03 · РЕШАЕТЕ</small><strong>Доказываете версию</strong><p>Выбираете ответ и сразу видите логику решения.</p></article></div><div class="solo407-kv-cases"><a class="solo407-kv-case" href="#"><small>Дело №001 · ≈ 8 минут</small><strong>Четыре входа в архив</strong><span>Порядок событий и способы доступа →</span></a><a class="solo407-kv-case" href="#"><small>Дело №002 · ≈ 7 минут</small><strong>Три несинхронных журнала</strong><span>Камера, датчик и турникет →</span></a><a class="solo407-kv-case" href="#"><small>Дело №003 · ≈ 6 минут</small><strong>Пять папок и пустое место</strong><span>Единственный возможный порядок →</span></a></div><div class="solo407-kv-bottom"><p>Не готовы сейчас погружаться в часовое расследование? Это лучший вход в Mystery Logic: откройте одно короткое дело, проверьте себя и продолжайте столько, сколько хочется.</p><a class="solo407-kv-cta" href="#">Играть в 15 дел бесплатно →</a></div></section></main><script>document.body.dataset.overflow=String(document.documentElement.scrollWidth>document.documentElement.clientWidth+1);</script></body></html>`;
const htmlFile = path.join(outDir, 'hub-showcase.html');
fs.writeFileSync(htmlFile, html);

const chromeCandidates = [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found: ${chromeCandidates.join(', ')}`);
const types = new Map([['.html','text/html; charset=utf-8'],['.css','text/css; charset=utf-8']]);
const server = http.createServer((request,response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath = path.resolve(repo, relative);
  if (!filePath.startsWith(`${repo}${path.sep}`) || !fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type', types.get(path.extname(filePath)) || 'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});
const port = await new Promise((resolve,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',() => resolve(server.address().port)); });
const runChrome = (args) => new Promise((resolve,reject) => { const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']}); let stdout='',stderr=''; child.stdout.on('data',c=>stdout+=c); child.stderr.on('data',c=>stderr+=c); child.on('error',reject); child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1200)}`))); });
try {
  const url = `http://127.0.0.1:${port}/artifacts/solo-407/hub-showcase.html`;
  const common = ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1','--virtual-time-budget=1200'];
  for (const [name,size] of [['hub-showcase-desktop.png','--window-size=1440,1500'],['hub-showcase-mobile.png','--window-size=390,2100']]) {
    const file = path.join(outDir,name);
    await runChrome([...common,size,`--screenshot=${file}`,url]);
    if (fs.statSync(file).size < 30_000) throw new Error(`${name} too small`);
  }
  const {stdout:dom} = await runChrome([...common,'--window-size=390,2100','--dump-dom',url]);
  if (!dom.includes('data-overflow="false"')) throw new Error('Who Lies showcase horizontal overflow');
  for (const marker of ['А ещё здесь есть','Кто врёт?','Играть в 15 дел бесплатно','Четыре входа в архив']) if (!dom.includes(marker)) throw new Error(`Who Lies showcase DOM missing: ${marker}`);
  console.log(JSON.stringify({ktoVretShowcase:true,desktop:true,mobile:true,horizontalOverflow:false},null,2));
} finally {
  await new Promise((resolve) => server.close(resolve));
}