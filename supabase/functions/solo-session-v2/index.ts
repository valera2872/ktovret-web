import {
  bindSoloSessionEntitlement,
  createSoloSession,
  deriveSoloSessionKey,
  loadSoloRuntime,
  loadSoloSessionByEntitlement,
  loadSoloSessionByKey,
  normalizeStoredSoloState,
  processSoloServerAction,
  resolveEntitlementById,
  resolveEntitlementByToken,
  safeSoloPayload,
  saveSoloSession,
  type SoloAccessMode,
  type SoloEntitlement,
} from '../_shared/solo-engine-v2-runtime.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);

const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    'vary': 'Origin',
    ...(origin ? { 'access-control-allow-origin': origin } : {}),
  },
});

function clean(value: unknown, max = 600) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}
function record(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}
function bearer(req: Request) {
  const auth = req.headers.get('authorization') || '';
  return auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
}
function errorStatus(code: string) {
  if (['invalid_case_id','invalid_request','solo_session_token_invalid','solo_hypothesis_invalid','solo_hint_invalid'].includes(code)) return 400;
  if (['access_denied','access_revoked','access_expired','access_wrong_case','solo_evidence_access_denied','solo_evidence_section_access_denied','solo_present_invalid','solo_deduction_access_denied','solo_interaction_unavailable','solo_reconstruction_access_denied'].includes(code)) return 403;
  if (['case_not_found','solo_session_not_found'].includes(code)) return 404;
  if (['solo_session_state_conflict','solo_session_merge_required','solo_session_entitlement_conflict'].includes(code)) return 409;
  if (['solo_case_not_ready','solo_canon_rotation_required'].includes(code)) return 423;
  if (['solo_store_not_configured','solo_store_unavailable'].includes(code)) return 503;
  return 400;
}

const MUTATING = new Set([
  'OPEN_EVIDENCE','OPEN_EVIDENCE_SECTION','PRESENT_EVIDENCE','ATTEMPT_DEDUCTION',
  'ADD_HYPOTHESIS','TRIGGER_INTERACTION','USE_HINT','SUBMIT_RECONSTRUCTION',
]);

Deno.serve(async (req: Request) => {
  const origin = (req.headers.get('origin') || '').replace(/\/$/, '');
  const allowedOrigin = !origin || configuredOrigins.includes(origin);
  if (req.method === 'OPTIONS') {
    if (!allowedOrigin) return new Response(null, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin ? { 'access-control-allow-origin': origin } : {}),
        'access-control-allow-headers': 'authorization, content-type',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-max-age': '600',
        'vary': 'Origin',
      },
    });
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!allowedOrigin) return json(403, { error: 'origin_not_allowed' });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(503, { error: 'solo_store_not_configured' }, origin);

  let body: Record<string, any> = {};
  try { body = record(await req.json()); } catch { return json(400, { error: 'invalid_request' }, origin); }
  const actionType = clean(body.action, 80).toUpperCase() || 'SNAPSHOT';
  const caseId = clean(body.case_id, 160);
  const rawSessionToken = clean(body.session_token, 512);
  const accessToken = bearer(req);

  try {
    const runtime = await loadSoloRuntime({ supabaseUrl: SUPABASE_URL, serviceRole: SERVICE_ROLE_KEY, caseId });
    let presentedEntitlement: SoloEntitlement | null = null;
    if (accessToken) {
      presentedEntitlement = await resolveEntitlementByToken({ supabaseUrl: SUPABASE_URL, serviceRole: SERVICE_ROLE_KEY, runtime, accessToken });
      if (!presentedEntitlement) throw new Error('access_denied');
    }

    let row: any = null;
    let sessionKey = '';
    let issuedSessionToken: string | null = null;

    if (rawSessionToken) {
      sessionKey = await deriveSoloSessionKey(rawSessionToken);
      row = await loadSoloSessionByKey({ supabaseUrl: SUPABASE_URL, serviceRole: SERVICE_ROLE_KEY, runtime, sessionKey });
      if (!row) throw new Error('solo_session_not_found');
    } else if (presentedEntitlement) {
      row = await loadSoloSessionByEntitlement({ supabaseUrl: SUPABASE_URL, serviceRole: SERVICE_ROLE_KEY, runtime, entitlementId: presentedEntitlement.id });
      if (row) sessionKey = String(row.session_key || '');
    }

    if (!row) {
      if (!['START','SNAPSHOT'].includes(actionType)) throw new Error('solo_session_not_found');
      const created = await createSoloSession({ supabaseUrl: SUPABASE_URL, serviceRole: SERVICE_ROLE_KEY, runtime, entitlement: presentedEntitlement });
      row = { session_key: created.sessionKey, case_id: runtime.caseId, entitlement_id: created.entitlementId, state: created.state, revision: created.revision };
      sessionKey = created.sessionKey;
      issuedSessionToken = created.rawToken;
    }

    const boundId = clean(row.entitlement_id, 80);
    let boundEntitlement = boundId
      ? await resolveEntitlementById({ supabaseUrl: SUPABASE_URL, serviceRole: SERVICE_ROLE_KEY, runtime, entitlementId: boundId })
      : null;

    if (presentedEntitlement && boundId !== presentedEntitlement.id) {
      if (boundEntitlement) throw new Error('solo_session_entitlement_conflict');
      row = await bindSoloSessionEntitlement({ supabaseUrl: SUPABASE_URL, serviceRole: SERVICE_ROLE_KEY, runtime, sessionKey, entitlement: presentedEntitlement });
      boundEntitlement = presentedEntitlement;
    }

    const accessMode: SoloAccessMode = boundEntitlement?.accessMode || 'demo';
    const revision = Number.isInteger(Number(row.revision)) ? Number(row.revision) : 0;
    const normalized = normalizeStoredSoloState(row.state, runtime, accessMode);
    const action = { ...body, type: actionType };
    const nextState = processSoloServerAction(runtime, normalized, action, accessMode);

    let nextRevision = revision;
    if (MUTATING.has(actionType)) {
      const saved = await saveSoloSession({ supabaseUrl: SUPABASE_URL, serviceRole: SERVICE_ROLE_KEY, runtime, sessionKey, expectedRevision: revision, state: nextState });
      nextRevision = saved.revision;
    }

    return json(200, {
      ...safeSoloPayload(runtime, nextState, nextRevision, accessMode),
      sessionToken: issuedSessionToken,
      resume: {
        viaSessionToken: Boolean(rawSessionToken || issuedSessionToken),
        viaEntitlement: Boolean(boundEntitlement),
      },
    }, origin);
  } catch (error) {
    const code = clean(error instanceof Error ? error.message : error, 120) || 'solo_request_failed';
    console.error('solo_session_v2_error', code);
    return json(errorStatus(code), { error: code }, origin);
  }
});
