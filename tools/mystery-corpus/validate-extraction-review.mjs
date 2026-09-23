#!/usr/bin/env node
import fs from 'node:fs';

function argsOf(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2),n=argv[i+1];
    if(!n||n.startsWith('--')) out[k]=true;
    else {out[k]=n;i++;}
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.result||!args.review){
  console.error('Usage: node validate-extraction-review.mjs --result <extraction-result.json> --review <review.json>');
  process.exit(2);
}
const r=JSON.parse(fs.readFileSync(args.result,'utf8'));
const v=JSON.parse(fs.readFileSync(args.review,'utf8'));
const errors=[];
if(v.schema_version!=='corpus_extraction_review_v1') errors.push('review.schema_version must equal corpus_extraction_review_v1');
for(const k of ['extraction_run_id','job_id','extractor_id']){
  if(v[k]!==r[k]) errors.push(`${k} mismatch`);
}
if(v.case_id!==r.case_dna?.case_id) errors.push('case_id mismatch');
if(!v.reviewer_id) errors.push('missing reviewer_id');
if(v.reviewer_id===v.extractor_id) errors.push('reviewer_id must differ from extractor_id');
const checks=['rights_policy_match','critical_claims_supported','unknowns_preserved','hypotheses_grounded','no_raw_text_leakage','no_distinctive_plot_copy'];
for(const k of checks) if(typeof v.checks?.[k]!=='boolean') errors.push(`missing boolean check: ${k}`);
const failIssues=(v.issues||[]).filter(x=>x.severity==='fail');
if(v.verdict==='approved'){
  for(const k of checks) if(v.checks?.[k]!==true) errors.push(`approved review requires ${k}=true`);
  if(failIssues.length) errors.push('approved review cannot contain fail issues');
}
if(v.verdict==='needs_rework' && !(v.issues||[]).length) errors.push('needs_rework requires at least one issue');

if(errors.length){
  console.error('Extraction Review INVALID');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
console.log('Extraction Review VALID');
console.log(JSON.stringify({
  extraction_run_id:v.extraction_run_id,
  case_id:v.case_id,
  extractor_id:v.extractor_id,
  reviewer_id:v.reviewer_id,
  verdict:v.verdict,
  fail_issues:failIssues.length
},null,2));
