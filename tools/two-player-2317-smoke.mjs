#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const outDir = path.join(siteRoot, 'artifacts', 'two-player-2317-smoke');
fs.mkdirSync(outDir, { recursive: true });

const chromeCandidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error(`Chrome/Chromium not found. Checked: ${chromeCandidates.join(', ')}`);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.xml', 'application/xml; charset=utf-8'],
]);

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
  let relative = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const filePath = path.resolve(siteRoot, relative);
  if (!filePath.startsWith(`${siteRoot}${path.sep}`) && filePath !== siteRoot) return response.writeHead(403).end('Forbidden');
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return response.writeHead(404).end('Not found');
  response.setHeader('Content-Type', contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream');
  response.end(fs.readFileSync(filePath));
});

const listen = () => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});

const runChrome = (args) => new Promise((resolve, reject) => {
  const child = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', reject);
  child.on('close', (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`Chrome exited ${code}: ${stderr.slice(-1800)}`)));
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
const v4Markers = ['data-coop-v4="1.0.0"', 'coop-v4.css', 'class="ref-header ref-wrap"', 'class="ref-footer ref-wrap"'];
const pages = [
  {
    name: 'landing',
    path: '/detektivnye-igry-dlya-dvoih/',
    required: [...v4Markers, 'Детективная игра для двоих онлайн', 'Последний звонок в 23:17', 'Следователь', 'Аналитик', 'data-duel-room-app'],
  },
  {
    name: 'case',
    path: '/detektivnye-igry-dlya-dvoih/2317/',
    required: [...v4Markers, 'Последний звонок', '23:17', 'Создать комнату', 'У меня есть код', 'data-case2317-app'],
  },
];

const port = await listen();
const results = [];
try {
  for (const page of pages) {
    for (const viewport of viewports) {
      const url = `http://127.0.0.1:${port}${page.path}`;
      const common = [
        '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--force-device-scale-factor=1',
        `--window-size=${viewport.width},${viewport.height}`, '--virtual-time-budget=2500',
      ];
      const screenshot = path.join(outDir, `${page.name}-${viewport.name}.png`);
      await runChrome([...common, `--screenshot=${screenshot}`, url]);
      const { stdout: dom } = await runChrome([...common, '--dump-dom', url]);
      const dimensions = pngDimensions(screenshot);
      if (dimensions.width !== viewport.width || dimensions.height !== viewport.height) throw new Error(`${page.name}/${viewport.name}: unexpected screenshot dimensions`);
      if (dimensions.bytes < 12_000) throw new Error(`${page.name}/${viewport.name}: screenshot suspiciously small (${dimensions.bytes})`);
      for (const marker of page.required) if (!dom.includes(marker)) throw new Error(`${page.name}/${viewport.name}: missing marker ${marker}`);
      if (dom.includes('Не удалось') || dom.includes('ReferenceError')) throw new Error(`${page.name}/${viewport.name}: visible/runtime failure detected`);
      results.push({ page: page.name, path: page.path, viewport: viewport.name, width: viewport.width, height: viewport.height, bytes: dimensions.bytes, screenshot: path.relative(siteRoot, screenshot) });
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ chrome, results }, null, 2));
console.log(JSON.stringify({ results }, null, 2));
