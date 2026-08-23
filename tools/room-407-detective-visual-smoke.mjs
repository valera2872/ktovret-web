#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = process.env.SITE_ROOT ? path.resolve(process.env.SITE_ROOT) : path.resolve(here, '..');
const outDir = path.join(siteRoot, 'artifacts', 'room-407-detective-v4');
fs.mkdirSync(outDir, { recursive: true });

const chromeCandidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(siteRoot, 'assets/case-407-data.js'), 'utf8'), context, { filename: 'case-407-data.js' });
vm.runInNewContext(fs.readFileSync(path.join(siteRoot, 'assets/case-407-detective-audit-v4.js'), 'utf8'), context, { filename: 'case-407-detective-audit-v4.js' });
vm.runInNewContext(fs.readFileSync(path.join(siteRoot, 'assets/case-407-detective-proof-v4.js'), 'utf8'), context, { filename: 'case-407-detective-proof-v4.js' });
const data = context.window.MLCase407;
if (data.logicVersion !== 4 || data.proofRevision !== '4.1') throw new Error('detective v4.1 overlays did not apply');

const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const evidenceHtml = (item, index) => {
  const paragraphs = (item.body || []).map((text) => `<p>${esc(text)}</p>`).join('');
  const facts = (item.facts || []).length ? `<div class="case2317-facts">${item.facts.map((fact) => `<span>${esc(fact)}</span>`).join('')}</div>` : '';
  const messages = (item.messages || []).length ? `<div class="case2317-messages">${item.messages.map(([name, text]) => `<div class="case2317-message"><b>${esc(name)}</b>${esc(text)}</div>`).join('')}</div>` : '';
  const stamp = item.stamp ? `<span class="case2317-stamp">${esc(item.stamp)}</span>` : '';
  const photo = item.image ? `<figure class="case407-evidence-photo"><img src="${esc(item.image)}" alt="${esc(item.alt || item.title)}"><figcaption>Фотоматериал следственной группы</figcaption></figure>` : '';
  return `<article class="case2317-evidence ${item.image ? 'has-photo' : ''}" data-index="${String(index + 1).padStart(2, '0')}"><span class="tag">${esc(item.tag)}</span><h3>${esc(item.title)}</h3>${photo}${paragraphs}${messages}${facts}${stamp}</article>`;
};
const roleMeta = { investigator: 'СЛЕДОВАТЕЛЬ', analyst: 'АНАЛИТИК' };
const previewHtml = (stage, role) => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="../../assets/mysterylogic.css"><link rel="stylesheet" href="../../assets/premium.css"><link rel="stylesheet" href="../../assets/case-2317.css"><link rel="stylesheet" href="../../assets/case-2317-v2.css"><link rel="stylesheet" href="../../assets/case-407.css"><link rel="stylesheet" href="../../assets/case-407-evidence-v2.css"><link rel="stylesheet" href="../../assets/case-407-evidence-v3.css"><style>body{margin:0}.preview{max-width:1180px;margin:0 auto;padding:28px 18px 80px}.preview-head{margin-bottom:18px;padding:18px;border:1px solid rgba(213,164,86,.22);background:#05131c}.preview-head small{color:#b98741;font-size:9px;letter-spacing:.12em}.preview-head h1{margin:6px 0 0;color:#ead8bb;font:400 36px Georgia,serif}.preview-head p{margin:8px 0 0;color:#9f9587;font-size:12px}.preview-role{display:inline-block;margin-top:11px;padding:6px 8px;border:1px solid rgba(213,164,86,.2);color:#d9bf8d;font-size:9px;letter-spacing:.1em}@media(max-width:760px){.preview{padding:16px 10px 60px}}</style></head><body class="case2317-body case407-body"><main class="preview" data-case407-app><section class="preview-head"><small>ЭТАП ${stage.id} · ${roleMeta[role]}</small><h1>${esc(stage.title)}</h1><p>${esc(stage.objective)}</p><span class="preview-role">Ваш пакет: 3 материала</span></section><div class="case2317-evidence-grid">${stage[role].map(evidenceHtml).join('')}</div></main><script src="../../assets/case-407-plaque-code-v2.js"></script><script src="../../assets/case-407-evidence-v2.js"></script><script src="../../assets/case-407-evidence-finalize.js"></script><script src="../../assets/case-407-detective-visual-v4.js"></script><script>setTimeout(()=>{document.body.dataset.overflow=String(document.documentElement.scrollWidth>window.innerWidth+1)},700)</script></body></html>`;

for (const stage of data.stages) for (const role of ['investigator', 'analyst']) fs.writeFileSync(path.join(outDir, `stage-${stage.id}-${role}.html`), previewHtml(stage, role));

const contentTypes = new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.webp','image/webp'],['.svg','image/svg+xml'],['.png','image/png']]);
const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath = path.resolve(siteRoot, relative);
  if (!filePath.startsWith(`${siteRoot}${path.sep}`) || !fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type', contentTypes.get(path.extname(filePath)) || 'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});
const port = await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => resolve(server.address().port)); });
const runChrome = (args) => new Promise((resolve, reject) => {
  const child = spawn(chrome, args, { stdio: ['ignore','pipe','pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', reject);
  child.on('close', (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1600)}`)));
});
const dimensions = (file) => { const bytes = fs.readFileSync(file); return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length }; };
const viewports = [{ name:'desktop', width:1440, height:1900 }, { name:'mobile', width:390, height:2200 }];
const results = [];

const assertDom = (key, viewport, dom) => {
  if ((dom.match(/case407-materialized/g) || []).length < 3) throw new Error(`${key}/${viewport}: fewer than 3 materialized cards`);
  if ((dom.match(/data-evidence-finalized="1"/g) || []).length < 3) throw new Error(`${key}/${viewport}: fewer than 3 finalized cards`);
  if (!dom.includes('data-overflow="false"')) throw new Error(`${key}/${viewport}: horizontal overflow`);
  if (key === '1-investigator') {
    if (!dom.includes('H-7C4') || dom.includes('H-409')) throw new Error(`${key}/${viewport}: plaque privacy regression`);
    if (dom.includes('телефон Марты, её ключ-карта')) throw new Error(`${key}/${viewport}: impossible key-card returned`);
  }
  if (key === '1-analyst') {
    for (const marker of ['H-7C4','H-409','L-409','L-407','S-407']) if (dom.includes(marker)) throw new Error(`${key}/${viewport}: leaked legacy/private marker ${marker}`);
    for (const marker of ['L-6B2','L-4A8','S-8D1','LOCKED']) if (!dom.includes(marker)) throw new Error(`${key}/${viewport}: missing opaque marker ${marker}`);
  }
  if (key === '2-investigator') {
    if (!dom.includes('00:51:50') || !dom.includes('через восемь секунд после входа Елены')) throw new Error(`${key}/${viewport}: phone placement chronology missing`);
  }
  if (key === '2-analyst') {
    if (!dom.includes('•••••6') || !dom.includes('•••••7')) throw new Error(`${key}/${viewport}: realistic duress visual missing`);
    if (dom.includes('телефон неподвижен')) throw new Error(`${key}/${viewport}: Wi-Fi visual overclaims exact location`);
    if (!dom.includes('телефон остаётся в зоне WEST-4')) throw new Error(`${key}/${viewport}: Wi-Fi caveat visual missing`);
    if (!dom.includes('часы: WEST-4 → STAFF-4 → LOADING-B1')) throw new Error(`${key}/${viewport}: network chronology label missing`);
  }
  if (key === '3-investigator') {
    for (const marker of ['BR-220 / NS-17','23:50','23:51','ни одного открытия до события 01:12']) if (!dom.includes(marker)) throw new Error(`${key}/${viewport}: sealed sapphire chain missing ${marker}`);
  }
  if (key === '3-analyst') {
    if (!dom.includes('Последние четыре минуты')) throw new Error(`${key}/${viewport}: neutral stage3 title missing`);
    for (const marker of ['ВОДИТЕЛЬ: E. RAEVA','не идентифицирует человека','MO-W1: OFFLINE 01:27','22:48 · Марта','22:49 · Елена','УДАЛЁННАЯ ПЕРЕПИСКА','не попадают в поле камеры погрузочной двери']) if (!dom.includes(marker)) throw new Error(`${key}/${viewport}: missing proof marker ${marker}`);
    if (dom.includes('BLE: MO-W1 В САЛОНЕ') || dom.includes('Bluetooth-журнал')) throw new Error(`${key}/${viewport}: unsupported vehicle Bluetooth inference returned`);
  }
};

try {
  for (const stage of data.stages) for (const role of ['investigator','analyst']) {
    const key = `${stage.id}-${role}`;
    for (const viewport of viewports) {
      const url = `http://127.0.0.1:${port}/artifacts/room-407-detective-v4/stage-${stage.id}-${role}.html`;
      const common = ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1',`--window-size=${viewport.width},${viewport.height}`,'--virtual-time-budget=2600'];
      const screenshot = path.join(outDir, `stage-${stage.id}-${role}-${viewport.name}.png`);
      await runChrome([...common, `--screenshot=${screenshot}`, url]);
      const { stdout: dom } = await runChrome([...common, '--dump-dom', url]);
      assertDom(key, viewport.name, dom);
      const size = dimensions(screenshot);
      if (size.width !== viewport.width || size.height !== viewport.height || size.bytes < 24_000) throw new Error(`${key}/${viewport.name}: bad screenshot ${JSON.stringify(size)}`);
      results.push({ stage:stage.id, role, viewport:viewport.name, ...size, screenshot:path.basename(screenshot) });
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ logicVersion:data.logicVersion, proofRevision:data.proofRevision, chrome, results }, null, 2));
console.log(JSON.stringify({ logicVersion:data.logicVersion, proofRevision:data.proofRevision, screenshots:results.length, results }, null, 2));