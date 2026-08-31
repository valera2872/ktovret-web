import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='content/ai-cases/AI-11.manifest.json';
const raw=fs.readFileSync(file,'utf8');
const ai11=JSON.parse(raw);

assert.equal(ai11.case_id,'AI-11');
assert.equal(ai11.status,'draft');
assert.equal(ai11.suspect_count,4,'AI-11 must preserve the four-suspect interrogation shape');
assert.equal(ai11.initial_evidence_count,3,'AI-11 must preserve the reviewed initial evidence set');
assert.equal(ai11.hidden_evidence_count,7,'AI-11 needs the reviewed contamination/access evidence depth');
assert.equal(ai11.rule_count,12,'AI-11 reviewed dependency graph count changed; rerun private state-space');
assert.equal(ai11.private_gate.minimum_verified_solution_turns,12,'AI-11 reviewed critical path depth changed; rerun private state-space');
assert.equal(ai11.private_gate.dependency_cycles_detected,0,'AI-11 rule graph must remain acyclic');
assert.equal(ai11.private_gate.unknown_reference_count,0,'AI-11 private graph must not reference unknown evidence/notes');
assert.equal(ai11.publication?.payload_published,false,'AI-11 payload must remain draft before release');
assert.equal(ai11.publication?.canon_published,false,'AI-11 canon must remain draft before release');
assert.equal(ai11.publication?.avatar_profiles_published,0,'AI-11 Live profiles must stay unpublished before Live release readiness');
assert.equal(ai11.publication?.production_sessions_expected,0,'AI-11 must not have production player sessions while draft');

const qa=ai11.production_qa||{};
assert.equal(qa.completed,true,'AI-11 production QA must stay recorded after the reviewed run');
assert.equal(qa.model_path_verified,true,'AI-11 must exercise the real production model path');
assert.equal(qa.knowledge_boundary_hardened_before_qa,true,'AI-11 private speaking briefs must not expose the later shared-source mechanism at zero stage');
assert.equal(qa.zero_stage_suspects_checked,4,'all four AI-11 suspects need zero-stage leak checks');
assert.equal(qa.zero_stage_hidden_leaks,0,'AI-11 must not leak later contamination/access findings at zero stage');
assert.equal(qa.zero_stage_unexpected_unlocks,0,'AI-11 zero-stage questions must not unlock gated material');
assert.equal(qa.full_chain_turns,12,'AI-11 reviewed critical path depth changed; rerun production QA');
assert.equal(qa.full_chain_model_turns,11,'AI-11 critical path must leave only the terminal response deterministic');
assert.equal(qa.canonical_terminal_model_turns,0,'AI-11 canonical terminal must never spend a model turn');
assert.equal(qa.earliest_accounts_before_shared_source_verified,true,'AI-11 must recover both earliest witness accounts before the shared source becomes available');
assert.equal(qa.shared_source_reconstruction_verified,true,'AI-11 must reconstruct the common source instead of treating later matching testimony as independent');
assert.equal(qa.false_corroboration_collapse_verified,true,'AI-11 must explicitly collapse the false corroboration created by contamination');
assert.equal(qa.independent_false_suspect_exclusion_verified,true,'AI-11 must preserve an independent line excluding the falsely corroborated suspect');
assert.equal(qa.independent_access_line_verified,true,'AI-11 must preserve an independent access line after witness contamination is resolved');
assert.equal(qa.independent_control_line_verified,true,'AI-11 must preserve an independent control/system line separate from access');
assert.equal(qa.no_early_confession_verified,true,'AI-11 must remain cornered rather than confessing one turn early');
assert.equal(qa.full_chain_theory_passed,true,'AI-11 final theory must pass on the reviewed chain');
assert.equal(qa.session_rpm_compliance_verified,true,'AI-11 QA must respect the production session RPM window');
assert.equal(qa.metering_cleanup_verified,true,'AI-11 QA must leave production metering clean');
assert.equal(qa.qa_fixture_cleaned,true,'AI-11 QA fixtures must be removed after production tests');
assert.equal(qa.synthetic_day_budget_cleanup_verified,true,'AI-11 synthetic-only daily budget row must be removed after QA');
assert.equal(Number(qa.observed_zero_stage_cost_usd),0.000705,'AI-11 zero-stage QA cost changed; rerun and record the reviewed path');
assert.equal(Number(qa.observed_critical_path_cost_usd),0.0027954,'AI-11 critical-path QA cost changed; rerun and record the reviewed path');

for(const forbidden of ['culprit_id','terminal_reply','success_explanation','base_facts','admissions','initial_evidence','suspects','rules','theory']) {
  assert.doesNotMatch(raw,new RegExp(`"${forbidden}"\\s*:`,'i'),`AI-11 manifest leaks solution-bearing case data: ${forbidden}`);
}

console.log('AI-11 production QA contract: ok');
