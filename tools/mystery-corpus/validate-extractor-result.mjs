#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

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
if(!args.result || !args.job){
  console.error('Usage: node validate-extractor-result.mjs --result <result.json> --job <job.json>');
  process.exit(2);
}
const r=JSON.parse(fs.readFileSync(args.result,'utf8'));
const job=JSON.parse(fs.readFileSync(args.job,'utf8'));
const errors=[];
if(r.schema_version!=='corpus_extraction_result_v1') errors.push('result.schema_version must equal corpus_extraction_result_v1');
if(r.job_id!==job.job_id) errors.push(`job_id mismatch: result=${r.job_id} job=${job.job_id}`);
if(!r.extractor_id) errors.push('missing extractor_id');
if(!r.extraction_run_id) errors.push('missing extraction_run_id');
if(!r.case_dna||typeof r.case_dna!=='object') errors.push('missing case_dna');
if(!r.provenance||typeof r.provenance!=='object') errors.push('missing provenance');
if(!r.extraction_notes||typeof r.extraction_notes!=='object') errors.push('missing extraction_notes');

const forbiddenKeys=/^(raw_source_text|source_text|full_source|verbatim_source|source_transcript)$/i;
function walk(v,p='$'){
  if(Array.isArray(v)){ v.forEach((x,i)=>walk(x,`${p}[${i}]`)); return; }
  if(v&&typeof v==='object'){
    for(const [k,x] of Object.entries(v)){
      if(forbiddenKeys.test(k)) errors.push(`${p}.${k}: raw source payload field is forbidden`);
      walk(x,`${p}.${k}`);
    }
  }
}
walk(r);

if(r.provenance?.review?.review_status==='approved') errors.push('extractor may not self-approve provenance');
if(r.provenance?.review?.review_status!=='needs_review') errors.push('extractor provenance review_status must be needs_review');

if(errors.length){
  console.error('Extractor Result INVALID');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'extractor-result-'));
const cf=path.join(tmp,'case.json'),pf=path.join(tmp,'prov.json');
fs.writeFileSync(cf,JSON.stringify(r.case_dna,null,2));
fs.writeFileSync(pf,JSON.stringify(r.provenance,null,2));
const bundle=path.join(path.dirname(new URL(import.meta.url).pathname),'validate-ingestion-bundle.mjs');
const br=spawnSync(process.execPath,[bundle,'--case',cf,'--provenance',pf,'--job',args.job],{encoding:'utf8'});
if(br.status!==0){
  console.error('Extractor Result INVALID');
  console.error((br.stderr||br.stdout).trim());
  process.exit(1);
}
console.log('Extractor Result VALID / NEEDS_REVIEW');
console.log(JSON.stringify({
  extraction_run_id:r.extraction_run_id,
  job_id:r.job_id,
  extractor_id:r.extractor_id,
  case_id:r.case_dna?.case_id,
  review_status:r.provenance?.review?.review_status
},null,2));
