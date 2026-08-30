import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='content/ai-cases/AI-07.manifest.json';
const raw=fs.readFileSync(file,'utf8');
const ai07=JSON.parse(raw);

assert.equal(ai07.case_id,'AI-07');
assert.equal(ai07.status,'draft');
assert.equal(ai07.suspect_count,4,'AI-07 must preserve the four-suspect interrogation shape');
assert.equal(ai07.initial_evidence_count,3,'AI-07 must begin from the reviewed eyewitness-identification evidence set');
assert.equal(ai07.hidden_evidence_count,6,'AI-07 needs the reviewed identification-contamination evidence depth');
assert.equal(ai07.rule_count,10,'AI-07 reviewed dependency graph count changed; rerun private state-space');
assert.equal(ai07.private_gate.minimum_verified_solution_turns,12,'AI-07 reviewed critical path depth changed; rerun private state-space');
assert.equal(ai07.private_gate.dependency_cycles_detected,0,'AI-07 rule graph must remain acyclic');
assert.equal(ai07.private_gate.unknown_reference_count,0,'AI-07 private graph must not reference unknown evidence/notes');
assert.equal(ai07.publication?.avatar_profiles_published,0,'AI-07 Live profiles must stay unpublished before Live release readiness');

const qa07=ai07.production_qa||{};
assert.equal(qa07.completed,true,'AI-07 production QA must stay recorded after the reviewed run');
assert.equal(qa07.model_path_verified,true,'AI-07 must exercise the real production model path');
assert.equal(qa07.zero_stage_suspects_checked,4,'all four AI-07 suspects need zero-stage leak checks');
assert.equal(qa07.zero_stage_hidden_leaks,0,'AI-07 must not leak gated identification-contamination findings at zero stage');
assert.equal(qa07.zero_stage_unexpected_unlocks,0,'AI-07 zero-stage questions must not unlock gated material');
assert.equal(qa07.full_chain_turns,12,'AI-07 reviewed critical path depth changed; rerun production QA');
assert.equal(qa07.full_chain_model_turns,11,'AI-07 critical path must leave only the terminal response deterministic');
assert.equal(qa07.canonical_terminal_model_turns,0,'AI-07 canonical terminal must never spend a model turn');
assert.equal(qa07.first_confidence_capture_verified,true,'AI-07 must preserve the first-confidence capture before feedback');
assert.equal(qa07.non_neutral_lineup_verified,true,'AI-07 must preserve the standout-fillers lineup audit');
assert.equal(qa07.confirming_feedback_inflation_verified,true,'AI-07 must preserve confidence inflation after confirming feedback');
assert.equal(qa07.pre_exposure_verified,true,'AI-07 must preserve the pre-lineup single-photo exposure finding');
assert.equal(qa07.independent_access_log_verified,true,'AI-07 must preserve the independent access-log line');
assert.equal(qa07.full_chain_theory_passed,true,'AI-07 final theory must pass on the reviewed chain');
assert.equal(qa07.no_early_confession_verified,true,'AI-07 must remain cornered rather than confessing one turn early');
assert.equal(qa07.session_rpm_compliance_verified,true,'AI-07 QA must respect the production session RPM window');
assert.equal(qa07.metering_cleanup_verified,true,'AI-07 QA must leave production metering clean');
assert.equal(qa07.qa_fixture_cleaned,true,'AI-07 QA fixtures must be removed after production tests');
assert.equal(Number(qa07.observed_zero_stage_cost_usd),0.000713,'AI-07 zero-stage QA cost changed; rerun and record the reviewed path');
assert.equal(Number(qa07.observed_critical_path_cost_usd),0.0029168,'AI-07 critical-path QA cost changed; rerun and record the reviewed path');

for(const forbidden of ['culprit_id','terminal_reply','success_explanation','base_facts','admissions','initial_evidence','suspects','rules','theory']) {
  assert.doesNotMatch(raw,new RegExp(`"${forbidden}"\\s*:`,'i'),`AI-07 manifest leaks solution-bearing case data: ${forbidden}`);
}

console.log('AI-07 production QA contract: ok');
