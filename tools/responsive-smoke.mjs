#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const casePath = '/ru/cases/chetyre-vhoda-v-arhiv/';
const outDir = path.join(siteRoot, 'artifacts', 'responsive-smoke');
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
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.xml', 'application/xml; charset=utf-8'],
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

const port = await listen();
const url = `http://127.0.0.1:${port}${casePath}`;
const results = [];

try {
  for (const viewport of viewports) {
    const common = [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--force-device-scale-factor=1',
      `--window-size=${viewport.width},${viewport.height}`,
      '--virtual-time-budget=3000',
    ];
    const screenshot = path.join(outDir, `${viewport.name}.png`);
    await runChrome([...common, `--screenshot=${screenshot}`, url]);
    const { stdout: dom } = await runChrome([...common, '--dump-dom', url]);
    const dimensions = pngDimensions(screenshot);

    if (dimensions.width !== viewport.width) throw new Error(`${viewport.name}: screenshot width ${dimensions.width}, expected ${viewport.width}`);
    if (dimensions.height !== viewport.height) throw new Error(`${viewport.name}: screenshot height ${dimensions.height}, expected ${viewport.height}`);
    if (dimensions.bytes < 10_000) throw new Error(`${viewport.name}: screenshot is suspiciously small (${dimensions.bytes} bytes)`);
    if (!dom.includes('data-ktv-root')) throw new Error(`${viewport.name}: game root disappeared after render`);
    if (!dom.includes('Четыре входа в архив')) throw new Error(`${viewport.name}: case H1/content did not render`);
    if (!dom.includes('data-action="submit"')) throw new Error(`${viewport.name}: interactive answer UI did not render`);
    if (dom.includes('Не удалось загрузить игровое дело')) throw new Error(`${viewport.name}: game loader reported an error`);

    results.push({ ...viewport, screenshot: path.relative(siteRoot, screenshot), bytes: dimensions.bytes });
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ casePath, chrome, results }, null, 2));
console.log(JSON.stringify({ casePath, results }, null, 2));
