import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const build=path.join(repo,'tools/mystery-corpus/build-ingestion-jobs.mjs');
const validate=path.join(repo,'tools/mystery-corpus/validate-ingestion-bundle.mjs');

function baseCase(){
 return {
  schema_version:'case_dna_v1',case_id:'src-ready-derived',title:'Derived',
  source:{source_type:'real_case',rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',provenance:'agency page',source_reference:'https://example.test',raw_text_retained:false},
  incident:{category:'fraud',surface_problem:'A discrepancy must be explained.',setting:'office',stakes:'Find cause',crime_required:true},
  mechanism:{core_mechanism:'records conceal actual state',mechanism_tags:['false-records'],secondary_traces:[]},
  evidence:[
   {id:'E1',type:'document',provenance:'report section 1',fact:'Record A conflicts with record B.',availability_stage:0,reliability:'high',supports:['HC'],weakens:['HA'],essential:true,corroborated_by:[],source_reason:'official report'}
  ],
  hypotheses:[
   {id:'HC',claim:'intentional falsification',supporting_evidence:['E1'],contradicting_evidence:[],viable_until_stage:0,canonical:true},
   {id:'HA',claim:'clerical error',supporting_evidence:[],contradicting_evidence:['E1'],viable_until_stage:0,canonical:false}
  ],
  reveal:{recontextualized_facts:['E1'],causal_compression:'The conflict is systematic rather than clerical.',signature_moment:'',retell_hook:'',new_answer_changing_fact:false},
  fingerprint:{incident_tags:['fraud'],setting_tags:['office'],mechanism_tags:['false-records'],motive_tags:[],character_topology:[],evidence_topology:['document-conflict'],reversal_tags:[],decisive_proof_tags:['cross-record-conflict'],signature_action_tags:[]}
 };
}
function prov(){
 return {
  schema_version:'case_dna_provenance_v1',case_id:'src-ready-derived',
  source_snapshot:{provenance:'agency page',source_reference:'https://example.test',rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',snapshot_hash:null,snapshot_date:'2026-09-23'},
  claims:[
   {case_dna_path:'$.incident.surface_problem',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
   {case_dna_path:'$.mechanism.core_mechanism',status:'abstracted_from_source',materiality:'critical',source_locator:'§2',support_note:null,reviewer_note:null},
   {case_dna_path:'$.evidence[0]',status:'source_supported',materiality:'critical',source_locator:'§3',support_note:null,reviewer_note:null},
   {case_dna_path:'$.hypotheses[0]',status:'abstracted_from_source',materiality:'critical',source_locator:'§4',support_note:null,reviewer_note:null},
   {case_dna_path:'$.reveal',status:'abstracted_from_source',materiality:'critical',source_locator:'§5',support_note:null,reviewer_note:null}
  ],
  review:{review_status:'approved',reviewed_at:'2026-09-23',reviewer:'fixture',notes:null}
 };
}
function job(){
 return {
  schema_version:'corpus_ingestion_job_v1',job_id:'batch:src-ready',
  source:{source_id:'src-ready',title:'Ready',source_family:'fbi_history',source_type:'real_case',source_reference:'https://example.test',source_locator:null,rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',raw_text_retained:false,target_pattern_tags:[]},
  constraints:{retain_raw_text:false,copy_distinctive_plot:false,fabricate_unknowns:false,critical_claims_need_locators:true,output_language:'en',notes:[]},
  required_outputs:['case_dna_v1','case_dna_provenance_v1','extraction_notes']
 };
}

test('job builder refuses blocked sources',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jobs-blocked-'));
 const plan=path.join(dir,'plan.json');
 fs.writeFileSync(plan,JSON.stringify({batch_id:'b',items:[{source_id:'x',title:'x',source_family:'other',source_type:'film',source_reference:'x',source_locator:null,rights_status:'unknown',ingestion_policy:'prohibited_pending_review',raw_text_retained:false,target_pattern_tags:[]}]}));
 const r=spawnSync(process.execPath,[build,'--plan',plan,'--outdir',path.join(dir,'out')],{encoding:'utf8'});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/Refusing blocked source/);
});

test('valid ingestion bundle passes both DNA and provenance gates',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bundle-good-'));
 const cf=path.join(dir,'case.json'),pf=path.join(dir,'prov.json'),jf=path.join(dir,'job.json');
 fs.writeFileSync(cf,JSON.stringify(baseCase())); fs.writeFileSync(pf,JSON.stringify(prov())); fs.writeFileSync(jf,JSON.stringify(job()));
 const r=spawnSync(process.execPath,[validate,'--case',cf,'--provenance',pf,'--job',jf,'--require-approved'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/Ingestion Bundle VALID/);
});

test('bundle fails if extractor escalates analysis-only source to raw-text retention',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bundle-bad-'));
 const c=baseCase(); c.source.raw_text_retained=true;
 const cf=path.join(dir,'case.json'),pf=path.join(dir,'prov.json'),jf=path.join(dir,'job.json');
 fs.writeFileSync(cf,JSON.stringify(c)); fs.writeFileSync(pf,JSON.stringify(prov())); fs.writeFileSync(jf,JSON.stringify(job()));
 const r=spawnSync(process.execPath,[validate,'--case',cf,'--provenance',pf,'--job',jf],{encoding:'utf8'});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/raw text|raw_text/i);
});
