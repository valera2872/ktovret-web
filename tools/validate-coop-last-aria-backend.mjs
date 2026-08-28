#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (relative) => fs.readFileSync(path.join(repo, relative), 'utf8');
const aria = read('supabase/functions/coop-last-aria/index.ts');
const reference = read('supabase/functions/coop-407/index.ts');
const expect = (condition, message) => {
  if (!condition) throw new Error(`Last Aria backend contract failed: ${message}`);
};

const requiredAria = [
  "const CASE_ID = 'special:last-aria'",
  "const CASE_TITLE = 'Последняя ария'",
  "const CASE_PATH = '/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/'",
  "const PRODUCT_ID = 'last_aria'",
  "const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/",
  "const BROWSER_KEY_RE = /^[a-f0-9]{48}$/",
  "const ACCESS_TOKEN_RE = /^ml_[a-z0-9]+_[A-Za-z0-9_-]{32,160}$/",
  "admin.from('duel_rooms')",
  "admin.from('duel_room_players')",
  "from('access_entitlements')",
  ".eq('product_id', PRODUCT_ID)",
  "if (!ACCESS_TOKEN_RE.test(accessToken)) return json(402, { error: 'payment_required' }",
  "if (!entitled) return json(402, { error: 'payment_required' }",
  "if (room.case_id !== CASE_ID) return 'wrong_case'",
  "if (action === 'create')",
  "if (action === 'preview')",
  "if (action === 'join')",
  "if (action === 'status')",
  "if (action === 'start')",
  "if (action === 'complete')",
  "return json(400, { error: 'invalid_action' }",
  "return json(403, { error: 'not_joined' }",
  "return json(409, { error: 'room_full' }",
  "return json(429, { error: 'room_rate_limited' }",
  "return json(503, { error: 'room_create_failed' }",
  "await admin.from('duel_rooms').delete().eq('id', room.id)",
  "new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)",
  "(hourResult.count || 0) >= 8",
  "(dayResult.count || 0) >= 24",
  "elapsedSeconds: Math.min(elapsedSeconds, 21600)",
  "hintsUsed: Math.min(hintsUsed, 10)",
  "attempts: Math.min(attempts, 20)",
  "const joinedView = await buildView(admin, activeRoom, browserKeyHash)",
  "if ((joinedView as any).error === 'not_joined') return json(409, { error: 'room_full' }",
  "bothJoined",
  "bothCompleted",
  "results: bothCompleted",
  "'access-control-allow-methods': 'POST, OPTIONS'",
  "'access-control-allow-headers': 'authorization, content-type'",
  "configuredOrigins.includes(origin)",
];
for (const marker of requiredAria) expect(aria.includes(marker), `missing ${marker}`);

expect(!aria.includes('elapsedSeconds > 21600'), 'long-running sessions must be clamped, not rejected');
expect(!aria.includes('attempts > 20'), 'high-attempt sessions must be clamped, not rejected');

const actionNames = [...aria.matchAll(/if \(action === '([^']+)'\)/g)].map((match) => match[1]);
const expectedActions = ['create', 'preview', 'join', 'status', 'start', 'complete'];
expect(JSON.stringify(actionNames) === JSON.stringify(expectedActions), `unexpected action surface: ${actionNames.join(', ')}`);

const sharedMarkers = [
  "const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'",
  "const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/",
  "const BROWSER_KEY_RE = /^[a-f0-9]{48}$/",
  "const roomSelect = 'id,code,case_id,case_title,case_path,creator_key_hash,status,created_at,expires_at'",
  "const playerSelect = 'id,room_id,role,player_key_hash,player_name,joined_at,started_at,elapsed_seconds,hints_used,attempts,first_answer_correct,completed_at'",
  "crypto.subtle.digest('SHA-256'",
  "status !== 'active'",
  "new Date(room.expires_at).getTime() <= Date.now()",
  "persistSession: false, autoRefreshToken: false",
  "select('id', { count: 'exact', head: true })",
  "new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)",
  "role: 'creator'",
  "role: 'guest'",
  ".is('started_at', null)",
  ".is('completed_at', null)",
];
for (const marker of sharedMarkers) {
  expect(reference.includes(marker), `reference 407 no longer contains ${marker}`);
  expect(aria.includes(marker), `Last Aria drifted from production transport contract at ${marker}`);
}

const responseStart = aria.indexOf("return {\n    ok: true,");
const responseEnd = aria.indexOf("\n  };\n};\n\nDeno.serve", responseStart);
expect(responseStart >= 0 && responseEnd > responseStart, 'cannot isolate serialized buildView response');
const serializedView = aria.slice(responseStart, responseEnd);
expect(!serializedView.includes('SUPABASE_SERVICE_ROLE_KEY'), 'service-role key must never be serialized');
expect(!serializedView.includes('creator_key_hash'), 'creator hash must never be serialized into public room view');
expect(!serializedView.includes('player_key_hash'), 'player hash must never be serialized into public player view');
expect(serializedView.includes('caseId: CASE_ID') && serializedView.includes('caseTitle: CASE_TITLE') && serializedView.includes('casePath: CASE_PATH'), 'public room identity fields missing');
expect(serializedView.includes('me: { role: me.role, name: me.player_name') && serializedView.includes('opponent:'), 'public player projection missing');

console.log(JSON.stringify({
  caseId: 'special:last-aria',
  productId: 'last_aria',
  creatorRequiresPaidEntitlement: true,
  guestRequiresPayment: false,
  actions: expectedActions,
  roomTtlDays: 7,
  rateLimit: { perHour: 8, perDay: 24 },
  persistedStatsLimits: { elapsedSeconds: 21600, hints: 10, attempts: 20 },
  overflowPolicy: 'clamp client gameplay telemetry instead of blocking a solved case',
  concurrentJoinPolicy: 'race loser receives room_full instead of a malformed 200 view',
  databaseModel: ['duel_rooms', 'duel_room_players', 'access_entitlements'],
  reference: 'coop-407 production transport contract + paid creator gate + Last Aria resilience boundaries',
  verdict: 'backend source is ready for resilient paid Last Aria deployment',
}, null, 2));