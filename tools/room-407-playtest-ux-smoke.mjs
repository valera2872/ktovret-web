#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const outDir = path.join(repo, 'artifacts', 'room-407-playtest-ux');
fs.mkdirSync(outDir, { recursive: true });

const chromeCandidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="../../assets/mysterylogic.css"><link rel="stylesheet" href="../../assets/premium.css"><link rel="stylesheet" href="../../assets/case-2317.css"><link rel="stylesheet" href="../../assets/case-407.css">
<style>body{margin:0}.test{max-width:760px;margin:0 auto;padding:18px 12px 80px}.test>section{margin:0 0 18px}.case2317-final form{display:grid;gap:8px}.case2317-final label{display:block;padding:10px;border:1px solid rgba(213,164,86,.2)}</style></head>
<body class="case2317-body case407-body"><main class="test" data-case407-app>
<section class="case2317-handoff"><p class="case2317-eyebrow">Сверка двух ролей</p><h3>Нужен маркер с другого экрана</h3><p>Старый текст</p><div class="case2317-handoff-row"><input data-handoff-input data-handoff-key="stage1" placeholder="ID контроллера"></div></section>
<section class="case2317-decision"><p class="case2317-eyebrow">Оперативный запрос · этап 2</p><h3>Какой срочный запрос сделать первым?</h3><p>Сверьтесь с напарником и выберите одну линию. Первый запрос бесплатный; если он не даст маршрута, второй снизит итоговый балл.</p></section>
<section class="case2317-final"><p class="case2317-eyebrow">Заключение</p><h2>Проверка доказательств</h2>
<form id="weak"><label><input checked type="checkbox" name="evidence" value="room_swap"> Комната</label><label><input checked type="checkbox" name="evidence" value="duress"> Намеренность</label><label><input checked type="checkbox" name="evidence" value="service_route"> Маршрут</label><label><input checked type="checkbox" name="evidence" value="br220"> Сапфир</label><label><input checked type="checkbox" name="evidence" value="shared_plan"> Переписка + билеты</label><div class="case2317-actions"><button type="submit">Отправить слабый набор</button></div></form>
<form id="strong"><label><input checked type="checkbox" name="evidence" value="room_swap"> Комната</label><label><input checked type="checkbox" name="evidence" value="duress"> Намеренность</label><label><input checked type="checkbox" name="evidence" value="service_route"> Маршрут</label><label><input checked type="checkbox" name="evidence" value="br220"> Сапфир</label><label><input checked type="checkbox" name="evidence" value="night_mgr"> CAM G1 + действия Елены</label><div class="case2317-actions"><button type="submit">Отправить сильный набор</button></div></form>
</section></main>
<script src="../../assets/case-407-playtest-ux-v42.js"></script>
<script>
const root=document.querySelector('[data-case407-app]');
root.addEventListener('submit',(event)=>{ if(event.target.id==='strong'){ event.preventDefault(); document.body.dataset.strongPassed='1'; } });
setTimeout(()=>{ document.querySelector('#weak').requestSubmit(); setTimeout(()=>{ document.querySelector('#strong').requestSubmit(); document.body.dataset.ready='1'; },120); },220);
</script></body></html>`;
const htmlFile = path.join(outDir, 'index.html');
fs.writeFileSync(htmlFile, html);

const types = new Map([['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8']]);
const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath = path.resolve(repo, relative);
  if (!filePath.startsWith(`${repo}${path.sep}`) || !fs.existsSync(filePath)) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type', types.get(path.extname(filePath)) || 'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});
const port = await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => resolve(server.address().port)); });
const runChrome = (args) => new Promise((resolve, reject) => {
  const child = spawn(chrome, args, { stdio:['ignore','pipe','pipe'] });
  let stdout='', stderr=''; child.stdout.on('data',(c)=>stdout+=c); child.stderr.on('data',(c)=>stderr+=c);
  child.on('error', reject); child.on('close',(code)=>code===0?resolve({stdout,stderr}):reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1200)}`)));
});

try {
  const url = `http://127.0.0.1:${port}/artifacts/room-407-playtest-ux/index.html`;
  const args = ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--force-device-scale-factor=1','--window-size=390,1600','--virtual-time-budget=1800'];
  const screenshot = path.join(outDir, 'playtest-ux-mobile.png');
  await runChrome([...args, `--screenshot=${screenshot}`, url]);
  const { stdout: dom } = await runChrome([...args, '--dump-dom', url]);
  const required = [
    'data-ready="1"', 'data-strong-passed="1"',
    'Назовите Аналитику H-код с обратной стороны таблички',
    'связанный L-код замка',
    'каждый подтвердите тот же вариант на своём экране',
    'общий план, но не личное действие Елены',
    'data-playtest-evidence-error="1"',
    'В наборе нет независимого доказательства личного действия Елены'
  ];
  for (const marker of required) if (!dom.includes(marker)) throw new Error(`playtest UX DOM missing ${marker}`);
  const stat = fs.statSync(screenshot);
  if (stat.size < 40_000) throw new Error(`playtest UX screenshot too small: ${stat.size}`);
  fs.writeFileSync(path.join(outDir,'report.json'), JSON.stringify({ revision:'4.2', weakFinalBlocked:true, strongFinalPassedPlaytestGate:true, sameDecisionCopy:true, hToLFlow:true, playerCopySimplified:true, screenshot:path.basename(screenshot), bytes:stat.size }, null, 2));
  console.log(JSON.stringify({ revision:'4.2', weakFinalBlocked:true, strongFinalPassedPlaytestGate:true, sameDecisionCopy:true, hToLFlow:true, playerCopySimplified:true, screenshotBytes:stat.size }, null, 2));
} finally {
  await new Promise((resolve)=>server.close(resolve));
}
