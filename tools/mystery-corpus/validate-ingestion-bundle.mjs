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
  return {ok:r.status===0,status:r.status,stdout:r.stdout,stderr:r.stderr};
}
const args=argsOf(process.argv.slice(2));
if(!args.case || !args.provenance){
  console.error('Usage: node validate-ingestion-bundle.mjs --case <case.json> --provenance <prov.json> [--job <job.json>] [--require-approved]');
  process.exit(2);
}

const here=path.dirname(new URL(import.meta.url).pathname);
const caseV=path.join(here,'validate-case-dna.mjs');
const provV=path.join(here,'validate-case-dna-provenance.mjs');
const errors=[];
const cv=run(caseV,[args.case]);
if(!cv.ok) errors.push('Case DNA validator failed:\n'+(cv.stderr||cv.stdout));
const pvArgs=['--case',args.case,'--provenance',args.provenance];
if(args['require-approved']) pvArgs.push('--require-approved');
const pv=run(provV,pvArgs);
if(!pv.ok) errors.push('Provenance validator failed:\n'+(pv.stderr||pv.stdout));

const d=JSON.parse(fs.readFileSync(args.case,'utf8'));
const p=JSON.parse(fs.readFileSync(args.provenance,'utf8'));
let job=null;
if(args.job){
  job=JSON.parse(fs.readFileSync(args.job,'utf8'));
  if(job.schema_version!=='corpus_ingestion_job_v1') errors.push('job.schema_version must equal corpus_ingestion_job_v1');
  if(job.source?.source_id && d.case_id && !String(d.case_id).includes(job.source.source_id)){
    // Do not hard-fail naming style; source_id may differ from case_id. Only compare source metadata below.
  }
  const pairs=[
    ['rights_status',d.source?.rights_status,job.source?.rights_status],
    ['ingestion_policy',d.source?.ingestion_policy,job.source?.ingestion_policy],
    ['source_type',d.source?.source_type,job.source?.source_type]
  ];
  for(const [name,a,b] of pairs){
    if(a!==b) errors.push(`source ${name} mismatch: case=${a} job=${b}`);
  }
  if(job.constraints?.retain_raw_text===false && d.source?.raw_text_retained===true){
    errors.push('job forbids raw text retention but Case DNA says raw_text_retained=true');
  }
  if(job.constraints?.fabricate_unknowns!==false) errors.push('job must forbid fabricate_unknowns');
  if(job.constraints?.copy_distinctive_plot!==false) errors.push('job must forbid copy_distinctive_plot');
}

if(p.source_snapshot?.rights_status!==d.source?.rights_status) errors.push('provenance rights_status differs from Case DNA source');
if(p.source_snapshot?.ingestion_policy!==d.source?.ingestion_policy) errors.push('provenance ingestion_policy differs from Case DNA source');

if(errors.length){
  console.error('Ingestion Bundle INVALID');
  for(const e of errors) console.error('- '+e.replace(/\n/g,'\n  '));
  process.exit(1);
}
console.log('Ingestion Bundle VALID');
console.log(JSON.stringify({
  case_id:d.case_id,
  source_type:d.source?.source_type,
  rights_status:d.source?.rights_status,
  ingestion_policy:d.source?.ingestion_policy,
  provenance_review:p.review?.review_status||null,
  job_id:job?.job_id||null
},null,2));
