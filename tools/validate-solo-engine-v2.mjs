#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createInitialSoloState, processSoloAction } from '../assets/solo-engine-v2-core.mjs';
import { ml0512PublicManifest } from '../assets/cases/ml-0512-case.mjs';
import { soloEngineV2ContractCase as contractCase } from './fixtures/solo-engine-v2-contract-case.mjs';

const ids = (items) => items.map((item) => item.id);
const unique = (values) => new Set(values).size === values.length;

assert.equal(ml0512PublicManifest.evidenceCount, 24, 'ML-0512 public manifest must advertise 24 evidence objects');
assert.equal(ml0512PublicManifest.deductionCount, 11, 'ML-0512 public manifest must advertise 11 deductions');
assert.equal(ml0512PublicManifest.runtimePolicy, 'server-authoritative-private-canon', 'ML-0512 must require private canon');
assert.equal(ml0512PublicManifest.clientContract.deductionAnswersStayServerSide, true, 'deduction answers must stay server-side');
assert.equal(ml0512PublicManifest.clientContract.characterCanonStaysServerSide, true, 'character canon must stay server-side');
assert.equal(ml0512PublicManifest.clientContract.reconstructionAnswersStayServerSide, true, 'reconstruction answers must stay server-side');

assert(unique(ids(contractCase.evidence)), 'duplicate contract evidence id');
assert(unique(ids(contractCase.characters)), 'duplicate contract character id');
assert(unique(ids(contractCase.deductions)), 'duplicate contract deduction id');
assert(unique(ids(contractCase.interactions)), 'duplicate contract interaction id');

function act(state, action) {
  return processSoloAction(contractCase, state, action);
}
function open(state, evidenceId) {
  return act(state, { type: 'OPEN_EVIDENCE', evidenceId });
}
function openSection(state, evidenceId, section) {
  return act(state, { type: 'OPEN_EVIDENCE_SECTION', evidenceId, section });
}
function present(state, evidenceId, characterId) {
  return act(state, { type: 'PRESENT_EVIDENCE', evidenceId, characterId });
}
function solve(state, deductionId) {
  const deduction = contractCase.deductions.find((item) => item.id === deductionId);
  return act(state, { type: 'ATTEMPT_DEDUCTION', deductionId, choiceId: deduction.correctChoice });
}

let demo = createInitialSoloState(contractCase);
demo = open(demo, 'A01');
demo = open(demo, 'A02');
demo = solve(demo, 'Q01');
for (const id of ['A03', 'A04', 'A05']) demo = open(demo, id);
demo = solve(demo, 'Q02');
assert(demo.milestones.includes('DEMO_COMPLETE'), 'demo milestone missing');
assert(demo.milestones.includes('DEMO_INSIGHT'), 'demo insight missing');
assert.equal(demo.evidence.B01.unlocked, false, 'premium evidence leaked into demo');

demo = act(demo, { type: 'SET_ENTITLEMENT', entitlement: 'owned' });
assert(demo.evidence.B01.unlocked, 'owned user did not unlock premium evidence');

let state = demo;

// The false suspect is genuinely caught in a separate violation, then eliminated from the main incident.
state = act(state, { type: 'ADD_HYPOTHESIS', subjectId: 'alpha', claim: 'CAUSED_INCIDENT' });
state = open(state, 'B01');
state = present(state, 'B01', 'alpha');
state = solve(state, 'Q03');
assert(state.milestones.includes('ALPHA_VIOLATION_EXPOSED'), 'false-suspect violation not exposed');
state = open(state, 'B02');
state = open(state, 'B03');
state = solve(state, 'Q04');
assert.equal(state.hypotheses[0].status, 'contradicted', 'false-suspect hypothesis not disproved');

// Unlocking a hidden evidence section is not equivalent to examining it.
state = open(state, 'B04');
state = present(state, 'B04', 'beta');
assert(state.evidence.B04.sections.hidden_detail.unlocked, 'hidden evidence section not unlocked');
assert.equal(state.deductions.Q05.available, false, 'deduction leaked before hidden section was examined');
state = openSection(state, 'B04', 'hidden_detail');
assert.equal(state.deductions.Q05.available, true, 'deduction did not unlock after hidden section was examined');
state = solve(state, 'Q05');

state = open(state, 'B05');
state = solve(state, 'Q06');
state = open(state, 'B06');
state = open(state, 'B07');
state = solve(state, 'Q07');

// Proof classes require both established deductions and direct evidence presentation.
assert(!state.milestones.includes('CONFESSION_OBTAINED'), 'confession triggered before proof presentation');
state = present(state, 'B05', 'beta');
state = present(state, 'B07', 'beta');
assert(state.milestones.includes('FINAL_INTERROGATION_AVAILABLE'), 'final interrogation not available');
assert(!state.milestones.includes('CONFESSION_OBTAINED'), 'confession triggered without explicit final confrontation');
assert(!state.milestones.includes('RECONSTRUCTION_AVAILABLE'), 'reconstruction leaked before confession');

state = act(state, { type: 'TRIGGER_INTERACTION', interactionId: 'FINAL_BETA_CONFRONTATION' });
assert(state.milestones.includes('CONFESSION_OBTAINED'), 'explicit final confrontation did not trigger confession');
assert(state.milestones.includes('RECONSTRUCTION_AVAILABLE'), 'reconstruction not unlocked after confession');

// Confession is not completion: holistic reconstruction remains mandatory.
state = act(state, { type: 'SUBMIT_RECONSTRUCTION', answers: contractCase.expectedReconstruction });
assert(state.completed, 'correct reconstruction did not complete contract case');
assert(state.milestones.includes('CASE_COMPLETED'), 'case completion milestone missing');

const roundTrip = JSON.parse(JSON.stringify(state));
assert.equal(roundTrip.completed, true, 'state roundtrip lost completion');
assert.equal(roundTrip.characters.beta.statementVersion, 3, 'statement-history state lost');
assert.equal(roundTrip.interactions.FINAL_BETA_CONFRONTATION.triggered, true, 'interaction state lost');

console.log(JSON.stringify({
  verdict: 'SOLO_ENGINE_V2_FOUNDATION_PASS',
  publicCanonBoundary: true,
  demoGateStable: true,
  premiumIsolation: true,
  falseSolutionSupported: true,
  evidenceMustBeExamined: true,
  explicitFinalConfrontation: true,
  confessionProofClasses: true,
  reconstructionRequired: true,
  refreshRoundTrip: true
}, null, 2));
