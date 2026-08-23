#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = process.env.SITE_ROOT ? path.resolve(process.env.SITE_ROOT) : path.resolve(here, '..');
const outDir = path.join(siteRoot, 'artifacts', 'room-407-evidence-smoke');
fs.mkdirSync(outDir, { recursive: true });

const chromeCandidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(siteRoot, 'assets/case-407-data.js'), 'utf8'), context, { filename: 'case-407-data.js' });
const data = context.window.MLCase407;
const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const evidenceHtml = (item, index) => {
  const paragraphs = (item.body || []).map((text) => `<p>${esc(text)}</p>`).join('');
  const facts = (item.facts || []).length ? `<div class="case2317-facts">${item.facts.map((fact) => `<span>${esc(fact)}</span>`).join('')}</div>` : '';
  const messages = (item.messages || []).length ? `<div class="case2317-messages">${item.messages.map(([name, text]) => `<div class="case2317-message"><b>${esc(name)}</b>${esc(text)}</div>`).join('')}</div>` : '';
  const stamp = item.stamp ? `<span class="case2317-stamp">${esc(item.stamp)}</span>` : '';
  const photo = item.image ? `<figure class="case407-evidence-photo"><img src="${esc(item.image)}" alt="${esc(item.alt || item.title)}"><figcaption>Фотоматериал следственной группы</figcaption></figure>` : '';
  return `<article class="case2317-evidence ${item.image ? 'has-photo' : ''}" data-index="${String(index + 1).padStart(2, '0')}"><span class="tag">${esc(item.tag)}</span><h3>${esc(item.title)}</h3>${photo}${paragraphs}${messages}${facts}${stamp}</article>`;
};
const previewHtml = (stage) => {
  const materials = [...stage.investigator, ...stage.analyst];
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="../../assets/mysterylogic.css"><link rel="stylesheet" href="../../assets/premium.css"><link rel="stylesheet" href="../../assets/case-2317.css"><link rel="stylesheet" href="../../assets/case-2317-v2.css"><link rel="stylesheet" href="../../assets/case-407.css"><link rel="stylesheet" href="../../assets/case-407-evidence-v2.css"><style>body{margin:0}.preview{max-width:1180px;margin:0 auto;padding:28px 18px 60px}.preview-head{margin-bottom:18px;padding:18px;border:1px solid rgba(213,164,86,.22);background:#05131c}.preview-head small{color:#b98741;font-size:9px;letter-spacing:.12em}.preview-head h1{margin:6px 0 0;color:#ead8bb;font:400 36px Georgia,serif}.preview-head p{margin:8px 0 0;color:#9f9587;font-size:12px}.case2317-evidence-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}@media(max-width:760px){.preview{padding:16px 10px 40px}.case2317-evidence-grid{grid-template-columns:1fr}}</style></head><body class="case2317-body case407-body"><main class="preview" data-case407-app><section class="preview-head"><small>ВИЗУАЛЬНЫЙ SMOKE · ЭТАП ${stage.id}</small><h1>${esc(stage.title)}</h1><p>${esc(stage.objective)}</p></section><div class="case2317-evidence-grid">${materials.map(evidenceHtml).join('')}</div></main><script src="../../assets/case-407-evidence-v2.js"></script><script src="../../assets/case-407-evidence-v2-hydrate.js"></script></body></html>`;
};

for (const stage of data.stages) fs.writeFileSync(path.join(outDir, `stage-${stage.id}.html`), previewHtml(stage));

const contentTypes = new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.webp','image/webp'],['.svg','image/svg+xml'],['.png','image/png']]);
const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath = path.resolve(siteRoot, relative);
  if (!filePath.startsWith(`${siteRoot}${path.sep}`) || !fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type', contentTypes.get(path.extname(filePath)) || 'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});
const port = await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => resolve(server.address().port)); });
const runChrome = (args) => new Promise((resolve, reject) => {
  const child = spawn(chrome, args, { stdio: ['ignore','pipe','pipe'] }); let stdout = '', stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; }); child.stderr.on('data', (chunk) => { stderr += chunk; }); child.on('error', reject);
  child.on('close', (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1600)}`)));
});
const dimensions = (file) => { const bytes = fs.readFileSync(file); return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length }; };
const viewports = [{ name:'desktop', width:1440, height:1800 }, { name:'mobile', width:390, height:1800 }];
const expectedByStage = {
  1: ['case407-plaque-grid','case407-terminal','case407-cctv','case407-registry'],
  2: ['case407-floorplan','case407-manual','case407-network','case407-request-export'],
  3: ['case407-lab','case407-audit','case407-alibi','case407-access','case407-car','case407-chat']
};
const results = [];
try {
  for (const stage of data.stages) {
    for (const viewport of viewports) {
      const url = `http://127.0.0.1:${port}/artifacts/room-407-evidence-smoke/stage-${stage.id}.html`;
      const common = ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1',`--window-size=${viewport.width},${viewport.height}`,'--virtual-time-budget=2200'];
      const screenshot = path.join(outDir, `stage-${stage.id}-${viewport.name}.png`);
      await runChrome([...common, `--screenshot=${screenshot}`, url]);
      const { stdout: dom } = await runChrome([...common, '--dump-dom', url]);
      for (const marker of expectedByStage[stage.id]) if (!dom.includes(marker)) throw new Error(`stage ${stage.id}/${viewport.name}: missing visual marker ${marker}`);
      if ((dom.match(/case407-materialized/g) || []).length < 5) throw new Error(`stage ${stage.id}/${viewport.name}: fewer than 5 materialized evidence cards`);
      if (!dom.includes('case407-evidence-notes')) throw new Error(`stage ${stage.id}/${viewport.name}: expert notes were not collapsed`);
      const size = dimensions(screenshot);
      if (size.width !== viewport.width || size.height !== viewport.height || size.bytes < 30_000) throw new Error(`stage ${stage.id}/${viewport.name}: bad screenshot ${JSON.stringify(size)}`);
      results.push({ stage: stage.id, viewport: viewport.name, ...size, screenshot: path.basename(screenshot) });
    }
  }
} finally { await new Promise((resolve) => server.close(resolve)); }
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ chrome, results }, null, 2));
console.log(JSON.stringify({ results }, null, 2));
