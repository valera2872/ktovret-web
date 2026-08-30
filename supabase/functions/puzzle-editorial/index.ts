import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const LEGACY_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
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

function serviceKey() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS') || '';
  if (modern) {
    try {
      const parsed = JSON.parse(modern);
      if (typeof parsed?.default === 'string' && parsed.default) return parsed.default;
    } catch {}
  }
  return LEGACY_SERVICE_ROLE_KEY;
}
const adminClient = () => createClient(SUPABASE_URL, serviceKey(), {
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

Deno.serve(async (req: Request) => {
  const origin = cleanOrigin(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') {
    return allowed(origin)
      ? new Response(null, { status: 204, headers: cors(origin) })
      : new Response(null, { status: 403 });
  }
  if (!allowed(origin)) return json(403, { error: 'origin_not_allowed' }, origin);
  if (!SUPABASE_URL || !serviceKey()) return json(503, { error: 'service_not_configured' }, origin);

  const admin = adminClient();
  const url = new URL(req.url);

  if (req.method === 'GET' && url.searchParams.get('mode') === 'approved-manifest') {
    const { data, error } = await admin
      .from('puzzle_editorial_queue')
      .select('puzzle_id,kind,content,moderated_at,updated_at')
      .eq('kind', 'quick')
      .eq('moderation_status', 'approved')
      .order('puzzle_id', { ascending: true });
    if (error) return json(503, { error: 'manifest_read_failed' }, origin);
    return json(200, {
      ok: true,
      schemaVersion: 1,
      count: data?.length || 0,
      puzzles: (data || []).map((row: any) => ({
        id: row.puzzle_id,
        content: row.content,
        approvedAt: row.moderated_at,
        updatedAt: row.updated_at,
      })),
    }, origin);
  }

  if (!(await authorize(req, admin))) return json(401, { error: 'unauthorized' }, origin);

  if (req.method === 'GET') {
    const status = String(url.searchParams.get('status') || 'pending');
    if (!['pending', 'approved', 'rejected', 'all'].includes(status)) {
      return json(400, { error: 'invalid_status' }, origin);
    }
    let query = admin
      .from('puzzle_editorial_queue')
      .select('puzzle_id,kind,slug,title,public_route,content,moderation_status,moderation_note,published_before_gate,moderated_at,created_at,updated_at')
      .order('puzzle_id', { ascending: true })
      .limit(500);
    if (status !== 'all') query = query.eq('moderation_status', status);
    const { data, error } = await query;
    if (error) return json(503, { error: 'queue_read_failed' }, origin);

    const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
    const { data: countRows } = await admin.from('puzzle_editorial_queue').select('moderation_status');
    for (const row of countRows || []) counts[row.moderation_status] = (counts[row.moderation_status] || 0) + 1;
    return json(200, { ok: true, status, counts, puzzles: data || [] }, origin);
  }

  if (req.method === 'POST') {
    let body: any = {};
    try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }, origin); }
    if (String(body.action || '') !== 'moderate') return json(400, { error: 'invalid_action' }, origin);

    const id = String(body.id || '').trim();
    const status = String(body.status || '').trim();
    const note = String(body.note || '').trim().slice(0, 1500) || null;
    if (!/^(quick|expert):[A-Za-z0-9_-]+$/.test(id) || !['approved', 'rejected', 'pending'].includes(status)) {
      return json(400, { error: 'invalid_moderation' }, origin);
    }

    const { data, error } = await admin
      .from('puzzle_editorial_queue')
      .update({
        moderation_status: status,
        moderation_note: note,
        moderated_at: status === 'pending' ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('puzzle_id', id)
      .select('puzzle_id,moderation_status,moderation_note,moderated_at,updated_at')
      .maybeSingle();
    if (error || !data) return json(503, { error: 'moderation_update_failed' }, origin);
    return json(200, { ok: true, puzzle: data }, origin);
  }

  return json(405, { error: 'method_not_allowed' }, origin);
});
