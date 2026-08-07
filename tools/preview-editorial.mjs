#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const args = process.argv.slice(2);
const readArg = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const sourceRoot = path.resolve(readArg('source', path.resolve(repoRoot, '..', 'ktovret')));
const port = Number(readArg('port', '4175'));
const previewRoot = path.resolve(readArg('out', path.join(repoRoot, '.editorial-preview')));

if (!fs.existsSync(path.join(sourceRoot, 'pubspec.yaml')) || !fs.existsSync(path.join(sourceRoot, 'lib/data/case_repository.dart'))) {
  console.error(`Не найден исходник мобильного приложения: ${sourceRoot}`);
  console.error('Передайте путь: node tools/preview-editorial.mjs --source "C:\\path\\to\\ktovret"');
  process.exit(1);
}

fs.rmSync(previewRoot, { recursive: true, force: true });
fs.mkdirSync(previewRoot, { recursive: true });

const excluded = new Set(['.git', '.editorial-preview']);
fs.cpSync(repoRoot, previewRoot, {
  recursive: true,
  filter: (source) => {
    const rel = path.relative(repoRoot, source);
    if (!rel) return true;
    const first = rel.split(path.sep)[0];
    return !excluded.has(first);
  },
});

const importResult = spawnSync(process.execPath, [
  path.join(repoRoot, 'tools/import-mobile-cases.mjs'),
  '--source', sourceRoot,
  '--site', previewRoot,
  '--mode', 'editorial',
], { stdio: 'inherit' });
if (importResult.status !== 0) process.exit(importResult.status || 1);

const qaResult = spawnSync(process.execPath, [
  path.join(repoRoot, 'tools/import-mobile/validate-editorial-build.mjs'),
  '--site', previewRoot,
], { stdio: 'inherit' });
if (qaResult.status !== 0) process.exit(qaResult.status || 1);

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
]);

const safePath = (urlPath) => {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  const clean = decoded.replace(/^\/+/, '');
  const candidate = path.resolve(previewRoot, clean);
  if (!candidate.startsWith(previewRoot)) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) return path.join(candidate, 'index.html');
  return candidate;
};

const server = http.createServer((req, res) => {
  let filePath = safePath(req.url);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'content-type': mime.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log('\nРедакторская сборка готова: 100 / 100 дел.');
  console.log(`Каталог: http://127.0.0.1:${port}/dela/`);
  console.log('Остановить сервер: Ctrl+C');
});
