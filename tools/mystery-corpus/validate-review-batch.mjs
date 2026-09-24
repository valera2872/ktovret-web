#!/usr/bin/env node
import fs from 'node:fs';
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
function run(script,args){
  return spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
}

const args=argsOf(process.argv.slice(2));
if(!args['batch-dir']){
  console.error('Usage: node validate-review-batch.mjs --batch-dir <unpacked-review-batch>');
  process.exit(2);
}
const root=path.resolve(args['batch-dir']);
const manifestFile=path.join(root,'batch-manifest.json');
const errors=[];
const warnings=[];

if(!fs.existsSync(manifestFile)){
  console.error('Review Batch INVALID\n- missing batch-manifest.json');
  process.exit(1);
}
let manifest;
try{ manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8')); }
catch(error){
  console.error('Review Batch INVALID\n- invalid batch-manifest.json: '+error.message);
  process.exit(1);
}

if(manifest.schema_version!=='corpus_review_batch_v1') errors.push('manifest.schema_version must equal corpus_review_batch_v1');
if(!manifest.batch_id) errors.push('manifest missing batch_id');
if(!manifest.extractor_id) errors.push('manifest missing extractor_id');
if(manifest.reviewer_must_differ_from_extractor!==true) errors.push('manifest must require reviewer/extractor separation');
if(!Array.isArray(manifest.candidates)||!manifest.candidates.length) errors.push('manifest.candidates must be non-empty');

const here=path.dirname(new URL(import.meta.url).pathname);
const resultValidator=path.join(here,'validate-extractor-result.mjs');
const seenFolders=new Set(), seenCases=new Set(), seenRuns=new Set(), seenJobs=new Set();
const items=[];

for(const [i,c] of (manifest.candidates||[]).entries()){
  const label=`candidate[${i}]`;
  if(!c.folder) { errors.push(`${label} missing folder`); continue; }
  if(seenFolders.has(c.folder)) errors.push(`duplicate candidate folder: ${c.folder}`);
  seenFolders.add(c.folder);

  const dir=path.join(root,'candidates',c.folder);
  const required=['job.json','extraction-result.json','case-dna.json','provenance.json','extraction-notes.json','review-request.json'];
  for(const name of required){
    if(!fs.existsSync(path.join(dir,name))) errors.push(`${c.folder}: missing ${name}`);
  }
  if(required.some(name=>!fs.existsSync(path.join(dir,name)))) continue;

  let job,result,caseDna,prov,notes,reviewReq;
  try{
    job=JSON.parse(fs.readFileSync(path.join(dir,'job.json'),'utf8'));
    result=JSON.parse(fs.readFileSync(path.join(dir,'extraction-result.json'),'utf8'));
    caseDna=JSON.parse(fs.readFileSync(path.join(dir,'case-dna.json'),'utf8'));
    prov=JSON.parse(fs.readFileSync(path.join(dir,'provenance.json'),'utf8'));
    notes=JSON.parse(fs.readFileSync(path.join(dir,'extraction-notes.json'),'utf8'));
    reviewReq=JSON.parse(fs.readFileSync(path.join(dir,'review-request.json'),'utf8'));
  }catch(error){
    errors.push(`${c.folder}: invalid JSON: ${error.message}`);
    continue;
  }

  if(c.case_id && caseDna.case_id!==c.case_id) errors.push(`${c.folder}: manifest case_id mismatch`);
  if(result.case_dna?.case_id!==caseDna.case_id) errors.push(`${c.folder}: extraction-result case_id differs from standalone case-dna`);
  if(result.provenance?.case_id!==prov.case_id) errors.push(`${c.folder}: extraction-result provenance case_id differs from standalone provenance`);
  if(JSON.stringify(result.case_dna)!==JSON.stringify(caseDna)) errors.push(`${c.folder}: standalone case-dna differs from extraction-result.case_dna`);
  if(JSON.stringify(result.provenance)!==JSON.stringify(prov)) errors.push(`${c.folder}: standalone provenance differs from extraction-result.provenance`);
  if(JSON.stringify(result.extraction_notes)!==JSON.stringify(notes)) errors.push(`${c.folder}: standalone extraction-notes differs from extraction-result.extraction_notes`);

  if(result.extractor_id!==manifest.extractor_id) errors.push(`${c.folder}: extractor_id differs from batch manifest`);
  if(reviewReq.extractor_id!==result.extractor_id) errors.push(`${c.folder}: review-request extractor_id mismatch`);
  if(reviewReq.reviewer_must_differ_from_extractor!==true) errors.push(`${c.folder}: review-request must require independent reviewer`);
  if(reviewReq.extraction_run_id!==result.extraction_run_id) errors.push(`${c.folder}: review-request extraction_run_id mismatch`);
  if(reviewReq.job_id!==result.job_id || result.job_id!==job.job_id) errors.push(`${c.folder}: job_id mismatch across files`);
  if(reviewReq.case_id!==caseDna.case_id) errors.push(`${c.folder}: review-request case_id mismatch`);

  for(const [name,a,b,cval,d] of [
    ['rights_status',job.source?.rights_status,caseDna.source?.rights_status,prov.source_snapshot?.rights_status,null],
    ['ingestion_policy',job.source?.ingestion_policy,caseDna.source?.ingestion_policy,prov.source_snapshot?.ingestion_policy,null],
    ['rights_evidence_reference',job.source?.rights_evidence_reference,caseDna.source?.rights_evidence_reference,prov.source_snapshot?.rights_evidence_reference,reviewReq.rights_evidence_reference],
    ['rights_verified_date',job.source?.rights_verified_date,caseDna.source?.rights_verified_date,prov.source_snapshot?.rights_verified_date,reviewReq.rights_verified_date]
  ]){
    const vals=[a,b,cval,...(d===null?[]:[d])];
    if(vals.some(v=>v==null||v==='')) errors.push(`${c.folder}: missing ${name}`);
    else if(new Set(vals.map(String)).size!==1) errors.push(`${c.folder}: ${name} mismatch across review package`);
  }

  if(prov.review?.review_status!=='needs_review') errors.push(`${c.folder}: provenance review_status must be needs_review`);
  if(c.status && c.status!=='needs_review') warnings.push(`${c.folder}: manifest status is ${c.status}, expected needs_review before independent review`);
  if(!Array.isArray(reviewReq.source_references)||!reviewReq.source_references.length) errors.push(`${c.folder}: review-request must contain source_references`);
  if(!Array.isArray(reviewReq.checks_required)||!reviewReq.checks_required.length) errors.push(`${c.folder}: review-request must contain checks_required`);

  for(const [set,value,name] of [
    [seenCases,caseDna.case_id,'case_id'],
    [seenRuns,result.extraction_run_id,'extraction_run_id'],
    [seenJobs,result.job_id,'job_id']
  ]){
    if(set.has(value)) errors.push(`duplicate ${name}: ${value}`);
    set.add(value);
  }

  const vr=run(resultValidator,['--result',path.join(dir,'extraction-result.json'),'--job',path.join(dir,'job.json')]);
  if(vr.status!==0) errors.push(`${c.folder}: extractor-result validation failed: ${(vr.stderr||vr.stdout).trim()}`);

  items.push({
    folder:c.folder,
    case_id:caseDna.case_id,
    extraction_run_id:result.extraction_run_id,
    job_id:result.job_id,
    source_family:c.source_family||job.source?.source_family||null,
    review_status:prov.review?.review_status||null,
    rights_status:job.source?.rights_status||null,
    ingestion_policy:job.source?.ingestion_policy||null
  });
}

if(errors.length){
  console.error('Review Batch INVALID');
  for(const e of errors) console.error('- '+e.replace(/\n/g,'\n  '));
  for(const w of warnings) console.error('WARN - '+w);
  process.exit(1);
}

console.log('Review Batch VALID');
console.log(JSON.stringify({
  batch_id:manifest.batch_id,
  version:manifest.version||null,
  extractor_id:manifest.extractor_id,
  candidates:items.length,
  rights_evidence_required:manifest.rights_evidence_required===true||manifest.rights_evidence_propagation_required===true,
  items,
  warnings
},null,2));
