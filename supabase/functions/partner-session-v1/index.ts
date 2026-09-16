import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  PARTNER_CASE_ID,
  PARTNER_CASE_PATH,
  PARTNER_CASE_TITLE,
  createInitialPartnerState,
  mapDuelRoleToPartner,
  normalizePartnerState,
  processPartnerAction,
  safePartnerView,
  type PartnerRole,
} from '../_shared/partner-ne-publikovat-v1.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ALLOWED_ORIGINS = new Set((Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://www.mysterylogic.com,https://valera2872.github.io,https://rawcdn.githack.com')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean));
const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
const BROWSER_KEY_RE = /^[a-f0-9]{48}$/;
const MUTATING = new Set(['OPEN_EVIDENCE','PUBLISH_FINDING','ATTEMPT_DEDUCTION','PRESENT_EVIDENCE','CHALLENGE_ROMAN']);

function clean(value: unknown, max = 600) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
}
function record(value: unknown): Record<string, any> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}; }
async function digest(value: string) {
  const data = new TextEncoder().encode(value);
  const out = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(out)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
function cors(origin: string) {
  return {
    ...(origin ? { 'access-control-allow-origin': origin } : {}),
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'POST, OPTIONS',
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    'vary': 'Origin',
  };
}
function json(origin: string, status: number, body: unknown) { return new Response(JSON.stringify(body), { status, headers: cors(origin) }); }
function serviceHeaders(extra: Record<string,string> = {}) {
  return { apikey: SERVICE_ROLE_KEY, authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'content-type': 'application/json', ...extra };
}
async function rest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...serviceHeaders(), ...(init.headers || {}) } });
  const text = await response.text();
  let body: any = null;
  if (text) { try { body = JSON.parse(text); } catch { body = text; } }
  if (!response.ok) throw new Error(`partner_store_${response.status}:${clean(typeof body === 'string' ? body : JSON.stringify(body), 240)}`);
  return body;
}

async function roomByCode(code: string) {
  const rows = await rest(`duel_rooms?select=id,code,case_id,case_title,case_path,status,expires_at&code=eq.${encodeURIComponent(code)}&limit=1`);
  const room = Array.isArray(rows) ? rows[0] : null;
  if (!room) throw new Error('partner_room_not_found');
  if (room.status !== 'active' || new Date(room.expires_at).getTime() <= Date.now()) throw new Error('partner_room_inactive');
  if (room.case_id !== PARTNER_CASE_ID || room.case_path !== PARTNER_CASE_PATH) throw new Error('partner_wrong_case');
  return room;
}

async function memberContext(roomId: string, browserKeyHash: string) {
  const rows = await rest(`duel_room_players?select=id,role,player_key_hash,player_name,joined_at&room_id=eq.${encodeURIComponent(roomId)}&order=role.asc`);
  const players = Array.isArray(rows) ? rows : [];
  const me = players.find((row: any) => row.player_key_hash === browserKeyHash) || null;
  if (!me) throw new Error('partner_not_joined');
  const other = players.find((row: any) => row.id !== me.id) || null;
  return {
    role: mapDuelRoleToPartner(String(me.role)) as PartnerRole,
    me,
    partner: { joined: Boolean(other), name: other?.player_name ? String(other.player_name) : null },
  };
}

async function loadStateRow(roomId: string) {
  const rows = await rest(`partner_room_states?select=room_id,case_id,state,revision,entitlement_id&room_id=eq.${encodeURIComponent(roomId)}&limit=1`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function ensureStateRow(roomId: string) {
  let row = await loadStateRow(roomId);
  if (row) return row;
  try {
    const created = await rest('partner_room_states?select=room_id,case_id,state,revision,entitlement_id', {
      method: 'POST',
      headers: { prefer: 'return=representation' },
      body: JSON.stringify({ room_id: roomId, case_id: PARTNER_CASE_ID, state: createInitialPartnerState(), revision: 0 }),
    });
    row = Array.isArray(created) ? created[0] : null;
  } catch (error) {
    const message = String(error);
    if (!message.includes('23505') && !message.includes('duplicate')) throw error;
    row = await loadStateRow(roomId);
  }
  if (!row) throw new Error('partner_state_unavailable');
  return row;
}

async function compareAndSave(roomId: string, expectedRevision: number, state: unknown) {
  const rows = await rest(`partner_room_states?room_id=eq.${encodeURIComponent(roomId)}&revision=eq.${expectedRevision}&select=room_id,state,revision`, {
    method: 'PATCH',
    headers: { prefer: 'return=representation' },
    body: JSON.stringify({ state, revision: expectedRevision + 1, updated_at: new Date().toISOString() }),
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function errorStatus(code: string) {
  if (['invalid_request','partner_action_invalid','partner_finding_invalid','partner_deduction_invalid'].includes(code)) return 400;
  if (['partner_not_joined','partner_partner_required','partner_evidence_access_denied','partner_evidence_not_opened','partner_character_unavailable','partner_challenge_unavailable','partner_wrong_case'].includes(code)) return 403;
  if (code === 'partner_room_not_found') return 404;
  if (code === 'partner_room_inactive') return 410;
  if (code === 'partner_state_conflict') return 409;
  if (code.startsWith('partner_store_') || code === 'partner_state_unavailable') return 503;
  return 400;
}

Deno.serve(async (req: Request) => {
  const origin = (req.headers.get('origin') || '').replace(/\/$/, '');
  const allowed = !origin || ALLOWED_ORIGINS.has(origin);
  if (req.method === 'OPTIONS') {
    if (!allowed) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (req.method !== 'POST') return json(origin, 405, { error: 'method_not_allowed' });
  if (!allowed) return json('', 403, { error: 'origin_not_allowed' });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(origin, 503, { error: 'partner_store_not_configured' });

  let body: Record<string, any> = {};
  try { body = record(await req.json()); } catch { return json(origin, 400, { error: 'invalid_request' }); }
  const actionType = clean(body.action || body.type, 80).toUpperCase() || 'SNAPSHOT';
  const code = clean(body.code, 16).toUpperCase();
  const browserKey = clean(body.browserKey, 80).toLowerCase();
  if (!CODE_RE.test(code) || !BROWSER_KEY_RE.test(browserKey)) return json(origin, 400, { error: 'invalid_request' });

  try {
    const room = await roomByCode(code);
    const browserKeyHash = await digest(browserKey);
    const member = await memberContext(String(room.id), browserKeyHash);
    let row = await ensureStateRow(String(room.id));
    let state = normalizePartnerState(row.state);
    let revision = Number.isInteger(Number(row.revision)) ? Number(row.revision) : 0;

    if (MUTATING.has(actionType) && !member.partner.joined) throw new Error('partner_partner_required');

    if (MUTATING.has(actionType)) {
      let saved: any = null;
      let attempts = 0;
      while (!saved && attempts < 2) {
        attempts += 1;
        const next = processPartnerAction(state, member.role, { ...body, type: actionType });
        saved = await compareAndSave(String(room.id), revision, next);
        if (saved) {
          state = normalizePartnerState(saved.state);
          revision = Number(saved.revision);
          break;
        }
        row = await loadStateRow(String(room.id));
        if (!row) throw new Error('partner_state_unavailable');
        state = normalizePartnerState(row.state);
        revision = Number(row.revision) || 0;
      }
      if (!saved) throw new Error('partner_state_conflict');
    }

    return json(origin, 200, {
      ok: true,
      room: { code, caseId: PARTNER_CASE_ID, caseTitle: PARTNER_CASE_TITLE },
      ...safePartnerView(state, member.role, member.partner, revision),
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const code = clean(raw.split(':')[0], 120) || 'partner_request_failed';
    console.error('partner_session_v1_error', raw);
    return json(origin, errorStatus(code), { error: code });
  }
});
