import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const prompt=path.join(repo,'tools/mystery-corpus/build-extraction-review-prompt.mjs');
const promotion=path.join(repo,'tools/mystery-corpus/validate-ingestion-promotion.mjs');

function caseDna(){
 return {
  schema_version:'case_dna_v1',case_id:'source-derived',title:'Derived',
  source:{source_type:'real_case',rights_status:'government_public_record',ingestion_policy:'metadata_and_analysis_only',provenance:'agency page',source_reference:'https://example.test',raw_text_retained:false},
  incident:{category:'fraud',surface_problem:'A discrepancy must be explained.',setting:'office',stakes:'Find cause',crime_required:true},
  mechanism:{core_mechanism:'records conceal actual state',mechanism_tags:['false-records'],secondary_traces:[]},
  evidence:[{id:'E1',type:'document',provenance:'§3',fact:'Record A conflicts with record B.',availability_stage:0,reliability:'high',supports:['HC'],weakens:['HA'],essential:true,corroborated_by:[],source_reason:'official report'}],
  hypotheses:[
   {id:'HC',claim:'intentional falsification',supporting_evidence:['E1'],contradicting_evidence:[],viable_until_stage:0,canonical:true},
   {id:'HA',claim:'clerical error',supporting_evidence:[],contradicting_evidence:['E1'],viable_until_stage:0,canonical:false}
  ],
  reveal:{recontextualized_facts:['E1'],causal_compression:'Systematic conflict.',signature_moment:'',retell_hook:'',new_answer_changing_fact:false},
  fingerprint:{incident_tags:['fraud'],setting_tags:['office'],mechanism_tags:['false-records'],motive_tags:[],character_topology:[],evidence_topology:['document-conflict'],reversal_tags:[],decisive_proof_tags:['cross-record-conflict'],signature_action_tags:[]}
 };
}
function provenance(){
 return {
  schema_version:'case_dna_provenance_v1',case_id:'source-derived',
  source_snapshot:{provenance:'agency page',source_reference:'https://example.test',rights_status:'government_public_record',ingestion_policy:'metadata_and_analysis_only',snapshot_hash:null,snapshot_date:'2026-09-23'},
  claims:[
   {case_dna_path:'$.incident.surface_problem',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
   {case_dna_path:'$.mechanism.core_mechanism',status:'abstracted_from_source',materiality:'critical',source_locator:'§2',support_note:null,reviewer_note:null},
   {case_dna_path:'$.evidence[0]',status:'source_supported',materiality:'critical',source_locator:'§3',support_note:null,reviewer_note:null},
   {case_dna_path:'$.hypotheses[0]',status:'abstracted_from_source',materiality:'critical',source_locator:'§4',support_note:null,reviewer_note:null},
   {case_dna_path:'$.reveal',status:'abstracted_from_source',materiality:'critical',source_locator:'§5',support_note:null,reviewer_note:null}
  ],
  review:{review_status:'needs_review',reviewed_at:null,reviewer:null,notes:null}
 };
}
function job(){
 return {
  schema_version:'corpus_ingestion_job_v1',job_id:'batch:source',
  source:{source_id:'source',title:'Source',source_family:'fbi_history',source_type:'real_case',source_reference:'https://example.test',source_locator:null,rights_status:'government_public_record',ingestion_policy:'metadata_and_analysis_only',raw_text_retained:false,target_pattern_tags:[]},
  constraints:{retain_raw_text:false,copy_distinctive_plot:false,fabricate_unknowns:false,critical_claims_need_locators:true,output_language:'en',notes:[]},
  required_outputs:['case_dna_v1','case_dna_provenance_v1','extraction_notes']
 };
}
function result(){
 return {schema_version:'corpus_extraction_result_v1',extraction_run_id:'run1',job_id:'batch:source',extractor_id:'extractor-A',extracted_at:'2026-09-23',case_dna:caseDna(),provenance:provenance(),extraction_notes:{}};
}
function review(verdict='approved'){
 return {
  schema_version:'corpus_extraction_review_v1',extraction_run_id:'run1',job_id:'batch:source',case_id:'source-derived',extractor_id:'extractor-A',reviewer_id:'reviewer-B',reviewed_at:'2026-09-23T20:00:00Z',
  checks:{rights_policy_match:true,critical_claims_supported:true,unknowns_preserved:true,hypotheses_grounded:true,no_raw_text_leakage:true,no_distinctive_plot_copy:true},
  verdict,issues:verdict==='approved'?[]:[{severity:'fail',code:'GROUNDING',message:'needs correction',case_dna_path:'$.evidence[0]',source_locator:'§3'}],notes:null
 };
}
function files(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'promotion-fixture-'));
 const jf=path.join(dir,'job.json'),rf=path.join(dir,'result.json'),vf=path.join(dir,'review.json');
 fs.writeFileSync(jf,JSON.stringify(job())); fs.writeFileSync(rf,JSON.stringify(result()));
 return {dir,jf,rf,vf};
}

test('review prompt refuses same extractor as reviewer',()=>{
 const {jf,rf}=files();
 const r=spawnSync(process.execPath,[prompt,'--result',rf,'--job',jf,'--reviewer-id','extractor-A'],{encoding:'utf8'});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/must differ from extractor_id/);
});

test('review prompt exposes source reference and hard checks to an independent reviewer',()=>{
 const {jf,rf}=files();
 const r=spawnSync(process.execPath,[prompt,'--result',rf,'--job',jf,'--reviewer-id','reviewer-B'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const p=JSON.parse(r.stdout);
 assert.equal(p.reviewer_id,'reviewer-B');
 assert.equal(p.source_to_verify.source_reference,'https://example.test');
 assert.ok(p.required_checks.includes('critical_claims_supported'));
});

test('approved independent review makes extraction eligible for promotion',()=>{
 const {jf,rf,vf}=files(); fs.writeFileSync(vf,JSON.stringify(review('approved')));
 const r=spawnSync(process.execPath,[promotion,'--result',rf,'--review',vf,'--job',jf],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/eligible_for_private_corpus/);
});

test('needs_rework review cannot promote extraction',()=>{
 const {jf,rf,vf}=files(); fs.writeFileSync(vf,JSON.stringify(review('needs_rework')));
 const r=spawnSync(process.execPath,[promotion,'--result',rf,'--review',vf,'--job',jf],{encoding:'utf8'});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/review verdict must be approved/);
});
