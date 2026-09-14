import { createClient } from 'npm:@supabase/supabase-js@2';
import { ZERO_CONTAINER_CASE } from '../_shared/partner-cases/zero-container.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const PUBLIC_SITE_ORIGIN = (Deno.env.get('PUBLIC_SITE_ORIGIN') || 'https://mysterylogic.com').replace(/\/$/, '');
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
const BROWSER_KEY_RE = /^[a-f0-9]{48}$/;
const CASE_REGISTRY: Record<string, typeof ZERO_CONTAINER_CASE> = {
  [ZERO_CONTAINER_CASE.id]: ZERO_CONTAINER_CASE,
};

const roomSelect = 'id,code,case_id,case_title,case_path,creator_key_hash,status,created_at,expires_at';
const playerSelect = 'id,room_id,role,player_key_hash,player_name,joined_at,started_at,completed_at';

type AdminClient = ReturnType<typeof createClient>;
type Row = Record<string, any>;
type PartnerRole = 'creator' | 'guest';

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
const cleanCaseId = (value: unknown) => String(value || '').trim();

const getCase = (caseId: string) => CASE_REGISTRY[caseId] || null;

const getRoom = async (admin: AdminClient, code: string) => {
  const result = await admin.from('duel_rooms').select(roomSelect).eq('code', code).maybeSingle();
  if (result.error) throw new Error(`room_lookup:${result.error.code}:${result.error.message}`);
  return result.data as Row | null;
};

const roomError = (room: Row | null) => {
  if (!room) return 'room_not_found';
  if (!CASE_REGISTRY[room.case_id]) return 'wrong_case';
  if (room.status !== 'active') return 'room_inactive';
  if (new Date(room.expires_at).getTime() <= Date.now()) return 'room_expired';
  return '';
};

const getPlayers = async (admin: AdminClient, roomId: string) => {
  const result = await admin.from('duel_room_players').select(playerSelect).eq('room_id', roomId).order('role', { ascending: true });
  if (result.error) throw new Error(`players_lookup:${result.error.code}:${result.error.message}`);
  return (result.data || []) as Row[];
};

const getCaseState = async (admin: AdminClient, roomId: string) => {
  const result = await admin.from('partner_v2_room_state')
    .select('room_id,case_id,case_version,chapter,revision,shared_state,updated_at')
    .eq('room_id', roomId).maybeSingle();
  if (result.error) throw new Error(`case_state_lookup:${result.error.code}:${result.error.message}`);
  return result.data as Row | null;
};

const getPlayerState = async (admin: AdminClient, roomId: string, playerId: string) => {
  const result = await admin.from('partner_v2_player_state')
    .select('room_id,player_id,role,revision,private_state,updated_at')
    .eq('room_id', roomId).eq('player_id', playerId).maybeSingle();
  if (result.error) throw new Error(`player_state_lookup:${result.error.code}:${result.error.message}`);
  return result.data as Row | null;
};

const visibleEvidence = (caseConfig: typeof ZERO_CONTAINER_CASE, role: PartnerRole, chapter: number) =>
  Object.values(caseConfig.evidence)
    .filter((item) => item.role === role && item.chapter <= chapter)
    .map((item) => ({ ...item }));

const publicCheckpointUi = (caseConfig: typeof ZERO_CONTAINER_CASE, role: PartnerRole) => {
  const ui = caseConfig.checkpointUi;
  return {
    photo_observation: ui.photo_observation,
    t04391_link: {
      id: ui.t04391_link.id,
      title: ui.t04391_link.title,
      lead: ui.t04391_link.lead,
      options: ui.t04391_link.roleOptions[role],
    },
  };
};

const matchesExpected = (value: unknown, expected: unknown) => {
  if (typeof expected === 'string') return String(value || '') === expected;
  if (!expected || typeof expected !== 'object' || !value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = value as Record<string, unknown>;
  return Object.entries(expected as Record<string, unknown>).every(([key, expectedValue]) => actual[key] === expectedValue);
};

const buildView = async (admin: AdminClient, room: Row, browserKeyHash: string) => {
  const caseConfig = getCase(room.case_id);
  if (!caseConfig) return { error: 'wrong_case' };

  const players = await getPlayers(admin, room.id);
  const me = players.find((player) => player.player_key_hash === browserKeyHash) || null;
  if (!me) return { error: 'not_joined' };

  const opponent = players.find((player) => player.id !== me.id) || null;
  const creator = players.find((player) => player.role === 'creator') || null;
  const guest = players.find((player) => player.role === 'guest') || null;
  const bothJoined = Boolean(creator && guest);
  const caseState = await getCaseState(admin, room.id);
  const playerState = await getPlayerState(admin, room.id, me.id);
  if (!caseState || !playerState) return { error: 'partner_state_missing' };

  const role = me.role as PartnerRole;
  const roleConfig = caseConfig.roles[role];
  const chapter = Number(caseState.chapter) || 1;
  const privateState = playerState.private_state || {};
  const sharedState = caseState.shared_state || {};

  return {
    ok: true,
    case: {
      id: caseConfig.id,
      version: caseConfig.version,
      title: caseConfig.title,
      subtitle: caseConfig.subtitle,
      duration: caseConfig.duration,
      difficulty: caseConfig.difficulty,
      access: caseConfig.access,
      brief: caseConfig.brief,
      chapters: Object.values(caseConfig.chapters),
      initialHypothesisOptions: caseConfig.initialHypothesisOptions,
      checkpointUi: publicCheckpointUi(caseConfig, role),
    },
    room: {
      code: room.code,
      caseId: caseConfig.id,
      caseTitle: caseConfig.title,
      casePath: caseConfig.path,
      roomUrl: `${PUBLIC_SITE_ORIGIN}${caseConfig.path}?room=${room.code}`,
      createdAt: room.created_at,
      expiresAt: room.expires_at,
    },
    me: {
      role,
      roleTitle: roleConfig.title,
      roleMark: roleConfig.mark,
      roleShort: roleConfig.short,
      name: me.player_name,
      started: Boolean(me.started_at),
      completed: Boolean(me.completed_at),
      firstHypothesis: privateState.firstHypothesis || null,
      checkpoints: privateState.checkpoints || {},
    },
    opponent: opponent ? {
      joined: true,
      role: opponent.role,
      name: opponent.player_name,
      started: Boolean(opponent.started_at),
      completed: Boolean(opponent.completed_at),
    } : { joined: false, started: false, completed: false },
    bothJoined,
    state: {
      chapter,
      revision: Number(caseState.revision) || 1,
      shared: {
        initialHypothesesComplete: Boolean(sharedState.initialHypothesesComplete),
        photoComparisonSolved: Boolean(sharedState.photoComparisonSolved),
        t04391Linked: Boolean(sharedState.t04391Linked),
      },
    },
    evidence: visibleEvidence(caseConfig, role, chapter),
  };
};

Deno.serve(async (req: Request) => {
  const origin = (req.headers.get('origin') || '').replace(/\/$/, '');
  const allowedOrigin = !origin || configuredOrigins.includes(origin);

  if (req.method === 'OPTIONS') {
    if (!allowedOrigin) return new Response(null, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin ? { 'access-control-allow-origin': origin } : {}),
        'access-control-allow-headers': 'content-type',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-max-age': '600',
        vary: 'Origin',
      },
    });
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
    const caseId = cleanCaseId(body.caseId);
    const caseConfig = getCase(caseId);
    if (!caseConfig) return json(400, { error: 'unsupported_case' }, origin);

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const hourResult = await admin.from('duel_rooms').select('id', { count: 'exact', head: true }).eq('creator_key_hash', browserKeyHash).gte('created_at', hourAgo);
    const dayResult = await admin.from('duel_rooms').select('id', { count: 'exact', head: true }).eq('creator_key_hash', browserKeyHash).gte('created_at', dayAgo);
    if (hourResult.error || dayResult.error) return json(503, { error: 'rate_check_failed' }, origin);
    if ((hourResult.count || 0) >= 8 || (dayResult.count || 0) >= 24) return json(429, { error: 'room_rate_limited' }, origin);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    let room: Row | null = null;
    for (let attempt = 0; attempt < 6 && !room; attempt += 1) {
      const result = await admin.from('duel_rooms').insert({
        code: makeCode(),
        case_id: caseConfig.id,
        case_title: caseConfig.title,
        case_path: caseConfig.path,
        creator_key_hash: browserKeyHash,
        expires_at: expiresAt,
      }).select(roomSelect).single();
      if (!result.error) room = result.data as Row;
      else if (result.error.code !== '23505') {
        console.error('partner_v2_room_create_failed', result.error.code, result.error.message);
        return json(503, { error: 'room_create_failed' }, origin);
      }
    }
    if (!room) return json(503, { error: 'room_code_generation_failed' }, origin);

    const playerResult = await admin.from('duel_room_players').insert({
      room_id: room.id,
      role: 'creator',
      player_key_hash: browserKeyHash,
      player_name: cleanName(body.playerName),
    }).select('id,role').single();

    if (playerResult.error) {
      await admin.from('duel_rooms').delete().eq('id', room.id);
      return json(503, { error: 'room_create_failed' }, origin);
    }

    const roomStateResult = await admin.from('partner_v2_room_state').insert({
      room_id: room.id,
      case_id: caseConfig.id,
      case_version: caseConfig.version,
      chapter: 1,
      revision: 1,
      shared_state: {
        initialHypothesesComplete: false,
        photoComparisonSolved: false,
        t04391Linked: false,
      },
    });

    const playerStateResult = await admin.from('partner_v2_player_state').insert({
      room_id: room.id,
      player_id: playerResult.data.id,
      role: 'creator',
      revision: 1,
      private_state: { firstHypothesis: null, checkpoints: {}, hints: {}, finalDraft: null },
    });

    if (roomStateResult.error || playerStateResult.error) {
      console.error('partner_v2_state_create_failed', roomStateResult.error?.message, playerStateResult.error?.message);
      await admin.from('duel_rooms').delete().eq('id', room.id);
      return json(503, { error: 'room_create_failed' }, origin);
    }

    return json(201, await buildView(admin, room, browserKeyHash), origin);
  }

  const code = String(body.code || '').trim().toUpperCase();
  if (!CODE_RE.test(code)) return json(400, { error: 'invalid_code' }, origin);

  let room: Row | null;
  try { room = await getRoom(admin, code); }
  catch (error) { console.error(String(error)); return json(503, { error: 'room_lookup_failed' }, origin); }

  const activeError = roomError(room);
  if (activeError) return json(activeError === 'room_not_found' ? 404 : activeError === 'wrong_case' ? 409 : 410, { error: activeError }, origin);
  const activeRoom = room as Row;
  const caseConfig = getCase(activeRoom.case_id)!;

  if (action === 'preview') {
    const players = await getPlayers(admin, activeRoom.id);
    const creator = players.find((player) => player.role === 'creator');
    const guest = players.find((player) => player.role === 'guest');
    return json(200, {
      ok: true,
      room: { code, caseId: caseConfig.id, caseTitle: caseConfig.title },
      creatorName: creator?.player_name || 'Игрок 1',
      roomFull: Boolean(guest),
    }, origin);
  }

  if (action === 'join') {
    const players = await getPlayers(admin, activeRoom.id);
    let me = players.find((player) => player.player_key_hash === browserKeyHash) || null;

    if (!me) {
      if (players.some((player) => player.role === 'guest')) return json(409, { error: 'room_full' }, origin);
      const joinResult = await admin.from('duel_room_players').insert({
        room_id: activeRoom.id,
        role: 'guest',
        player_key_hash: browserKeyHash,
        player_name: cleanName(body.playerName),
      }).select('id,role').single();
      if (joinResult.error) return json(503, { error: 'join_failed' }, origin);
      me = joinResult.data as Row;

      const playerStateResult = await admin.from('partner_v2_player_state').insert({
        room_id: activeRoom.id,
        player_id: me.id,
        role: 'guest',
        revision: 1,
        private_state: { firstHypothesis: null, checkpoints: {}, hints: {}, finalDraft: null },
      });
      if (playerStateResult.error) {
        await admin.from('duel_room_players').delete().eq('id', me.id);
        return json(503, { error: 'join_failed' }, origin);
      }
    }

    return json(200, await buildView(admin, activeRoom, browserKeyHash), origin);
  }

  let view = await buildView(admin, activeRoom, browserKeyHash);
  if ((view as any).error === 'not_joined') return json(403, { error: 'not_joined' }, origin);
  if ((view as any).error) return json(503, { error: (view as any).error }, origin);

  if (action === 'status') return json(200, view, origin);

  if (action === 'start') {
    if (!(view as any).bothJoined) return json(409, { error: 'partner_not_joined' }, origin);
    const update = await admin.from('duel_room_players')
      .update({ started_at: new Date().toISOString() })
      .eq('room_id', activeRoom.id)
      .eq('player_key_hash', browserKeyHash)
      .is('started_at', null);
    if (update.error) return json(503, { error: 'start_failed' }, origin);
    return json(200, await buildView(admin, activeRoom, browserKeyHash), origin);
  }

  if (action === 'submit_checkpoint') {
    const checkpointId = String(body.checkpointId || '').trim();
    const clientRevision = Number(body.clientRevision);
    if (!Number.isInteger(clientRevision) || clientRevision < 1) return json(400, { error: 'invalid_revision' }, origin);

    const players = await getPlayers(admin, activeRoom.id);
    const me = players.find((player) => player.player_key_hash === browserKeyHash) || null;
    if (!me) return json(403, { error: 'not_joined' }, origin);
    const role = me.role as PartnerRole;

    if (checkpointId === 'initial_hypothesis') {
      const value = String(body.value || '').trim();
      const rpc = await admin.rpc('partner_v2_submit_initial_hypothesis', {
        p_room_id: activeRoom.id,
        p_player_id: me.id,
        p_role: role,
        p_value: value,
        p_expected_revision: clientRevision,
      });
      if (rpc.error) {
        console.error('partner_v2_initial_checkpoint_failed', rpc.error.code, rpc.error.message);
        return json(503, { error: 'checkpoint_failed' }, origin);
      }
      const result = rpc.data as Row;
      if (!result?.ok) return json(result?.error === 'state_conflict' ? 409 : 400, result || { error: 'checkpoint_failed' }, origin);
      view = await buildView(admin, activeRoom, browserKeyHash);
      return json(200, { ...(view as Row), checkpointResult: { id: checkpointId, correct: true, sharedUnlocked: Boolean(result.initialHypothesesComplete) } }, origin);
    }

    const rules = caseConfig.checkpointRules as unknown as Record<string, any>;
    const rule = rules[checkpointId];
    if (!rule) return json(400, { error: 'unsupported_checkpoint' }, origin);

    const value = body.value ?? null;
    const expected = rule.expected?.[role];
    const isCorrect = matchesExpected(value, expected);

    const rpc = await admin.rpc('partner_v2_submit_gate_checkpoint', {
      p_room_id: activeRoom.id,
      p_player_id: me.id,
      p_role: role,
      p_checkpoint_key: checkpointId,
      p_value: value,
      p_is_correct: isCorrect,
      p_shared_key: rule.sharedKey,
      p_unlock_chapter: rule.unlockChapter,
      p_expected_revision: clientRevision,
    });

    if (rpc.error) {
      console.error('partner_v2_gate_checkpoint_failed', checkpointId, rpc.error.code, rpc.error.message);
      return json(503, { error: 'checkpoint_failed' }, origin);
    }

    const result = rpc.data as Row;
    if (!result?.ok) return json(result?.error === 'state_conflict' ? 409 : 400, result || { error: 'checkpoint_failed' }, origin);

    view = await buildView(admin, activeRoom, browserKeyHash);
    return json(200, {
      ...(view as Row),
      checkpointResult: {
        id: checkpointId,
        correct: Boolean(result.correct),
        sharedUnlocked: Boolean(result.sharedUnlocked),
      },
    }, origin);
  }

  return json(400, { error: 'invalid_action' }, origin);
});
