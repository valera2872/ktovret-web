#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('assets/case-aria-paid-auth.js', 'utf8');
const coopSource = fs.readFileSync('supabase/functions/coop-last-aria/index.ts', 'utf8');
const statusSource = fs.readFileSync('supabase/functions/payment-status-last-aria/index.ts', 'utf8');

for (const marker of [
  "const FLIGHT_KEY = 'mysterylogic:last-aria:checkout-flight:v2'",
  "const PENDING_KEY = 'mysterylogic:last-aria:pending-payment:v2'",
  'attempts: clampInt(body.attempts, 1, 20, 1)',
  'elapsedSeconds: clampInt(body.elapsedSeconds, 1, 21600, 60)',
  'finalAccepted: Boolean(completed)',
  "payload?.error === 'not_joined'",
  "TERMINAL_ROOM_ERRORS.has",
  'now - lastFinalSubmit.at < 650',
]) assert(source.includes(marker), `state guard missing ${marker}`);
assert(coopSource.includes('attempts: Math.min(attempts, 20)'), 'backend attempts clamp missing');
assert(coopSource.includes('elapsedSeconds: Math.min(elapsedSeconds, 21600)'), 'backend elapsed clamp missing');
assert(coopSource.includes("(joinedView as any).error === 'not_joined'"), 'join race guard missing');
assert(statusSource.includes('confirmationUrl,'), 'pending payment resume URL missing');

class Storage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const localStorage = new Storage();
const sessionStorage = new Storage();
const listeners = new Map();
const root = { innerHTML: '', querySelector: () => null };
const document = {
  querySelector(selector) {
    if (selector === '[data-casearia-app]') return root;
    if (selector === '.casearia-room-top>span:nth-child(2) strong') return { textContent: 'Сценический следователь' };
    return null;
  },
  addEventListener(type, handler) { listeners.set(type, handler); },
};
class MutationObserver { constructor(callback) { this.callback = callback; } observe() {} }
const location = { pathname: '/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/', assign() {} };

const calls = [];
let checkoutCalls = 0;
const nativeFetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : String(input?.url || '');
  const body = (() => { try { return JSON.parse(init.body || '{}'); } catch { return {}; } })();
  calls.push({ url, body, headers: Object.fromEntries(new Headers(init.headers || {}).entries()) });
  if (url.includes('create-checkout-last-aria')) {
    checkoutCalls += 1;
    if (checkoutCalls === 1) throw new TypeError('simulated network loss after provider request');
    return new Response(JSON.stringify({ ok: true, orderId: '11111111-1111-4111-8111-111111111111', confirmationUrl: 'https://payments.example/resume', status: 'pending' }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.includes('payment-status-last-aria')) {
    if (body.orderId === 'entitled-order') return new Response(JSON.stringify({ ok: true, orderId: body.orderId, status: 'canceled', entitled: true, confirmationUrl: '' }), { status: 200, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ ok: true, orderId: body.orderId, status: 'pending', entitled: false, confirmationUrl: 'https://payments.example/resume' }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.includes('coop-last-aria')) {
    if (body.action === 'join') return new Response(JSON.stringify({ error: 'not_joined' }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (body.action === 'status') return new Response(JSON.stringify({ ok: true, room: { code: body.code }, me: { role: 'creator', completed: false }, opponent: { joined: true }, bothJoined: true, bothCompleted: false }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (body.action === 'complete') return new Response(JSON.stringify({ ok: true, room: { code: body.code }, me: { role: 'creator', completed: true }, opponent: { joined: true }, bothJoined: true, bothCompleted: false }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
};

const window = {
  fetch: nativeFetch,
  MLLastAriaAccessToken: `ml_aria_${'a'.repeat(48)}`,
  MLCaseAria: {
    roles: { creator: { title: 'Сценический следователь' }, guest: { title: 'Технический аналитик' } },
    decision: { options: [{ id: 'conductor' }, { id: 'manager' }] },
  },
};
const context = vm.createContext({
  window, document, localStorage, sessionStorage, MutationObserver, location,
  Headers, Response, URL, crypto, setTimeout, clearTimeout, Date, JSON, Math, Number, String, Boolean, Object, Array, Set, Promise, console,
});
vm.runInContext(source, context, { filename: 'case-aria-paid-auth.js' });
assert.equal(typeof window.__MLLastAriaStateSpace?.normalizeProgress, 'function', 'state-space debug contract missing');

const checkoutUrl = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/create-checkout-last-aria';
const firstId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const secondId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const checkoutBase = { accessToken: 'token', email: 'qa@example.com', reviewDiscountCode: '', offerAccepted: true, privacyAcknowledged: true };
await assert.rejects(() => window.fetch(checkoutUrl, { method: 'POST', body: JSON.stringify({ ...checkoutBase, requestId: firstId }) }), /network loss/);
const second = await window.fetch(checkoutUrl, { method: 'POST', body: JSON.stringify({ ...checkoutBase, requestId: secondId }) });
assert.equal(second.status, 200);
const checkoutBodies = calls.filter((call) => call.url.includes('create-checkout-last-aria')).map((call) => call.body);
assert.equal(checkoutBodies[0].requestId, firstId, 'first checkout id changed');
assert.equal(checkoutBodies[1].requestId, firstId, 'retry did not reuse checkout id');

const progressKey = 'mysterylogic:last-aria:v1:ABCDEFGH:creator';
localStorage.setItem(progressKey, JSON.stringify({ stage: 99, hintsUsed: 40, attempts: 77, startedAt: Date.now() - 30_000_000, handoffs: [], decision: 'bogus', finalAccepted: true }));
await window.fetch('https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/coop-last-aria', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'status', code: 'ABCDEFGH', browserKey: 'a'.repeat(48) }) });
const normalized = JSON.parse(localStorage.getItem(progressKey));
assert.equal(normalized.stage, 3, 'corrupt stage not clamped');
assert.equal(normalized.hintsUsed, 10, 'hints not clamped');
assert.equal(normalized.attempts, 20, 'attempts not clamped');
assert.equal(normalized.finalAccepted, false, 'server completion did not override stale local acceptance');
assert.deepEqual(normalized.handoffs, {}, 'corrupt handoffs not normalized');
assert.equal(normalized.decision, '', 'invalid decision not cleared');

await window.fetch('https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/coop-last-aria', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'complete', code: 'ABCDEFGH', browserKey: 'a'.repeat(48), elapsedSeconds: 999999, hintsUsed: 99, attempts: 99, firstAnswerCorrect: false }) });
const completeCall = calls.filter((call) => call.url.includes('coop-last-aria') && call.body.action === 'complete').at(-1);
assert.equal(completeCall.body.elapsedSeconds, 21600, 'complete elapsed not clamped');
assert.equal(completeCall.body.hintsUsed, 10, 'complete hints not clamped');
assert.equal(completeCall.body.attempts, 20, 'complete attempts not clamped');
assert.match(completeCall.headers.authorization || '', /^Bearer ml_aria_/, 'paid/reward authorization not attached');
assert.equal(JSON.parse(localStorage.getItem(progressKey)).finalAccepted, true, 'server completion not restored locally');

const joinResponse = await window.fetch('https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/coop-last-aria', { method: 'POST', body: JSON.stringify({ action: 'join', code: 'ABCDEFGH', browserKey: 'b'.repeat(48) }) });
assert.equal(joinResponse.status, 409, 'join race malformed 200 not converted');
assert.equal((await joinResponse.json()).error, 'room_full');

const entitled = await window.fetch('https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/payment-status-last-aria', { method: 'POST', body: JSON.stringify({ orderId: 'entitled-order' }) });
assert.equal((await entitled.json()).status, 'paid', 'active entitlement remained hidden behind newer canceled order');

const submit = listeners.get('submit');
assert.equal(typeof submit, 'function', 'duplicate-submit guard not installed');
const form = { querySelectorAll: () => [{ name: 'final-culprit', value: 'mikhail' }, { name: 'evidence', value: 'tag' }] };
const firstEvent = { target: { closest: () => form }, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
const secondEvent = { target: { closest: () => form }, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
submit(firstEvent);
submit(secondEvent);
assert.equal(Boolean(firstEvent.prevented), false, 'first final submit was blocked');
assert.equal(Boolean(secondEvent.prevented), true, 'duplicate final submit was not blocked');
assert.equal(Boolean(secondEvent.stopped), true, 'duplicate final submit propagated');

console.log(JSON.stringify({
  verdict: 'LAST_ARIA_STATE_SPACE_PASS',
  checkoutRetryIdempotent: true,
  staleSaveNormalized: true,
  serverCompletionAuthoritative: true,
  longSessionAndAttemptsClamped: true,
  joinRaceMappedToRoomFull: true,
  activeEntitlementRestoredAcrossCanceledOrder: true,
  duplicateFinalSubmitBlocked: true,
}, null, 2));