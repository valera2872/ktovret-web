import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',')
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    'vary': 'Origin',
    ...(origin ? { 'access-control-allow-origin': origin } : {}),
  },
});

const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes))
  .map((value) => value.toString(16).padStart(2, '0'))
  .join('');

const sha256 = async (value: string) => hex(await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(value),
));

const statsFrom = (body: Record<string, unknown>) => {
  const elapsedSeconds = Number(body.elapsedSeconds);
  const hintsUsed = Number(body.hintsUsed);
  const attempts = Number(body.attempts);
  const firstAnswerCorrect = Boolean(body.firstAnswerCorrect);
  if (!Number.isInteger(elapsedSeconds) || elapsedSeconds < 1 || elapsedSeconds > 21600) return null;
  if (!Number.isInteger(hintsUsed) || hintsUsed < 0 || hintsUsed > 10) return null;
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 20) return null;
  return { elapsedSeconds, hintsUsed, attempts, firstAnswerCorrect };
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
        'vary': 'Origin',
      },
    });
  }

  if (!allowedOrigin) return json(403, { error: 'origin_not_allowed' });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' }, origin);
  }

  if (String(body.action || '') !== 'complete') return json(400, { error: 'invalid_action' }, origin);

  const browserKey = String(body.browserKey || '').trim();
  const caseId = String(body.caseId || '').trim();
  const casePathRaw = String(body.casePath || '').trim();
  const casePath = casePathRaw.endsWith('/') ? casePathRaw : `${casePathRaw}/`;
  const stats = statsFrom(body);

  if (!/^[a-f0-9]{48}$/.test(browserKey)) return json(400, { error: 'invalid_browser_key' }, origin);
  if (!/^[a-zA-Z0-9_:-]{3,160}$/.test(caseId)) return json(400, { error: 'invalid_case_id' }, origin);
  if (!/^\/(?:delo|ru\/cases)\/[a-z0-9-]+\/$/.test(casePath)) return json(400, { error: 'invalid_case_path' }, origin);
  if (!stats) return json(400, { error: 'invalid_stats' }, origin);

  const playerKeyHash = await sha256(browserKey);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // First result is immutable. Replays only retrieve the already recorded row.
  const { error: insertError } = await admin
    .from('case_first_results')
    .insert({
      case_id: caseId,
      player_key_hash: playerKeyHash,
      elapsed_seconds: stats.elapsedSeconds,
      hints_used: stats.hintsUsed,
      attempts: stats.attempts,
      first_answer_correct: stats.firstAnswerCorrect,
    });

  if (insertError && insertError.code !== '23505') {
    console.error('case_stats_insert_failed', insertError.code, insertError.message);
    return json(503, { error: 'stats_write_failed' }, origin);
  }

  const { data, error } = await admin.rpc('get_case_first_result_stats', {
    p_case_id: caseId,
    p_player_key_hash: playerKeyHash,
  });

  if (error || !data) {
    console.error('case_stats_read_failed', error?.code, error?.message);
    return json(503, { error: 'stats_read_failed' }, origin);
  }

  return json(200, { ok: true, ...data }, origin);
});
