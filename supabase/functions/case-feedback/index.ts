import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALLOWED_ORIGINS = new Set([
  'https://mysterylogic.com',
  'https://www.mysterylogic.com',
  'https://valera2872.github.io',
]);
const BROWSER_KEY_RE = /^[a-f0-9]{48}$/;
const CASE_ID_RE = /^[A-Za-z0-9:_-]{3,160}$/;
const DIFFICULTIES = new Set(['too_easy','just_right','too_hard']);
const MORE_INTENTS = new Set(['yes','maybe','no']);
const MODES = new Set(['short','solo','partner','party','ai_text','ai_live','other']);
const LIKED_TAGS = new Set(['story','clues','atmosphere','logic','characters','finale','teamplay','ai']);
const IMPROVE_TAGS = new Set(['navigation','too_hard','too_easy','too_much_text','too_little_text','hints','technical','finale','other']);

const cleanOrigin = (raw: string) => {
  try { return new URL(raw).origin; } catch { return ''; }
};
const allowedOrigin = (origin: string) => ALLOWED_ORIGINS.has(origin) || /^https:\/\/valera2872\.github\.io$/.test(origin);
const cors = (origin: string) => ({
  'access-control-allow-origin': allowedOrigin(origin) ? origin : 'https://mysterylogic.com',
  'access-control-allow-methods': 'POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'vary': 'origin',
});
const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors(origin), 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
};
const tags = (value: unknown, allowed: Set<string>) => Array.isArray(value)
  ? [...new Set(value.map((item) => String(item || '').trim()).filter((item) => allowed.has(item)))].slice(0, 8)
  : [];
const cleanName = (value: unknown) => {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, 80) : null;
};

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    if (!allowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!allowedOrigin(origin)) return json(403, { error: 'origin_not_allowed' }, origin);

  let body: any = {};
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }

  const browserKey = String(body.browserKey || '').trim();
  const caseId = String(body.caseId || '').trim();
  const rating = Number(body.rating);
  const comment = String(body.comment || '').trim().slice(0, 2000);
  const difficultyRaw = String(body.difficulty || '').trim();
  const moreRaw = String(body.moreIntent || '').trim();
  const modeRaw = String(body.experienceMode || '').trim();
  const publicationConsent = body.publicationConsent === true && comment.length >= 5;
  const displayName = publicationConsent ? cleanName(body.displayName) : null;

  if (!BROWSER_KEY_RE.test(browserKey)) return json(400, { error: 'invalid_browser_key' }, origin);
  if (!CASE_ID_RE.test(caseId)) return json(400, { error: 'invalid_case_id' }, origin);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json(400, { error: 'invalid_rating' }, origin);

  const reviewerKeyHash = await sha256(browserKey);
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const now = new Date().toISOString();
  const payload = {
    case_id: caseId,
    reviewer_key_hash: reviewerKeyHash,
    rating,
    comment,
    difficulty: DIFFICULTIES.has(difficultyRaw) ? difficultyRaw : null,
    display_name: displayName,
    publication_consent: publicationConsent,
    moderation_status: 'pending',
    liked_tags: tags(body.likedTags, LIKED_TAGS),
    improve_tags: tags(body.improveTags, IMPROVE_TAGS),
    more_intent: MORE_INTENTS.has(moreRaw) ? moreRaw : null,
    experience_mode: MODES.has(modeRaw) ? modeRaw : 'other',
    feedback_source: 'post_case',
    feedback_version: 2,
    updated_at: now,
  };

  const { data, error } = await admin
    .from('case_reviews')
    .upsert(payload, { onConflict: 'case_id,reviewer_key_hash' })
    .select('id,rating,publication_consent')
    .single();
  if (error || !data?.id) return json(503, { error: 'feedback_save_failed' }, origin);

  return json(200, {
    ok: true,
    feedbackSaved: true,
    reviewCandidate: Boolean(data.publication_consent),
  }, origin);
});
