import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);
const BROWSER_RE = /^[a-f0-9]{48}$/;
const CASE_RE = /^[A-Za-z0-9:_-]{3,160}$/;
const DIFFICULTIES = new Set(['too_easy', 'just_right', 'too_hard']);
const INTEREST = new Set(['yes', 'maybe', 'no']);
const LIKE = new Set(['plot', 'evidence', 'logic', 'atmosphere', 'characters', 'finale']);
const DISLIKE = new Set(['too_easy', 'too_hard', 'navigation', 'too_much_text', 'hints', 'finale', 'technical', 'nothing']);
const encoder = new TextEncoder();

function clean(value: unknown, max = 2000) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}
function cleanText(value: unknown, max = 2000) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max)
    : '';
}
function list(value: unknown, allowed: Set<string>, max = 8) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => clean(v, 40)).filter((v) => allowed.has(v)))].slice(0, max);
}
function safeContext(value: unknown) {
  const src = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const out: Record<string, string> = {};
  for (const key of ['mode', 'path', 'version']) {
    const v = clean(src[key], key === 'path' ? 240 : 80);
    if (v) out[key] = v;
  }
  return out;
}
function originOf(req: Request) { return (req.headers.get('origin') || '').trim().replace(/\/$/, ''); }
function allowed(origin: string) { return Boolean(origin) && ORIGINS.includes(origin); }
function cors(origin: string) {
  return {
    ...(allowed(origin) ? { 'access-control-allow-origin': origin } : {}),
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-max-age': '600',
    'vary': 'Origin',
  };
}
function json(status: number, body: unknown, origin = '') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cors(origin) },
  });
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  const origin = originOf(req);
  if (req.method === 'OPTIONS') return allowed(origin) ? new Response(null, { status: 204, headers: cors(origin) }) : new Response(null, { status: 403 });
  if (!allowed(origin)) return json(403, { error: 'origin_not_allowed' });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }

  const browserKey = clean(body.browserKey, 64);
  const caseId = clean(body.caseId, 160);
  const rating = Number(body.rating);
  const difficultyRaw = clean(body.difficulty, 40);
  const moreRaw = clean(body.moreCasesInterest, 20);
  const comment = cleanText(body.comment, 2000);
  const displayName = clean(body.displayName, 80) || null;
  const publicationConsent = body.publicationConsent === true;
  const likedTags = list(body.likedTags, LIKE, 6);
  let dislikedTags = list(body.dislikedTags, DISLIKE, 8);
  if (dislikedTags.includes('nothing')) dislikedTags = ['nothing'];
  const difficulty = DIFFICULTIES.has(difficultyRaw) ? difficultyRaw : null;
  const moreCasesInterest = INTEREST.has(moreRaw) ? moreRaw : null;

  if (!BROWSER_RE.test(browserKey)) return json(400, { error: 'invalid_browser_key' }, origin);
  if (!CASE_RE.test(caseId)) return json(400, { error: 'invalid_case_id' }, origin);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json(400, { error: 'invalid_rating' }, origin);
  if (comment.length > 2000) return json(400, { error: 'feedback_too_long' }, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const reviewerKeyHash = await sha256(browserKey);
  const now = new Date().toISOString();
  const payload = {
    case_id: caseId,
    reviewer_key_hash: reviewerKeyHash,
    rating,
    comment,
    difficulty,
    display_name: displayName,
    publication_consent: publicationConsent,
    moderation_status: 'pending',
    moderation_note: null,
    moderated_at: null,
    liked_tags: likedTags,
    disliked_tags: dislikedTags,
    more_cases_interest: moreCasesInterest,
    feedback_context: safeContext(body.context),
    feedback_version: 'v2',
    updated_at: now,
  };
  const { data, error } = await admin.from('case_reviews')
    .upsert(payload, { onConflict: 'case_id,reviewer_key_hash' })
    .select('id').single();
  if (error || !data?.id) {
    console.error('player_feedback_save_failed', error?.code, error?.message);
    return json(503, { error: 'feedback_save_failed' }, origin);
  }

  return json(200, {
    ok: true,
    feedbackSaved: true,
    ratingPublishedToAggregate: true,
    publicationRequested: publicationConsent,
    feedbackVersion: 'v2',
  }, origin);
});
