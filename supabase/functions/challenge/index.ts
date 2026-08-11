import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const PUBLIC_SITE_ORIGIN = (Deno.env.get('PUBLIC_SITE_ORIGIN') || 'https://mysterylogic.com').replace(/\/$/, '');
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',')
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

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

const cleanTitle = (value: unknown) => String(value || '')
  .replace(/[\u0000-\u001f\u007f]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .slice(0, 120);

const normalizeCasePath = (value: unknown) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.endsWith('/') ? raw : `${raw}/`;
};

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

const publicChallenge = (row: Record<string, any>) => ({
  code: row.code,
  caseId: row.case_id,
  caseTitle: row.case_title,
  casePath: row.case_path,
  challenger: {
    name: row.challenger_name,
    elapsedSeconds: row.challenger_elapsed_seconds,
    hintsUsed: row.challenger_hints_used,
    attempts: row.challenger_attempts,
    firstAnswerCorrect: row.challenger_first_answer_correct,
  },
  createdAt: row.created_at,
  expiresAt: row.expires_at,
});

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
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-max-age': '600',
        'vary': 'Origin',
      },
    });
  }

  if (!allowedOrigin) return json(403, { error: 'origin_not_allowed' });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'service_not_configured' }, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === 'GET') {
    const challengeCode = new URL(req.url).searchParams.get('code')?.trim().toUpperCase() || '';
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(challengeCode)) return json(400, { error: 'invalid_code' }, origin);

    const { data, error } = await admin
      .from('challenges')
      .select('code,case_id,case_title,case_path,challenger_name,challenger_elapsed_seconds,challenger_hints_used,challenger_attempts,challenger_first_answer_correct,created_at,expires_at,status')
      .eq('code', challengeCode)
      .maybeSingle();

    if (error) {
      console.error('challenge_lookup_failed', error.code, error.message);
      return json(503, { error: 'challenge_lookup_failed' }, origin);
    }
    if (!data) return json(404, { error: 'challenge_not_found' }, origin);
    if (data.status !== 'active') return json(410, { error: 'challenge_inactive' }, origin);
    if (new Date(data.expires_at).getTime() <= Date.now()) return json(410, { error: 'challenge_expired' }, origin);

    return json(200, { ok: true, ...publicChallenge(data) }, origin);
  }

  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' }, origin);
  }

  const action = String(body.action || '');
  const browserKey = String(body.browserKey || '').trim();
  if (!/^[a-f0-9]{48}$/.test(browserKey)) return json(400, { error: 'invalid_browser_key' }, origin);
  const browserKeyHash = await sha256(browserKey);

  if (action === 'create') {
    const caseId = String(body.caseId || '').trim();
    const caseTitle = cleanTitle(body.caseTitle);
    const casePath = normalizeCasePath(body.casePath);
    const challengerName = cleanName(body.challengerName);
    const stats = statsFrom(body);

    if (!/^[a-zA-Z0-9_:-]{3,160}$/.test(caseId)) return json(400, { error: 'invalid_case_id' }, origin);
    if (!caseTitle) return json(400, { error: 'invalid_case_title' }, origin);
    if (!/^\/(?:delo|ru\/cases)\/[a-z0-9-]+\/$/.test(casePath)) return json(400, { error: 'invalid_case_path' }, origin);
    if (!stats) return json(400, { error: 'invalid_stats' }, origin);

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const hourResult = await admin
      .from('challenges')
      .select('id', { count: 'exact', head: true })
      .eq('creator_key_hash', browserKeyHash)
      .gte('created_at', hourAgo);
    if (hourResult.error) {
      console.error('challenge_rate_hour_failed', hourResult.error.code, hourResult.error.message);
      return json(503, { error: 'rate_check_failed' }, origin);
    }

    const dayResult = await admin
      .from('challenges')
      .select('id', { count: 'exact', head: true })
      .eq('creator_key_hash', browserKeyHash)
      .gte('created_at', dayAgo);
    if (dayResult.error) {
      console.error('challenge_rate_day_failed', dayResult.error.code, dayResult.error.message);
      return json(503, { error: 'rate_check_failed' }, origin);
    }

    if ((hourResult.count || 0) >= 12 || (dayResult.count || 0) >= 40) {
      return json(429, { error: 'challenge_rate_limited' }, origin);
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    let inserted: Record<string, any> | null = null;

    for (let attempt = 0; attempt < 6 && !inserted; attempt += 1) {
      const challengeCode = makeCode();
      const { data, error } = await admin
        .from('challenges')
        .insert({
          code: challengeCode,
          case_id: caseId,
          case_title: caseTitle,
          case_path: casePath,
          challenger_name: challengerName,
          challenger_elapsed_seconds: stats.elapsedSeconds,
          challenger_hints_used: stats.hintsUsed,
          challenger_attempts: stats.attempts,
          challenger_first_answer_correct: stats.firstAnswerCorrect,
          creator_key_hash: browserKeyHash,
          expires_at: expiresAt,
        })
        .select('code,case_id,case_title,case_path,challenger_name,challenger_elapsed_seconds,challenger_hints_used,challenger_attempts,challenger_first_answer_correct,created_at,expires_at,status')
        .single();

      if (!error) inserted = data;
      else if (error.code !== '23505') {
        console.error('challenge_create_failed', error.code, error.message);
        return json(503, { error: 'challenge_create_failed' }, origin);
      }
    }

    if (!inserted) return json(503, { error: 'challenge_code_generation_failed' }, origin);

    return json(201, {
      ok: true,
      ...publicChallenge(inserted),
      shareUrl: `${PUBLIC_SITE_ORIGIN}/challenge/?c=${inserted.code}`,
    }, origin);
  }

  if (action === 'complete') {
    const challengeCode = String(body.code || '').trim().toUpperCase();
    const stats = statsFrom(body);
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(challengeCode)) return json(400, { error: 'invalid_code' }, origin);
    if (!stats) return json(400, { error: 'invalid_stats' }, origin);

    const { data: challenge, error: challengeError } = await admin
      .from('challenges')
      .select('id,code,case_id,case_title,case_path,challenger_name,challenger_elapsed_seconds,challenger_hints_used,challenger_attempts,challenger_first_answer_correct,created_at,expires_at,status')
      .eq('code', challengeCode)
      .maybeSingle();

    if (challengeError) {
      console.error('challenge_complete_lookup_failed', challengeError.code, challengeError.message);
      return json(503, { error: 'challenge_lookup_failed' }, origin);
    }
    if (!challenge) return json(404, { error: 'challenge_not_found' }, origin);
    if (challenge.status !== 'active') return json(410, { error: 'challenge_inactive' }, origin);
    if (new Date(challenge.expires_at).getTime() <= Date.now()) return json(410, { error: 'challenge_expired' }, origin);

    const { data: player, error: attemptError } = await admin
      .from('challenge_attempts')
      .upsert({
        challenge_id: challenge.id,
        player_key_hash: browserKeyHash,
        elapsed_seconds: stats.elapsedSeconds,
        hints_used: stats.hintsUsed,
        attempts: stats.attempts,
        first_answer_correct: stats.firstAnswerCorrect,
      }, { onConflict: 'challenge_id,player_key_hash' })
      .select('elapsed_seconds,hints_used,attempts,first_answer_correct,completed_at')
      .single();

    if (attemptError) {
      console.error('challenge_result_failed', attemptError.code, attemptError.message);
      return json(503, { error: 'challenge_result_failed' }, origin);
    }

    return json(200, {
      ok: true,
      challenger: publicChallenge(challenge).challenger,
      player: {
        elapsedSeconds: player.elapsed_seconds,
        hintsUsed: player.hints_used,
        attempts: player.attempts,
        firstAnswerCorrect: player.first_answer_correct,
        completedAt: player.completed_at,
      },
    }, origin);
  }

  return json(400, { error: 'invalid_action' }, origin);
});
