import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);

const cleanOrigin = (value = '') => value.trim().replace(/\/$/, '');
const allowedOrigin = (origin = '') => !origin || configuredOrigins.includes(cleanOrigin(origin));
const headers = (origin = '') => ({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=300',
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
  return '';
};

const publicReviewKey = (caseId = '') => {
  const value = String(caseId || '').trim();
  if (!value || /^audit_/i.test(value)) return '';
  if (['last_aria', 'last-aria', 'poslednyaya-ariya', 'special:last-aria', 'coop:last-aria'].includes(value)) return 'last_aria';
  if (['solo-407', 'solo_407', 'solo:407'].includes(value)) return 'solo-407';
  if (['coop-407', 'coop_407', 'coop:407', 'special:407'].includes(value)) return 'coop-407';
  if (['coop-2317', 'coop_2317', 'coop:2317', '2317', 'special:2317'].includes(value)) return 'coop-2317';
  return `case:${value}`;
};

const automatedPlayer = (name = '') => /^(?:CI|RG)\b/i.test(String(name || '').trim());
type Proof = { reviewCount: number; ratingTotal: number; playerKeys: Set<string> };

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!allowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: {
        ...headers(origin),
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': 'content-type',
      },
    });
  }
  if (!allowedOrigin(origin)) return json(403, { error: 'origin_not_allowed' });
  if (req.method !== 'GET') return json(405, { error: 'method_not_allowed' }, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const proof = new Map<string, Proof>();
  const ensure = (key: string) => {
    if (!proof.has(key)) proof.set(key, { reviewCount: 0, ratingTotal: 0, playerKeys: new Set() });
    return proof.get(key)!;
  };

  // Public rating is owner-moderated. Pending/rejected reviews and CI audit rows
  // cannot affect either the average stars or the displayed review count.
  const { data: reviews, error: reviewsError } = await admin
    .from('case_reviews')
    .select('case_id,rating')
    .eq('moderation_status', 'approved')
    .limit(10000);
  if (reviewsError) return json(503, { error: 'reviews_read_failed' }, origin);
  for (const row of reviews || []) {
    const key = publicReviewKey(row.case_id);
    const rating = Number(row.rating || 0);
    if (!key || !Number.isInteger(rating) || rating < 1 || rating > 5) continue;
    const item = ensure(key);
    item.reviewCount += 1;
    item.ratingTotal += rating;
  }

  // Clean browser funnel: funnel-analytics.js exits immediately for navigator.webdriver,
  // so these are suitable public completion counts for short cases and Solo 407.
  const { data: funnelCompletions, error: funnelError } = await admin
    .from('site_funnel_events')
    .select('visitor_key_hash,page_path,metadata')
    .eq('event_name', 'game_complete')
    .limit(50000);
  if (funnelError) return json(503, { error: 'funnel_stats_read_failed' }, origin);
  for (const row of funnelCompletions || []) {
    const player = String(row.visitor_key_hash || '');
    if (!player) continue;
    const gameKey = gameKeyFromPath(row.page_path);
    if (gameKey === 'solo-407') {
      ensure(gameKey).playerKeys.add(player);
      continue;
    }
    if (/^\/(?:delo|ru\/cases)\//.test(String(row.page_path || ''))) {
      const caseId = String(row.metadata?.case_id || '').trim();
      const key = publicReviewKey(caseId);
      if (key && key.startsWith('case:')) ensure(key).playerKeys.add(player);
    }
  }

  // Co-op completion is authoritative in duel_room_players. Release gates also complete
  // rooms against production, so CI*/RG* players are explicitly excluded from public proof.
  const { data: rooms, error: roomsError } = await admin
    .from('duel_rooms')
    .select('id,case_path')
    .limit(50000);
  if (roomsError) return json(503, { error: 'room_stats_read_failed' }, origin);
  const roomKey = new Map<string, string>();
  for (const room of rooms || []) {
    const key = gameKeyFromPath(room.case_path);
    if (key) roomKey.set(String(room.id), key);
  }

  if (roomKey.size) {
    const { data: players, error: playersError } = await admin
      .from('duel_room_players')
      .select('room_id,player_key_hash,player_name,completed_at')
      .not('completed_at', 'is', null)
      .limit(50000);
    if (playersError) return json(503, { error: 'coop_stats_read_failed' }, origin);
    for (const row of players || []) {
      const key = roomKey.get(String(row.room_id));
      const player = String(row.player_key_hash || '');
      if (!key || !player || automatedPlayer(row.player_name)) continue;
      ensure(key).playerKeys.add(player);
    }
  }

  const items: Record<string, unknown> = {};
  for (const [key, item] of proof.entries()) {
    items[key] = {
      rating: item.reviewCount ? Math.round((item.ratingTotal / item.reviewCount) * 10) / 10 : null,
      reviewCount: item.reviewCount,
      completedPlayers: item.playerKeys.size,
    };
  }

  return json(200, {
    ok: true,
    moderation: 'approved_only',
    ratingThreshold: 3,
    playerThreshold: 10,
    items,
  }, origin);
});
