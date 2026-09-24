import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const validator=path.join(repo,'tools/mystery-corpus/validate-review-batch.mjs');

function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'review-batch-preflight-'));
  const folder='01-case';
  const dir=path.join(root,'candidates',folder);
  fs.mkdirSync(dir,{recursive:true});
  const source={source_type:'real_case',rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',provenance:'agency',source_reference:'https://example.test/source',raw_text_retained:false};
  const caseDna={
    schema_version:'case_dna_v1',case_id:'case-1',title:'Case',source,
    incident:{category:'fraud',surface_problem:'x',setting:'office',stakes:'y',crime_required:true},
    mechanism:{core_mechanism:'m',mechanism_tags:['m'],secondary_traces:[]},
    evidence:[{id:'E1',type:'document',provenance:'§1',fact:'f',availability_stage:0,reliability:'high',supports:['HC'],weakens:[],essential:true,corroborated_by:[],source_reason:'s'}],
    hypotheses:[{id:'HC',claim:'c',supporting_evidence:['E1'],contradicting_evidence:[],viable_until_stage:0,canonical:true}],
    reveal:{recontextualized_facts:['E1'],causal_compression:'c',signature_moment:'',retell_hook:'',new_answer_changing_fact:false},
    fingerprint:{incident_tags:[],setting_tags:[],mechanism_tags:['m'],motive_tags:[],character_topology:[],evidence_topology:['doc'],reversal_tags:[],decisive_proof_tags:['doc'],signature_action_tags:[]}
  };
  const prov={
    schema_version:'case_dna_provenance_v1',case_id:'case-1',
    source_snapshot:{provenance:'agency',source_reference:'https://example.test/source',rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',snapshot_hash:null,snapshot_date:'2026-09-23'},
    claims:[
      {case_dna_path:'$.incident',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
      {case_dna_path:'$.mechanism.core_mechanism',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
      {case_dna_path:'$.evidence[0]',status:'source_supported',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
      {case_dna_path:'$.hypotheses[0]',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
      {case_dna_path:'$.reveal',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null}
    ],
    review:{review_status:'needs_review',reviewed_at:null,reviewer:null,notes:null}
  };
  const job={
    schema_version:'corpus_ingestion_job_v1',job_id:'job-1',
    source:{source_id:'s1',title:'Source',source_family:'fbi_history',source_type:'real_case',source_reference:'https://example.test/source',source_locator:null,rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',raw_text_retained:false,target_pattern_tags:[]},
    constraints:{retain_raw_text:false,copy_distinctive_plot:false,fabricate_unknowns:false,critical_claims_need_locators:true,output_language:'en',notes:[]},
    required_outputs:['case_dna_v1','case_dna_provenance_v1','extraction_notes']
  };
  const notes={};
  const result={schema_version:'corpus_extraction_result_v1',extraction_run_id:'run-1',job_id:'job-1',extractor_id:'extractor-A',extracted_at:'2026-09-23',case_dna:caseDna,provenance:prov,extraction_notes:notes};
  const request={
    schema_version:'corpus_extraction_review_request_v1',extraction_run_id:'run-1',job_id:'job-1',case_id:'case-1',extractor_id:'extractor-A',reviewer_must_differ_from_extractor:true,
    source_references:['https://example.test/source'],checks_required:['critical_claims_supported'],review_instructions:['verify'],rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23'
  };
  fs.writeFileSync(path.join(root,'batch-manifest.json'),JSON.stringify({schema_version:'corpus_review_batch_v1',batch_id:'batch-1',version:'0.1',extractor_id:'extractor-A',reviewer_must_differ_from_extractor:true,rights_evidence_required:true,candidates:[{folder,case_id:'case-1',source_family:'fbi_history',status:'needs_review'}]}));
  for(const [name,obj] of [['job.json',job],['extraction-result.json',result],['case-dna.json',caseDna],['provenance.json',prov],['extraction-notes.json',notes],['review-request.json',request]]) fs.writeFileSync(path.join(dir,name),JSON.stringify(obj));
  return {root,dir};
}

test('preflight accepts a consistent review package',()=>{
  const {root}=fixture();
  const r=spawnSync(process.execPath,[validator,'--batch-dir',root],{cwd:repo,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/Review Batch VALID/);
});

test('preflight rejects rights evidence drift',()=>{
  const {root,dir}=fixture();
  const c=JSON.parse(fs.readFileSync(path.join(dir,'case-dna.json'),'utf8'));
  c.source.rights_evidence_reference='https://wrong.test/rights';
  fs.writeFileSync(path.join(dir,'case-dna.json'),JSON.stringify(c));
  const r=spawnSync(process.execPath,[validator,'--batch-dir',root],{cwd:repo,encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/rights_evidence_reference mismatch|standalone case-dna differs/);
});

test('preflight rejects duplicate case ids across candidates',()=>{
  const {root}=fixture();
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'batch-manifest.json'),'utf8'));
  manifest.candidates.push({...manifest.candidates[0]});
  manifest.candidates[1].folder='02-case';
  fs.cpSync(path.join(root,'candidates','01-case'),path.join(root,'candidates','02-case'),{recursive:true});
  fs.writeFileSync(path.join(root,'batch-manifest.json'),JSON.stringify(manifest));
  const r=spawnSync(process.execPath,[validator,'--batch-dir',root],{cwd:repo,encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/duplicate case_id/);
});
