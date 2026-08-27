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
  if (['last_aria', 'last-aria', 'poslednyaya-ariya'].includes(value)) return 'last_aria';
  if (['solo-407', 'solo_407'].includes(value)) return 'solo-407';
  if (['coop-407', 'coop_407'].includes(value)) return 'coop-407';
  if (['coop-2317', 'coop_2317', '2317'].includes(value)) return 'coop-2317';
  return `case:${value}`;
};

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

  // Ratings are deliberately moderation-gated. Pending/rejected rows and CI audit rows
  // can never affect public stars or public review counts.
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

  // Short cases have immutable one-row-per-browser first-completion records.
  const { data: shortCompletions, error: shortError } = await admin
    .from('case_first_results')
    .select('case_id,player_key_hash')
    .limit(50000);
  if (shortError) return json(503, { error: 'short_stats_read_failed' }, origin);
  for (const row of shortCompletions || []) {
    const key = publicReviewKey(row.case_id);
    const player = String(row.player_key_hash || '');
    if (!key || !player || /^case:audit_/i.test(key)) continue;
    ensure(key).playerKeys.add(player);
  }

  // Long solo/co-op games record completion in the common funnel. Count unique visitors,
  // not page views or button presses, so the public number means completed players.
  const { data: completions, error: completionError } = await admin
    .from('site_funnel_events')
    .select('visitor_key_hash,page_path')
    .eq('event_name', 'game_complete')
    .limit(50000);
  if (completionError) return json(503, { error: 'completion_stats_read_failed' }, origin);
  for (const row of completions || []) {
    const key = gameKeyFromPath(row.page_path);
    const player = String(row.visitor_key_hash || '');
    if (!key || !player) continue;
    ensure(key).playerKeys.add(player);
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
