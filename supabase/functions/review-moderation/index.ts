import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const origins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);

const cleanOrigin = (value = '') => value.trim().replace(/\/$/, '');
const allowed = (origin = '') => !origin || origins.includes(cleanOrigin(origin));
const cors = (origin = '') => ({
  ...(origin && allowed(origin) ? { 'access-control-allow-origin': cleanOrigin(origin) } : {}),
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-max-age': '600',
  'vary': 'Origin',
});
const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    ...cors(origin),
  },
});
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes))
  .map((value) => value.toString(16).padStart(2, '0')).join('');
const sha256 = async (value: string) => hex(await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(value),
));
const adminClient = () => createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function authorize(req: Request, admin: any) {
  const raw = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!/^MLADM-[A-Za-z0-9_-]{30,100}$/.test(raw)) return false;
  const tokenHash = await sha256(raw);
  const { data, error } = await admin
    .from('review_moderation_access')
    .select('id,active')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error || !data?.active) return false;
  await admin
    .from('review_moderation_access')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);
  return true;
}

const summarizeFunnel = (events: any[]) => {
  const byEvent: Record<string, number> = {};
  const byPage: Record<string, Record<string, number>> = {};
  const sessions = new Map<string, Set<string>>();

  for (const row of events) {
    byEvent[row.event_name] = (byEvent[row.event_name] || 0) + 1;
    byPage[row.page_group] ||= {};
    byPage[row.page_group][row.event_name] = (byPage[row.page_group][row.event_name] || 0) + 1;
    if (!sessions.has(row.session_key_hash)) sessions.set(row.session_key_hash, new Set());
    sessions.get(row.session_key_hash)!.add(row.event_name);
  }

  let sessionsWithAction = 0;
  let sessionsWithoutAction = 0;
  let completedSessions = 0;
  for (const eventNames of sessions.values()) {
    if (
      eventNames.has('game_accept') ||
      eventNames.has('game_open') ||
      eventNames.has('format_choice') ||
      eventNames.has('primary_action')
    ) sessionsWithAction += 1;
    else sessionsWithoutAction += 1;
    if (eventNames.has('game_complete')) completedSessions += 1;
  }

  return {
    sessions: sessions.size,
    sessionsWithAction,
    sessionsWithoutAction,
    completedSessions,
    byEvent,
    byPage,
  };
};

const hasFeedbackContext = (value: unknown) => Boolean(
  value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length,
);
const safeTags = (value: unknown) => Array.isArray(value)
  ? value.filter((item) => typeof item === 'string').slice(0, 12)
  : [];
const genuineFeedback = (row: any) => {
  const caseId = String(row?.case_id || '');
  return Boolean(
    caseId &&
    !caseId.startsWith('audit_review_pr_') &&
    !caseId.startsWith('ci:') &&
    hasFeedbackContext(row?.feedback_context),
  );
};
const publicFeedbackRow = (row: any) => ({
  id: row.id,
  case_id: row.case_id,
  rating: Number(row.rating || 0),
  comment: String(row.comment || ''),
  difficulty: row.difficulty || null,
  display_name: row.display_name || null,
  publication_consent: Boolean(row.publication_consent),
  moderation_status: row.moderation_status || 'pending',
  liked_tags: safeTags(row.liked_tags),
  disliked_tags: safeTags(row.disliked_tags),
  more_cases_interest: row.more_cases_interest || null,
  feedback_context: hasFeedbackContext(row.feedback_context) ? {
    mode: String(row.feedback_context?.mode || '').slice(0, 80) || null,
    path: String(row.feedback_context?.path || '').slice(0, 240) || null,
    version: String(row.feedback_context?.version || '').slice(0, 80) || null,
  } : {},
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const summarizeFeedback = (rows: any[]) => {
  const stars: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  const difficulty: Record<string, number> = { too_easy: 0, just_right: 0, too_hard: 0, unknown: 0 };
  const moreCases: Record<string, number> = { yes: 0, maybe: 0, no: 0, unknown: 0 };
  const liked: Record<string, number> = {};
  const disliked: Record<string, number> = {};
  const byCase = new Map<string, any>();
  let ratingSum = 0;

  for (const row of rows) {
    const rating = Math.max(1, Math.min(5, Number(row.rating || 0)));
    stars[String(rating)] = (stars[String(rating)] || 0) + 1;
    ratingSum += rating;
    const d = ['too_easy', 'just_right', 'too_hard'].includes(String(row.difficulty)) ? String(row.difficulty) : 'unknown';
    difficulty[d] = (difficulty[d] || 0) + 1;
    const more = ['yes', 'maybe', 'no'].includes(String(row.more_cases_interest)) ? String(row.more_cases_interest) : 'unknown';
    moreCases[more] = (moreCases[more] || 0) + 1;
    for (const tag of safeTags(row.liked_tags)) liked[tag] = (liked[tag] || 0) + 1;
    for (const tag of safeTags(row.disliked_tags)) disliked[tag] = (disliked[tag] || 0) + 1;

    const caseId = String(row.case_id || 'unknown');
    if (!byCase.has(caseId)) byCase.set(caseId, {
      caseId,
      mode: String(row.feedback_context?.mode || 'unknown'),
      responses: 0,
      ratingSum: 0,
      wantMoreYes: 0,
      disliked: {},
      latestAt: null,
    });
    const item = byCase.get(caseId)!;
    item.responses += 1;
    item.ratingSum += rating;
    if (more === 'yes') item.wantMoreYes += 1;
    for (const tag of safeTags(row.disliked_tags)) item.disliked[tag] = (item.disliked[tag] || 0) + 1;
    if (!item.latestAt || new Date(row.updated_at).getTime() > new Date(item.latestAt).getTime()) item.latestAt = row.updated_at;
  }

  const sortedTags = (source: Record<string, number>) => Object.entries(source)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
  const cases = [...byCase.values()].map((item) => {
    const topProblem = sortedTags(item.disliked)[0] || null;
    return {
      caseId: item.caseId,
      mode: item.mode,
      responses: item.responses,
      averageRating: Number((item.ratingSum / item.responses).toFixed(2)),
      wantMoreYes: item.wantMoreYes,
      wantMoreRate: item.responses ? Math.round((item.wantMoreYes / item.responses) * 100) : 0,
      topProblem,
      latestAt: item.latestAt,
    };
  }).sort((a, b) => b.responses - a.responses || b.averageRating - a.averageRating);

  const answeredMore = moreCases.yes + moreCases.maybe + moreCases.no;
  return {
    responses: rows.length,
    averageRating: rows.length ? Number((ratingSum / rows.length).toFixed(2)) : null,
    stars,
    difficulty,
    moreCases,
    wantMoreYesRate: answeredMore ? Math.round((moreCases.yes / answeredMore) * 100) : null,
    liked: sortedTags(liked),
    disliked: sortedTags(disliked),
    cases,
  };
};

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    return allowed(origin)
      ? new Response(null, { status: 204, headers: cors(origin) })
      : new Response(null, { status: 403 });
  }
  if (!allowed(origin)) return json(403, { error: 'origin_not_allowed' });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  const admin = adminClient();
  if (!(await authorize(req, admin))) return json(401, { error: 'unauthorized' }, origin);
  const url = new URL(req.url);

  if (req.method === 'GET') {
    if (url.searchParams.get('mode') === 'funnel') {
      const days = Math.max(1, Math.min(30, Number(url.searchParams.get('days') || 7) || 7));
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const { data, error } = await admin
        .from('site_funnel_events')
        .select('session_key_hash,event_name,page_group,page_path,target,metadata,created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) return json(503, { error: 'funnel_read_failed' }, origin);
      return json(200, {
        ok: true,
        days,
        events: data?.length || 0,
        summary: summarizeFunnel(data || []),
        recent: (data || []).slice(0, 100),
      }, origin);
    }

    if (url.searchParams.get('mode') === 'feedback') {
      const daysRaw = String(url.searchParams.get('days') || '30');
      const days = daysRaw === 'all' ? null : Math.max(1, Math.min(365, Number(daysRaw) || 30));
      const { data, error } = await admin
        .from('case_reviews')
        .select('id,case_id,rating,comment,difficulty,display_name,publication_consent,moderation_status,liked_tags,disliked_tags,more_cases_interest,feedback_context,feedback_version,created_at,updated_at')
        .order('updated_at', { ascending: false })
        .limit(5000);
      if (error) return json(503, { error: 'feedback_read_failed' }, origin);
      const cutoff = days ? Date.now() - days * 86_400_000 : null;
      const genuine = (data || []).filter((row) => genuineFeedback(row) && (!cutoff || new Date(row.updated_at).getTime() >= cutoff));
      const safe = genuine.map(publicFeedbackRow);
      const redFlags = safe.filter((row) =>
        row.rating <= 3 || row.disliked_tags.some((tag: string) => ['technical', 'navigation', 'finale', 'too_hard'].includes(tag)),
      ).slice(0, 80);
      return json(200, {
        ok: true,
        days: days ?? 'all',
        generatedAt: new Date().toISOString(),
        summary: summarizeFeedback(genuine),
        redFlags,
        recent: safe.slice(0, 100),
      }, origin);
    }

    const status = String(url.searchParams.get('status') || 'pending');
    if (!['pending', 'approved', 'rejected', 'all'].includes(status)) {
      return json(400, { error: 'invalid_status' }, origin);
    }

    let query = admin
      .from('case_reviews')
      .select('id,case_id,rating,comment,difficulty,display_name,publication_consent,moderation_status,moderation_note,moderated_at,liked_tags,disliked_tags,more_cases_interest,feedback_context,feedback_version,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (status !== 'all') query = query.eq('moderation_status', status);
    const { data, error } = await query;
    if (error) return json(503, { error: 'reviews_read_failed' }, origin);

    const counts: Record<string, number> = {};
    const { data: countRows } = await admin.from('case_reviews').select('moderation_status');
    for (const row of countRows || []) {
      counts[row.moderation_status] = (counts[row.moderation_status] || 0) + 1;
    }
    return json(200, { ok: true, status, counts, reviews: data || [] }, origin);
  }

  if (req.method === 'POST') {
    let body: any = {};
    try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }
    if (String(body.action || '') !== 'moderate') return json(400, { error: 'invalid_action' }, origin);

    const id = String(body.id || '').trim();
    const status = String(body.status || '').trim();
    const note = String(body.note || '').trim().slice(0, 1000) || null;
    if (!/^[0-9a-f-]{36}$/i.test(id) || !['approved', 'rejected', 'pending'].includes(status)) {
      return json(400, { error: 'invalid_moderation' }, origin);
    }

    const { data, error } = await admin
      .from('case_reviews')
      .update({
        moderation_status: status,
        moderation_note: note,
        moderated_at: status === 'pending' ? null : new Date().toISOString(),
      })
      .eq('id', id)
      .select('id,moderation_status,moderated_at')
      .maybeSingle();
    if (error || !data) return json(503, { error: 'moderation_update_failed' }, origin);
    return json(200, { ok: true, review: data }, origin);
  }

  return json(405, { error: 'method_not_allowed' }, origin);
});
