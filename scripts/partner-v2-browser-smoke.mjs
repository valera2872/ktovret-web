#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright-core';

const ROOT = process.cwd();
const PORT = Number(process.env.PARTNER_V2_BROWSER_PORT || 4174);
const HOST = '127.0.0.1';
const CASE_PATH = '/detektivnye-igry-dlya-dvoih/nulevoy-konteyner/';
const API_PATH = '/__partner-v2-browser-api';
const LOCAL_FUNCTION = String(
  process.env.LOCAL_PARTNER_V2_ENDPOINT || 'http://127.0.0.1:54321/functions/v1/coop-case-v2'
).trim().replace(/\/$/, '');
const BROWSER_BIN = String(process.env.BROWSER_BIN || '').trim();

if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/functions\/v1\/coop-case-v2$/i.test(LOCAL_FUNCTION)) {
  console.error(`[partner-v2-browser] Refusing unexpected endpoint: ${LOCAL_FUNCTION}`);
  process.exit(2);
}
if (!BROWSER_BIN) {
  console.error('[partner-v2-browser] BROWSER_BIN is required (system Chrome/Chromium).');
  process.exit(2);
}

const log = (message) => console.log(`[partner-v2-browser] ${message}`);
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
    });
    response.end(payload);
  } catch {
    response.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'browser_smoke_proxy_failed' }));
  }
};

const startServer = async () => {
  const server = createServer(async (request, response) => {
    if (!request.url) return response.writeHead(400).end('Bad request');
    const url = new URL(request.url, `http://${HOST}:${PORT}`);
    if (url.pathname === API_PATH) return proxyApi(request, response);
    if (!['GET', 'HEAD'].includes(request.method || 'GET')) return response.writeHead(405).end('Method not allowed');
    if (url.pathname === '/') return response.writeHead(302, { location: CASE_PATH }).end();

    const filePath = safeFile(url.pathname);
    if (!filePath) return response.writeHead(404).end('Not found');
    try {
      let body = await readFile(filePath);
      if (url.pathname === CASE_PATH || url.pathname === `${CASE_PATH}index.html`) {
        const html = body.toString('utf8').replace(
          /data-partner-endpoint="[^"]+"/,
          `data-partner-endpoint="${API_PATH}"`,
        );
        assert.ok(html.includes(`data-partner-endpoint="${API_PATH}"`), 'local endpoint rewrite failed');
        body = Buffer.from(html, 'utf8');
      }
      response.writeHead(200, { 'content-type': mime(filePath), 'cache-control': 'no-store, max-age=0' });
      if (request.method === 'HEAD') response.end();
      else response.end(body);
    } catch (error) {
      response.writeHead(error?.code === 'ENOENT' ? 404 : 500).end(error?.code === 'ENOENT' ? 'Not found' : 'Browser smoke server error');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, HOST, resolve);
  });
  return server;
};

const closeServer = (server) => new Promise((resolve) => server.close(() => resolve()));
const waitVisible = (page, selector, timeout = 12000) => page.locator(selector).waitFor({ state: 'visible', timeout });

const fillPhoto = async (page, values) => {
  await waitVisible(page, '[data-checkpoint="photo_observation"]');
  for (const [field, value] of Object.entries(values)) {
    await page.locator(`[data-photo-field="${field}"]`).selectOption(value);
  }
  await page.locator('[data-partner-v2-action="photo-submit"]').click();
};

const chooseGate = async (page, checkpoint, value) => {
  const selector = `[data-checkpoint="${checkpoint}"] [data-partner-v2-action="option-submit"][data-value="${value}"]`;
  await waitVisible(page, selector);
  await page.locator(selector).click();
};

const waitGate = (page, checkpoint) => waitVisible(page, `[data-partner-v2-gate][data-checkpoint="${checkpoint}"]`, 15000);

const fillFinal = async (page, answers, evidenceIds) => {
  await waitVisible(page, '[data-partner-v2-final] [data-final-field="replacement"]', 15000);
  for (const [field, value] of Object.entries(answers)) {
    await page.locator(`[data-final-field="${field}"]`).selectOption(value);
  }
  for (const id of evidenceIds) {
    await page.locator(`[data-final-evidence][value="${id}"]`).check();
  }
};

const correctFinal = {
  replacement: 'tk0',
  place: 'vector12_loop_b',
  window: '0206_0222',
  method: 'whole_container_swap',
  executor: 'rybakov',
  organizer: 'markova',
};

let server;
let browser;
try {
  server = await startServer();
  const baseUrl = `http://${HOST}:${PORT}${CASE_PATH}`;
  log(`serving ${baseUrl}`);

  browser = await chromium.launch({
    headless: true,
    executablePath: BROWSER_BIN,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const creatorContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const guestContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const creator = await creatorContext.newPage();
  const guest = await guestContext.newPage();
  const browserErrors = [];

  for (const [label, page] of [['creator-mobile', creator], ['guest-desktop', guest]]) {
    page.on('pageerror', (error) => browserErrors.push(`${label}: pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(`${label}: console: ${message.text()}`);
    });
  }

  log('creating room in mobile creator context');
  await creator.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await creator.locator('[data-action="create-open"]').click();
  await creator.locator('[data-player-name]').fill('Mobile Route');
  await creator.locator('[data-action="create"]').click();
  await waitVisible(creator, '.partner-v2-room-code strong');
  const roomCode = String(await creator.locator('.partner-v2-room-code strong').textContent()).trim();
  assert.match(roomCode, /^[A-HJ-NP-Z2-9]{8}$/);

  log(`joining room ${roomCode} from independent desktop context`);
  await guest.goto(`${baseUrl}?room=${roomCode}`, { waitUntil: 'domcontentloaded' });
  await waitVisible(guest, '[data-action="join"]');
  await guest.locator('[data-player-name]').fill('Desktop Cargo');
  await guest.locator('[data-action="join"]').click();
  await waitVisible(guest, '[data-action="start"]');

  log('starting both players');
  await Promise.all([
    creator.locator('[data-action="start"]').click({ timeout: 12000 }),
    guest.locator('[data-action="start"]').click({ timeout: 12000 }),
  ]);
  await Promise.all([waitVisible(creator, '.partner-v2-game-grid'), waitVisible(guest, '.partner-v2-game-grid')]);

  log('checking mobile Vector-12 map containment and initial pan');
  await waitVisible(creator, '[data-vector12-map]');
  await creator.waitForTimeout(150);
  const mapMetrics = await creator.locator('.partner-v2-vector-map-scroll').evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    scrollLeft: node.scrollLeft,
  }));
  assert.ok(mapMetrics.scrollWidth > mapMetrics.clientWidth, `mobile map should overflow inside its own scroller: ${JSON.stringify(mapMetrics)}`);
  assert.ok(mapMetrics.scrollLeft > 0, `mobile map should open centered on the investigation zone: ${JSON.stringify(mapMetrics)}`);
  const mobilePageFits = await creator.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  assert.equal(mobilePageFits, true, 'mobile page must not create body-level horizontal overflow');

  log('submitting independent first hypotheses');
  await creator.locator('[data-action="hypothesis"][data-value="during_stop"]').click();
  await guest.locator('[data-action="hypothesis"][data-value="insufficient"]').click();
  await Promise.all([waitGate(creator, 'photo_observation'), waitGate(guest, 'photo_observation')]);

  log('solving three-sign photo checkpoint through real controls');
  await fillPhoto(creator, { patch: 'absent', scratch: 'absent', door_deformation: 'present' });
  await fillPhoto(guest, { patch: 'present', scratch: 'present', door_deformation: 'absent' });
  await Promise.all([waitGate(creator, 't04391_link'), waitGate(guest, 't04391_link')]);

  log('refreshing one browser to verify persisted identity and progress');
  await guest.reload({ waitUntil: 'domcontentloaded' });
  await waitVisible(guest, '.partner-v2-game-grid');
  await waitGate(guest, 't04391_link');
  assert.ok(await guest.locator('[data-evidence-id="G05"]').count(), 'guest evidence must remain role-isolated after refresh');
  assert.equal(await guest.locator('[data-evidence-id^="M"]').count(), 0, 'guest must not receive route evidence after refresh');

  log('linking T-04391 across roles');
  await chooseGate(creator, 't04391_link', 'rybakov_r4');
  await chooseGate(guest, 't04391_link', 'tk0');
  await Promise.all([waitGate(creator, 'physical_operation'), waitGate(guest, 'physical_operation')]);

  log('proving physical swap');
  await chooseGate(creator, 'physical_operation', 'two_loaded_objects');
  await chooseGate(guest, 'physical_operation', 'mass_compensated');
  await Promise.all([waitGate(creator, 'endpoint_link'), waitGate(guest, 'endpoint_link')]);

  log('linking Endpoint 184 / L-14');
  await chooseGate(creator, 'endpoint_link', 'endpoint184_call');
  await chooseGate(guest, 'endpoint_link', 'l14_markova');

  log('building final reconstruction in both browsers');
  await fillFinal(creator, correctFinal, ['M08', 'M09']);
  await fillFinal(guest, correctFinal, ['G02', 'G08', 'G13']);
  await creator.locator('[data-partner-v2-final-submit]').click();
  await waitVisible(creator, '.partner-v2-final-notice');
  await guest.locator('[data-partner-v2-final-submit]').click();

  log('waiting for solved reveal on both devices');
  await Promise.all([
    waitVisible(creator, '[data-partner-v2-final].is-solved', 15000),
    waitVisible(guest, '[data-partner-v2-final].is-solved', 15000),
  ]);
  assert.ok((await creator.locator('.partner-v2-resolution-timeline > div').count()) >= 10, 'creator reveal should contain full timeline');
  assert.ok((await guest.locator('.partner-v2-resolution-timeline > div').count()) >= 10, 'guest reveal should contain full timeline');
  await waitVisible(creator, '[data-partner-v2-debrief]');
  await waitVisible(guest, '[data-partner-v2-debrief]');

  assert.deepEqual(browserErrors, [], `browser errors detected:\n${browserErrors.join('\n')}`);
  log(`PASS room=${roomCode}: mobile + desktop completed the real UI flow through solved reveal`);

  await creatorContext.close();
  await guestContext.close();
} catch (error) {
  console.error('[partner-v2-browser] FAIL:', error);
  process.exitCode = 1;
} finally {
  try { await browser?.close(); } catch {}
  try { if (server) await closeServer(server); } catch {}
}
