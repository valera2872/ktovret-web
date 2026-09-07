import { processAuthorizedSoloAction } from './solo-engine-v2-controller.ts';
import { createInitialSoloServerState, parseSoloDefinition, type SoloRuntime } from './solo-engine-v2-runtime.ts';

function assert(condition: unknown, message: string) { if (!condition) throw new Error(message); }
function assertThrows(fn: () => unknown, expected: string) {
  try { fn(); } catch (error) {
    if (String(error instanceof Error ? error.message : error).includes(expected)) return;
    throw error;
  }
  throw new Error(`expected throw: ${expected}`);
}

const definition = parseSoloDefinition({
  schema_version: 2,
  case_version: 'controller-1',
  metadata: { title: 'Controller contract' },
  initial_evidence_ids: ['E1'],
  evidence: [{ id: 'E1', title: 'Evidence', body: 'Body', sections: [] }],
  characters: [{ id: 'c1', name: 'Character', statements: { '1': 'Opening' }, states: [{ id: 0, statement_version: 1, disclosure_level: 0 }] }],
  deductions: [{
    id: 'D1', title: 'Deduction', prompt: 'Choose',
    choices: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }], correct_choice: 'B',
    effects_on_confirm: [{ type: 'UNLOCK_RECONSTRUCTION' }],
  }],
  timeline: [], proof_classes: [], milestone_rules: [], interactions: [],
  reconstruction: {
    fields: [{ id: 'final', prompt: 'Final', options: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }] }],
    expected: { final: 'B' },
  },
});
const runtime: SoloRuntime = { caseId: 'CONTROLLER-CONTRACT', productId: 'p', payloadVersion: 1, canonRelease: '1.0.0', definition };

Deno.test('duplicate open/present-like retry does not advance semantic sequence', () => {
  let state = createInitialSoloServerState(runtime, 'owned');
  state = processAuthorizedSoloAction(runtime, state, { type: 'OPEN_EVIDENCE', evidence_id: 'E1' }, 'owned');
  const sequence = state.sequence;
  const retried = processAuthorizedSoloAction(runtime, state, { type: 'OPEN_EVIDENCE', evidence_id: 'E1' }, 'owned');
  assert(retried.sequence === sequence, 'idempotent OPEN_EVIDENCE retry advanced sequence');
});

Deno.test('confirmed deduction cannot regress on a retry with another choice', () => {
  let state = createInitialSoloServerState(runtime, 'owned');
  state = processAuthorizedSoloAction(runtime, state, { type: 'ATTEMPT_DEDUCTION', deduction_id: 'D1', choice_id: 'B' }, 'owned');
  assert(state.deductions.D1.result === 'confirmed', 'deduction did not confirm');
  assertThrows(() => processAuthorizedSoloAction(runtime, state, { type: 'ATTEMPT_DEDUCTION', deduction_id: 'D1', choice_id: 'A' }, 'owned'), 'solo_deduction_already_confirmed');
  assert(state.deductions.D1.result === 'confirmed', 'confirmed source state was mutated by rejected retry');
});

Deno.test('completed case is immutable except START/SNAPSHOT reads', () => {
  let state = createInitialSoloServerState(runtime, 'owned');
  state = processAuthorizedSoloAction(runtime, state, { type: 'ATTEMPT_DEDUCTION', deduction_id: 'D1', choice_id: 'B' }, 'owned');
  state = processAuthorizedSoloAction(runtime, state, { type: 'SUBMIT_RECONSTRUCTION', answers: { final: 'B' } }, 'owned');
  assert(state.completed === true, 'case did not complete');
  assertThrows(() => processAuthorizedSoloAction(runtime, state, { type: 'ADD_HYPOTHESIS', claim: 'change after completion' }, 'owned'), 'solo_case_completed');
  const snapshot = processAuthorizedSoloAction(runtime, state, { type: 'SNAPSHOT' }, 'owned');
  assert(snapshot.completed === true, 'snapshot of completed case failed');
});

Deno.test('reconstruction equality is independent of PostgreSQL jsonb object-key order', () => {
  const jsonbDefinition = parseSoloDefinition({
    schema_version: 2,
    case_version: 'controller-jsonb-order',
    metadata: { title: 'JSONB reconstruction contract' },
    initial_evidence_ids: ['E1'],
    evidence: [{ id: 'E1', title: 'Evidence', body: 'Body', sections: [] }],
    characters: [{ id: 'c1', name: 'Character', statements: { '1': 'Opening' }, states: [{ id: 0, statement_version: 1, disclosure_level: 0 }] }],
    deductions: [{
      id: 'D1', title: 'Deduction', prompt: 'Choose',
      choices: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }], correct_choice: 'B',
      effects_on_confirm: [{ type: 'UNLOCK_RECONSTRUCTION' }],
    }],
    timeline: [], proof_classes: [], milestone_rules: [], interactions: [],
    reconstruction: {
      fields: [
        { id: 'alpha', prompt: 'Alpha', options: [{ id: 'A', label: 'A' }] },
        { id: 'middle', prompt: 'Middle', options: [{ id: 'M', label: 'M' }] },
        { id: 'zeta', prompt: 'Zeta', options: [{ id: 'Z', label: 'Z' }] },
      ],
      // This order intentionally differs from the submitted object below,
      // modelling a definition after a PostgreSQL jsonb round-trip.
      expected: { zeta: 'Z', alpha: 'A', middle: 'M' },
    },
  });
  const jsonbRuntime: SoloRuntime = {
    caseId: 'CONTROLLER-JSONB', productId: 'p-jsonb', payloadVersion: 1, canonRelease: '1.0.0', definition: jsonbDefinition,
  };

  let state = createInitialSoloServerState(jsonbRuntime, 'owned');
  state = processAuthorizedSoloAction(jsonbRuntime, state, { type: 'ATTEMPT_DEDUCTION', deduction_id: 'D1', choice_id: 'B' }, 'owned');
  state = processAuthorizedSoloAction(
    jsonbRuntime,
    state,
    { type: 'SUBMIT_RECONSTRUCTION', answers: { alpha: 'A', middle: 'M', zeta: 'Z' } },
    'owned',
  );

  assert(state.completed === true, 'logically equal reconstruction failed after jsonb key reordering');
});
