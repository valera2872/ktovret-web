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

  return processSoloServerAction(runtime, state, { ...action, type }, accessMode);
}
