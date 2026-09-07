const CASE_ID_RE = /^[A-Za-z0-9_:-]{3,160}$/;
const ID_RE = /^[A-Za-z0-9_:-]{1,80}$/;
const TOKEN_HASH_RE = /^[0-9a-f]{64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEMVER_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const encoder = new TextEncoder();

export type SoloAccessMode = 'demo' | 'owned' | 'club' | 'admin';
export type SoloRule = Record<string, unknown> | null;
export type SoloEffect = Record<string, unknown>;

type EvidenceSection = { id: string; title: string; body: string };
type EvidenceDef = {
  id: string;
  type: string;
  location_id: string;
  title: string;
  teaser: string;
  body: string;
  unlock_rule: SoloRule;
  access_rule: SoloRule;
  sections: EvidenceSection[];
};
type CharacterStateDef = {
  id: number;
  statement_version: number;
  disclosure_level: number;
  enter_rule: SoloRule;
  effects: SoloEffect[];
};
type CharacterDef = {
  id: string;
  name: string;
  role: string;
  statements: Record<string, string>;
  states: CharacterStateDef[];
};
type DeductionChoice = { id: string; label: string };
type DeductionDef = {
  id: string;
  title: string;
  prompt: string;
  choices: DeductionChoice[];
  correct_choice: string;
  contradicted_choices: string[];
  unlock_rule: SoloRule;
  access_rule: SoloRule;
  effects_on_confirm: SoloEffect[];
};
type TimelineDef = { id: string; time: string; label: string; visibility_rule: SoloRule };
type ProofClassDef = { id: string; label: string; satisfied_by: SoloRule };
type MilestoneRuleDef = { id: string; when: SoloRule; effects: SoloEffect[] };
type InteractionDef = {
  id: string;
  label: string;
  character_id: string;
  unlock_rule: SoloRule;
  access_rule: SoloRule;
  effects: SoloEffect[];
};
type ReconstructionField = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
};
type ReconstructionDef = {
  access_rule: SoloRule;
  fields: ReconstructionField[];
  expected: Record<string, unknown>;
};

export type SoloCaseDefinition = {
  schema_version: 2;
  case_version: string;
  metadata: { title: string; subtitle: string };
  initial_evidence_ids: string[];
  evidence: EvidenceDef[];
  characters: CharacterDef[];
  deductions: DeductionDef[];
  timeline: TimelineDef[];
  proof_classes: ProofClassDef[];
  milestone_rules: MilestoneRuleDef[];
  interactions: InteractionDef[];
  reconstruction: ReconstructionDef;
  client_flags: {
    demo_complete_milestone: string;
    confession_milestone: string;
  };
};

export type SoloEvidenceState = {
  unlocked: boolean;
  opened: boolean;
  examined: boolean;
  presented_to: Record<string, boolean>;
  sections: Record<string, { unlocked: boolean; opened: boolean }>;
};
export type SoloCharacterState = {
  state: number;
  disclosure_level: number;
  evidence_exposure: string[];
  contradictions: string[];
  statement_version: number;
};
export type SoloDeductionState = {
  available: boolean;
  attempts: number;
  result: 'untried' | 'confirmed' | 'contradicted' | 'insufficient';
  selected_choice: string | null;
};
export type SoloState = {
  schema_version: 2;
  case_id: string;
  case_version: string;
  entitlement: SoloAccessMode;
  milestones: string[];
  facts: string[];
  evidence: Record<string, SoloEvidenceState>;
  characters: Record<string, SoloCharacterState>;
  deductions: Record<string, SoloDeductionState>;
  timeline: Record<string, { established: boolean; visible: boolean }>;
  interactions: Record<string, { triggered: boolean }>;
  proof_classes: Record<string, boolean>;
  hypotheses: { id: string; subject_id: string | null; claim: string; status: 'active' | 'contradicted'; contradicted_by: string[] }[];
  hints_used: string[];
  reconstruction: Record<string, unknown>;
  sequence: number;
  completed: boolean;
};

export type SoloRuntime = {
  caseId: string;
  productId: string;
  payloadVersion: number;
  canonRelease: string;
  definition: SoloCaseDefinition;
};

export type SoloEntitlement = {
  id: string;
  productId: string;
  accessMode: Exclude<SoloAccessMode, 'demo' | 'admin'>;
  expiresAt: string | null;
};

function clean(value: unknown, max = 600) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}
function record(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}
function list(value: unknown) { return Array.isArray(value) ? value : []; }
function stringList(value: unknown, maxItems = 100, maxLen = 160) {
  return list(value).map((v) => clean(v, maxLen)).filter(Boolean).slice(0, maxItems);
}
function unique<T>(values: T[]) { return [...new Set(values)]; }
function boundedInt(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}
function clone<T>(value: T): T { return structuredClone(value); }
function deepEqual(a: unknown, b: unknown) { return JSON.stringify(a) === JSON.stringify(b); }
function normalizeRule(value: unknown): SoloRule { return value && typeof value === 'object' && !Array.isArray(value) ? clone(value as Record<string, unknown>) : null; }
function normalizeEffects(value: unknown) { return list(value).map((item) => record(item)).filter((item) => clean(item.type, 80)); }
function semverAtLeast(value: string, minimum: string) {
  if (!SEMVER_RE.test(value) || !SEMVER_RE.test(minimum)) return false;
  const a = value.split('.').map(Number), b = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) { if (a[i] !== b[i]) return a[i] > b[i]; }
  return true;
}

export function normalizeCaseId(value: unknown) {
  const id = clean(value, 160);
  return CASE_ID_RE.test(id) ? id : null;
}
export async function digestHex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
export async function deriveSoloSessionKey(rawSessionToken: string) {
  const token = clean(rawSessionToken, 512);
  if (token.length < 32) throw new Error('solo_session_token_invalid');
  return digestHex(`solo-v2-session:${token}`);
}
export function createSoloSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function parseEvidence(value: unknown): EvidenceDef | null {
  const src = record(value), id = clean(src.id, 80), title = clean(src.title, 240);
  if (!ID_RE.test(id) || !title) return null;
  const sections: EvidenceSection[] = [];
  for (const raw of list(src.sections)) {
    const s = record(raw), sid = clean(s.id, 80), stitle = clean(s.title, 240), body = clean(s.body, 6000);
    if (!ID_RE.test(sid) || !stitle || !body || sections.some((x) => x.id === sid)) throw new Error('solo_definition_section_invalid');
    sections.push({ id: sid, title: stitle, body });
  }
  return {
    id,
    type: clean(src.type, 80) || 'document',
    location_id: clean(src.location_id, 80),
    title,
    teaser: clean(src.teaser, 600),
    body: clean(src.body, 12000),
    unlock_rule: normalizeRule(src.unlock_rule),
    access_rule: normalizeRule(src.access_rule),
    sections,
  };
}
function parseCharacter(value: unknown): CharacterDef | null {
  const src = record(value), id = clean(src.id, 80), name = clean(src.name, 180), role = clean(src.role, 180);
  if (!ID_RE.test(id) || !name) return null;
  const statements: Record<string, string> = {};
  for (const [version, text] of Object.entries(record(src.statements))) {
    const v = boundedInt(version, 1, 100, 0), body = clean(text, 6000);
    if (v && body) statements[String(v)] = body;
  }
  const states: CharacterStateDef[] = list(src.states).map((raw) => {
    const s = record(raw);
    return {
      id: boundedInt(s.id, 0, 100, 0),
      statement_version: boundedInt(s.statement_version, 1, 100, 1),
      disclosure_level: boundedInt(s.disclosure_level, 0, 100, 0),
      enter_rule: normalizeRule(s.enter_rule),
      effects: normalizeEffects(s.effects),
    };
  }).sort((a, b) => a.id - b.id);
  if (!states.length || states[0].id !== 0 || !statements[String(states[0].statement_version)]) throw new Error('solo_definition_character_state_invalid');
  return { id, name, role, statements, states };
}
function parseDeduction(value: unknown): DeductionDef | null {
  const src = record(value), id = clean(src.id, 80), title = clean(src.title, 240), prompt = clean(src.prompt, 1600);
  if (!ID_RE.test(id) || !title || !prompt) return null;
  const choices: DeductionChoice[] = list(src.choices).map((raw) => {
    const c = record(raw); return { id: clean(c.id, 80), label: clean(c.label, 600) };
  }).filter((c) => ID_RE.test(c.id) && c.label);
  if (choices.length < 2 || new Set(choices.map((c) => c.id)).size !== choices.length) throw new Error('solo_definition_deduction_choices_invalid');
  const correct = clean(src.correct_choice, 80);
  if (!choices.some((c) => c.id === correct)) throw new Error('solo_definition_deduction_answer_invalid');
  return {
    id, title, prompt, choices, correct_choice: correct,
    contradicted_choices: stringList(src.contradicted_choices, 20, 80).filter((choice) => choices.some((c) => c.id === choice)),
    unlock_rule: normalizeRule(src.unlock_rule), access_rule: normalizeRule(src.access_rule),
    effects_on_confirm: normalizeEffects(src.effects_on_confirm),
  };
}

export function parseSoloDefinition(value: unknown): SoloCaseDefinition {
  const raw = record(value);
  if (Number(raw.schema_version) !== 2) throw new Error('solo_definition_schema_invalid');
  const caseVersion = clean(raw.case_version, 80);
  if (!caseVersion) throw new Error('solo_definition_version_invalid');
  const meta = record(raw.metadata), title = clean(meta.title, 240);
  if (!title) throw new Error('solo_definition_metadata_invalid');
  const evidence = list(raw.evidence).map(parseEvidence).filter(Boolean) as EvidenceDef[];
  const characters = list(raw.characters).map(parseCharacter).filter(Boolean) as CharacterDef[];
  const deductions = list(raw.deductions).map(parseDeduction).filter(Boolean) as DeductionDef[];
  if (!evidence.length || !characters.length || !deductions.length) throw new Error('solo_definition_content_invalid');
  for (const items of [evidence, characters, deductions]) if (new Set(items.map((x) => x.id)).size !== items.length) throw new Error('solo_definition_duplicate_id');
  const evidenceIds = new Set(evidence.map((x) => x.id)), characterIds = new Set(characters.map((x) => x.id));
  const initialEvidence = unique(stringList(raw.initial_evidence_ids, 100, 80));
  if (initialEvidence.some((id) => !evidenceIds.has(id))) throw new Error('solo_definition_initial_evidence_invalid');

  const timeline: TimelineDef[] = list(raw.timeline).map((item) => {
    const t = record(item); return { id: clean(t.id, 80), time: clean(t.time, 80), label: clean(t.label, 600), visibility_rule: normalizeRule(t.visibility_rule) };
  }).filter((t) => ID_RE.test(t.id) && t.time && t.label);
  const proofClasses: ProofClassDef[] = list(raw.proof_classes).map((item) => {
    const p = record(item); return { id: clean(p.id, 80), label: clean(p.label, 240), satisfied_by: normalizeRule(p.satisfied_by) };
  }).filter((p) => ID_RE.test(p.id) && p.label);
  const milestoneRules: MilestoneRuleDef[] = list(raw.milestone_rules).map((item) => {
    const m = record(item); return { id: clean(m.id, 80), when: normalizeRule(m.when), effects: normalizeEffects(m.effects) };
  }).filter((m) => ID_RE.test(m.id));
  const interactions: InteractionDef[] = list(raw.interactions).map((item) => {
    const x = record(item); return {
      id: clean(x.id, 80), label: clean(x.label, 600), character_id: clean(x.character_id, 80),
      unlock_rule: normalizeRule(x.unlock_rule), access_rule: normalizeRule(x.access_rule), effects: normalizeEffects(x.effects),
    };
  }).filter((x) => ID_RE.test(x.id) && x.label && characterIds.has(x.character_id));

  const rr = record(raw.reconstruction);
  const fields: ReconstructionField[] = list(rr.fields).map((item) => {
    const f = record(item), id = clean(f.id, 80), prompt = clean(f.prompt, 1000);
    const options = list(f.options).map((opt) => { const o = record(opt); return { id: clean(o.id, 80), label: clean(o.label, 600) }; }).filter((o) => ID_RE.test(o.id) && o.label);
    return { id, prompt, options };
  }).filter((f) => ID_RE.test(f.id) && f.prompt && f.options.length >= 2);
  const expected = record(rr.expected);
  if (!fields.length || !Object.keys(expected).length) throw new Error('solo_definition_reconstruction_invalid');
  const flags = record(raw.client_flags);
  return {
    schema_version: 2,
    case_version: caseVersion,
    metadata: { title, subtitle: clean(meta.subtitle, 600) },
    initial_evidence_ids: initialEvidence,
    evidence, characters, deductions, timeline, proof_classes: proofClasses, milestone_rules: milestoneRules, interactions,
    reconstruction: { access_rule: normalizeRule(rr.access_rule), fields, expected },
    client_flags: {
      demo_complete_milestone: clean(flags.demo_complete_milestone, 80) || 'DEMO_COMPLETE',
      confession_milestone: clean(flags.confession_milestone, 80) || 'CONFESSION_OBTAINED',
    },
  };
}

function serverHeaders(serviceRole: string, extra: Record<string, string> = {}) {
  return { apikey: serviceRole, authorization: `Bearer ${serviceRole}`, 'content-type': 'application/json', ...extra };
}
async function restJson(base: string, serviceRole: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${base}/rest/v1/${path}`, { ...init, headers: { ...serverHeaders(serviceRole), ...(init.headers || {}) } });
  const text = await response.text(); let body: any = null; try { body = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) { console.error('solo_v2_rest_error', response.status, path.slice(0, 180), text.slice(0, 400)); throw new Error('solo_store_unavailable'); }
  return body;
}

export function entitlementAllowsCase(metadata: unknown, caseId: string) {
  const m = record(metadata), allowed = stringList(m.allowed_case_ids, 100, 160), scoped = clean(m.case_id, 160);
  if (allowed.length) return allowed.includes(caseId);
  return !scoped || scoped === caseId;
}
function entitlementAccessMode(metadata: unknown, expiresAt: unknown): 'owned' | 'club' {
  const override = clean(record(metadata).solo_access_mode, 40).toLowerCase();
  if (override === 'club') return 'club';
  if (override === 'owned') return 'owned';
  return clean(expiresAt, 80) ? 'club' : 'owned';
}
function validEntitlementRow(row: any, productId: string, caseId: string): SoloEntitlement | null {
  if (!row || !UUID_RE.test(String(row.id || '')) || clean(row.product_id, 160) !== productId) return null;
  if (String(row.status || '') !== 'active' || row.revoked_at) return null;
  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return null;
  if (row.expires_at && new Date(row.expires_at).getTime() <= now) return null;
  if (!entitlementAllowsCase(row.metadata, caseId)) return null;
  return { id: String(row.id), productId, accessMode: entitlementAccessMode(row.metadata, row.expires_at), expiresAt: row.expires_at ? String(row.expires_at) : null };
}

export async function loadSoloRuntime(input: { supabaseUrl: string; serviceRole: string; caseId: string }): Promise<SoloRuntime> {
  const { supabaseUrl, serviceRole } = input, caseId = normalizeCaseId(input.caseId);
  if (!supabaseUrl || !serviceRole) throw new Error('solo_store_not_configured');
  if (!caseId) throw new Error('invalid_case_id');
  const paidRows = await restJson(supabaseUrl, serviceRole, `paid_case_payloads?select=case_id,product_id,status,payload_version&case_id=eq.${encodeURIComponent(caseId)}&status=eq.published&limit=1`);
  const paid = Array.isArray(paidRows) ? paidRows[0] : null;
  if (!paid) throw new Error('case_not_found');
  const productId = clean(paid.product_id, 160); if (!productId) throw new Error('case_product_invalid');
  const defRows = await restJson(supabaseUrl, serviceRole, `solo_case_definitions?select=case_id,status,classification,production_eligible,schema_version,canon_release,definition&case_id=eq.${encodeURIComponent(caseId)}&status=eq.published&limit=1`);
  const row = Array.isArray(defRows) ? defRows[0] : null;
  if (!row) throw new Error('solo_case_not_ready');
  if (row.classification !== 'PRIVATE_CANON_PRODUCTION' || row.production_eligible !== true || !semverAtLeast(String(row.canon_release || ''), '1.0.0')) {
    throw new Error('solo_canon_rotation_required');
  }
  return {
    caseId, productId,
    payloadVersion: boundedInt(paid.payload_version, 1, 1000000, 1),
    canonRelease: String(row.canon_release),
    definition: parseSoloDefinition(row.definition),
  };
}

export async function resolveEntitlementByToken(input: { supabaseUrl: string; serviceRole: string; runtime: SoloRuntime; accessToken: string }): Promise<SoloEntitlement | null> {
  const token = clean(input.accessToken, 512); if (token.length < 32) return null;
  const tokenHash = await digestHex(token); if (!TOKEN_HASH_RE.test(tokenHash)) return null;
  const rows = await restJson(input.supabaseUrl, input.serviceRole, `access_entitlements?select=id,product_id,status,starts_at,expires_at,revoked_at,metadata&token_hash=eq.${tokenHash}&product_id=eq.${encodeURIComponent(input.runtime.productId)}&limit=1`);
  return validEntitlementRow(Array.isArray(rows) ? rows[0] : null, input.runtime.productId, input.runtime.caseId);
}
export async function resolveEntitlementById(input: { supabaseUrl: string; serviceRole: string; runtime: SoloRuntime; entitlementId: string }): Promise<SoloEntitlement | null> {
  if (!UUID_RE.test(input.entitlementId)) return null;
  const rows = await restJson(input.supabaseUrl, input.serviceRole, `access_entitlements?select=id,product_id,status,starts_at,expires_at,revoked_at,metadata&id=eq.${input.entitlementId}&limit=1`);
  return validEntitlementRow(Array.isArray(rows) ? rows[0] : null, input.runtime.productId, input.runtime.caseId);
}

function asArray(value: unknown) { return Array.isArray(value) ? value : value == null ? [] : [value]; }
function presentedMatch(state: SoloState, spec: unknown) {
  const r = record(spec), evidenceId = typeof spec === 'string' ? spec : clean(r.evidence_id, 80), characterId = clean(r.character_id, 80);
  const e = state.evidence[evidenceId]; if (!e) return false;
  return characterId ? Boolean(e.presented_to[characterId]) : Object.values(e.presented_to).some(Boolean);
}
export function evaluateSoloRule(rule: SoloRule, state: SoloState): boolean {
  if (!rule) return true;
  const r = record(rule);
  if (r.all) return asArray(r.all).every((x) => evaluateSoloRule(normalizeRule(x), state));
  if (r.any) return asArray(r.any).some((x) => evaluateSoloRule(normalizeRule(x), state));
  if (r.not) return !evaluateSoloRule(normalizeRule(r.not), state);
  if ('evidence_opened' in r) return Boolean(state.evidence[clean(r.evidence_opened, 80)]?.opened);
  if ('evidence_unlocked' in r) return Boolean(state.evidence[clean(r.evidence_unlocked, 80)]?.unlocked);
  if ('evidence_presented' in r) return presentedMatch(state, r.evidence_presented);
  if ('evidence_section_opened' in r) { const s = record(r.evidence_section_opened); return Boolean(state.evidence[clean(s.evidence_id, 80)]?.sections?.[clean(s.section_id, 80)]?.opened); }
  if ('deduction_confirmed' in r) return state.deductions[clean(r.deduction_confirmed, 80)]?.result === 'confirmed';
  if ('milestone_reached' in r) return state.milestones.includes(clean(r.milestone_reached, 80));
  if ('fact' in r) return state.facts.includes(clean(r.fact, 160));
  if ('character_state_at_least' in r) { const s = record(r.character_state_at_least); return (state.characters[clean(s.character_id, 80)]?.state || 0) >= boundedInt(s.state, 0, 100, 0); }
  if ('entitlement' in r) return stringList(r.entitlement, 10, 20).includes(state.entitlement);
  if ('proof_class' in r) return Boolean(state.proof_classes[clean(r.proof_class, 80)]);
  if ('interaction_triggered' in r) return Boolean(state.interactions[clean(r.interaction_triggered, 80)]?.triggered);
  throw new Error('solo_rule_unknown');
}

function evidenceDef(def: SoloCaseDefinition, id: string) { return def.evidence.find((x) => x.id === id) || null; }
function deductionDef(def: SoloCaseDefinition, id: string) { return def.deductions.find((x) => x.id === id) || null; }
function characterDef(def: SoloCaseDefinition, id: string) { return def.characters.find((x) => x.id === id) || null; }
function addUnique(list: string[], value: string) { if (value && !list.includes(value)) list.push(value); }
export function isSoloEvidenceAccessible(def: SoloCaseDefinition, state: SoloState, id: string) {
  const runtime = state.evidence[id], item = evidenceDef(def, id); return Boolean(runtime?.unlocked && item && evaluateSoloRule(item.access_rule, state));
}
export function isSoloDeductionAccessible(def: SoloCaseDefinition, state: SoloState, id: string) {
  const runtime = state.deductions[id], item = deductionDef(def, id); return Boolean(runtime?.available && item && evaluateSoloRule(item.access_rule, state));
}

export function createInitialSoloServerState(runtime: SoloRuntime, entitlement: SoloAccessMode = 'demo'): SoloState {
  const def = runtime.definition, initial = new Set(def.initial_evidence_ids), evidence: Record<string, SoloEvidenceState> = {};
  for (const item of def.evidence) {
    const sections: Record<string, { unlocked: boolean; opened: boolean }> = {};
    for (const s of item.sections) sections[s.id] = { unlocked: false, opened: false };
    evidence[item.id] = { unlocked: initial.has(item.id) || !item.unlock_rule, opened: false, examined: false, presented_to: {}, sections };
  }
  const characters: Record<string, SoloCharacterState> = {};
  for (const c of def.characters) characters[c.id] = { state: 0, disclosure_level: c.states[0].disclosure_level, evidence_exposure: [], contradictions: [], statement_version: c.states[0].statement_version };
  const deductions: Record<string, SoloDeductionState> = {};
  for (const d of def.deductions) deductions[d.id] = { available: !d.unlock_rule, attempts: 0, result: 'untried', selected_choice: null };
  const timeline: SoloState['timeline'] = {}; for (const t of def.timeline) timeline[t.id] = { established: false, visible: false };
  const interactions: SoloState['interactions'] = {}; for (const x of def.interactions) interactions[x.id] = { triggered: false };
  return recomputeSoloState(def, { schema_version: 2, case_id: runtime.caseId, case_version: def.case_version, entitlement, milestones: ['CASE_STARTED'], facts: [], evidence, characters, deductions, timeline, interactions, proof_classes: {}, hypotheses: [], hints_used: [], reconstruction: {}, sequence: 0, completed: false });
}

function applyEffect(def: SoloCaseDefinition, state: SoloState, effect: SoloEffect) {
  const e = record(effect), type = clean(e.type, 80);
  if (type === 'UNLOCK_EVIDENCE') { const id = clean(e.evidence_id, 80); if (!state.evidence[id]) throw new Error('solo_effect_evidence_unknown'); state.evidence[id].unlocked = true; return; }
  if (type === 'UNLOCK_EVIDENCE_SECTION') { const id = clean(e.evidence_id, 80), sid = clean(e.section_id, 80); if (!state.evidence[id]?.sections?.[sid]) throw new Error('solo_effect_section_unknown'); state.evidence[id].sections[sid].unlocked = true; return; }
  if (type === 'ADD_FACT') { addUnique(state.facts, clean(e.id, 160)); return; }
  if (type === 'ADD_CONTRADICTION') { const id = clean(e.character_id, 80), cid = clean(e.contradiction_id, 160); if (!state.characters[id]) throw new Error('solo_effect_character_unknown'); addUnique(state.characters[id].contradictions, cid); return; }
  if (type === 'SET_MILESTONE') { addUnique(state.milestones, clean(e.id, 160)); return; }
  if (type === 'DISPROVE_HYPOTHESIS') { const m = record(e.matcher), subject = clean(m.subject_id, 80), claim = clean(m.claim, 240); for (const h of state.hypotheses) if (h.status === 'active' && (!subject || h.subject_id === subject) && (!claim || h.claim === claim)) { h.status = 'contradicted'; addUnique(h.contradicted_by, clean(e.by, 80) || 'engine'); } return; }
  if (type === 'UNLOCK_RECONSTRUCTION') { addUnique(state.milestones, 'RECONSTRUCTION_AVAILABLE'); return; }
  if (type === 'SET_PROOF_CLASS') { state.proof_classes[clean(e.id, 80)] = e.value !== false; return; }
  throw new Error('solo_effect_unknown');
}
function applyEffects(def: SoloCaseDefinition, state: SoloState, effects: SoloEffect[]) { for (const e of effects) applyEffect(def, state, e); }

function refreshUnlocks(def: SoloCaseDefinition, state: SoloState) {
  let changed = false;
  for (const item of def.evidence) if (!state.evidence[item.id].unlocked && evaluateSoloRule(item.unlock_rule, state)) { state.evidence[item.id].unlocked = true; changed = true; }
  return changed;
}
function refreshDeductions(def: SoloCaseDefinition, state: SoloState) {
  let changed = false;
  for (const item of def.deductions) if (!state.deductions[item.id].available && evaluateSoloRule(item.unlock_rule, state)) { state.deductions[item.id].available = true; changed = true; }
  return changed;
}
function refreshCharacters(def: SoloCaseDefinition, state: SoloState) {
  let changed = false;
  for (const c of def.characters) {
    const rt = state.characters[c.id];
    for (const candidate of c.states) {
      if (candidate.id <= rt.state || !candidate.enter_rule || !evaluateSoloRule(candidate.enter_rule, state)) continue;
      rt.state = candidate.id; rt.statement_version = candidate.statement_version; rt.disclosure_level = candidate.disclosure_level;
      applyEffects(def, state, candidate.effects); changed = true;
    }
  }
  return changed;
}
function refreshProof(def: SoloCaseDefinition, state: SoloState) {
  let changed = false; for (const p of def.proof_classes) if (!state.proof_classes[p.id] && evaluateSoloRule(p.satisfied_by, state)) { state.proof_classes[p.id] = true; changed = true; } return changed;
}
function refreshTimeline(def: SoloCaseDefinition, state: SoloState) {
  let changed = false; for (const t of def.timeline) if (!state.timeline[t.id].visible && evaluateSoloRule(t.visibility_rule, state)) { state.timeline[t.id].visible = true; state.timeline[t.id].established = true; changed = true; } return changed;
}
function refreshMilestones(def: SoloCaseDefinition, state: SoloState) {
  let changed = false; for (const m of def.milestone_rules) if (!state.milestones.includes(m.id) && evaluateSoloRule(m.when, state)) { addUnique(state.milestones, m.id); applyEffects(def, state, m.effects); changed = true; } return changed;
}
export function recomputeSoloState(def: SoloCaseDefinition, state: SoloState) {
  for (let pass = 0; pass < 50; pass += 1) {
    if (![refreshUnlocks(def, state), refreshDeductions(def, state), refreshCharacters(def, state), refreshProof(def, state), refreshTimeline(def, state), refreshMilestones(def, state)].some(Boolean)) return state;
  }
  throw new Error('solo_recompute_did_not_converge');
}

export function normalizeStoredSoloState(value: unknown, runtime: SoloRuntime, entitlement: SoloAccessMode): SoloState {
  const def = runtime.definition, raw = record(value), fresh = createInitialSoloServerState(runtime, entitlement);
  if (Number(raw.schema_version) !== 2 || clean(raw.case_id, 160) !== runtime.caseId || clean(raw.case_version, 80) !== def.case_version) return fresh;
  fresh.entitlement = entitlement;
  fresh.milestones = unique(stringList(raw.milestones, 300, 160)); if (!fresh.milestones.includes('CASE_STARTED')) fresh.milestones.unshift('CASE_STARTED');
  fresh.facts = unique(stringList(raw.facts, 300, 160));
  for (const item of def.evidence) {
    const src = record(record(raw.evidence)[item.id]), dst = fresh.evidence[item.id];
    dst.unlocked = Boolean(src.unlocked) || dst.unlocked; dst.opened = Boolean(src.opened); dst.examined = Boolean(src.examined);
    const presented = record(src.presented_to); for (const c of def.characters) if (presented[c.id] === true) dst.presented_to[c.id] = true;
    const sections = record(src.sections); for (const s of item.sections) { const ss = record(sections[s.id]); dst.sections[s.id] = { unlocked: Boolean(ss.unlocked), opened: Boolean(ss.opened) }; }
  }
  for (const c of def.characters) {
    const src = record(record(raw.characters)[c.id]), dst = fresh.characters[c.id];
    dst.state = boundedInt(src.state, 0, 100, dst.state); dst.disclosure_level = boundedInt(src.disclosure_level, 0, 100, dst.disclosure_level); dst.statement_version = boundedInt(src.statement_version, 1, 100, dst.statement_version);
    dst.evidence_exposure = unique(stringList(src.evidence_exposure, 100, 80).filter((id) => fresh.evidence[id])); dst.contradictions = unique(stringList(src.contradictions, 100, 160));
  }
  for (const d of def.deductions) {
    const src = record(record(raw.deductions)[d.id]), dst = fresh.deductions[d.id];
    dst.available = Boolean(src.available) || dst.available; dst.attempts = boundedInt(src.attempts, 0, 1000, 0);
    const result = String(src.result || 'untried'); dst.result = ['untried','confirmed','contradicted','insufficient'].includes(result) ? result as SoloDeductionState['result'] : 'untried';
    dst.selected_choice = d.choices.some((c) => c.id === src.selected_choice) ? String(src.selected_choice) : null;
  }
  for (const t of def.timeline) { const src = record(record(raw.timeline)[t.id]); fresh.timeline[t.id] = { established: Boolean(src.established), visible: Boolean(src.visible) }; }
  for (const x of def.interactions) fresh.interactions[x.id].triggered = Boolean(record(record(raw.interactions)[x.id]).triggered);
  fresh.proof_classes = {}; for (const p of def.proof_classes) if (record(raw.proof_classes)[p.id] === true) fresh.proof_classes[p.id] = true;
  fresh.hypotheses = list(raw.hypotheses).slice(0, 50).map((h) => { const x = record(h); return { id: clean(x.id, 80), subject_id: clean(x.subject_id, 80) || null, claim: clean(x.claim, 600), status: x.status === 'contradicted' ? 'contradicted' as const : 'active' as const, contradicted_by: unique(stringList(x.contradicted_by, 30, 80)) }; }).filter((h) => ID_RE.test(h.id) && h.claim);
  fresh.hints_used = unique(stringList(raw.hints_used, 100, 80)); fresh.reconstruction = record(raw.reconstruction); fresh.sequence = boundedInt(raw.sequence, 0, 10000000, 0); fresh.completed = Boolean(raw.completed);
  return recomputeSoloState(def, fresh);
}

function nextEvent(state: SoloState) { state.sequence += 1; }
export type SoloAction = { type: string; [key: string]: unknown };
export function processSoloServerAction(runtime: SoloRuntime, inputState: SoloState, action: SoloAction, entitlement: SoloAccessMode): SoloState {
  const def = runtime.definition, state = normalizeStoredSoloState(inputState, runtime, entitlement), type = clean(action.type, 80);
  state.entitlement = entitlement;
  if (!type || type === 'SNAPSHOT' || type === 'START') return recomputeSoloState(def, state);
  if (type === 'OPEN_EVIDENCE') {
    const id = clean(action.evidence_id, 80); if (!isSoloEvidenceAccessible(def, state, id)) throw new Error('solo_evidence_access_denied');
    state.evidence[id].opened = true; state.evidence[id].examined = true; nextEvent(state);
  } else if (type === 'OPEN_EVIDENCE_SECTION') {
    const id = clean(action.evidence_id, 80), sid = clean(action.section_id, 80), section = state.evidence[id]?.sections?.[sid];
    if (!isSoloEvidenceAccessible(def, state, id) || !section?.unlocked) throw new Error('solo_evidence_section_access_denied'); section.opened = true; nextEvent(state);
  } else if (type === 'PRESENT_EVIDENCE') {
    const id = clean(action.evidence_id, 80), cid = clean(action.character_id, 80), c = state.characters[cid];
    if (!isSoloEvidenceAccessible(def, state, id) || !state.evidence[id]?.opened || !c) throw new Error('solo_present_invalid'); state.evidence[id].presented_to[cid] = true; addUnique(c.evidence_exposure, id); nextEvent(state);
  } else if (type === 'ATTEMPT_DEDUCTION') {
    const id = clean(action.deduction_id, 80), choice = clean(action.choice_id, 80), d = deductionDef(def, id), rt = state.deductions[id];
    if (!d || !rt?.available || !isSoloDeductionAccessible(def, state, id) || !d.choices.some((c) => c.id === choice)) throw new Error('solo_deduction_access_denied');
    rt.attempts += 1; rt.selected_choice = choice;
    if (choice === d.correct_choice) { rt.result = 'confirmed'; applyEffects(def, state, d.effects_on_confirm); }
    else if (d.contradicted_choices.includes(choice)) rt.result = 'contradicted'; else rt.result = 'insufficient'; nextEvent(state);
  } else if (type === 'ADD_HYPOTHESIS') {
    const claim = clean(action.claim, 600), subject = clean(action.subject_id, 80); if (!claim) throw new Error('solo_hypothesis_invalid');
    state.hypotheses.push({ id: clean(action.id, 80) || `H${state.hypotheses.length + 1}`, subject_id: subject || null, claim, status: 'active', contradicted_by: [] }); nextEvent(state);
  } else if (type === 'TRIGGER_INTERACTION') {
    const id = clean(action.interaction_id, 80), x = def.interactions.find((item) => item.id === id), rt = state.interactions[id];
    if (!x || !rt || rt.triggered || !evaluateSoloRule(x.unlock_rule, state) || !evaluateSoloRule(x.access_rule, state)) throw new Error('solo_interaction_unavailable');
    rt.triggered = true; applyEffects(def, state, x.effects); nextEvent(state);
  } else if (type === 'USE_HINT') {
    const id = clean(action.hint_id, 80); if (!ID_RE.test(id)) throw new Error('solo_hint_invalid'); addUnique(state.hints_used, id); nextEvent(state);
  } else if (type === 'SUBMIT_RECONSTRUCTION') {
    if (!state.milestones.includes('RECONSTRUCTION_AVAILABLE') || !evaluateSoloRule(def.reconstruction.access_rule, state)) throw new Error('solo_reconstruction_access_denied');
    const answers = record(action.answers); state.reconstruction = clone(answers); if (deepEqual(answers, def.reconstruction.expected)) { addUnique(state.milestones, 'RECONSTRUCTION_COMPLETE'); addUnique(state.milestones, 'CASE_COMPLETED'); state.completed = true; } nextEvent(state);
  } else throw new Error('solo_action_unknown');
  return recomputeSoloState(def, state);
}

export function safeSoloPayload(runtime: SoloRuntime, stateInput: SoloState, revision: number, accessMode: SoloAccessMode) {
  const def = runtime.definition, state = normalizeStoredSoloState(stateInput, runtime, accessMode); state.entitlement = accessMode;
  const evidence = def.evidence.filter((item) => state.evidence[item.id].unlocked).map((item) => {
    const rt = state.evidence[item.id], accessible = isSoloEvidenceAccessible(def, state, item.id);
    return {
      id: item.id, type: item.type, locationId: item.location_id || null, title: item.title, teaser: item.teaser || null,
      unlocked: true, accessible, opened: rt.opened, examined: rt.examined,
      presentedTo: accessible && rt.opened ? Object.entries(rt.presented_to).filter(([, yes]) => yes).map(([id]) => id) : [],
      ...(accessible && rt.opened ? { body: item.body, sections: item.sections.filter((s) => rt.sections[s.id]?.unlocked).map((s) => ({ id: s.id, title: s.title, opened: rt.sections[s.id].opened, ...(rt.sections[s.id].opened ? { body: s.body } : {}) })) } : {}),
    };
  });
  const characters = def.characters.map((c) => {
    const rt = state.characters[c.id]; return { id: c.id, name: c.name, role: c.role, state: rt.state, disclosureLevel: rt.disclosure_level, statementVersion: rt.statement_version, statement: c.statements[String(rt.statement_version)] || '', contradictionsFound: rt.contradictions.length, evidenceExposure: [...rt.evidence_exposure] };
  });
  const deductions = def.deductions.filter((d) => state.deductions[d.id].available).map((d) => {
    const rt = state.deductions[d.id], accessible = isSoloDeductionAccessible(def, state, d.id);
    return { id: d.id, title: d.title, available: true, accessible, attempts: rt.attempts, result: rt.result, ...(accessible && rt.result !== 'confirmed' ? { prompt: d.prompt, choices: d.choices } : {}) };
  });
  const timeline = def.timeline.filter((t) => state.timeline[t.id]?.visible).map((t) => ({ id: t.id, time: t.time, label: t.label }));
  const proof = def.proof_classes.map((p) => ({ id: p.id, label: p.label, satisfied: Boolean(state.proof_classes[p.id]) }));
  const interactions = def.interactions.filter((x) => !state.interactions[x.id]?.triggered && evaluateSoloRule(x.unlock_rule, state)).map((x) => ({ id: x.id, label: x.label, characterId: x.character_id, accessible: evaluateSoloRule(x.access_rule, state) }));
  const reconstructionStoryUnlocked = state.milestones.includes('RECONSTRUCTION_AVAILABLE');
  const reconstructionAccessible = reconstructionStoryUnlocked && evaluateSoloRule(def.reconstruction.access_rule, state);
  return {
    ok: true,
    case: { id: runtime.caseId, version: def.case_version, title: def.metadata.title, subtitle: def.metadata.subtitle || null, payloadVersion: runtime.payloadVersion, canonRelease: runtime.canonRelease },
    session: { revision, sequence: state.sequence, accessMode, completed: state.completed },
    flags: { demoComplete: state.milestones.includes(def.client_flags.demo_complete_milestone), confessionObtained: state.milestones.includes(def.client_flags.confession_milestone), reconstructionStoryUnlocked, reconstructionAccessible },
    evidence, characters, deductions, timeline, proofClasses: proof, hypotheses: state.hypotheses.map((h) => ({ ...h })), interactions,
    reconstruction: reconstructionStoryUnlocked ? { accessible: reconstructionAccessible, ...(reconstructionAccessible ? { fields: def.reconstruction.fields } : {}) } : null,
  };
}

export async function loadSoloSessionByKey(input: { supabaseUrl: string; serviceRole: string; runtime: SoloRuntime; sessionKey: string }) {
  if (!TOKEN_HASH_RE.test(input.sessionKey)) throw new Error('solo_session_token_invalid');
  const rows = await restJson(input.supabaseUrl, input.serviceRole, `solo_case_sessions?select=session_key,case_id,entitlement_id,state,revision&session_key=eq.${input.sessionKey}&case_id=eq.${encodeURIComponent(input.runtime.caseId)}&limit=1`);
  return Array.isArray(rows) ? rows[0] || null : null;
}
export async function loadSoloSessionByEntitlement(input: { supabaseUrl: string; serviceRole: string; runtime: SoloRuntime; entitlementId: string }) {
  if (!UUID_RE.test(input.entitlementId)) return null;
  const rows = await restJson(input.supabaseUrl, input.serviceRole, `solo_case_sessions?select=session_key,case_id,entitlement_id,state,revision&case_id=eq.${encodeURIComponent(input.runtime.caseId)}&entitlement_id=eq.${input.entitlementId}&limit=1`);
  return Array.isArray(rows) ? rows[0] || null : null;
}
export async function createSoloSession(input: { supabaseUrl: string; serviceRole: string; runtime: SoloRuntime; entitlement: SoloEntitlement | null }) {
  const rawToken = createSoloSessionToken(), sessionKey = await deriveSoloSessionKey(rawToken), accessMode: SoloAccessMode = input.entitlement?.accessMode || 'demo';
  const state = createInitialSoloServerState(input.runtime, accessMode);
  await restJson(input.supabaseUrl, input.serviceRole, 'solo_case_sessions', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ session_key: sessionKey, case_id: input.runtime.caseId, entitlement_id: input.entitlement?.id || null, state }) });
  return { rawToken, sessionKey, entitlementId: input.entitlement?.id || null, state, revision: 0 };
}
export async function bindSoloSessionEntitlement(input: { supabaseUrl: string; serviceRole: string; runtime: SoloRuntime; sessionKey: string; entitlement: SoloEntitlement }) {
  const existing = await loadSoloSessionByEntitlement({ ...input, entitlementId: input.entitlement.id });
  if (existing && String(existing.session_key) !== input.sessionKey) throw new Error('solo_session_merge_required');
  const rows = await restJson(input.supabaseUrl, input.serviceRole, `solo_case_sessions?session_key=eq.${input.sessionKey}&case_id=eq.${encodeURIComponent(input.runtime.caseId)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ entitlement_id: input.entitlement.id, updated_at: new Date().toISOString() }) });
  const row = Array.isArray(rows) ? rows[0] : null; if (!row) throw new Error('solo_session_bind_failed'); return row;
}
export async function saveSoloSession(input: { supabaseUrl: string; serviceRole: string; runtime: SoloRuntime; sessionKey: string; expectedRevision: number; state: SoloState }) {
  const path = `solo_case_sessions?session_key=eq.${input.sessionKey}&case_id=eq.${encodeURIComponent(input.runtime.caseId)}&revision=eq.${input.expectedRevision}`;
  const rows = await restJson(input.supabaseUrl, input.serviceRole, path, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ state: input.state, revision: input.expectedRevision + 1, updated_at: new Date().toISOString(), last_success_at: new Date().toISOString(), ...(input.state.completed ? { completed_at: new Date().toISOString() } : {}) }) });
  const row = Array.isArray(rows) ? rows[0] : null; if (!row) throw new Error('solo_session_state_conflict'); return { revision: input.expectedRevision + 1, state: input.state };
}
