#!/usr/bin/env node

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const SUPABASE_CLI_VERSION = '2.117.0';
const LOCAL_FUNCTION = 'http://127.0.0.1:54321/functions/v1/coop-case-v2';
const HOST = '127.0.0.1';
const PORT = Number(process.env.PARTNER_V2_PLAYTEST_PORT || 4173);
const CASE_PATH = '/detektivnye-igry-dlya-dvoih/nulevoy-konteyner/';
const ROOT = process.cwd();
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const docker = process.platform === 'win32' ? 'docker.exe' : 'docker';
const args = new Set(process.argv.slice(2));

let functionProcess = null;
let webServer = null;
let cleaned = false;

const fail = (message, code = 1) => {
  console.error(`[partner-v2-playtest] ${message}`);
  process.exit(code);
};

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: options.quiet ? 'pipe' : 'inherit',
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error(`${command} ${commandArgs.join(' ')} exited with ${result.status}`);
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }
  return result;
};

const supabaseArgs = (...rest) => ['--yes', `supabase@${SUPABASE_CLI_VERSION}`, ...rest];

const assertProjectRoot = async () => {
  const required = [
    'supabase/config.toml',
    'supabase/functions/coop-case-v2/index.ts',
    'detektivnye-igry-dlya-dvoih/nulevoy-konteyner/index.html',
    'assets/partner-v2-engine.js',
  ];
  for (const relative of required) {
    try {
      const info = await stat(path.join(ROOT, relative));
      if (!info.isFile()) throw new Error('not a file');
    } catch {
      fail(`Запустите скрипт из корня репозитория. Не найден ${relative}.`);
    }
  }
};

const assertDocker = () => {
  const result = spawnSync(docker, ['info'], { stdio: 'ignore' });
  if (result.error || result.status !== 0) {
    fail('Docker не запущен. Запустите Docker Desktop и повторите команду.');
  }
};

const waitForFunction = async () => {
  let stable = 0;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const response = await fetch(LOCAL_FUNCTION, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const text = await response.text();
      if (response.status === 400 && text.includes('invalid_browser_key')) stable += 1;
      else stable = 0;
      if (stable >= 3) return;
    } catch {
      stable = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('coop-case-v2 did not become ready');
};

const mime = (filePath) => ({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
}[path.extname(filePath).toLowerCase()] || 'application/octet-stream');

const safeFile = (pathname) => {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.endsWith('/') ? `${decoded}index.html` : decoded;
  const resolved = path.resolve(ROOT, `.${relative}`);
  if (resolved !== ROOT && !resolved.startsWith(`${ROOT}${path.sep}`)) return null;
  return resolved;
};

const startWebServer = async () => {
  webServer = createServer(async (request, response) => {
    if (!request.url || !['GET', 'HEAD'].includes(request.method || 'GET')) {
      response.writeHead(405).end('Method not allowed');
      return;
    }

    const url = new URL(request.url, `http://${HOST}:${PORT}`);
    if (url.pathname === '/') {
      response.writeHead(302, { location: CASE_PATH, 'cache-control': 'no-store' }).end();
      return;
    }

    const filePath = safeFile(url.pathname);
    if (!filePath) {
      response.writeHead(400).end('Bad path');
      return;
    }

    try {
      let body = await readFile(filePath);
      if (url.pathname === `${CASE_PATH}index.html` || url.pathname === CASE_PATH) {
        const html = body.toString('utf8').replace(
          /data-partner-endpoint="[^"]+"/,
          `data-partner-endpoint="${LOCAL_FUNCTION}"`,
        );
        if (!html.includes(`data-partner-endpoint="${LOCAL_FUNCTION}"`)) {
          throw new Error('local endpoint rewrite failed');
        }
        body = Buffer.from(html, 'utf8');
      }

      response.writeHead(200, {
        'content-type': mime(filePath),
        'cache-control': 'no-store, max-age=0',
        'x-partner-v2-playtest': 'local-only',
      });
      if (request.method === 'HEAD') response.end();
      else response.end(body);
    } catch (error) {
      response.writeHead(error?.code === 'ENOENT' ? 404 : 500).end(error?.code === 'ENOENT' ? 'Not found' : 'Playtest server error');
    }
  });

  await new Promise((resolve, reject) => {
    webServer.once('error', reject);
    webServer.listen(PORT, HOST, resolve);
  });
};

const openBrowser = (url) => {
  if (!args.has('--open')) return;
  try {
    if (process.platform === 'win32') spawn('cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    else if (process.platform === 'darwin') spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    else spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  } catch {}
};

const cleanup = async () => {
  if (cleaned) return;
  cleaned = true;
  console.log('\n[partner-v2-playtest] Останавливаю локальный playtest...');
  try { await new Promise((resolve) => webServer?.close(() => resolve())); } catch {}
  try { functionProcess?.kill('SIGTERM'); } catch {}
  try {
    run(npx, supabaseArgs('stop', '--no-backup'), { quiet: false });
  } catch (error) {
    console.error(`[partner-v2-playtest] Не удалось автоматически остановить Supabase: ${error.message}`);
  }
};

process.on('SIGINT', async () => { await cleanup(); process.exit(0); });
process.on('SIGTERM', async () => { await cleanup(); process.exit(0); });

await assertProjectRoot();
assertDocker();

console.log(`[partner-v2-playtest] Supabase CLI ${SUPABASE_CLI_VERSION}`);
console.log('[partner-v2-playtest] Поднимаю изолированный локальный Supabase. Production не используется.');

try {
  run(npx, supabaseArgs(
    'start',
    '-x',
    'realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,logflare,vector,supavisor',
  ));

  functionProcess = spawn(
    npx,
    supabaseArgs('functions', 'serve', 'coop-case-v2', '--no-verify-jwt'),
    {
      cwd: ROOT,
      stdio: ['ignore', 'inherit', 'inherit'],
      env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
    },
  );

  functionProcess.on('exit', (code) => {
    if (!cleaned && code !== 0) {
      console.error(`[partner-v2-playtest] Edge Function завершилась с кодом ${code}.`);
    }
  });

  await waitForFunction();
  await startWebServer();

  const url = `http://${HOST}:${PORT}${CASE_PATH}`;
  console.log('\n[partner-v2-playtest] ГОТОВО');
  console.log(`[partner-v2-playtest] Игрок 1: ${url}`);
  console.log('[partner-v2-playtest] Игрок 2: откройте тот же URL в режиме инкогнито или в другом браузере.');
  console.log('[partner-v2-playtest] Первый игрок создаёт комнату и передаёт код второму.');
  console.log('[partner-v2-playtest] Для завершения нажмите Ctrl+C — тестовая база будет удалена.\n');
  openBrowser(url);
} catch (error) {
  console.error(`[partner-v2-playtest] FAIL: ${error.message}`);
  await cleanup();
  process.exit(1);
}

await new Promise(() => {});
