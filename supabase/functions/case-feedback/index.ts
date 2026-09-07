import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);
const BROWSER_KEY_RE = /^[a-f0-9]{48}$/;
const CASE_ID_RE = /^[A-Za-z0-9:_.-]{2,160}$/;
const KINDS = new Set(['short','premium','ai','custom']);
const MODES = new Set(['solo','partner','party','ai','text','live']);
const DIFFICULTIES = new Set(['too_easy','just_right','too_hard']);
const WANT_MORE = new Set(['yes','maybe','no']);
const LIKED = new Set(['story','evidence','atmosphere','deduction','finale','teamplay','characters','interrogation','pace']);
const IMPROVE = new Set(['unclear_next_step','too_hard','too_easy','need_hints','too_long','too_short','weak_finale','technical_issue']);

const cleanOrigin = (value = '') => String(value || '').trim().replace(/\/$/, '');
const allowedOrigin = (origin = '') => !origin || ALLOWED_ORIGINS.includes(cleanOrigin(origin));
const corsHeaders = (origin = '') => ({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'vary': 'Origin',
  ...(origin && allowedOrigin(origin) ? { 'access-control-allow-origin': cleanOrigin(origin) } : {}),
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
});
const json = (status: number, body: unknown, origin = '') =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
const sha256 = async (value: string) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
};
const optionalText = (value: unknown, max: number) => {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : null;
};
const cleanTags = (value: unknown, allowed: Set<string>) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter((item) => allowed.has(item)))].slice(0, 12);
};
const cleanPath = (value: unknown) => {
  const text = String(value || '').trim();
  if (!text.startsWith('/') || text.length > 300) return null;
  return text.split('?')[0].split('#')[0];
};

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!allowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!allowedOrigin(origin)) return json(403, { error: 'origin_not_allowed' });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  let body: any = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }

  const browserKey = String(body.browserKey || '').trim();
  const caseId = String(body.caseId || '').trim();
  const caseKindRaw = String(body.caseKind || 'custom').trim();
  const modeRaw = String(body.mode || 'solo').trim();
  const rating = Number(body.rating);
  const difficultyRaw = String(body.difficulty || '').trim();
  const wantMoreRaw = String(body.wantMore || '').trim();
  const rawComment = String(body.comment || '').trim();
  const comment = rawComment.slice(0, 2000);
  const displayName = optionalText(body.displayName, 80);
  const likedTags = cleanTags(body.likedTags, LIKED);
  const improvementTags = cleanTags(body.improvementTags, IMPROVE);
  const publicationConsent = body.publicationConsent === true && comment.length > 0;
  const feedbackVersion = Math.max(1, Math.min(20, Number(body.feedbackVersion) || 2));

  if (!BROWSER_KEY_RE.test(browserKey)) return json(400, { error: 'invalid_browser_key' }, origin);
  if (!CASE_ID_RE.test(caseId)) return json(400, { error: 'invalid_case_id' }, origin);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json(400, { error: 'invalid_rating' }, origin);
  if (rawComment.length > 2000) return json(400, { error: 'comment_too_long' }, origin);

  const reviewerKeyHash = await sha256(browserKey);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let completionVerified = false;
  if (caseKindRaw === 'short') {
    const { data: completion } = await admin.from('case_first_results')
      .select('completed_at').eq('case_id', caseId).eq('player_key_hash', reviewerKeyHash).maybeSingle();
    completionVerified = Boolean(completion?.completed_at);
  }

  const row = {
    case_id: caseId,
    reviewer_key_hash: reviewerKeyHash,
    rating,
    comment,
    difficulty: DIFFICULTIES.has(difficultyRaw) ? difficultyRaw : null,
    display_name: displayName,
    publication_consent: publicationConsent,
    moderation_status: 'pending',
    liked_tags: likedTags,
    improvement_tags: improvementTags,
    want_more: WANT_MORE.has(wantMoreRaw) ? wantMoreRaw : null,
    case_kind: KINDS.has(caseKindRaw) ? caseKindRaw : 'custom',
    mode: MODES.has(modeRaw) ? modeRaw : null,
    feedback_version: feedbackVersion,
    source_path: cleanPath(body.sourcePath),
    completion_verified: completionVerified,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin.from('case_reviews')
    .upsert(row, { onConflict: 'case_id,reviewer_key_hash' })
    .select('id,rating,created_at,updated_at')
    .single();
  if (error || !data) return json(503, { error: 'feedback_save_failed' }, origin);

  return json(200, { ok: true, feedbackSaved: true, id: data.id }, origin);
});