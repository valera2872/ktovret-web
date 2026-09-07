import {
  normalizeStoredSoloState,
  processSoloServerAction,
  type SoloAccessMode,
  type SoloAction,
  type SoloRuntime,
  type SoloState,
} from './solo-engine-v2-runtime.ts';

function clean(value: unknown, max = 160) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalJson(item)]),
    );
  }
  return value;
}

function canonicalRecord(value: unknown): Record<string, unknown> {
  const canonical = canonicalJson(value);
  return canonical && typeof canonical === 'object' && !Array.isArray(canonical)
    ? canonical as Record<string, unknown>
    : {};
}

const READ_ONLY = new Set(['START', 'SNAPSHOT']);

// Production-facing guard around the generic transition engine.
// It prevents network retries/double-clicks from regressing confirmed state and
// makes a completed investigation immutable while keeping START/SNAPSHOT readable.
export function processAuthorizedSoloAction(
  runtime: SoloRuntime,
  inputState: SoloState,
  action: SoloAction,
  accessMode: SoloAccessMode,
): SoloState {
  const state = normalizeStoredSoloState(inputState, runtime, accessMode);
  const type = clean(action.type, 80).toUpperCase() || 'SNAPSHOT';

  if (READ_ONLY.has(type)) return processSoloServerAction(runtime, state, { ...action, type }, accessMode);
  if (state.completed) throw new Error('solo_case_completed');

  if (type === 'ATTEMPT_DEDUCTION') {
    const id = clean(action.deduction_id, 80);
    if (state.deductions[id]?.result === 'confirmed') throw new Error('solo_deduction_already_confirmed');
  }

  if (type === 'OPEN_EVIDENCE') {
    const id = clean(action.evidence_id, 80);
    if (state.evidence[id]?.opened) return state;
  }
  if (type === 'OPEN_EVIDENCE_SECTION') {
    const id = clean(action.evidence_id, 80), section = clean(action.section_id, 80);
    if (state.evidence[id]?.sections?.[section]?.opened) return state;
  }
  if (type === 'PRESENT_EVIDENCE') {
    const id = clean(action.evidence_id, 80), character = clean(action.character_id, 80);
    if (state.evidence[id]?.presented_to?.[character]) return state;
  }
  if (type === 'USE_HINT') {
    const id = clean(action.hint_id, 80);
    if (state.hints_used.includes(id)) return state;
  }

  if (type === 'SUBMIT_RECONSTRUCTION') {
    // PostgreSQL jsonb does not preserve object-key insertion order. The generic
    // runtime intentionally uses strict JSON equality, so canonicalize both sides
    // at the production boundary before comparison. Arrays remain order-sensitive.
    const normalizedRuntime: SoloRuntime = {
      ...runtime,
      definition: {
        ...runtime.definition,
        reconstruction: {
          ...runtime.definition.reconstruction,
          expected: canonicalRecord(runtime.definition.reconstruction.expected),
        },
      },
    };
    return processSoloServerAction(
      normalizedRuntime,
      state,
      { ...action, type, answers: canonicalRecord(action.answers || {}) },
      accessMode,
    );
  }

  return processSoloServerAction(runtime, state, { ...action, type }, accessMode);
}
