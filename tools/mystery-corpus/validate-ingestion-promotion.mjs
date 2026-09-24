#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
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
function run(script,args){
  const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
  return r;
}
const args=argsOf(process.argv.slice(2));
if(!args.result || !args.review || !args.job){
  console.error('Usage: node validate-ingestion-promotion.mjs --result <result.json> --review <review.json> --job <job.json>');
  process.exit(2);
}
const result=JSON.parse(fs.readFileSync(args.result,'utf8'));
const review=JSON.parse(fs.readFileSync(args.review,'utf8'));
const job=JSON.parse(fs.readFileSync(args.job,'utf8'));
const errors=[];

if(review.verdict!=='approved') errors.push(`review verdict must be approved, got ${review.verdict}`);
if(review.reviewer_id===result.extractor_id) errors.push('reviewer_id must differ from extractor_id');
for(const k of ['extraction_run_id','job_id','extractor_id']){
  if(review[k]!==result[k]) errors.push(`${k} mismatch between review and extraction result`);
}
if(review.case_id!==result.case_dna?.case_id) errors.push('case_id mismatch between review and extraction result');
if(result.job_id!==job.job_id) errors.push('job_id mismatch between extraction result and ingestion job');

const reviewValidator=path.join(path.dirname(new URL(import.meta.url).pathname),'validate-extraction-review.mjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'promotion-'));
const rf=path.join(tmp,'review.json');
fs.writeFileSync(rf,JSON.stringify(review));
const vr=run(reviewValidator,['--result',args.result,'--review',rf]);
if(vr.status!==0) errors.push('independent review validation failed: '+(vr.stderr||vr.stdout).trim());

const cf=path.join(tmp,'case.json'),pf=path.join(tmp,'prov.json');
const approvedProv=structuredClone(result.provenance);
approvedProv.review={
  ...(approvedProv.review||{}),
  review_status:'approved',
  reviewed_at:review.reviewed_at,
  reviewer:review.reviewer_id,
  notes:review.notes||null
};
fs.writeFileSync(cf,JSON.stringify(result.case_dna));
fs.writeFileSync(pf,JSON.stringify(approvedProv));
const bundleValidator=path.join(path.dirname(new URL(import.meta.url).pathname),'validate-ingestion-bundle.mjs');
const br=run(bundleValidator,['--case',cf,'--provenance',pf,'--job',args.job,'--require-approved']);
if(br.status!==0) errors.push('approved ingestion bundle validation failed: '+(br.stderr||br.stdout).trim());

if(errors.length){
  console.error('Ingestion Promotion INVALID');
  for(const e of errors) console.error('- '+e.replace(/\n/g,'\n  '));
  process.exit(1);
}
console.log('Ingestion Promotion VALID');
console.log(JSON.stringify({
  job_id:result.job_id,
  case_id:result.case_dna?.case_id,
  extractor_id:result.extractor_id,
  reviewer_id:review.reviewer_id,
  verdict:review.verdict,
  promotion_status:'eligible_for_private_corpus'
},null,2));
