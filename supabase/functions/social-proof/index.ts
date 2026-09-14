import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((v) => v.trim().replace(/\/$/, '')).filter(Boolean);

const cleanOrigin = (v = '') => v.trim().replace(/\/$/, '');
const allowedOrigin = (origin = '') => !origin || ORIGINS.includes(cleanOrigin(origin));
const headers = (origin = '') => ({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=30',
  'vary': 'Origin',
  ...(origin && allowedOrigin(origin) ? { 'access-control-allow-origin': cleanOrigin(origin) } : {}),
});
const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), { status, headers: headers(origin) });

const gameKeyFromPath = (raw = '') => {
  const path = String(raw || '').replace(/\?.*$/, '').replace(/\/$/, '') + '/';
  if (path === '/detektivnye-igry-dlya-odnogo/407/') return 'solo-407';
  if (path === '/detektivnye-igry-dlya-dvoih/2317/') return 'coop-2317';
  if (path === '/detektivnye-igry-dlya-dvoih/407/') return 'coop-407';
  if (path === '/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/') return 'last_aria';
  if (path === '/detektivnaya-igra-s-ii/' || path === '/ai-investigation/') return 'case:ai:01';
  return '';
};

const publicKey = (caseId = '') => {
  const value = String(caseId || '').trim();
  if (!value || /^audit_/i.test(value)) return '';
  if (['last_aria','last-aria','poslednyaya-ariya','special:last-aria','coop:last-aria'].includes(value)) return 'last_aria';
  if (['solo-407','solo_407','solo:407'].includes(value)) return 'solo-407';
  if (['coop-407','coop_407','coop:407','special:407'].includes(value)) return 'coop-407';
  if (['coop-2317','coop_2317','coop:2317','2317','special:2317'].includes(value)) return 'coop-2317';
  return `case:${value}`;
};

const automatedPlayer = (name = '') => /^(?:CI|RG)\b/i.test(String(name || '').trim());

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!allowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: { ...headers(origin), 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'content-type' } });
  }
  if (!allowedOrigin(origin)) return json(403, { error: 'origin_not_allowed' });
  if (req.method !== 'GET') return json(405, { error: 'method_not_allowed' }, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const players = new Map<string, Set<string>>();
  const ensure = (key: string) => {
    if (!players.has(key)) players.set(key, new Set());
    return players.get(key)!;
  };

  const { data: funnel, error: funnelError } = await admin
    .from('site_funnel_events')
    .select('visitor_key_hash,page_path,metadata')
    .eq('event_name', 'game_complete')
    .limit(50000);
  if (funnelError) return json(503, { error: 'funnel_stats_read_failed' }, origin);

  for (const row of funnel || []) {
    const player = String(row.visitor_key_hash || '');
    if (!player) continue;
    const big = gameKeyFromPath(row.page_path);
    if (big === 'solo-407' || big === 'case:ai:01') {
      ensure(big).add(player);
      continue;
    }
    if (/^\/(?:delo|ru\/cases)\//.test(String(row.page_path || ''))) {
      const key = publicKey(String(row.metadata?.case_id || ''));
      if (key && key.startsWith('case:')) ensure(key).add(player);
    }
  }

  const { data: rooms, error: roomsError } = await admin.from('duel_rooms').select('id,case_path').limit(50000);
  if (roomsError) return json(503, { error: 'room_stats_read_failed' }, origin);
  const roomKey = new Map<string, string>();
  for (const room of rooms || []) {
    const key = gameKeyFromPath(room.case_path);
    if (key) roomKey.set(String(room.id), key);
  }

  if (roomKey.size) {
    const { data: roomPlayers, error: playersError } = await admin
      .from('duel_room_players')
      .select('room_id,player_key_hash,player_name,completed_at')
      .not('completed_at', 'is', null)
      .limit(50000);
    if (playersError) return json(503, { error: 'coop_stats_read_failed' }, origin);
    for (const row of roomPlayers || []) {
      const key = roomKey.get(String(row.room_id));
      const player = String(row.player_key_hash || '');
      if (!key || !player || automatedPlayer(row.player_name)) continue;
      ensure(key).add(player);
    }
  }

  const items: Record<string, unknown> = {};
  for (const [key, set] of players.entries()) {
    items[key] = {
      rating: null,
      ratingCount: 0,
      reviewCount: 0,
      completedPlayers: set.size,
      reviews: [],
    };
  }

  return json(200, {
    ok: true,
    publicRatingsEnabled: false,
    ratingPolicy: 'private_pending_moderation',
    reviewPolicy: 'private_pending_moderation',
    playerThreshold: 1,
    items,
  }, origin);
});
