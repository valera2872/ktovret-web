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
function runNode(script,args,{allowFail=false}={}){
  const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
  if(r.status!==0 && !allowFail) throw new Error((r.stderr||r.stdout||'child process failed').trim());
  return r;
}

const args=argsOf(process.argv.slice(2));
if(!args.result || !args.job || !args['reviewer-id']){
  console.error('Usage: node run-review-promotion-check.mjs --result <result.json> --job <job.json> --reviewer-id <id> [--endpoint <url>] [--out <report.json>]');
  process.exit(2);
}
const endpoint=String(args.endpoint||process.env.CORPUS_REVIEWER_ENDPOINT||'');
if(!/^https?:\/\//i.test(endpoint)){
  console.error('Corpus reviewer endpoint must be http(s).');
  process.exit(2);
}

const here=path.dirname(new URL(import.meta.url).pathname);
const reviewer=path.join(here,'run-extraction-review-provider.mjs');
const promotion=path.join(here,'validate-ingestion-promotion.mjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-review-promotion-'));
const reviewFile=path.join(tmp,'review.json');

const reviewRun=runNode(reviewer,[
  '--result',args.result,
  '--job',args.job,
  '--reviewer-id',String(args['reviewer-id']),
  '--endpoint',endpoint,
  '--out',reviewFile
],{allowFail:true});

if(reviewRun.status!==0){
  const report={
    schema_version:'corpus_review_promotion_report_v1',
    status:'review_invalid',
    eligible_for_private_corpus:false,
    reviewer_id:String(args['reviewer-id']),
    error:(reviewRun.stderr||reviewRun.stdout||'review provider failed').trim()
  };
  const text=JSON.stringify(report,null,2)+'\n';
  if(args.out) fs.writeFileSync(args.out,text); else process.stdout.write(text);
  process.exitCode=1;
}else{
  const review=JSON.parse(fs.readFileSync(reviewFile,'utf8'));
  const promotionRun=runNode(promotion,[
    '--result',args.result,
    '--review',reviewFile,
    '--job',args.job
  ],{allowFail:true});

  const result=JSON.parse(fs.readFileSync(args.result,'utf8'));
  const report={
    schema_version:'corpus_review_promotion_report_v1',
    extraction_run_id:result.extraction_run_id,
    job_id:result.job_id,
    case_id:result.case_dna?.case_id,
    extractor_id:result.extractor_id,
    reviewer_id:review.reviewer_id,
    review_verdict:review.verdict,
    review_checks:review.checks,
    review_issues:review.issues||[],
    eligible_for_private_corpus:promotionRun.status===0,
    promotion_status:promotionRun.status===0?'eligible_for_private_corpus':'blocked',
    promotion_error:promotionRun.status===0?null:(promotionRun.stderr||promotionRun.stdout||'promotion blocked').trim(),
    note:'This report never moves files. Eligibility must be followed by a separate explicit private-corpus promotion action.'
  };
  const text=JSON.stringify(report,null,2)+'\n';
  if(args.out) fs.writeFileSync(args.out,text); else process.stdout.write(text);
  if(promotionRun.status!==0) process.exitCode=1;
}
