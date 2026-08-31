import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='content/ai-cases/AI-09.manifest.json';
const raw=fs.readFileSync(file,'utf8');
const ai09=JSON.parse(raw);

assert.equal(ai09.case_id,'AI-09');
assert.equal(ai09.status,'draft');
assert.equal(ai09.suspect_count,4,'AI-09 must preserve the four-suspect interrogation shape');
assert.equal(ai09.initial_evidence_count,3,'AI-09 must begin from the reviewed audio-source evidence set');
assert.equal(ai09.hidden_evidence_count,6,'AI-09 needs the reviewed acoustic/source-provenance evidence depth');
assert.equal(ai09.rule_count,11,'AI-09 reviewed dependency graph count changed; rerun private state-space');
assert.equal(ai09.private_gate.minimum_verified_solution_turns,12,'AI-09 reviewed critical path depth changed; rerun private state-space');
assert.equal(ai09.private_gate.dependency_cycles_detected,0,'AI-09 rule graph must remain acyclic');
assert.equal(ai09.private_gate.unknown_reference_count,0,'AI-09 private graph must not reference unknown evidence/notes');
assert.equal(ai09.publication?.avatar_profiles_published,0,'AI-09 Live profiles must stay unpublished before Live release readiness');

const qa=ai09.production_qa||{};
assert.equal(qa.completed,true,'AI-09 production QA must stay recorded after the reviewed run');
assert.equal(qa.model_path_verified,true,'AI-09 must exercise the real production model path');
assert.equal(qa.zero_stage_suspects_checked,4,'all four AI-09 suspects need zero-stage leak checks');
assert.equal(qa.zero_stage_hidden_leaks,0,'AI-09 must not leak gated acoustic/source findings at zero stage');
assert.equal(qa.zero_stage_unexpected_unlocks,0,'AI-09 zero-stage questions must not unlock gated material');
assert.equal(qa.full_chain_turns,12,'AI-09 reviewed critical path depth changed; rerun production QA');
assert.equal(qa.full_chain_model_turns,11,'AI-09 critical path must leave only the terminal response deterministic');
assert.equal(qa.canonical_terminal_model_turns,0,'AI-09 canonical terminal must never spend a model turn');
assert.equal(qa.earliest_source_recovery_verified,true,'AI-09 must preserve recovery of the earliest available recording');
assert.equal(qa.independent_acoustic_anchors_verified,true,'AI-09 must preserve two independently anchored background events');
assert.equal(qa.continuity_break_verified,true,'AI-09 must preserve the continuity-break evidence line');
assert.equal(qa.source_take_reconstruction_verified,true,'AI-09 must preserve reconstruction from source takes');
assert.equal(qa.independent_physical_access_verified,true,'AI-09 must preserve the independent physical-access evidence line');
assert.equal(qa.full_chain_theory_passed,true,'AI-09 final theory must pass on the reviewed chain');
assert.equal(qa.no_early_confession_verified,true,'AI-09 must remain cornered rather than confessing one turn early');
assert.equal(qa.session_rpm_compliance_verified,true,'AI-09 QA must respect the production session RPM window');
assert.equal(qa.cross_utc_midnight_cleanup_verified,true,'AI-09 cleanup must preserve quota accounting across UTC midnight');
assert.equal(qa.metering_cleanup_verified,true,'AI-09 QA must leave production metering clean');
assert.equal(qa.qa_fixture_cleaned,true,'AI-09 QA fixtures must be removed after production tests');
assert.equal(Number(qa.observed_zero_stage_cost_usd),0.0006908,'AI-09 zero-stage QA cost changed; rerun and record the reviewed path');
assert.equal(Number(qa.observed_critical_path_cost_usd),0.0029308,'AI-09 critical-path QA cost changed; rerun and record the reviewed path');

for(const forbidden of ['culprit_id','terminal_reply','success_explanation','base_facts','admissions','initial_evidence','suspects','rules','theory']) {
  assert.doesNotMatch(raw,new RegExp(`"${forbidden}"\\s*:`,'i'),`AI-09 manifest leaks solution-bearing case data: ${forbidden}`);
}

console.log('AI-09 production QA contract: ok');
