import {
  createInitialSoloServerState,
  parseSoloDefinition,
  processSoloServerAction,
  safeSoloPayload,
  type SoloRuntime,
} from './solo-engine-v2-runtime.ts';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}
function assertThrows(fn: () => unknown, expected: string) {
  try { fn(); } catch (error) {
    if (String(error instanceof Error ? error.message : error).includes(expected)) return;
    throw error;
  }
  throw new Error(`expected throw: ${expected}`);
}

const PRIVATE_DEDUCTION_ANSWER = 'CHOICE_B';
const PRIVATE_RECONSTRUCTION_ANSWER = 'FINAL_B';
const PRIVATE_EFFECT_FACT = 'PRIVATE_EFFECT_FACT';

const definition = parseSoloDefinition({
  schema_version: 2,
  case_version: 'contract-1',
  metadata: { title: 'Server contract', subtitle: 'Synthetic only' },
  initial_evidence_ids: ['A1'],
  evidence: [
    { id: 'A1', type: 'log', title: 'Demo log', teaser: 'Visible teaser', body: 'DEMO_BODY', sections: [] },
    {
      id: 'P1', type: 'document', title: 'Premium document', teaser: 'Story-unlocked premium item', body: 'PREMIUM_BODY',
      unlock_rule: { milestone_reached: 'DEMO_COMPLETE' },
      access_rule: { entitlement: ['owned','club','admin'] },
      sections: [{ id: 'S1', title: 'Protected section', body: 'PREMIUM_SECTION_BODY' }],
    },
  ],
  characters: [
    {
      id: 'alpha', name: 'Alpha', role: 'Witness', statements: { '1': 'Opening statement', '2': 'Changed statement' },
      states: [
        { id: 0, statement_version: 1, disclosure_level: 0 },
        {
          id: 1, statement_version: 2, disclosure_level: 1,
          enter_rule: { evidence_presented: { evidence_id: 'P1', character_id: 'alpha' } },
          effects: [{ type: 'UNLOCK_EVIDENCE_SECTION', evidence_id: 'P1', section_id: 'S1' }],
        },
      ],
    },
  ],
  deductions: [
    {
      id: 'D1', title: 'Demo deduction', prompt: 'What follows from the demo log?',
      choices: [{ id: 'WRONG', label: 'Wrong' }, { id: 'DEMO_CORRECT', label: 'Correct' }],
      correct_choice: 'DEMO_CORRECT',
      effects_on_confirm: [{ type: 'SET_MILESTONE', id: 'DEMO_COMPLETE' }],
    },
    {
      id: 'D2', title: 'Premium deduction', prompt: 'What happened?',
      choices: [{ id: 'CHOICE_A', label: 'Alternative A' }, { id: PRIVATE_DEDUCTION_ANSWER, label: 'Alternative B' }],
      correct_choice: PRIVATE_DEDUCTION_ANSWER,
      unlock_rule: { evidence_opened: 'P1' },
      access_rule: { entitlement: ['owned','club','admin'] },
      effects_on_confirm: [{ type: 'ADD_FACT', id: PRIVATE_EFFECT_FACT }, { type: 'UNLOCK_RECONSTRUCTION' }],
    },
  ],
  timeline: [
    { id: 'T1', time: '00:01', label: 'Demo fact established', visibility_rule: { deduction_confirmed: 'D1' } },
  ],
  proof_classes: [
    { id: 'proof', label: 'Proof', satisfied_by: { deduction_confirmed: 'D2' } },
  ],
  milestone_rules: [],
  interactions: [],
  reconstruction: {
    access_rule: { entitlement: ['owned','club','admin'] },
    fields: [{ id: 'final', prompt: 'Final reconstruction?', options: [{ id: 'FINAL_A', label: 'Alternative A' }, { id: PRIVATE_RECONSTRUCTION_ANSWER, label: 'Alternative B' }] }],
    expected: { final: PRIVATE_RECONSTRUCTION_ANSWER },
  },
  client_flags: { demo_complete_milestone: 'DEMO_COMPLETE', confession_milestone: 'CONFESSION_OBTAINED' },
});

const runtime: SoloRuntime = {
  caseId: 'SERVER-CONTRACT', productId: 'contract-product', payloadVersion: 1, canonRelease: '1.0.0', definition,
};

Deno.test('Solo V2 safe payload hides unopened and inaccessible evidence bodies', () => {
  let state = createInitialSoloServerState(runtime, 'demo');
  let safe: any = safeSoloPayload(runtime, state, 0, 'demo');
  assert(safe.evidence[0].id === 'A1', 'A1 should be visible');
  assert(!('body' in safe.evidence[0]), 'unopened demo evidence body leaked');

  state = processSoloServerAction(runtime, state, { type: 'OPEN_EVIDENCE', evidence_id: 'A1' }, 'demo');
  safe = safeSoloPayload(runtime, state, 1, 'demo');
  assert(safe.evidence.find((x: any) => x.id === 'A1').body === 'DEMO_BODY', 'opened evidence body missing');

  state = processSoloServerAction(runtime, state, { type: 'ATTEMPT_DEDUCTION', deduction_id: 'D1', choice_id: 'DEMO_CORRECT' }, 'demo');
  safe = safeSoloPayload(runtime, state, 2, 'demo');
  const premium = safe.evidence.find((x: any) => x.id === 'P1');
  assert(premium?.accessible === false, 'story-unlocked premium evidence should be inaccessible in demo');
  assert(!('body' in premium), 'premium evidence body leaked without entitlement');
  assertThrows(() => processSoloServerAction(runtime, state, { type: 'OPEN_EVIDENCE', evidence_id: 'P1' }, 'demo'), 'solo_evidence_access_denied');
});

Deno.test('Solo V2 Club expiry preserves progress but removes protected content', () => {
  let state = createInitialSoloServerState(runtime, 'demo');
  state = processSoloServerAction(runtime, state, { type: 'OPEN_EVIDENCE', evidence_id: 'A1' }, 'demo');
  state = processSoloServerAction(runtime, state, { type: 'ATTEMPT_DEDUCTION', deduction_id: 'D1', choice_id: 'DEMO_CORRECT' }, 'demo');
  state = processSoloServerAction(runtime, state, { type: 'OPEN_EVIDENCE', evidence_id: 'P1' }, 'club');
  assert(state.evidence.P1.opened === true, 'premium progress did not persist');

  const expired: any = safeSoloPayload(runtime, state, 3, 'demo');
  const premium = expired.evidence.find((x: any) => x.id === 'P1');
  assert(premium.opened === true, 'Club expiry erased opened state');
  assert(premium.accessible === false, 'Club expiry did not revoke access');
  assert(!('body' in premium), 'Club expiry still exposed premium body');

  const renewed: any = safeSoloPayload(runtime, state, 3, 'club');
  assert(renewed.evidence.find((x: any) => x.id === 'P1').body === 'PREMIUM_BODY', 'Club renewal did not restore protected content');
});

Deno.test('Solo V2 safe payload never identifies correctness or private effects', () => {
  let state = createInitialSoloServerState(runtime, 'demo');
  state = processSoloServerAction(runtime, state, { type: 'OPEN_EVIDENCE', evidence_id: 'A1' }, 'demo');
  state = processSoloServerAction(runtime, state, { type: 'ATTEMPT_DEDUCTION', deduction_id: 'D1', choice_id: 'DEMO_CORRECT' }, 'demo');
  state = processSoloServerAction(runtime, state, { type: 'OPEN_EVIDENCE', evidence_id: 'P1' }, 'owned');

  // Before answering, both alternatives are intentionally visible. The secret is which one is correct.
  let safe: any = safeSoloPayload(runtime, state, 3, 'owned');
  const d2 = safe.deductions.find((x: any) => x.id === 'D2');
  assert(d2.choices.length === 2, 'player choices must be visible');
  let serialized = JSON.stringify(safe);
  assert(!serialized.includes('correct_choice'), 'correct_choice field leaked');
  assert(!serialized.includes('effects_on_confirm'), 'private effects structure leaked');
  assert(!serialized.includes(PRIVATE_EFFECT_FACT), 'private effect/fact leaked');
  assert(!serialized.includes('expected'), 'expected reconstruction structure leaked before reconstruction');

  state = processSoloServerAction(runtime, state, { type: 'ATTEMPT_DEDUCTION', deduction_id: 'D2', choice_id: PRIVATE_DEDUCTION_ANSWER }, 'owned');
  safe = safeSoloPayload(runtime, state, 4, 'owned');
  serialized = JSON.stringify(safe);
  assert(!serialized.includes('correct_choice'), 'correct_choice field leaked after confirmation');
  assert(!serialized.includes('effects_on_confirm'), 'private effects leaked after confirmation');
  assert(!serialized.includes(PRIVATE_EFFECT_FACT), 'private confirmed effect leaked');
  assert(!serialized.includes('expected'), 'expected reconstruction structure leaked');
  assert(safe.flags.reconstructionStoryUnlocked === true, 'reconstruction story flag missing');
  assert(Array.isArray(safe.reconstruction.fields), 'authorized reconstruction fields missing');
});

Deno.test('Solo V2 reconstruction is evaluated server-side', () => {
  let state = createInitialSoloServerState(runtime, 'demo');
  state = processSoloServerAction(runtime, state, { type: 'OPEN_EVIDENCE', evidence_id: 'A1' }, 'demo');
  state = processSoloServerAction(runtime, state, { type: 'ATTEMPT_DEDUCTION', deduction_id: 'D1', choice_id: 'DEMO_CORRECT' }, 'demo');
  state = processSoloServerAction(runtime, state, { type: 'OPEN_EVIDENCE', evidence_id: 'P1' }, 'owned');
  state = processSoloServerAction(runtime, state, { type: 'ATTEMPT_DEDUCTION', deduction_id: 'D2', choice_id: PRIVATE_DEDUCTION_ANSWER }, 'owned');
  assertThrows(() => processSoloServerAction(runtime, state, { type: 'SUBMIT_RECONSTRUCTION', answers: { final: PRIVATE_RECONSTRUCTION_ANSWER } }, 'demo'), 'solo_reconstruction_access_denied');
  state = processSoloServerAction(runtime, state, { type: 'SUBMIT_RECONSTRUCTION', answers: { final: PRIVATE_RECONSTRUCTION_ANSWER } }, 'owned');
  assert(state.completed === true, 'server did not accept correct reconstruction');
});
