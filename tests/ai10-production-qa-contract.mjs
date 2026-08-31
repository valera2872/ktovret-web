import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='content/ai-cases/AI-10.manifest.json';
const raw=fs.readFileSync(file,'utf8');
const ai10=JSON.parse(raw);

assert.equal(ai10.case_id,'AI-10');
assert.equal(ai10.status,'draft');
assert.equal(ai10.suspect_count,4,'AI-10 must preserve the four-suspect interrogation shape');
assert.equal(ai10.initial_evidence_count,3,'AI-10 must preserve the reviewed initial evidence set');
assert.equal(ai10.hidden_evidence_count,6,'AI-10 needs the reviewed staged-scene evidence depth');
assert.equal(ai10.rule_count,11,'AI-10 reviewed dependency graph count changed; rerun private state-space');
assert.equal(ai10.private_gate.minimum_verified_solution_turns,12,'AI-10 reviewed critical path depth changed; rerun private state-space');
assert.equal(ai10.private_gate.dependency_cycles_detected,0,'AI-10 rule graph must remain acyclic');
assert.equal(ai10.private_gate.unknown_reference_count,0,'AI-10 private graph must not reference unknown evidence/notes');
assert.equal(ai10.publication?.payload_published,false,'AI-10 payload must remain draft before release');
assert.equal(ai10.publication?.canon_published,false,'AI-10 canon must remain draft before release');
assert.equal(ai10.publication?.avatar_profiles_published,0,'AI-10 Live profiles must stay unpublished before Live release readiness');
assert.equal(ai10.publication?.production_sessions_expected,0,'AI-10 must not have production player sessions while draft');

const qa=ai10.production_qa||{};
assert.equal(qa.completed,true,'AI-10 production QA must stay recorded after the reviewed run');
assert.equal(qa.model_path_verified,true,'AI-10 must exercise the real production model path');
assert.equal(qa.zero_stage_suspects_checked,4,'all four AI-10 suspects need zero-stage leak checks');
assert.equal(qa.zero_stage_hidden_leaks,0,'AI-10 must not leak gated staged-scene findings at zero stage');
assert.equal(qa.zero_stage_unexpected_unlocks,0,'AI-10 zero-stage questions must not unlock gated material');
assert.equal(qa.full_chain_turns,12,'AI-10 reviewed critical path depth changed; rerun production QA');
assert.equal(qa.full_chain_model_turns,11,'AI-10 critical path must leave only the terminal response deterministic');
assert.equal(qa.canonical_terminal_model_turns,0,'AI-10 canonical terminal must never spend a model turn');
assert.equal(qa.scene_retention_control_verified,true,'AI-10 must first establish that the claimed route would preserve a recoverable trace');
assert.equal(qa.missing_transfer_requires_control_verified,true,'AI-10 must never treat missing transfer as evidence before the retention control');
assert.equal(qa.independent_scene_lines_verified,true,'AI-10 must preserve independent scene-integrity evidence beyond the missing transfer');
assert.equal(qa.internal_route_reconstruction_verified,true,'AI-10 must preserve the independent internal-route reconstruction');
assert.equal(qa.independent_access_verified,true,'AI-10 must preserve an independent access line separate from scene reconstruction');
assert.equal(qa.no_early_confession_verified,true,'AI-10 must remain cornered rather than confessing one turn early');
assert.equal(qa.full_chain_theory_passed,true,'AI-10 final theory must pass on the reviewed chain');
assert.equal(qa.session_rpm_compliance_verified,true,'AI-10 QA must respect the production session RPM window');
assert.equal(qa.metering_cleanup_verified,true,'AI-10 QA must leave production metering clean');
assert.equal(qa.qa_fixture_cleaned,true,'AI-10 QA fixtures must be removed after production tests');
assert.equal(qa.synthetic_day_budget_cleanup_verified,true,'AI-10 synthetic-only daily budget row must be removed after QA');
assert.equal(Number(qa.observed_zero_stage_cost_usd),0.0006964,'AI-10 zero-stage QA cost changed; rerun and record the reviewed path');
assert.equal(Number(qa.observed_critical_path_cost_usd),0.0030134,'AI-10 critical-path QA cost changed; rerun and record the reviewed path');

for(const forbidden of ['culprit_id','terminal_reply','success_explanation','base_facts','admissions','initial_evidence','suspects','rules','theory']) {
  assert.doesNotMatch(raw,new RegExp(`"${forbidden}"\\s*:`,'i'),`AI-10 manifest leaks solution-bearing case data: ${forbidden}`);
}

console.log('AI-10 production QA contract: ok');
