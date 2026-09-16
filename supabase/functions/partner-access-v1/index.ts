import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  adminClient,
  cleanOrigin,
  corsHeaders,
  isAllowedOrigin,
  json,
  sha256,
  validAccessToken,
} from '../_shared/last-aria-payment.ts';
import {
  PARTNER_PRICE_RUB,
  PARTNER_PRODUCT_ID,
  partnerEntitlementUsable,
} from '../_shared/partner-commerce.ts';
import { createInitialFullPartnerState } from '../_shared/partner-engine-v2-secure.ts';
import {
  FULL_PARTNER_CASE_ID,
  FULL_PARTNER_CASE_PATH,
  FULL_PARTNER_CASE_TITLE,
} from '../_shared/partner-ne-publikovat-content-v2.ts';

const PUBLIC_SITE_ORIGIN = (Deno.env.get('PUBLIC_SITE_ORIGIN') || 'https://mysterylogic.com').replace(/\/$/, '');
const PARTNER_PUBLIC_PATH = '/detektivnye-igry-dlya-dvoih/ne-publikovat/';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const BROWSER_KEY_RE = /^[a-f0-9]{48}$/;
const ROOM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(CODE_LENGTH)))
  .map((value) => CODE_ALPHABET[value % CODE_ALPHABET.length])
  .join('');

const cleanName = (value: unknown) => {
  const text = String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 32);
  return text || 'Следователь';
};

const entitlementForToken = async (admin: any, accessToken: string) => {
  const tokenHash = await sha256(accessToken);
  const { data, error } = await admin
    .from('access_entitlements')
    .select('id,token_hash,product_id,status,starts_at,expires_at,revoked_at,metadata')
    .eq('token_hash', tokenHash)
    .eq('product_id', PARTNER_PRODUCT_ID)
    .maybeSingle();
  if (error) throw new Error('partner_access_lookup_failed');
  if (!partnerEntitlementUsable(data)) throw new Error('partner_access_required');
  return data;
};

const loadRoom = async (admin: any, roomId: string) => {
  const { data, error } = await admin.from('duel_rooms')
    .select('id,code,case_id,case_title,case_path,status,created_at,expires_at')
    .eq('id', roomId)
    .maybeSingle();
  if (error) throw new Error('partner_room_lookup_failed');
  return data;
};

const loadPlayers = async (admin: any, roomId: string) => {
  const { data, error } = await admin.from('duel_room_players')
    .select('id,role,player_key_hash,player_name,joined_at,started_at,completed_at')
    .eq('room_id', roomId)
    .order('role', { ascending: true });
  if (error) throw new Error('partner_players_lookup_failed');
  return data || [];
};

const buildRoomView = async (admin: any, room: any, browserHash: string) => {
  const players = await loadPlayers(admin, room.id);
  const me = players.find((player: any) => player.player_key_hash === browserHash) || null;
  if (!me || me.role !== 'creator') throw new Error('partner_owner_restore_failed');
  const guest = players.find((player: any) => player.role === 'guest') || null;
  return {
    ok: true,
    entitled: true,
    productId: PARTNER_PRODUCT_ID,
    priceRub: PARTNER_PRICE_RUB,
    room: {
      code: room.code,
      caseId: room.case_id,
      caseTitle: room.case_title,
      casePath: room.case_path,
      createdAt: room.created_at,
      expiresAt: room.expires_at,
      roomUrl: `${PUBLIC_SITE_ORIGIN}${PARTNER_PUBLIC_PATH}?room=${room.code}`,
    },
    me: {
      role: 'creator',
      name: me.player_name,
      started: Boolean(me.started_at),
      completed: Boolean(me.completed_at),
    },
    opponent: guest ? {
      joined: true,
      role: 'guest',
      name: guest.player_name,
      started: Boolean(guest.started_at),
      completed: Boolean(guest.completed_at),
    } : { joined: false, started: false, completed: false },
    bothJoined: Boolean(guest),
  };
};

const findBoundRoom = async (admin: any, entitlementId: string) => {
  const { data: states, error } = await admin.from('partner_room_states')
    .select('room_id,case_id,revision,updated_at')
    .eq('entitlement_id', entitlementId)
    .eq('case_id', FULL_PARTNER_CASE_ID)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (error) throw new Error('partner_state_lookup_failed');
  if (!states?.length) return null;
  return await loadRoom(admin, states[0].room_id);
};

const restoreOwner = async (admin: any, room: any, browserHash: string, playerName: string) => {
  const players = await loadPlayers(admin, room.id);
  const creator = players.find((player: any) => player.role === 'creator');
  const guest = players.find((player: any) => player.role === 'guest');
  if (!creator) throw new Error('partner_owner_missing');
  if (guest?.player_key_hash === browserHash) throw new Error('partner_browser_key_conflict');

  const expiresAt = new Date(Date.now() + ROOM_TTL_MS).toISOString();
  const { error: roomError } = await admin.from('duel_rooms').update({
    status: 'active',
    expires_at: expiresAt,
    creator_key_hash: browserHash,
  }).eq('id', room.id);
  if (roomError) throw new Error('partner_room_restore_failed');

  const { error: playerError } = await admin.from('duel_room_players').update({
    player_key_hash: browserHash,
    player_name: playerName,
  }).eq('id', creator.id);
  if (playerError) throw new Error('partner_owner_restore_failed');

  return { ...room, status: 'active', expires_at: expiresAt };
};

const createPaidRoom = async (admin: any, entitlementId: string, browserHash: string, playerName: string) => {
  const expiresAt = new Date(Date.now() + ROOM_TTL_MS).toISOString();
  let room: any = null;
  for (let attempt = 0; attempt < 7 && !room; attempt += 1) {
    const { data, error } = await admin.from('duel_rooms').insert({
      code: makeCode(),
      case_id: FULL_PARTNER_CASE_ID,
      case_title: FULL_PARTNER_CASE_TITLE,
      case_path: FULL_PARTNER_CASE_PATH,
      creator_key_hash: browserHash,
      expires_at: expiresAt,
    }).select('id,code,case_id,case_title,case_path,status,created_at,expires_at').single();
    if (!error) room = data;
    else if (error.code !== '23505') throw new Error('partner_room_create_failed');
  }
  if (!room) throw new Error('partner_room_create_failed');

  const { error: playerError } = await admin.from('duel_room_players').insert({
    room_id: room.id,
    role: 'creator',
    player_key_hash: browserHash,
    player_name: playerName,
  });
  if (playerError) {
    await admin.from('duel_rooms').delete().eq('id', room.id);
    throw new Error('partner_room_create_failed');
  }

  const { error: stateError } = await admin.from('partner_room_states').insert({
    room_id: room.id,
    case_id: FULL_PARTNER_CASE_ID,
    entitlement_id: entitlementId,
    state: createInitialFullPartnerState(),
    revision: 0,
  });
  if (stateError) {
    await admin.from('duel_rooms').delete().eq('id', room.id);
    throw new Error('partner_state_create_failed');
  }
  return room;
};

const errorStatus = (code: string) => {
  if (code === 'partner_access_required') return 403;
  if (['invalid_request', 'partner_browser_key_conflict'].includes(code)) return 400;
  if (code.endsWith('_lookup_failed') || code.endsWith('_create_failed') || code.endsWith('_restore_failed') || code === 'partner_owner_missing') return 503;
  return 400;
};

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!isAllowedOrigin(origin)) return json(403, { error: 'origin_not_allowed' });

  const accessToken = (req.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
  if (!validAccessToken(accessToken)) return json(401, { error: 'access_token_required' }, origin);

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_request' }, origin); }
  const action = String(body.action || 'STATUS').trim().toUpperCase();

  try {
    const admin = adminClient();
    const entitlement = await entitlementForToken(admin, accessToken);
    let room = await findBoundRoom(admin, entitlement.id);

    if (action === 'STATUS') {
      return json(200, {
        ok: true,
        entitled: true,
        entitlementId: entitlement.id,
        productId: PARTNER_PRODUCT_ID,
        priceRub: PARTNER_PRICE_RUB,
        room: room ? {
          code: room.code,
          active: room.status === 'active' && new Date(room.expires_at).getTime() > Date.now(),
          expiresAt: room.expires_at,
        } : null,
      }, origin);
    }

    if (action !== 'CREATE_OR_RESUME') return json(400, { error: 'invalid_request' }, origin);
    const browserKey = String(body.browserKey || '').trim().toLowerCase();
    if (!BROWSER_KEY_RE.test(browserKey)) return json(400, { error: 'invalid_request' }, origin);
    const browserHash = await sha256(browserKey);
    const playerName = cleanName(body.playerName);
    const restored = Boolean(room);

    if (room) room = await restoreOwner(admin, room, browserHash, playerName);
    else room = await createPaidRoom(admin, entitlement.id, browserHash, playerName);

    return json(200, {
      ...(await buildRoomView(admin, room, browserHash)),
      entitlementId: entitlement.id,
      restored,
    }, origin);
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const code = raw.split(':')[0] || 'partner_access_failed';
    console.error('partner_access_v1_error', raw);
    return json(errorStatus(code), { error: code }, origin);
  }
});
