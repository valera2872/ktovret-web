import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const prompt=path.join(repo,'tools/mystery-corpus/build-extractor-prompt.mjs');
const reviewV=path.join(repo,'tools/mystery-corpus/validate-extraction-review.mjs');

function job(){
 return {
  schema_version:'corpus_ingestion_job_v1',job_id:'b:s',
  source:{source_id:'s',title:'Source',source_family:'fbi_history',source_type:'real_case',source_reference:'https://example.test',source_locator:null,rights_status:'government_public_record',ingestion_policy:'metadata_and_analysis_only',raw_text_retained:false,target_pattern_tags:[]},
  constraints:{retain_raw_text:false,copy_distinctive_plot:false,fabricate_unknowns:false,critical_claims_need_locators:true,output_language:'en',notes:[]},
  required_outputs:['case_dna_v1','case_dna_provenance_v1','extraction_notes']
 };
}
function result(){
 return {schema_version:'corpus_extraction_result_v1',extraction_run_id:'run1',job_id:'b:s',extractor_id:'extractor-A',extracted_at:'2026-09-23',case_dna:{case_id:'case1'},provenance:{review:{review_status:'needs_review'}},extraction_notes:{}};
}
function review(overrides={}){
 return {
  schema_version:'corpus_extraction_review_v1',extraction_run_id:'run1',job_id:'b:s',case_id:'case1',extractor_id:'extractor-A',reviewer_id:'reviewer-B',reviewed_at:'2026-09-23',
  checks:{rights_policy_match:true,critical_claims_supported:true,unknowns_preserved:true,hypotheses_grounded:true,no_raw_text_leakage:true,no_distinctive_plot_copy:true},
  verdict:'approved',issues:[],notes:null,...overrides
 };
}

test('extractor prompt forbids self approval and fabrication',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'extract-prompt-'));
 const jf=path.join(dir,'job.json'); fs.writeFileSync(jf,JSON.stringify(job()));
 const r=spawnSync(process.execPath,[prompt,'--job',jf,'--extractor-id','extractor-A'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const p=JSON.parse(r.stdout);
 assert.equal(p.hard_output_rules.provenance_review_status,'needs_review');
 assert.equal(p.hard_output_rules.fabricate_unknowns,false);
 assert.equal(p.hard_output_rules.copy_distinctive_plot,false);
});

test('review cannot be approved by the same extractor',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'review-self-'));
 const rf=path.join(dir,'result.json'),vf=path.join(dir,'review.json');
 fs.writeFileSync(rf,JSON.stringify(result())); fs.writeFileSync(vf,JSON.stringify(review({reviewer_id:'extractor-A'})));
 const r=spawnSync(process.execPath,[reviewV,'--result',rf,'--review',vf],{encoding:'utf8'});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/reviewer_id must differ from extractor_id/);
});

test('approved review requires every hard check to pass',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'review-check-'));
 const rf=path.join(dir,'result.json'),vf=path.join(dir,'review.json');
 const v=review(); v.checks.hypotheses_grounded=false;
 fs.writeFileSync(rf,JSON.stringify(result())); fs.writeFileSync(vf,JSON.stringify(v));
 const r=spawnSync(process.execPath,[reviewV,'--result',rf,'--review',vf],{encoding:'utf8'});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/approved review requires hypotheses_grounded=true/);
});

test('independent fully passing review is valid',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'review-good-'));
 const rf=path.join(dir,'result.json'),vf=path.join(dir,'review.json');
 fs.writeFileSync(rf,JSON.stringify(result())); fs.writeFileSync(vf,JSON.stringify(review()));
 const r=spawnSync(process.execPath,[reviewV,'--result',rf,'--review',vf],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/Extraction Review VALID/);
});
