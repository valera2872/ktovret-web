import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='content/ai-cases/AI-08.manifest.json';
const raw=fs.readFileSync(file,'utf8');
const ai08=JSON.parse(raw);

assert.equal(ai08.case_id,'AI-08');
assert.equal(ai08.status,'draft');
assert.equal(ai08.suspect_count,4,'AI-08 must preserve the four-suspect interrogation shape');
assert.equal(ai08.initial_evidence_count,3,'AI-08 must begin from the reviewed raw-timestamp evidence set');
assert.equal(ai08.hidden_evidence_count,6,'AI-08 needs the reviewed multi-clock reconstruction depth');
assert.equal(ai08.rule_count,11,'AI-08 reviewed dependency graph count changed; rerun private state-space');
assert.equal(ai08.private_gate.minimum_verified_solution_turns,12,'AI-08 reviewed critical path depth changed; rerun private state-space');
assert.equal(ai08.private_gate.dependency_cycles_detected,0,'AI-08 rule graph must remain acyclic');
assert.equal(ai08.private_gate.unknown_reference_count,0,'AI-08 private graph must not reference unknown evidence/notes');
assert.equal(ai08.publication?.avatar_profiles_published,0,'AI-08 Live profiles must stay unpublished before Live release readiness');

const qa=ai08.production_qa||{};
assert.equal(qa.completed,true,'AI-08 production QA must stay recorded after the reviewed run');
assert.equal(qa.model_path_verified,true,'AI-08 must exercise the real production model path');
assert.equal(qa.runtime_schema_contract_verified,true,'AI-08 private canon must preserve the v2 runtime schema contract');
assert.equal(qa.zero_stage_suspects_checked,4,'all four AI-08 suspects need zero-stage leak checks');
assert.equal(qa.zero_stage_hidden_leaks,0,'AI-08 must not leak gated clock offsets or normalized timeline findings at zero stage');
assert.equal(qa.zero_stage_unexpected_unlocks,0,'AI-08 zero-stage questions must not unlock gated material');
assert.equal(qa.full_chain_turns,12,'AI-08 reviewed critical path depth changed; rerun production QA');
assert.equal(qa.full_chain_model_turns,11,'AI-08 critical path must leave only the terminal response deterministic');
assert.equal(qa.canonical_terminal_model_turns,0,'AI-08 canonical terminal must never spend a model turn');
assert.equal(qa.cctv_clock_calibration_verified,true,'AI-08 must preserve independent CCTV clock calibration');
assert.equal(qa.server_clock_calibration_verified,true,'AI-08 must preserve independent server clock calibration');
assert.equal(qa.access_controller_calibration_verified,true,'AI-08 must preserve independent access-controller clock calibration');
assert.equal(qa.timur_timeline_normalization_verified,true,'AI-08 must preserve the normalized Timur timeline');
assert.equal(qa.roman_alibi_normalization_verified,true,'AI-08 must preserve the normalized Roman alibi');
assert.equal(qa.master_card_access_verified,true,'AI-08 must preserve the late master-card access line');
assert.equal(qa.full_chain_theory_passed,true,'AI-08 final theory must pass on the reviewed chain');
assert.equal(qa.no_early_confession_verified,true,'AI-08 must remain cornered rather than confessing one turn early');
assert.equal(qa.session_rpm_compliance_verified,true,'AI-08 QA must respect the production session RPM window');
assert.equal(qa.metering_cleanup_verified,true,'AI-08 QA must leave production metering clean');
assert.equal(qa.qa_fixture_cleaned,true,'AI-08 QA fixtures must be removed after production tests');
assert.equal(Number(qa.observed_zero_stage_cost_usd),0.0007194,'AI-08 zero-stage QA cost changed; rerun and record the reviewed path');
assert.equal(Number(qa.observed_critical_path_cost_usd),0.0030304,'AI-08 critical-path QA cost changed; rerun and record the reviewed path');

for(const forbidden of ['culprit_id','terminal_reply','success_explanation','base_facts','admissions','initial_evidence','suspects','rules','theory']) {
  assert.doesNotMatch(raw,new RegExp(`"${forbidden}"\\s*:`,'i'),`AI-08 manifest leaks solution-bearing case data: ${forbidden}`);
}

console.log('AI-08 production QA contract: ok');
