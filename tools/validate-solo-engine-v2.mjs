#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createInitialSoloState, processSoloAction, isEvidenceAccessible, isDeductionAccessible } from '../assets/solo-engine-v2-core.mjs';
import { ml0512PublicManifest } from '../assets/cases/ml-0512-case.mjs';
import { soloEngineV2ContractCase as contractCase } from '../assets/cases/solo-engine-v2-contract-case.mjs';

const ids = (items) => items.map((item) => item.id);
const unique = (values) => new Set(values).size === values.length;

assert.equal(ml0512PublicManifest.evidenceCount, 24, 'ML-0512 public manifest must advertise 24 evidence objects');
assert.equal(ml0512PublicManifest.deductionCount, 11, 'ML-0512 public manifest must advertise 11 deductions');
assert.equal(ml0512PublicManifest.runtimePolicy, 'server-authoritative-private-canon', 'ML-0512 must require private canon');
assert.equal(ml0512PublicManifest.clientContract.storyUnlockStateMayPersistWithoutContent, true, 'story unlock state must be separable from protected content');
assert.equal(ml0512PublicManifest.clientContract.receivesOnlyAuthorizedEvidenceContent, true, 'browser must receive only authorized evidence content');
assert.equal(ml0512PublicManifest.clientContract.entitlementEvaluatedServerSide, true, 'entitlement must be evaluated server-side');
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

let state = createInitialSoloState(contractCase);
state = open(state, 'A01');
state = open(state, 'A02');
state = solve(state, 'Q01');
for (const id of ['A03', 'A04', 'A05']) state = open(state, id);
state = solve(state, 'Q02');
assert(state.milestones.includes('DEMO_COMPLETE'), 'demo milestone missing');
assert(state.milestones.includes('DEMO_INSIGHT'), 'demo insight missing');

// Story progress can unlock premium evidence while entitlement still blocks access.
assert.equal(state.evidence.B01.unlocked, true, 'premium evidence should be story-unlocked after demo insight');
assert.equal(isEvidenceAccessible(contractCase, state, 'B01'), false, 'demo must not access story-unlocked premium evidence');
assert.throws(() => open(state, 'B01'), /solo_evidence_access_denied:B01/, 'demo opening premium evidence must fail');

// Club grants access without changing story progress.
state = act(state, { type: 'SET_ENTITLEMENT', entitlement: 'club' });
assert.equal(isEvidenceAccessible(contractCase, state, 'B01'), true, 'active Club must grant premium evidence access');
assert(state.milestones.includes('PREMIUM_EVER_ACTIVATED'), 'historical premium activation milestone missing');
state = act(state, { type: 'ADD_HYPOTHESIS', subjectId: 'alpha', claim: 'CAUSED_INCIDENT' });
state = open(state, 'B01');
assert.equal(state.evidence.B01.opened, true, 'premium evidence did not open under Club');
assert.equal(state.deductions.Q03.available, true, 'story deduction should become available after evidence opens');

// Club expiry removes access but keeps semantic progress intact.
state = act(state, { type: 'SET_ENTITLEMENT', entitlement: 'demo' });
assert.equal(state.evidence.B01.unlocked, true, 'Club expiry must not erase story unlock');
assert.equal(state.evidence.B01.opened, true, 'Club expiry must not erase opened evidence progress');
assert.equal(isEvidenceAccessible(contractCase, state, 'B01'), false, 'expired Club must revoke evidence access');
assert.equal(state.deductions.Q03.available, true, 'Club expiry must not erase story deduction availability');
assert.equal(isDeductionAccessible(contractCase, state, 'Q03'), false, 'expired Club must revoke premium deduction access');
assert.throws(() => present(state, 'B01', 'alpha'), /solo_present_invalid/, 'expired Club must block presenting premium evidence');
assert.throws(() => solve(state, 'Q03'), /solo_deduction_access_denied:Q03/, 'expired Club must block premium deduction attempts');

// Resubscribing resumes from the exact same state.
state = act(state, { type: 'SET_ENTITLEMENT', entitlement: 'club' });
assert.equal(isEvidenceAccessible(contractCase, state, 'B01'), true, 'renewed Club must restore evidence access');
assert.equal(isDeductionAccessible(contractCase, state, 'Q03'), true, 'renewed Club must restore deduction access');
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

assert(!state.milestones.includes('CONFESSION_OBTAINED'), 'confession triggered before proof presentation');
state = present(state, 'B05', 'beta');
state = present(state, 'B07', 'beta');
assert(state.milestones.includes('FINAL_INTERROGATION_AVAILABLE'), 'final interrogation not available');
assert(!state.milestones.includes('CONFESSION_OBTAINED'), 'confession triggered without explicit final confrontation');
assert(!state.milestones.includes('RECONSTRUCTION_AVAILABLE'), 'reconstruction leaked before confession');

// Access rules also protect the final interaction.
state = act(state, { type: 'SET_ENTITLEMENT', entitlement: 'demo' });
assert.throws(() => act(state, { type: 'TRIGGER_INTERACTION', interactionId: 'FINAL_BETA_CONFRONTATION' }), /solo_interaction_unavailable/, 'expired Club must block final confrontation');
state = act(state, { type: 'SET_ENTITLEMENT', entitlement: 'club' });
state = act(state, { type: 'TRIGGER_INTERACTION', interactionId: 'FINAL_BETA_CONFRONTATION' });
assert(state.milestones.includes('CONFESSION_OBTAINED'), 'explicit final confrontation did not trigger confession');
assert(state.milestones.includes('RECONSTRUCTION_AVAILABLE'), 'reconstruction not unlocked after confession');

// Reconstruction remains entitlement-protected without losing the unlocked final state.
state = act(state, { type: 'SET_ENTITLEMENT', entitlement: 'demo' });
assert(state.milestones.includes('RECONSTRUCTION_AVAILABLE'), 'Club expiry must not erase unlocked reconstruction state');
assert.throws(() => act(state, { type: 'SUBMIT_RECONSTRUCTION', answers: contractCase.expectedReconstruction }), /solo_reconstruction_access_denied/, 'expired Club must block reconstruction submission');
state = act(state, { type: 'SET_ENTITLEMENT', entitlement: 'club' });
state = act(state, { type: 'SUBMIT_RECONSTRUCTION', answers: contractCase.expectedReconstruction });
assert(state.completed, 'correct reconstruction did not complete contract case');
assert(state.milestones.includes('CASE_COMPLETED'), 'case completion milestone missing');

const roundTrip = JSON.parse(JSON.stringify(state));
assert.equal(roundTrip.completed, true, 'state roundtrip lost completion');
assert.equal(roundTrip.characters.beta.statementVersion, 3, 'statement-history state lost');
assert.equal(roundTrip.interactions.FINAL_BETA_CONFRONTATION.triggered, true, 'interaction state lost');
assert.equal(roundTrip.evidence.B01.opened, true, 'premium evidence progress lost across refresh roundtrip');

console.log(JSON.stringify({
  verdict: 'SOLO_ENGINE_V2_FOUNDATION_PASS',
  publicCanonBoundary: true,
  authorizedContentContract: true,
  storyUnlockSeparatedFromAccess: true,
  clubExpiryRevokesAccess: true,
  clubRenewalRestoresProgress: true,
  falseSolutionSupported: true,
  evidenceMustBeExamined: true,
  explicitFinalConfrontation: true,
  reconstructionAccessProtected: true,
  refreshRoundTrip: true
}, null, 2));
