#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const out = path.join(repo, 'artifacts', 'conversion-ux');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const chromeCandidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const stub = `<script>window.MysteryLogicFunnel={track:(name,meta,target)=>{const row=[name,meta?.flow||'',meta?.step||'',meta?.choice||'',target||''].join('|');document.body.dataset.events=((document.body.dataset.events||'')+';'+row);}};</script>`;
const asset = `<link rel="stylesheet" href="/assets/conversion-ux.css"><script defer src="/assets/conversion-ux-analytics.js"></script>`;

const hubDir = path.join(out, 'detektivnye-igry-dlya-dvoih');
fs.mkdirSync(hubDir, { recursive: true });
fs.writeFileSync(path.join(hubDir, 'index.html'), `<!doctype html><html><head><meta charset="utf-8">${asset}</head><body class="coop-v4"><main class="duel-page"><section class="duel-hero"><div class="coop-hero-grid"><div class="coop-hero-copy"><h1>OLD HERO</h1><p>old copy</p></div><div class="coop-hero-scene"></div></div></section><section class="duel-app-shell"><div data-duel-room-app><button data-duel-action="focus-code">focus</button></div></section></main>${stub}<script>window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{document.body.dataset.ready='1';},120));</script></body></html>`);

const pairDir = path.join(out, 'detektivnye-igry-dlya-dvoih', '407');
fs.mkdirSync(pairDir, { recursive: true });
fs.writeFileSync(path.join(pairDir, 'index.html'), `<!doctype html><html><head><meta charset="utf-8">${asset}</head><body><main data-case407-app><div class="case2317-actions"><button data-action="create-open">Создать комнату</button><button data-action="join-focus">У меня есть код</button></div></main>${stub}<script>window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{document.querySelector('[data-action="create-open"]')?.click();document.body.dataset.ready='1';},160));</script></body></html>`);

const soloDir = path.join(out, 'detektivnye-igry-dlya-odnogo', '407');
fs.mkdirSync(soloDir, { recursive: true });
fs.writeFileSync(path.join(soloDir, 'index.html'), `<!doctype html><html><head><meta charset="utf-8">${asset}</head><body><main data-solo407-app><section data-solo407-progressive data-progressive-step="scene" data-progressive-signature="scene"></section></main>${stub}<script>window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{document.body.dataset.ready='1';},120));</script></body></html>`);

const type = new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8']]);
const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  let file = path.resolve(repo, relative);
  if (url.pathname.startsWith('/detektivnye-igry-dlya-')) file = path.resolve(out, relative, url.pathname.endsWith('/') ? 'index.html' : '');
  if (!file.startsWith(repo) && !file.startsWith(out)) return response.writeHead(403).end('Forbidden');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type', type.get(path.extname(file)) || 'application/octet-stream');
  response.end(fs.readFileSync(file));
});
const port = await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => resolve(server.address().port)); });

const runChrome = (args) => new Promise((resolve, reject) => {
  const child = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', (c) => stdout += c); child.stderr.on('data', (c) => stderr += c);
  child.on('error', reject); child.on('close', (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1200)}`)));
});

const dump = async (pathname) => {
  const url = `http://127.0.0.1:${port}${pathname}`;
  const { stdout } = await runChrome(['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--virtual-time-budget=900','--dump-dom',url]);
  if (!stdout.includes('data-ready="1"')) throw new Error(`${pathname}: browser test did not settle`);
  return stdout;
};

try {
  const hub = await dump('/detektivnye-igry-dlya-dvoih/');
  for (const marker of ['Как хотите играть сегодня?','data-coop-format-choice="deep-2317"','data-coop-format-choice="short-duel"','data-coop-format-choice="join-existing"','step_view|coop-hub|format-choice']) {
    if (!hub.includes(marker)) throw new Error(`Co-op hub conversion smoke missing ${marker}`);
  }
  if (hub.includes('OLD HERO')) throw new Error('Co-op hub old hero survived conversion layer');

  const pair = await dump('/detektivnye-igry-dlya-dvoih/407/');
  for (const marker of ['Начать вдвоём — создать комнату','Войти по приглашению','Ссылка для второго игрока появится сразу','step_view|coop-entry|cover','diagnostic_choice|||coop:407:entry:create-open']) {
    if (!pair.includes(marker)) throw new Error(`Pair 407 entry smoke missing ${marker}`);
  }

  const solo = await dump('/detektivnye-igry-dlya-odnogo/407/');
  if (!solo.includes('step_view|solo-407-progressive|scene')) throw new Error('Solo 407 progressive impression missing');

  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({
    verdict: 'CONVERSION_UX_BROWSER_PASS',
    coopHubChoice: true,
    coop407EntryMeasured: true,
    solo407StepViews: true,
  }, null, 2));
  console.log(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
} finally {
  await new Promise((resolve) => server.close(resolve));
}
