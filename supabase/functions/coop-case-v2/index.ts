import { createClient } from 'npm:@supabase/supabase-js@2';
import { ZERO_CONTAINER_CASE } from '../_shared/partner-cases/zero-container.ts';
import { ZERO_CONTAINER_FINAL } from '../_shared/partner-cases/zero-container-final.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const PUBLIC_SITE_ORIGIN = (Deno.env.get('PUBLIC_SITE_ORIGIN') || 'https://mysterylogic.com').replace(/\/$/, '');
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
const BROWSER_KEY_RE = /^[a-f0-9]{48}$/;
const CASE_ID = ZERO_CONTAINER_CASE.id;
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
    vary: 'Origin',
    ...(origin ? { 'access-control-allow-origin': origin } : {}),
  },
});

const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes)).map((value) => value.toString(16).padStart(2, '0')).join('');
const sha256 = async (value: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8))).map((value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('');
const cleanName = (value: unknown) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ').slice(0, 32) || 'Следователь';
const getCase = (caseId: string) => caseId === CASE_ID ? ZERO_CONTAINER_CASE : null;
const allEvidence = () => ({ ...ZERO_CONTAINER_CASE.evidence, ...ZERO_CONTAINER_FINAL.evidence }) as Record<string, any>;
const allCheckpointRules = () => ({ ...ZERO_CONTAINER_CASE.checkpointRules, ...ZERO_CONTAINER_FINAL.checkpointRules }) as Record<string, any>;

const getRoom = async (admin: AdminClient, code: string) => {
  const result = await admin.from('duel_rooms').select(roomSelect).eq('code', code).maybeSingle();
  if (result.error) throw new Error(`room_lookup:${result.error.code}:${result.error.message}`);
  return result.data as Row | null;
};

const roomError = (room: Row | null) => {
  if (!room) return 'room_not_found';
  if (!getCase(room.case_id)) return 'wrong_case';
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

const visibleEvidence = (role: PartnerRole, chapter: number) => Object.values(allEvidence())
  .filter((item: any) => item.role === role && Number(item.chapter) <= chapter)
  .map((item: any) => ({ ...item }));

const checkpointUiForRole = (role: PartnerRole) => ({
  photo_observation: ZERO_CONTAINER_CASE.checkpointUi.photo_observation,
  t04391_link: {
    id: ZERO_CONTAINER_CASE.checkpointUi.t04391_link.id,
    title: ZERO_CONTAINER_CASE.checkpointUi.t04391_link.title,
    lead: ZERO_CONTAINER_CASE.checkpointUi.t04391_link.lead,
    options: ZERO_CONTAINER_CASE.checkpointUi.t04391_link.roleOptions[role],
  },
  physical_operation: {
    id: ZERO_CONTAINER_FINAL.checkpointUi.physical_operation.id,
    title: ZERO_CONTAINER_FINAL.checkpointUi.physical_operation.title,
    lead: ZERO_CONTAINER_FINAL.checkpointUi.physical_operation.lead,
    options: ZERO_CONTAINER_FINAL.checkpointUi.physical_operation.roleOptions[role],
  },
  endpoint_link: {
    id: ZERO_CONTAINER_FINAL.checkpointUi.endpoint_link.id,
    title: ZERO_CONTAINER_FINAL.checkpointUi.endpoint_link.title,
    lead: ZERO_CONTAINER_FINAL.checkpointUi.endpoint_link.lead,
    options: ZERO_CONTAINER_FINAL.checkpointUi.endpoint_link.roleOptions[role],
  },
});

const matchesExpected = (value: unknown, expected: unknown) => {
  if (typeof expected === 'string') return String(value || '') === expected;
  if (!expected || typeof expected !== 'object' || !value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = value as Record<string, unknown>;
  return Object.entries(expected as Record<string, unknown>).every(([key, expectedValue]) => actual[key] === expectedValue);
};

const finalDiff = (a: Record<string, string>, b: Record<string, string>) =>
  ZERO_CONTAINER_FINAL.finalUi.fields
    .filter((field) => String(a[field.id] || '') !== String(b[field.id] || ''))
    .map((field) => ({ field: field.id, label: field.label, mine: a[field.id] || '', partner: b[field.id] || '' }));

const finalContradiction = (answers: Record<string, string>) => {
  const truth = ZERO_CONTAINER_FINAL.finalTruth as Record<string, string>;
  if (answers.method !== truth.method || answers.replacement !== truth.replacement) return 'BODY_IDENTITY_UNEXPLAINED';
  if (answers.place !== truth.place || answers.window !== truth.window) return 'STOP_WINDOW_UNEXPLAINED';
  if (answers.executor !== truth.executor) return 'PHYSICAL_EXECUTION_UNEXPLAINED';
  if (answers.organizer !== truth.organizer) return 'ORGANIZER_LACKS_PREPARATION_ACCESS';
  return '';
};

const evidenceCoverage = (ids: string[]) => {
  const categories = new Set<string>();
  const map = ZERO_CONTAINER_FINAL.evidenceCategories as Record<string, readonly string[]>;
  for (const id of ids) for (const category of map[id] || []) categories.add(category);
  return categories;
};

const missingEvidenceCategory = (ids: string[]) => {
  const coverage = evidenceCoverage(ids);
  return ZERO_CONTAINER_FINAL.requiredEvidenceCategories.find((category) => !coverage.has(category)) || '';
};

const validateOwnEvidence = (role: PartnerRole, ids: unknown, chapter: number) => {
  if (!Array.isArray(ids)) return null;
  const unique = [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))];
  const allowed = new Set(visibleEvidence(role, chapter).map((item: any) => item.id));
  if (unique.length < ZERO_CONTAINER_FINAL.finalUi.minEvidencePerPlayer) return null;
  if (unique.some((id) => !allowed.has(id))) return null;
  return unique;
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
  const chapters = [...Object.values(caseConfig.chapters), ZERO_CONTAINER_FINAL.chapter5, ZERO_CONTAINER_FINAL.chapter6];

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
      chapters,
      initialHypothesisOptions: caseConfig.initialHypothesisOptions,
      checkpointUi: checkpointUiForRole(role),
      finalUi: chapter >= 5 ? ZERO_CONTAINER_FINAL.finalUi : null,
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
      finalDraft: privateState.finalDraft || null,
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
        physicalSwapProven: Boolean(sharedState.physicalSwapProven),
        endpoint184Linked: Boolean(sharedState.endpoint184Linked),
        finalConsensus: Boolean(sharedState.finalConsensus),
        finalSolved: Boolean(sharedState.finalSolved),
      },
    },
    evidence: visibleEvidence(role, chapter),
    resolution: sharedState.finalSolved ? ZERO_CONTAINER_FINAL.reveal : null,
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
    const caseId = String(body.caseId || '').trim();
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
        code: makeCode(), case_id: caseConfig.id, case_title: caseConfig.title,
        case_path: caseConfig.path, creator_key_hash: browserKeyHash, expires_at: expiresAt,
      }).select(roomSelect).single();
      if (!result.error) room = result.data as Row;
      else if (result.error.code !== '23505') return json(503, { error: 'room_create_failed' }, origin);
    }
    if (!room) return json(503, { error: 'room_code_generation_failed' }, origin);

    const playerResult = await admin.from('duel_room_players').insert({
      room_id: room.id, role: 'creator', player_key_hash: browserKeyHash, player_name: cleanName(body.playerName),
    }).select('id,role').single();
    if (playerResult.error) {
      await admin.from('duel_rooms').delete().eq('id', room.id);
      return json(503, { error: 'room_create_failed' }, origin);
    }

    const roomStateResult = await admin.from('partner_v2_room_state').insert({
      room_id: room.id, case_id: caseConfig.id, case_version: caseConfig.version, chapter: 1, revision: 1,
      shared_state: {
        initialHypothesesComplete: false,
        photoComparisonSolved: false,
        t04391Linked: false,
        physicalSwapProven: false,
        endpoint184Linked: false,
        finalConsensus: false,
        finalSolved: false,
      },
    });
    const playerStateResult = await admin.from('partner_v2_player_state').insert({
      room_id: room.id, player_id: playerResult.data.id, role: 'creator', revision: 1,
      private_state: { firstHypothesis: null, checkpoints: {}, hints: {}, finalDraft: null },
    });
    if (roomStateResult.error || playerStateResult.error) {
      await admin.from('duel_rooms').delete().eq('id', room.id);
      return json(503, { error: 'room_create_failed' }, origin);
    }
    return json(201, await buildView(admin, room, browserKeyHash), origin);
  }

  const code = String(body.code || '').trim().toUpperCase();
  if (!CODE_RE.test(code)) return json(400, { error: 'invalid_code' }, origin);
  let room: Row | null;
  try { room = await getRoom(admin, code); } catch { return json(503, { error: 'room_lookup_failed' }, origin); }
  const activeError = roomError(room);
  if (activeError) return json(activeError === 'room_not_found' ? 404 : activeError === 'wrong_case' ? 409 : 410, { error: activeError }, origin);
  const activeRoom = room as Row;

  if (action === 'preview') {
    const players = await getPlayers(admin, activeRoom.id);
    const creator = players.find((player) => player.role === 'creator');
    const guest = players.find((player) => player.role === 'guest');
    return json(200, { ok: true, room: { code, caseId: CASE_ID, caseTitle: ZERO_CONTAINER_CASE.title }, creatorName: creator?.player_name || 'Игрок 1', roomFull: Boolean(guest) }, origin);
  }

  if (action === 'join') {
    const players = await getPlayers(admin, activeRoom.id);
    let me = players.find((player) => player.player_key_hash === browserKeyHash) || null;
    if (!me) {
      if (players.some((player) => player.role === 'guest')) return json(409, { error: 'room_full' }, origin);
      const joinResult = await admin.from('duel_room_players').insert({
        room_id: activeRoom.id, role: 'guest', player_key_hash: browserKeyHash, player_name: cleanName(body.playerName),
      }).select('id,role').single();
      if (joinResult.error) return json(503, { error: 'join_failed' }, origin);
      me = joinResult.data as Row;
      const playerStateResult = await admin.from('partner_v2_player_state').insert({
        room_id: activeRoom.id, player_id: me.id, role: 'guest', revision: 1,
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
    const update = await admin.from('duel_room_players').update({ started_at: new Date().toISOString() })
      .eq('room_id', activeRoom.id).eq('player_key_hash', browserKeyHash).is('started_at', null);
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
      const rpc = await admin.rpc('partner_v2_submit_initial_hypothesis', {
        p_room_id: activeRoom.id, p_player_id: me.id, p_role: role,
        p_value: String(body.value || '').trim(), p_expected_revision: clientRevision,
      });
      if (rpc.error) return json(503, { error: 'checkpoint_failed' }, origin);
      const result = rpc.data as Row;
      if (!result?.ok) return json(result?.error === 'state_conflict' ? 409 : 400, result || { error: 'checkpoint_failed' }, origin);
      view = await buildView(admin, activeRoom, browserKeyHash);
      return json(200, { ...(view as Row), checkpointResult: { id: checkpointId, correct: true, sharedUnlocked: Boolean(result.initialHypothesesComplete) } }, origin);
    }

    const rule = allCheckpointRules()[checkpointId];
    if (!rule) return json(400, { error: 'unsupported_checkpoint' }, origin);
    const currentState = await getCaseState(admin, activeRoom.id);
    if (!currentState) return json(503, { error: 'partner_state_missing' }, origin);
    for (const key of rule.requiresShared || []) {
      if (!Boolean(currentState.shared_state?.[key])) return json(409, { error: 'checkpoint_locked', required: key }, origin);
    }

    const value = body.value ?? null;
    const isCorrect = matchesExpected(value, rule.expected?.[role]);
    const rpc = await admin.rpc('partner_v2_submit_gate_checkpoint', {
      p_room_id: activeRoom.id, p_player_id: me.id, p_role: role,
      p_checkpoint_key: checkpointId, p_value: value, p_is_correct: isCorrect,
      p_shared_key: rule.sharedKey, p_unlock_chapter: rule.unlockChapter,
      p_expected_revision: clientRevision,
    });
    if (rpc.error) return json(503, { error: 'checkpoint_failed' }, origin);
    const result = rpc.data as Row;
    if (!result?.ok) return json(result?.error === 'state_conflict' ? 409 : 400, result || { error: 'checkpoint_failed' }, origin);
    view = await buildView(admin, activeRoom, browserKeyHash);
    return json(200, { ...(view as Row), checkpointResult: { id: checkpointId, correct: Boolean(result.correct), sharedUnlocked: Boolean(result.sharedUnlocked) } }, origin);
  }

  if (action === 'submit_final') {
    const clientRevision = Number(body.clientRevision);
    if (!Number.isInteger(clientRevision) || clientRevision < 1) return json(400, { error: 'invalid_revision' }, origin);
    const state = await getCaseState(admin, activeRoom.id);
    if (!state || Number(state.chapter) < 5) return json(409, { error: 'final_locked' }, origin);
    const players = await getPlayers(admin, activeRoom.id);
    const me = players.find((player) => player.player_key_hash === browserKeyHash) || null;
    if (!me) return json(403, { error: 'not_joined' }, origin);
    const role = me.role as PartnerRole;
    const answers = body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers) ? body.answers as Record<string, string> : null;
    if (!answers) return json(400, { error: 'invalid_final_payload' }, origin);
    const requiredFields = ZERO_CONTAINER_FINAL.finalUi.fields.map((field) => field.id);
    if (requiredFields.some((field) => !String(answers[field] || '').trim())) return json(400, { error: 'final_incomplete' }, origin);
    const ownEvidence = validateOwnEvidence(role, body.evidenceIds, 5);
    if (!ownEvidence) return json(400, { error: 'invalid_final_evidence' }, origin);

    const rpc = await admin.rpc('partner_v2_submit_final_draft', {
      p_room_id: activeRoom.id, p_player_id: me.id, p_role: role,
      p_answers: answers, p_evidence_ids: ownEvidence, p_expected_revision: clientRevision,
    });
    if (rpc.error) return json(503, { error: 'final_save_failed' }, origin);
    const result = rpc.data as Row;
    if (!result?.ok) return json(result?.error === 'state_conflict' ? 409 : 400, result || { error: 'final_save_failed' }, origin);
    if (!result.otherDraft) {
      view = await buildView(admin, activeRoom, browserKeyHash);
      return json(200, { ...(view as Row), finalResult: { status: 'waiting_partner' } }, origin);
    }

    const otherDraft = result.otherDraft as Row;
    if (!result.consensus) {
      view = await buildView(admin, activeRoom, browserKeyHash);
      return json(200, { ...(view as Row), finalResult: { status: 'disagreement', differences: finalDiff(answers, otherDraft.answers || {}) } }, origin);
    }

    const contradiction = finalContradiction(answers);
    if (contradiction) {
      view = await buildView(admin, activeRoom, browserKeyHash);
      return json(200, { ...(view as Row), finalResult: { status: 'contradiction', code: contradiction } }, origin);
    }

    const combinedEvidence = [...new Set([...ownEvidence, ...((otherDraft.evidenceIds || []) as string[])])];
    const missingCategory = missingEvidenceCategory(combinedEvidence);
    if (missingCategory) {
      view = await buildView(admin, activeRoom, browserKeyHash);
      return json(200, { ...(view as Row), finalResult: { status: 'evidence_gap', category: missingCategory } }, origin);
    }

    const solved = await admin.rpc('partner_v2_mark_solved', { p_room_id: activeRoom.id });
    if (solved.error || !solved.data?.ok) return json(503, { error: 'final_resolve_failed' }, origin);
    view = await buildView(admin, activeRoom, browserKeyHash);
    return json(200, { ...(view as Row), finalResult: { status: 'solved' } }, origin);
  }

  return json(400, { error: 'invalid_action' }, origin);
});
