import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);

const cleanOrigin = (value = '') => value.trim().replace(/\/$/, '');
const allowedOrigin = (origin = '') => !origin || configuredOrigins.includes(cleanOrigin(origin));
const headers = (origin = '') => ({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=60',
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
type PublicReview = {
  rating: number;
  comment: string;
  displayName: string;
  difficulty: string;
  createdAt: string;
};
type Proof = {
  ratingCount: number;
  ratingTotal: number;
  reviewCount: number;
  playerKeys: Set<string>;
  reviews: PublicReview[];
};

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
    if (!proof.has(key)) {
      proof.set(key, {
        ratingCount: 0,
        ratingTotal: 0,
        reviewCount: 0,
        playerKeys: new Set(),
        reviews: [],
      });
    }
    return proof.get(key)!;
  };

  // Rating and text publication are deliberately separate contracts.
  // Every genuine v2 player rating can affect the aggregate unless explicitly rejected.
  // A text review is public only after owner moderation AND explicit publication consent.
  // audit_* rows and the legacy v1 QA corpus are excluded from both public surfaces.
  const { data: feedback, error: feedbackError } = await admin
    .from('case_reviews')
    .select('case_id,rating,comment,difficulty,display_name,publication_consent,moderation_status,feedback_version,created_at')
    .eq('feedback_version', 'v2')
    .limit(10000);
  if (feedbackError) return json(503, { error: 'reviews_read_failed' }, origin);

  for (const row of feedback || []) {
    const key = publicReviewKey(row.case_id);
    const rating = Number(row.rating || 0);
    if (!key || !Number.isInteger(rating) || rating < 1 || rating > 5) continue;

    const item = ensure(key);
    if (row.moderation_status !== 'rejected') {
      item.ratingCount += 1;
      item.ratingTotal += rating;
    }

    const comment = String(row.comment || '').trim();
    if (row.moderation_status === 'approved' && row.publication_consent === true && comment) {
      item.reviewCount += 1;
      item.reviews.push({
        rating,
        comment: comment.slice(0, 2000),
        displayName: String(row.display_name || '').trim().slice(0, 80),
        difficulty: String(row.difficulty || '').trim().slice(0, 40),
        createdAt: String(row.created_at || ''),
      });
    }
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
    const publicReviews = item.reviews
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 3);
    items[key] = {
      rating: item.ratingCount ? Math.round((item.ratingTotal / item.ratingCount) * 10) / 10 : null,
      ratingCount: item.ratingCount,
      reviewCount: item.reviewCount,
      completedPlayers: item.playerKeys.size,
      reviews: publicReviews,
    };
  }

  return json(200, {
    ok: true,
    ratingPolicy: 'genuine_v2_non_rejected',
    reviewPolicy: 'approved_with_publication_consent',
    ratingThreshold: 1,
    playerThreshold: 1,
    items,
  }, origin);
});
