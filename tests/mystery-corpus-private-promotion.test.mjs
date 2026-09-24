import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const promote=path.join(repo,'tools/mystery-corpus/promote-reviewed-extraction.mjs');
const registry=path.join(repo,'tools/mystery-corpus/build-approved-corpus-registry.mjs');

function fixture(verdict='approved'){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'promotion-atomic-'));
 const dna={schema_version:'case_dna_v1',case_id:'approved-case',title:'Approved',
  source:{source_type:'real_case',rights_status:'government_public_record',rights_evidence_reference:'https://example/rights',rights_verified_date:'2026-09-24',ingestion_policy:'metadata_and_analysis_only',provenance:'source',source_reference:'https://example/source',raw_text_retained:false},
  incident:{category:'fraud',surface_problem:'x'},mechanism:{core_mechanism:'m',mechanism_tags:['m']},
  evidence:[{id:'E1',type:'document',provenance:'§1',fact:'f',availability_stage:0,reliability:'high',supports:['H1'],weakens:[],essential:true,corroborated_by:[],source_reason:'source'}],
  hypotheses:[{id:'H1',claim:'claim',supporting_evidence:['E1'],contradicting_evidence:[],viable_until_stage:0,canonical:true}],
  reveal:{recontextualized_facts:['E1'],causal_compression:'x',new_answer_changing_fact:false},
  fingerprint:{incident_tags:[],setting_tags:[],mechanism_tags:['m'],motive_tags:[],character_topology:[],evidence_topology:['doc'],reversal_tags:[],decisive_proof_tags:['doc'],signature_action_tags:[]}};
 const prov={schema_version:'case_dna_provenance_v1',case_id:'approved-case',source_snapshot:{provenance:'source',source_reference:'https://example/source',rights_status:'government_public_record',rights_evidence_reference:'https://example/rights',rights_verified_date:'2026-09-24',ingestion_policy:'metadata_and_analysis_only',snapshot_hash:null,snapshot_date:'2026-09-24'},claims:[
  {case_dna_path:'$.incident',status:'source_supported',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
  {case_dna_path:'$.mechanism.core_mechanism',status:'source_supported',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
  {case_dna_path:'$.evidence[0]',status:'source_supported',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
  {case_dna_path:'$.hypotheses[0]',status:'source_supported',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
  {case_dna_path:'$.reveal',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null}
 ],review:{review_status:'needs_review',reviewed_at:null,reviewer:null,notes:null}};
 const job={schema_version:'corpus_ingestion_job_v1',job_id:'job-1',source:{source_id:'source-1',title:'Source',source_family:'sec',source_type:'real_case',source_reference:'https://example/source',source_locator:null,rights_status:'government_public_record',rights_evidence_reference:'https://example/rights',rights_verified_date:'2026-09-24',ingestion_policy:'metadata_and_analysis_only',raw_text_retained:false,target_pattern_tags:[]},constraints:{retain_raw_text:false,copy_distinctive_plot:false,fabricate_unknowns:false,critical_claims_need_locators:true,output_language:'en',notes:[]},required_outputs:['case_dna_v1','case_dna_provenance_v1','extraction_notes']};
 const result={schema_version:'corpus_extraction_result_v1',extraction_run_id:'run-1',job_id:'job-1',extractor_id:'extractor-A',extracted_at:'2026-09-24',case_dna:dna,provenance:prov,extraction_notes:{}};
 const review={schema_version:'corpus_extraction_review_v1',extraction_run_id:'run-1',job_id:'job-1',case_id:'approved-case',extractor_id:'extractor-A',reviewer_id:'reviewer-B',reviewed_at:'2026-09-24',checks:{rights_policy_match:verdict==='approved',critical_claims_supported:verdict==='approved',unknowns_preserved:true,hypotheses_grounded:verdict==='approved',no_raw_text_leakage:true,no_distinctive_plot_copy:true},verdict,issues:verdict==='approved'?[]:[{severity:'fail',code:'X',message:'bad'}],notes:null};
 const rf=path.join(dir,'result.json'),vf=path.join(dir,'review.json'),jf=path.join(dir,'job.json'),dest=path.join(dir,'approved');
 fs.writeFileSync(rf,JSON.stringify(result));fs.writeFileSync(vf,JSON.stringify(review));fs.writeFileSync(jf,JSON.stringify(job));
 return{dir,rf,vf,jf,dest};
}
test('promotion defaults to dry-run and writes no files',()=>{
 const f=fixture('approved');
 const r=spawnSync(process.execPath,[promote,'--result',f.rf,'--review',f.vf,'--job',f.jf,'--dest',f.dest],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/ELIGIBLE_DRY_RUN/);assert.equal(fs.existsSync(f.dest),false);
});
test('explicit execute writes immutable case plus promotion receipt and registry validates it',()=>{
 const f=fixture('approved');
 const r=spawnSync(process.execPath,[promote,'--result',f.rf,'--review',f.vf,'--job',f.jf,'--dest',f.dest,'--execute'],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);assert.ok(fs.existsSync(path.join(f.dest,'approved-case.json')));assert.ok(fs.existsSync(path.join(f.dest,'approved-case.promotion.json')));
 const rr=spawnSync(process.execPath,[registry,'--dir',f.dest],{cwd:repo,encoding:'utf8'});assert.equal(rr.status,0,rr.stderr);assert.match(rr.stdout,/approved_corpus_registry_v1/);
});
test('needs-rework review cannot promote',()=>{
 const f=fixture('needs_rework');
 const r=spawnSync(process.execPath,[promote,'--result',f.rf,'--review',f.vf,'--job',f.jf,'--dest',f.dest,'--execute'],{cwd:repo,encoding:'utf8'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/Promotion REFUSED/);assert.equal(fs.existsSync(f.dest),false);
});
test('explicit promotion refuses implicit overwrite',()=>{
 const f=fixture('approved');
 const a=spawnSync(process.execPath,[promote,'--result',f.rf,'--review',f.vf,'--job',f.jf,'--dest',f.dest,'--execute'],{cwd:repo,encoding:'utf8'});assert.equal(a.status,0,a.stderr);
 const b=spawnSync(process.execPath,[promote,'--result',f.rf,'--review',f.vf,'--job',f.jf,'--dest',f.dest,'--execute'],{cwd:repo,encoding:'utf8'});assert.notEqual(b.status,0);assert.match(b.stderr,/No implicit overwrite/);
});


test('same-source approved record requires explicit supersedes lineage',()=>{
 const f=fixture('approved');
 const legacy=path.join(f.dir,'legacy');fs.mkdirSync(legacy);
 const legacyCase=JSON.parse(fs.readFileSync(f.rf,'utf8')).case_dna;
 legacyCase.case_id='legacy-case';
 fs.writeFileSync(path.join(legacy,'legacy-case.json'),JSON.stringify(legacyCase));
 const blocked=spawnSync(process.execPath,[promote,'--result',f.rf,'--review',f.vf,'--job',f.jf,'--dest',f.dest,'--approved-reference-dir',legacy],{cwd:repo,encoding:'utf8'});
 assert.notEqual(blocked.status,0);
 assert.match(blocked.stderr,/Explicit --supersedes/);
 const allowed=spawnSync(process.execPath,[promote,'--result',f.rf,'--review',f.vf,'--job',f.jf,'--dest',f.dest,'--approved-reference-dir',legacy,'--supersedes','legacy-case'],{cwd:repo,encoding:'utf8'});
 assert.equal(allowed.status,0,allowed.stderr);
 const out=JSON.parse(allowed.stdout);
 assert.equal(out.source_lineage.supersedes_case_id,'legacy-case');
 assert.equal(out.receipt.same_source_collision_count,1);
});

test('supersedes cannot name an unrelated approved case',()=>{
 const f=fixture('approved');
 const legacy=path.join(f.dir,'legacy');fs.mkdirSync(legacy);
 const legacyCase=JSON.parse(fs.readFileSync(f.rf,'utf8')).case_dna;
 legacyCase.case_id='legacy-case';
 fs.writeFileSync(path.join(legacy,'legacy-case.json'),JSON.stringify(legacyCase));
 const r=spawnSync(process.execPath,[promote,'--result',f.rf,'--review',f.vf,'--job',f.jf,'--dest',f.dest,'--approved-reference-dir',legacy,'--supersedes','different-case'],{cwd:repo,encoding:'utf8'});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/does not match an approved same-source case/);
});
