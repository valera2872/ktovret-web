import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const PUBLIC_SITE_ORIGIN = (Deno.env.get('PUBLIC_SITE_ORIGIN') || 'https://mysterylogic.com').replace(/\/$/, '');
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);

const CASE_ID = 'special:407';
const CASE_TITLE = 'Номер 407';
const CASE_PATH = '/detektivnye-igry-dlya-dvoih/407/';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
const BROWSER_KEY_RE = /^[a-f0-9]{48}$/;
const roomSelect = 'id,code,case_id,case_title,case_path,creator_key_hash,status,created_at,expires_at';
const playerSelect = 'id,room_id,role,player_key_hash,player_name,joined_at,started_at,elapsed_seconds,hints_used,attempts,first_answer_correct,completed_at';

type AdminClient = ReturnType<typeof createClient>;

const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    'vary': 'Origin',
    ...(origin ? { 'access-control-allow-origin': origin } : {}),
  },
});

const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes)).map((value) => value.toString(16).padStart(2, '0')).join('');
const sha256 = async (value: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8))).map((value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('');
const cleanName = (value: unknown) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ').slice(0, 32) || 'Следователь';

const statsFrom = (body: Record<string, unknown>) => {
  const elapsedSeconds = Number(body.elapsedSeconds);
  const hintsUsed = Number(body.hintsUsed);
  const attempts = Number(body.attempts);
  const firstAnswerCorrect = Boolean(body.firstAnswerCorrect);
  if (!Number.isInteger(elapsedSeconds) || elapsedSeconds < 1 || elapsedSeconds > 21600) return null;
  if (!Number.isInteger(hintsUsed) || hintsUsed < 0 || hintsUsed > 10) return null;
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 20) return null;
  return { elapsedSeconds, hintsUsed, attempts, firstAnswerCorrect };
};

const getRoom = async (admin: AdminClient, code: string) => {
  const result = await admin.from('duel_rooms').select(roomSelect).eq('code', code).maybeSingle();
  if (result.error) throw new Error(`room_lookup:${result.error.code}:${result.error.message}`);
  return result.data as Record<string, any> | null;
};

const roomError = (room: Record<string, any> | null) => {
  if (!room) return 'room_not_found';
  if (room.case_id !== CASE_ID) return 'wrong_case';
  if (room.status !== 'active') return 'room_inactive';
  if (new Date(room.expires_at).getTime() <= Date.now()) return 'room_expired';
  return '';
};

const publicMetrics = (player: Record<string, any>) => ({
  name: player.player_name,
  role: player.role,
  elapsedSeconds: player.elapsed_seconds,
  hintsUsed: player.hints_used,
  attempts: player.attempts,
  firstAnswerCorrect: player.first_answer_correct,
  completedAt: player.completed_at,
});

const buildView = async (admin: AdminClient, room: Record<string, any>, browserKeyHash: string) => {
  const playersResult = await admin.from('duel_room_players').select(playerSelect).eq('room_id', room.id).order('role', { ascending: true });
  if (playersResult.error) throw new Error(`players_lookup:${playersResult.error.code}:${playersResult.error.message}`);
  const players = (playersResult.data || []) as Record<string, any>[];
  const me = players.find((player) => player.player_key_hash === browserKeyHash) || null;
  if (!me) return { error: 'not_joined' };
  const opponent = players.find((player) => player.id !== me.id) || null;
  const creator = players.find((player) => player.role === 'creator') || null;
  const guest = players.find((player) => player.role === 'guest') || null;
  const bothJoined = Boolean(creator && guest);
  const bothCompleted = Boolean(bothJoined && creator.completed_at && guest.completed_at);
  return {
    ok: true,
    room: {
      code: room.code,
      caseId: CASE_ID,
      caseTitle: CASE_TITLE,
      casePath: CASE_PATH,
      createdAt: room.created_at,
      expiresAt: room.expires_at,
      roomUrl: `${PUBLIC_SITE_ORIGIN}${CASE_PATH}?room=${room.code}`,
    },
    me: { role: me.role, name: me.player_name, started: Boolean(me.started_at), completed: Boolean(me.completed_at) },
    opponent: opponent ? { joined: true, role: opponent.role, name: opponent.player_name, started: Boolean(opponent.started_at), completed: Boolean(opponent.completed_at) } : { joined: false, started: false, completed: false },
    bothJoined,
    bothCompleted,
    results: bothCompleted ? { creator: publicMetrics(creator), guest: publicMetrics(guest) } : null,
  };
};

Deno.serve(async (req: Request) => {
  const origin = (req.headers.get('origin') || '').replace(/\/$/, '');
  const allowedOrigin = !origin || configuredOrigins.includes(origin);
  if (req.method === 'OPTIONS') {
    if (!allowedOrigin) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: { ...(origin ? { 'access-control-allow-origin': origin } : {}), 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-max-age': '600', vary: 'Origin' } });
  }
  if (!allowedOrigin) return json(403, { error: 'origin_not_allowed' });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }
  const action = String(body.action || '').trim();
  const browserKey = String(body.browserKey || '').trim();
  if (!BROWSER_KEY_RE.test(browserKey)) return json(400, { error: 'invalid_browser_key' }, origin);
  const browserKeyHash = await sha256(browserKey);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  if (action === 'create') {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const hourResult = await admin.from('duel_rooms').select('id', { count: 'exact', head: true }).eq('creator_key_hash', browserKeyHash).gte('created_at', hourAgo);
    const dayResult = await admin.from('duel_rooms').select('id', { count: 'exact', head: true }).eq('creator_key_hash', browserKeyHash).gte('created_at', dayAgo);
    if (hourResult.error || dayResult.error) return json(503, { error: 'rate_check_failed' }, origin);
    if ((hourResult.count || 0) >= 8 || (dayResult.count || 0) >= 24) return json(429, { error: 'room_rate_limited' }, origin);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    let room: Record<string, any> | null = null;
    for (let attempt = 0; attempt < 6 && !room; attempt += 1) {
      const result = await admin.from('duel_rooms').insert({
        code: makeCode(), case_id: CASE_ID, case_title: CASE_TITLE, case_path: CASE_PATH,
        creator_key_hash: browserKeyHash, expires_at: expiresAt,
      }).select(roomSelect).single();
      if (!result.error) room = result.data as Record<string, any>;
      else if (result.error.code !== '23505') {
        console.error('coop_407_room_create_failed', result.error.code, result.error.message);
        return json(503, { error: 'room_create_failed' }, origin);
      }
    }
    if (!room) return json(503, { error: 'room_code_generation_failed' }, origin);
    const playerResult = await admin.from('duel_room_players').insert({ room_id: room.id, role: 'creator', player_key_hash: browserKeyHash, player_name: cleanName(body.playerName) }).select('id').single();
    if (playerResult.error) {
      await admin.from('duel_rooms').delete().eq('id', room.id);
      return json(503, { error: 'room_create_failed' }, origin);
    }
    return json(201, await buildView(admin, room, browserKeyHash), origin);
  }

  const code = String(body.code || '').trim().toUpperCase();
  if (!CODE_RE.test(code)) return json(400, { error: 'invalid_code' }, origin);
  let room: Record<string, any> | null;
  try { room = await getRoom(admin, code); } catch (error) { console.error(String(error)); return json(503, { error: 'room_lookup_failed' }, origin); }
  const activeError = roomError(room);
  if (activeError) return json(activeError === 'room_not_found' ? 404 : activeError === 'wrong_case' ? 409 : 410, { error: activeError }, origin);
  const activeRoom = room as Record<string, any>;

  if (action === 'preview') {
    const playersResult = await admin.from('duel_room_players').select('role,player_name').eq('room_id', activeRoom.id);
    if (playersResult.error) return json(503, { error: 'players_lookup_failed' }, origin);
    const creator = (playersResult.data || []).find((player: any) => player.role === 'creator');
    const guest = (playersResult.data || []).find((player: any) => player.role === 'guest');
    return json(200, { ok: true, room: { code, caseTitle: CASE_TITLE }, creatorName: creator?.player_name || 'Следователь', roomFull: Boolean(guest) }, origin);
  }

  if (action === 'join') {
    const current = await admin.from('duel_room_players').select(playerSelect).eq('room_id', activeRoom.id);
    if (current.error) return json(503, { error: 'players_lookup_failed' }, origin);
    const players = (current.data || []) as Record<string, any>[];
    if (!players.some((player) => player.player_key_hash === browserKeyHash)) {
      if (players.some((player) => player.role === 'guest')) return json(409, { error: 'room_full' }, origin);
      const joinResult = await admin.from('duel_room_players').insert({ room_id: activeRoom.id, role: 'guest', player_key_hash: browserKeyHash, player_name: cleanName(body.playerName) }).select('id').single();
      if (joinResult.error && joinResult.error.code !== '23505') return json(503, { error: 'join_failed' }, origin);
    }
    return json(200, await buildView(admin, activeRoom, browserKeyHash), origin);
  }

  let view = await buildView(admin, activeRoom, browserKeyHash);
  if ((view as any).error === 'not_joined') return json(403, { error: 'not_joined' }, origin);
  if (action === 'status') return json(200, view, origin);

  if (action === 'start') {
    const update = await admin.from('duel_room_players').update({ started_at: new Date().toISOString() }).eq('room_id', activeRoom.id).eq('player_key_hash', browserKeyHash).is('started_at', null);
    if (update.error) return json(503, { error: 'start_failed' }, origin);
    return json(200, await buildView(admin, activeRoom, browserKeyHash), origin);
  }

  if (action === 'complete') {
    const stats = statsFrom(body);
    if (!stats) return json(400, { error: 'invalid_stats' }, origin);
    const player = await admin.from('duel_room_players').select('completed_at').eq('room_id', activeRoom.id).eq('player_key_hash', browserKeyHash).single();
    if (player.error) return json(503, { error: 'player_lookup_failed' }, origin);
    if (!player.data.completed_at) {
      const completedAt = new Date().toISOString();
      const update = await admin.from('duel_room_players').update({ elapsed_seconds: stats.elapsedSeconds, hints_used: stats.hintsUsed, attempts: stats.attempts, first_answer_correct: stats.firstAnswerCorrect, completed_at: completedAt, started_at: completedAt }).eq('room_id', activeRoom.id).eq('player_key_hash', browserKeyHash).is('completed_at', null);
      if (update.error) return json(503, { error: 'complete_failed' }, origin);
    }
    view = await buildView(admin, activeRoom, browserKeyHash);
    return json(200, view, origin);
  }

  return json(400, { error: 'invalid_action' }, origin);
});
