import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT='content/ai-cases';
const SHA=/^[0-9a-f]{64}$/;
const manifests=fs.readdirSync(ROOT).filter(name=>name.endsWith('.manifest.json')).sort();
assert.ok(manifests.length>=1,'at least one AI case manifest is required');

for(const name of manifests){
  const file=path.join(ROOT,name);
  const raw=fs.readFileSync(file,'utf8');
  const data=JSON.parse(raw);

  assert.match(String(data.case_id||''),/^AI-[0-9]{2,}$/,'case id must use the paid AI namespace');
  assert.match(String(data.product_id||''),/^[A-Za-z0-9_.:-]{2,160}$/,'product id must be server-scope safe');
  assert.ok(['draft','published','retired'].includes(data.status),'manifest status must be explicit');
  assert.ok(Number.isInteger(data.payload_version)&&data.payload_version>0,'payload version required');
  assert.ok(Number.isInteger(data.canon_version)&&data.canon_version>0,'canon version required');
  assert.ok(Number.isInteger(data.max_turns)&&data.max_turns>=5&&data.max_turns<=60,'turn cap must match v2 bounds');
  assert.ok(Number.isInteger(data.suspect_count)&&data.suspect_count>=2&&data.suspect_count<=8,'suspect count must match v2 bounds');
  assert.ok(Number.isInteger(data.initial_evidence_count)&&data.initial_evidence_count>=1,'initial evidence count required');
  assert.ok(Number.isInteger(data.hidden_evidence_count)&&data.hidden_evidence_count>=1,'AI paid case must have gated discovery');
  assert.ok(Number.isInteger(data.rule_count)&&data.rule_count>=1,'rule count required');
  assert.match(String(data.payload_jsonb_sha256||''),SHA,'payload database hash required');
  assert.match(String(data.private_canon_jsonb_sha256||''),SHA,'private canon database hash required');

  const gate=data.private_gate||{};
  assert.equal(gate.checked,true,'private state-space gate must be recorded');
  assert.ok(Number.isInteger(gate.minimum_verified_solution_turns)&&gate.minimum_verified_solution_turns>0,'verified solution depth required');
  assert.ok(gate.minimum_verified_solution_turns<=data.max_turns,'verified solution must fit under max turns');
  assert.equal(gate.terminal_requires_all_core_evidence,true,'terminal must require the core evidence set');
  assert.equal(gate.terminal_requires_progressive_contradictions,true,'terminal must require progressive interrogation state');
  assert.equal(gate.wrong_suspect_terminal_reachable,false,'wrong suspect terminal must be impossible');
  assert.equal(gate.missing_required_evidence_terminal_reachable,false,'missing evidence must block terminal');
  assert.equal(gate.missing_required_note_terminal_reachable,false,'missing contradiction must block terminal');

  for(const forbidden of ['culprit_id','terminal_reply','success_explanation','base_facts','admissions','initial_evidence','suspects','rules','theory']){
    assert.doesNotMatch(raw,new RegExp(`"${forbidden}"\\s*:`,'i'),`${file} leaks solution-bearing case data: ${forbidden}`);
  }
  assert.doesNotMatch(raw,/признал|призналась|виновн|убийц|похитил|подменил|украл/i,`${file} must stay spoiler-safe`);

  if(data.status==='draft'){
    assert.equal(data.publication?.payload_published,false,'draft payload must not claim publication');
    assert.equal(data.publication?.canon_published,false,'draft canon must not claim publication');
    assert.equal(data.publication?.production_sessions_expected,0,'draft case should not expect player sessions');
  }
}

const ai02=JSON.parse(fs.readFileSync(path.join(ROOT,'AI-02.manifest.json'),'utf8'));
assert.equal(ai02.case_id,'AI-02');
assert.equal(ai02.status,'draft');
assert.equal(ai02.suspect_count,4,'AI-02 must exercise more than the three-suspect AI-01 slice');
assert.equal(ai02.initial_evidence_count,3,'AI-02 starts from a compact neutral evidence set');
assert.equal(ai02.hidden_evidence_count,5,'AI-02 needs multiple independently earned evidence lines');
assert.equal(ai02.rule_count,9,'AI-02 reviewed private rule graph count changed; rerun private gate and refresh manifest');
assert.equal(ai02.private_gate.minimum_verified_solution_turns,10,'AI-02 solution depth changed; rerun private state-space before accepting');
const qa02=ai02.production_qa||{};
assert.equal(qa02.completed,true,'AI-02 production QA must stay recorded after the reviewed run');
assert.equal(qa02.model_path_verified,true,'AI-02 must have a real production model-path check');
assert.equal(qa02.model,'gpt-5.6-luna','AI-02 reviewed model changed; rerun production QA before accepting');
assert.equal(qa02.zero_stage_suspects_checked,4,'all four AI-02 suspects need zero-stage leak checks');
assert.equal(qa02.zero_stage_hidden_leaks,0,'AI-02 zero-stage model path must not leak hidden canon');
assert.equal(qa02.zero_stage_unexpected_unlocks,0,'AI-02 zero-stage questions must not unlock gated material');
assert.equal(qa02.full_chain_turns,10,'AI-02 reviewed critical path depth changed; rerun full-chain QA');
assert.equal(qa02.full_chain_model_turns,9,'AI-02 critical path must keep the terminal confession deterministic');
assert.equal(qa02.canonical_terminal_model_turns,0,'canonical terminal must never spend a model turn');
assert.equal(qa02.full_chain_theory_passed,true,'AI-02 reviewed full-chain theory check must pass');
assert.equal(qa02.no_early_confession_verified,true,'AI-02 must prove the confession cannot occur one turn early');
assert.equal(qa02.session_rpm_fail_closed_verified,true,'AI-02 QA must preserve the production session RPM guard');
assert.equal(qa02.metering_cleanup_verified,true,'AI-02 QA must leave production metering clean');
assert.equal(qa02.qa_fixture_cleaned,true,'AI-02 QA fixtures must be removed after production tests');

const ai03=JSON.parse(fs.readFileSync(path.join(ROOT,'AI-03.manifest.json'),'utf8'));
assert.equal(ai03.case_id,'AI-03');
assert.equal(ai03.status,'draft');
assert.equal(ai03.suspect_count,4,'AI-03 must preserve the four-suspect interrogation shape');
assert.equal(ai03.initial_evidence_count,3,'AI-03 should begin from a deliberately misleading compact evidence set');
assert.equal(ai03.hidden_evidence_count,6,'AI-03 needs the reviewed late-stage reversal evidence depth');
assert.equal(ai03.rule_count,11,'AI-03 reviewed dependency graph count changed; rerun private state-space');
assert.equal(ai03.private_gate.minimum_verified_solution_turns,12,'AI-03 reviewed critical path depth changed; rerun private state-space');
assert.equal(ai03.private_gate.dependency_cycles_detected,0,'AI-03 rule graph must remain acyclic');
assert.equal(ai03.private_gate.unknown_reference_count,0,'AI-03 private graph must not reference unknown evidence/notes');
assert.equal(ai03.publication?.avatar_profiles_published,0,'AI-03 Live profiles must stay unpublished while LiveAvatar credentials are unavailable');
const qa03=ai03.production_qa||{};
assert.equal(qa03.completed,true,'AI-03 production QA must stay recorded after the reviewed run');
assert.equal(qa03.model_path_verified,true,'AI-03 must exercise the real production model path');
assert.equal(qa03.zero_stage_suspects_checked,4,'all four AI-03 suspects need zero-stage leak checks');
assert.equal(qa03.zero_stage_hidden_leaks,0,'AI-03 must not leak late reversal evidence at zero stage');
assert.equal(qa03.zero_stage_unexpected_unlocks,0,'AI-03 zero-stage questions must not unlock gated material');
assert.equal(qa03.full_chain_turns,12,'AI-03 reviewed critical path depth changed; rerun production QA');
assert.equal(qa03.full_chain_model_turns,11,'AI-03 critical path must leave only the terminal response deterministic');
assert.equal(qa03.canonical_terminal_model_turns,0,'AI-03 canonical terminal must never spend a model turn');
assert.equal(qa03.fair_play_red_herring_reversal_verified,true,'AI-03 must prove the early red herring is later overturned by earned evidence');
assert.equal(qa03.full_chain_theory_passed,true,'AI-03 final theory must pass on the reviewed chain');
assert.equal(qa03.no_early_confession_verified,true,'AI-03 must remain cornered rather than confessing one turn early');
assert.equal(qa03.session_rpm_compliance_verified,true,'AI-03 QA must respect the production session RPM window');
assert.equal(qa03.metering_cleanup_verified,true,'AI-03 QA must leave production metering clean');
assert.equal(qa03.qa_fixture_cleaned,true,'AI-03 QA fixtures must be removed after production tests');
assert.ok(Number(qa03.observed_zero_stage_cost_usd)>=0,'AI-03 zero-stage QA cost must be recorded');
assert.ok(Number(qa03.observed_critical_path_cost_usd)>=0,'AI-03 critical-path QA cost must be recorded');

const ai04=JSON.parse(fs.readFileSync(path.join(ROOT,'AI-04.manifest.json'),'utf8'));
assert.equal(ai04.case_id,'AI-04');
assert.equal(ai04.status,'draft');
assert.equal(ai04.suspect_count,4,'AI-04 must preserve the four-suspect interrogation shape');
assert.equal(ai04.initial_evidence_count,3,'AI-04 must start from the reviewed spatial reconstruction evidence set');
assert.equal(ai04.hidden_evidence_count,6,'AI-04 needs the reviewed route-elimination evidence depth');
assert.equal(ai04.rule_count,11,'AI-04 reviewed dependency graph count changed; rerun private state-space');
assert.equal(ai04.private_gate.minimum_verified_solution_turns,12,'AI-04 reviewed critical path depth changed; rerun private state-space');
assert.equal(ai04.private_gate.dependency_cycles_detected,0,'AI-04 rule graph must remain acyclic');
assert.equal(ai04.private_gate.unknown_reference_count,0,'AI-04 private graph must not reference unknown evidence/notes');
assert.equal(ai04.publication?.avatar_profiles_published,0,'AI-04 Live profiles must stay unpublished before Live release readiness');
const qa04=ai04.production_qa||{};
assert.equal(qa04.completed,true,'AI-04 production QA must stay recorded after the reviewed run');
assert.equal(qa04.model_path_verified,true,'AI-04 must exercise the real production model path');
assert.equal(qa04.zero_stage_suspects_checked,4,'all four AI-04 suspects need zero-stage leak checks');
assert.equal(qa04.zero_stage_hidden_leaks,0,'AI-04 must not leak gated spatial measurements at zero stage');
assert.equal(qa04.zero_stage_unexpected_unlocks,0,'AI-04 zero-stage questions must not unlock gated material');
assert.equal(qa04.full_chain_turns,12,'AI-04 reviewed critical path depth changed; rerun production QA');
assert.equal(qa04.full_chain_model_turns,11,'AI-04 critical path must leave only the terminal response deterministic');
assert.equal(qa04.canonical_terminal_model_turns,0,'AI-04 canonical terminal must never spend a model turn');
assert.equal(qa04.spatial_route_elimination_verified,true,'AI-04 must prove the reviewed impossible-route elimination chain');
assert.equal(qa04.material_route_trace_verified,true,'AI-04 must prove the earned material trace corroborates the reconstructed route');
assert.equal(qa04.full_chain_theory_passed,true,'AI-04 final theory must pass on the reviewed chain');
assert.equal(qa04.no_early_confession_verified,true,'AI-04 must remain cornered rather than confessing one turn early');
assert.equal(qa04.session_rpm_compliance_verified,true,'AI-04 QA must respect the production session RPM window');
assert.equal(qa04.metering_cleanup_verified,true,'AI-04 QA must leave production metering clean');
assert.equal(qa04.qa_fixture_cleaned,true,'AI-04 QA fixtures must be removed after production tests');
assert.ok(Number(qa04.observed_zero_stage_cost_usd)>=0,'AI-04 zero-stage QA cost must be recorded');
assert.ok(Number(qa04.observed_critical_path_cost_usd)>=0,'AI-04 critical-path QA cost must be recorded');

console.log(`AI case spoiler-safe manifests: ok (${manifests.length})`);
