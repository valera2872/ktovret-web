#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const casePath = '/ru/investigations/poslednyaya-sborka/';
const outDir = path.join(siteRoot, 'artifacts', 'investigation-smoke');
fs.mkdirSync(outDir, { recursive: true });

const chromeCandidates = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
]);

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
  let relative = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const filePath = path.resolve(siteRoot, relative);
  if (!filePath.startsWith(`${siteRoot}${path.sep}`) && filePath !== siteRoot) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.setHeader('Content-Type', contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});

const listen = () => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});

const runChrome = (args) => new Promise((resolve, reject) => {
  const child = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', reject);
  child.on('close', (code) => {
    if (code !== 0) reject(new Error(`Chrome exited ${code}: ${stderr.slice(-2000)}`));
    else resolve({ stdout, stderr });
  });
});

const pngDimensions = (filePath) => {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 24 || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw new Error(`${filePath} is not a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length };
};

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1100 },
];
const interrogationScenarios = [
  { mode: 'initial', expected: 'После 18:30 в офис я не возвращался' },
  { mode: 'presence-ready', expected: 'После предъявления данных о гостевом пропуске T-17' },
  { mode: 'aster-blocked', expected: 'В реестре указано, что устройство было связано со мной' },
  { mode: 'aster-ready', expected: 'Роман подтверждает, что раньше пользовался флешкой ASTER-64' },
];

const port = await listen();
const baseUrl = `http://127.0.0.1:${port}${casePath}`;
const results = [];

try {
  for (const viewport of viewports) {
    const common = [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--force-device-scale-factor=1', `--window-size=${viewport.width},${viewport.height}`, '--virtual-time-budget=4500',
    ];
    const screenshot = path.join(outDir, `${viewport.name}.png`);
    await runChrome([...common, `--screenshot=${screenshot}`, baseUrl]);
    const { stdout: dom } = await runChrome([...common, '--dump-dom', baseUrl]);
    const dimensions = pngDimensions(screenshot);

    if (dimensions.width !== viewport.width) throw new Error(`${viewport.name}: screenshot width ${dimensions.width}, expected ${viewport.width}`);
    if (dimensions.height !== viewport.height) throw new Error(`${viewport.name}: screenshot height ${dimensions.height}, expected ${viewport.height}`);
    if (dimensions.bytes < 12_000) throw new Error(`${viewport.name}: screenshot is suspiciously small (${dimensions.bytes} bytes)`);
    if (!dom.includes('Последняя сборка')) throw new Error(`${viewport.name}: case title did not render`);
    if (!dom.includes('mli-workspace')) throw new Error(`${viewport.name}: investigation workspace did not render behind cold open`);
    if (dom.includes('mli-intro-backdrop')) throw new Error(`${viewport.name}: blocking cold-open overlay returned instead of the integrated cover`);
    if (!dom.includes('data-mli-lead-material')) throw new Error(`${viewport.name}: integrated cover has no immediate evidence action`);
    if (!dom.includes('office-hero-v2.webp')) throw new Error(`${viewport.name}: cinematic phone-and-empty-case cover did not load`);
    if (!dom.includes('Один из вас уже продал нашу игру')) throw new Error(`${viewport.name}: integrated cover lost Pavel message`);
    if (!dom.includes('Интерактивный детектив')) throw new Error(`${viewport.name}: product format is not explained on first contact`);
    if (!dom.includes('Кто украл секретную копию новой компьютерной игры?')) throw new Error(`${viewport.name}: plain-language premise did not render`);
    if (!dom.includes('Вы — следователь.')) throw new Error(`${viewport.name}: player role is not explained`);
    if (!dom.includes('готовая версия игры')) throw new Error(`${viewport.name}: case-title jargon is not explained`);
    if (!dom.includes('data-view="materials"')) throw new Error(`${viewport.name}: materials navigation did not render`);
    if (!dom.includes('data-view="theory"')) throw new Error(`${viewport.name}: theory navigation did not render`);
    if (!dom.includes('data-material="pavel-message"')) throw new Error(`${viewport.name}: initial evidence did not render`);
    if (!dom.includes('Три шага до обвинения')) throw new Error(`${viewport.name}: investigation instructions did not render`);
    if (!dom.includes('Начать: открыть сообщение руководителя')) throw new Error(`${viewport.name}: first authored action is not explicit`);
    for (const label of ['Начало', 'Улики', 'Участники', 'Обвинение']) {
      if (!dom.includes(label)) throw new Error(`${viewport.name}: plain-language navigation lost ${label}`);
    }
    if (!dom.includes('Краткая вводная по делу')) throw new Error(`${viewport.name}: collapsible case brief did not render`);
    if (dom.includes('mli-progress-strip')) throw new Error(`${viewport.name}: dashboard counters returned to the first workspace`);
    if (dom.includes('mli-desk-aside')) throw new Error(`${viewport.name}: competing status sidebar returned to the first workspace`);
    const leadControls = (dom.match(/data-mli-lead-material/g) || []).length;
    if (leadControls !== 1) throw new Error(`${viewport.name}: expected one dominant opening action, found ${leadControls}`);
    if (dom.includes('mli-material-card is-opening')) throw new Error(`${viewport.name}: competing opening cards returned to the first screen`);
    if (dom.includes('Что можно сделать')) throw new Error(`${viewport.name}: empty generic action block returned to the first workspace`);
    if (dom.includes('Роман физически вернулся в офис')) throw new Error(`${viewport.name}: canonical theory leaked into player-facing proof copy`);

    const { stdout: receiptDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewEvidence=roman-receipt`]);
    if (receiptDom.includes('mli-intro-backdrop')) throw new Error(`${viewport.name}: cold open must not block evidence QA preview`);
    if (!receiptDom.includes('mli-ev-receipt')) throw new Error(`${viewport.name}: receipt renderer did not activate`);
    if (!receiptDom.includes('mli-ev-message-card')) throw new Error(`${viewport.name}: receipt message context did not render`);
    if (!receiptDom.includes('20:47')) throw new Error(`${viewport.name}: receipt evidence content disappeared`);

    const { stdout: officeDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewEvidence=office-morning`]);
    if (!officeDom.includes('mli-ev-office-photo')) throw new Error(`${viewport.name}: office evidence did not reuse the scene image`);
    if (!officeDom.includes('общий компьютер в переговорной')) throw new Error(`${viewport.name}: office evidence does not explain DEMO-04`);
    if (!officeDom.includes('официальной флешки студии ORBIT-2')) throw new Error(`${viewport.name}: office evidence does not explain ORBIT-2`);
    if (!officeDom.includes('финальной версией игры')) throw new Error(`${viewport.name}: office evidence does not explain RELEASE`);

    const { stdout: interviewsDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewEvidence=initial-statements`]);
    if (!interviewsDom.includes('data-statement-viewer')) throw new Error(`${viewport.name}: introductory interview dossier did not render`);
    if ((interviewsDom.match(/data-statement-person=/g) || []).length !== 3) throw new Error(`${viewport.name}: introductory dossier must expose exactly three interview tabs`);
    if (!interviewsDom.includes('Для протокола: представьтесь и объясните, как вы связаны со студией и этой игрой.')) throw new Error(`${viewport.name}: investigator identity question disappeared`);
    if (!interviewsDom.includes('общий компьютер в переговорной')) throw new Error(`${viewport.name}: DEMO-04 is not explained before the alibi`);
    for (const role of ['Операционный менеджер', 'Технический руководитель', 'Консультант инвестора']) {
      if (!interviewsDom.includes(role)) throw new Error(`${viewport.name}: plain-language participant role lost ${role}`);
    }

    const { stdout: passDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewEvidence=t17-registry`]);
    if (!passDom.includes('Временный гостевой пропуск T-17')) throw new Error(`${viewport.name}: T-17 is not explained as a temporary guest pass`);
    if (passDom.includes('scan-in') || passDom.includes('Контроллер:')) throw new Error(`${viewport.name}: unexplained access-control jargon leaked into T-17 evidence`);

    const { stdout: guestLaptopDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewEvidence=guest02-assignment`]);
    if (!guestLaptopDom.includes('Гостевой ноутбук GUEST-02')) throw new Error(`${viewport.name}: GUEST-02 is not explained as a guest laptop`);

    const { stdout: usbDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewEvidence=usb-audit`]);
    if (!usbDom.includes('внешняя флешка ASTER-64')) throw new Error(`${viewport.name}: ASTER-64 is not explained as a flash drive`);
    for (const technicalLeak of ['transfer started', 'transfer completed', 'USB-аудит']) {
      if (usbDom.includes(technicalLeak)) throw new Error(`${viewport.name}: unexplained technical copy leaked into USB evidence: ${technicalLeak}`);
    }

    const { stdout: peopleDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewResult=S&previewInitial=people`]);
    for (const portrait of ['alina-sokolova.webp', 'timur-vlasov.webp', 'roman-karsky.webp', 'pavel-nesterov.webp']) {
      if (!peopleDom.includes(portrait)) throw new Error(`${viewport.name}: dossier portrait ${portrait} did not render`);
    }

    for (const scenario of interrogationScenarios) {
      const { stdout: interrogationDom } = await runChrome([
        ...common,
        '--dump-dom',
        `${baseUrl}?previewInterrogation=${scenario.mode}`,
      ]);
      if (interrogationDom.includes('mli-intro-backdrop')) throw new Error(`${viewport.name}/${scenario.mode}: cold open blocked interrogation QA`);
      if (!interrogationDom.includes('data-interrogation-character="roman"')) throw new Error(`${viewport.name}/${scenario.mode}: Roman interrogation panel did not mount`);
      if (!interrogationDom.includes('data-interrogation-question')) throw new Error(`${viewport.name}/${scenario.mode}: free-form question field disappeared`);
      if (!interrogationDom.includes(scenario.expected)) throw new Error(`${viewport.name}/${scenario.mode}: authored response did not match gated state`);
    }

    const { stdout: terminalDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewEvidence=delete-audit`]);
    if (!terminalDom.includes('mli-ev-terminal')) throw new Error(`${viewport.name}: terminal renderer did not activate`);
    if (!terminalDom.includes('КОМПЬЮТЕР DEMO-04 · ЖУРНАЛ ДЕЙСТВИЙ')) throw new Error(`${viewport.name}: terminal evidence content disappeared`);

    const { stdout: webDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewEvidence=studio-brief`]);
    if (!webDom.includes('mli-ev-browser')) throw new Error(`${viewport.name}: web evidence renderer did not activate`);
    if (!webDom.includes('kadr17.studio / team')) throw new Error(`${viewport.name}: web evidence content disappeared`);

    const { stdout: solvedDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewResult=S`]);
    if (solvedDom.includes('mli-intro-backdrop')) throw new Error(`${viewport.name}: cold open must not block result QA preview`);
    if (!solvedDom.includes('data-mli-debrief')) throw new Error(`${viewport.name}: solved case did not render rich debrief`);
    if (!solvedDom.includes('Почему они лгали')) throw new Error(`${viewport.name}: debrief lost character-lie reconstruction`);
    if (!solvedDom.includes('Улики, которые изменили смысл')) throw new Error(`${viewport.name}: debrief lost clue reinterpretation layer`);
    if (!solvedDom.includes('Первая рабочая версия')) throw new Error(`${viewport.name}: debrief lost personalized investigation path`);
    if (solvedDom.includes('class="mli-truth"')) throw new Error(`${viewport.name}: generic truth dump remained alongside rich debrief`);

    const { stdout: materialsDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewResult=S&previewInitial=materials`]);
    if (!materialsDom.includes('data-material-group="new"')) throw new Error(`${viewport.name}: unread-first material group did not render`);
    if (!materialsDom.includes('data-material-group="viewed"')) throw new Error(`${viewport.name}: viewed material archive did not render`);
    if (!materialsDom.includes('Изученные материалы')) throw new Error(`${viewport.name}: viewed material archive lost its label`);
    if (materialsDom.includes('<details class="mli-viewed-materials" data-material-group="viewed" open')) throw new Error(`${viewport.name}: viewed material archive must start collapsed`);

    if (!peopleDom.includes('data-interrogation-character="roman"')) throw new Error(`${viewport.name}: Roman free-form interrogation did not mount`);
    if (!peopleDom.includes('Допрос Романа')) throw new Error(`${viewport.name}: human-readable interrogation label disappeared`);
    if (!peopleDom.includes('data-interrogation-question')) throw new Error(`${viewport.name}: interrogation has no free-form question field`);
    if (!peopleDom.includes('Допрос не создаёт новых фактов')) throw new Error(`${viewport.name}: authored-truth boundary is not visible`);
    const { stdout: weakDom } = await runChrome([...common, '--dump-dom', `${baseUrl}?previewResult=B`]);
    if (weakDom.includes('data-mli-debrief')) throw new Error(`${viewport.name}: weak B accusation must not reveal canonical debrief`);
    if (!weakDom.includes('Версия пока не выдерживает предъявления')) throw new Error(`${viewport.name}: weak B result copy did not render`);
    if (weakDom.includes('канонического исполнителя')) throw new Error(`${viewport.name}: weak B result leaked answer confirmation`);

    results.push({
      ...viewport,
      screenshotBytes: dimensions.bytes,
      workspaceRendered: true,
      coldOpenRendered: 'integrated persistent case cover',
      focusedWorkspace: 'one dominant evidence action, no counters/sidebar',
      fairPlayCopy: true,
      plainLanguage: 'codes explained before or alongside identifiers',
      premiumEvidence: ['receipt', 'terminal', 'web'],
      premiumArt: ['office', 'four portraits'],
      solvedDebrief: true,
      materialArchive: 'unread-first, viewed-collapsed',
      strictInterrogation: 'four gated states, authored-truth',
      weakResultProtected: true,
    });
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ casePath, chrome, results }, null, 2));
console.log(JSON.stringify({ casePath, results }, null, 2));