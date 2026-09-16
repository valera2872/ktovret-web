#!/usr/bin/env node

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import process from 'node:process';

const SUPABASE_CLI_VERSION = '2.117.0';
const LOCAL_FUNCTION = 'http://127.0.0.1:54321/functions/v1/coop-case-v2';
const PORT = Number(process.env.PARTNER_V2_PLAYTEST_PORT || 4173);
const CASE_PATH = '/detektivnye-igry-dlya-dvoih/nulevoy-konteyner/';
const API_PATH = '/__partner-v2-api';
const ROOT = process.cwd();
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const docker = process.platform === 'win32' ? 'docker.exe' : 'docker';
const args = new Set(process.argv.slice(2));
const LAN_MODE = args.has('--lan');
const HOST = LAN_MODE ? '0.0.0.0' : '127.0.0.1';

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

const privateIpScore = (address) => {
  if (/^192\.168\./.test(address)) return 300;
  if (/^10\./.test(address)) return 200;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(address)) return 100;
  return 0;
};

const lanAddress = () => {
  const override = String(process.env.PARTNER_V2_LAN_IP || '').trim();
  if (override && privateIpScore(override)) return override;

  const candidates = [];
  for (const [name, interfaces] of Object.entries(networkInterfaces())) {
    for (const entry of interfaces || []) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      let score = privateIpScore(entry.address);
      if (!score) continue;
      const adapter = name.toLowerCase();
      if (/wi-?fi|wlan|ethernet|\beth\d|\ben\d/.test(adapter)) score += 30;
      if (/docker|wsl|vethernet|virtual|vmware|hyper-v|tailscale|zerotier|vbox/.test(adapter)) score -= 80;
      candidates.push({ address: entry.address, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.address.localeCompare(b.address));
  return candidates[0]?.address || '';
};

const mime = (filePath) => ({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
}[path.extname(filePath).toLowerCase()] || 'application/octet-stream');

const safeFile = (pathname) => {
  let decoded = '';
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  const isCase = decoded === CASE_PATH || decoded === `${CASE_PATH}index.html`;
  const isAsset = decoded.startsWith('/assets/') && !decoded.includes('..');
  if (!isCase && !isAsset) return null;

  const relative = decoded.endsWith('/') ? `${decoded}index.html` : decoded;
  const resolved = path.resolve(ROOT, `.${relative}`);
  if (!resolved.startsWith(`${ROOT}${path.sep}`)) return null;
  return resolved;
};

const readRequestBody = async (request) => {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > 256 * 1024) throw new Error('request_too_large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const proxyApi = async (request, response) => {
  if (request.method !== 'POST') {
    response.writeHead(405, { allow: 'POST' }).end('Method not allowed');
    return;
  }
  try {
    const body = await readRequestBody(request);
    const upstream = await fetch(LOCAL_FUNCTION, {
      method: 'POST',
      headers: {
        'content-type': request.headers['content-type'] || 'application/json',
        accept: 'application/json',
      },
      body,
    });
    const payload = Buffer.from(await upstream.arrayBuffer());
    response.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-partner-v2-playtest': 'local-proxy',
    });
    response.end(payload);
  } catch (error) {
    response.writeHead(error.message === 'request_too_large' ? 413 : 502, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    });
    response.end(JSON.stringify({ error: 'local_playtest_proxy_failed' }));
  }
};

const startWebServer = async () => {
  webServer = createServer(async (request, response) => {
    if (!request.url) {
      response.writeHead(400).end('Bad request');
      return;
    }

    const url = new URL(request.url, `http://127.0.0.1:${PORT}`);
    if (url.pathname === API_PATH) {
      await proxyApi(request, response);
      return;
    }

    if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
      response.writeHead(405).end('Method not allowed');
      return;
    }

    if (url.pathname === '/') {
      response.writeHead(302, { location: CASE_PATH, 'cache-control': 'no-store' }).end();
      return;
    }

    const filePath = safeFile(url.pathname);
    if (!filePath) {
      response.writeHead(404).end('Not found');
      return;
    }

    try {
      let body = await readFile(filePath);
      if (url.pathname === `${CASE_PATH}index.html` || url.pathname === CASE_PATH) {
        const html = body.toString('utf8').replace(
          /data-partner-endpoint="[^"]+"/,
          `data-partner-endpoint="${API_PATH}"`,
        );
        if (!html.includes(`data-partner-endpoint="${API_PATH}"`)) {
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
  if (webServer) {
    try { await new Promise((resolve) => webServer.close(() => resolve())); } catch {}
  }
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

const LAN_ADDRESS = LAN_MODE ? lanAddress() : '';
if (LAN_MODE && !LAN_ADDRESS) fail('Не найден локальный IPv4-адрес Wi-Fi/LAN. Используйте режим без --lan или задайте PARTNER_V2_LAN_IP.');

console.log(`[partner-v2-playtest] Supabase CLI ${SUPABASE_CLI_VERSION}`);
console.log('[partner-v2-playtest] Поднимаю изолированный локальный Supabase. Облачный проект не используется.');

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
    if (!cleaned && code !== 0) console.error(`[partner-v2-playtest] Edge Function завершилась с кодом ${code}.`);
  });

  await waitForFunction();
  await startWebServer();

  const localUrl = `http://127.0.0.1:${PORT}${CASE_PATH}`;
  const lanUrl = LAN_MODE ? `http://${LAN_ADDRESS}:${PORT}${CASE_PATH}` : '';
  const primaryUrl = LAN_MODE ? lanUrl : localUrl;
  console.log('\n[partner-v2-playtest] ГОТОВО');
  if (LAN_MODE) {
    console.log(`[partner-v2-playtest] Общий адрес для компьютера и второго устройства: ${lanUrl}`);
    console.log(`[partner-v2-playtest] Резервный localhost-адрес только для этого компьютера: ${localUrl}`);
    console.log('[partner-v2-playtest] Открывайте игру на компьютере через общий LAN-адрес — тогда «Скопировать приглашение» создаст ссылку, работающую на телефоне.');
    console.log('[partner-v2-playtest] В режиме --lan страница доступна устройствам вашей локальной сети только пока работает этот процесс.');
  } else {
    console.log(`[partner-v2-playtest] Этот компьютер: ${localUrl}`);
    console.log('[partner-v2-playtest] Игрок 2 на этом компьютере: откройте тот же URL в режиме инкогнито или в другом браузере.');
    console.log('[partner-v2-playtest] Для телефона/второго ноутбука перезапустите с --lan.');
  }
  console.log('[partner-v2-playtest] Первый игрок создаёт комнату и передаёт код или ссылку второму.');
  console.log('[partner-v2-playtest] Для завершения нажмите Ctrl+C — тестовая база будет удалена.\n');
  openBrowser(primaryUrl);
} catch (error) {
  console.error(`[partner-v2-playtest] FAIL: ${error.message}`);
  await cleanup();
  process.exit(1);
}

await new Promise(() => {});
