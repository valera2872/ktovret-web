#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createInitialSoloState, processSoloAction } from '../assets/solo-engine-v2-core.mjs';
import { ml0512Case } from '../assets/cases/ml-0512-case.mjs';

const ids = (items) => items.map((item) => item.id);
const unique = (values) => new Set(values).size === values.length;

assert.equal(ml0512Case.evidence.length, 24, 'ML-0512 must keep 24 evidence objects');
assert.equal(ml0512Case.deductions.length, 11, 'ML-0512 must expose 11 system deductions');
assert(unique(ids(ml0512Case.evidence)), 'duplicate evidence id');
assert(unique(ids(ml0512Case.characters)), 'duplicate character id');
assert(unique(ids(ml0512Case.deductions)), 'duplicate deduction id');
assert(unique(ids(ml0512Case.interactions)), 'duplicate interaction id');

function act(state, action) {
  return processSoloAction(ml0512Case, state, action);
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
  const deduction = ml0512Case.deductions.find((item) => item.id === deductionId);
  return act(state, { type: 'ATTEMPT_DEDUCTION', deductionId, choiceId: deduction.correctChoice });
}

let demo = createInitialSoloState(ml0512Case);
demo = open(demo, 'E04');
demo = open(demo, 'E05');
demo = solve(demo, 'D01');
for (const id of ['E13', 'E14', 'E15']) demo = open(demo, id);
demo = solve(demo, 'D02');
assert(demo.milestones.includes('DEMO_COMPLETE'), 'demo milestone missing');
assert(demo.milestones.includes('SOURCE_IDENTIFIED_AS_B2'), 'source milestone missing');
assert.equal(demo.evidence.E11.unlocked, false, 'premium audit leaked into demo');

demo = act(demo, { type: 'SET_ENTITLEMENT', entitlement: 'owned' });
assert(demo.evidence.E11.unlocked, 'owned user did not unlock premium audit');

let state = demo;

// False solution: Anton is genuinely guilty of the data manipulation, but later excluded from the death.
state = act(state, { type: 'ADD_HYPOTHESIS', subjectId: 'anton', claim: 'CAUSED_DEATH' });
state = open(state, 'E11');
state = present(state, 'E11', 'anton');
state = solve(state, 'D03');
assert(state.milestones.includes('ANTON_VIOLATION_EXPOSED'), 'Anton violation not exposed');
state = open(state, 'E16');
state = open(state, 'E17');
state = solve(state, 'D04');
assert.equal(state.hypotheses[0].status, 'contradicted', 'Anton hypothesis not disproved');

// Sofia can be investigated before the Denis branch is complete.
state = open(state, 'E07');
state = open(state, 'E18');
state = solve(state, 'D05');
state = open(state, 'E19');
state = open(state, 'E22');
state = present(state, 'E19', 'mila');
assert(state.milestones.includes('SOFIA_ENTRY_CONFIRMED'), 'Mila branch did not establish Sofia entry');
state = solve(state, 'D07');
state = solve(state, 'D08');
state = solve(state, 'D09');
state = present(state, 'E19', 'sofia');
assert(state.characters.sofia.state >= 2, 'Sofia did not move to version 2');

// Denis unlocks a historical evidence section; merely unlocking it must not reveal the deduction.
state = open(state, 'E23');
state = present(state, 'E23', 'denis');
assert(state.evidence.E23.sections.historical_observations.unlocked, 'historical observations not unlocked');
assert.equal(state.deductions.D06.available, false, 'D06 leaked before historical observations were examined');
state = openSection(state, 'E23', 'historical_observations');
assert.equal(state.deductions.D06.available, true, 'D06 did not unlock after historical observations were examined');
state = solve(state, 'D06');
state = open(state, 'E24');
state = solve(state, 'D10');

// Physical death mechanism remains a separate proof class.
state = open(state, 'E20');
state = open(state, 'E21');
state = solve(state, 'D11');

// Knowing the answer is not enough: Sofia must be confronted with all five proof classes.
assert(!state.milestones.includes('CONFESSION_OBTAINED'), 'confession triggered before proof presentation');
state = present(state, 'E17', 'sofia');
state = present(state, 'E24', 'sofia');
state = present(state, 'E21', 'sofia');
assert(state.milestones.includes('FINAL_INTERROGATION_AVAILABLE'), 'final interrogation not available');
assert(!state.milestones.includes('CONFESSION_OBTAINED'), 'confession triggered without an explicit final confrontation');
assert(!state.milestones.includes('RECONSTRUCTION_AVAILABLE'), 'reconstruction leaked before confession');
state = act(state, { type: 'TRIGGER_INTERACTION', interactionId: 'FINAL_SOFIA_CONFRONTATION' });
assert(state.milestones.includes('CONFESSION_OBTAINED'), 'explicit final confrontation did not trigger confession');
assert(state.milestones.includes('RECONSTRUCTION_AVAILABLE'), 'reconstruction not unlocked after confession');

// Confession still does not complete the case: holistic reconstruction is mandatory.
state = act(state, { type: 'SUBMIT_RECONSTRUCTION', answers: ml0512Case.expectedReconstruction });
assert(state.completed, 'correct reconstruction did not complete case');
assert(state.milestones.includes('CASE_COMPLETED'), 'case completion milestone missing');

// Persistence contract: the semantic state survives a JSON refresh round-trip.
const roundTrip = JSON.parse(JSON.stringify(state));
assert.equal(roundTrip.completed, true, 'state roundtrip lost completion');
assert.equal(roundTrip.characters.sofia.statementVersion, 3, 'statement history state lost');
assert.equal(roundTrip.interactions.FINAL_SOFIA_CONFRONTATION.triggered, true, 'interaction state lost');

console.log(JSON.stringify({
  verdict: 'SOLO_ENGINE_V2_FOUNDATION_PASS',
  evidence: ml0512Case.evidence.length,
  deductions: ml0512Case.deductions.length,
  demoGateStable: true,
  premiumIsolation: true,
  antonFalseSolution: true,
  evidenceMustBeExamined: true,
  explicitFinalConfrontation: true,
  confessionProofClasses: true,
  reconstructionRequired: true,
  refreshRoundTrip: true,
}, null, 2));
