#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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
function sha(v){return crypto.createHash('sha256').update(v).digest('hex');}
function stable(v){return JSON.stringify(v,null,2)+'\n';}
function normalizedSourceReference(v){
  return String(v||'').trim().toLowerCase().replace(/^http:/,'https:').replace(/\/$/,'');
}
function approvedSourceCollisions(dir,sourceReference){
  if(!dir || !sourceReference) return [];
  const root=path.resolve(dir);
  if(!fs.existsSync(root)||!fs.statSync(root).isDirectory()) return [];
  const ref=normalizedSourceReference(sourceReference);
  const hits=[];
  for(const name of fs.readdirSync(root).filter(x=>x.endsWith('.json')&&!x.endsWith('.promotion.json')).sort()){
    try{
      const d=JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
      if(d.schema_version!=='case_dna_v1') continue;
      if(normalizedSourceReference(d.source?.source_reference)===ref) hits.push(d.case_id);
    }catch{}
  }
  return hits;
}

const args=argsOf(process.argv.slice(2));
if(!args.result||!args.review||!args.job||!args.dest){
  console.error('Usage: node promote-reviewed-extraction.mjs --result <result.json> --review <review.json> --job <job.json> --dest <approved-dir> [--approved-reference-dir <dir>] [--supersedes <case_id>] [--execute]');
  process.exit(2);
}
const here=path.dirname(new URL(import.meta.url).pathname);
const gate=path.join(here,'validate-ingestion-promotion.mjs');
const g=spawnSync(process.execPath,[gate,'--result',args.result,'--review',args.review,'--job',args.job],{encoding:'utf8'});
if(g.status!==0){
  console.error('Promotion REFUSED');
  console.error((g.stderr||g.stdout||'promotion gate failed').trim());
  process.exit(1);
}
const result=JSON.parse(fs.readFileSync(args.result,'utf8'));
const review=JSON.parse(fs.readFileSync(args.review,'utf8'));
const job=JSON.parse(fs.readFileSync(args.job,'utf8'));
const dna=structuredClone(result.case_dna);
const caseText=stable(dna);
const caseHash=sha(caseText);
const sourceReference=dna.source?.source_reference||job.source?.source_reference||null;
const collisions=approvedSourceCollisions(args['approved-reference-dir'],sourceReference);
const supersedes=args.supersedes?String(args.supersedes):null;
if(collisions.length && !supersedes){
  console.error('Promotion REFUSED: approved corpus already contains the same source_reference. Explicit --supersedes <case_id> is required.');
  console.error(JSON.stringify({source_reference:sourceReference,matching_case_ids:collisions},null,2));
  process.exit(1);
}
if(supersedes && !collisions.includes(supersedes)){
  console.error('Promotion REFUSED: --supersedes does not match an approved same-source case.');
  console.error(JSON.stringify({supersedes,source_reference:sourceReference,matching_case_ids:collisions},null,2));
  process.exit(1);
}
const dest=path.resolve(args.dest);
const caseFile=path.join(dest,`${dna.case_id}.json`);
const receiptFile=path.join(dest,`${dna.case_id}.promotion.json`);
const receipt={
  schema_version:'corpus_promotion_receipt_v1',
  case_id:dna.case_id,
  case_sha256:caseHash,
  extraction_run_id:result.extraction_run_id,
  job_id:result.job_id,
  extractor_id:result.extractor_id,
  reviewer_id:review.reviewer_id,
  reviewed_at:review.reviewed_at,
  review_verdict:review.verdict,
  source_id:job.source?.source_id||null,
  source_reference:job.source?.source_reference||null,
  supersedes_case_id:supersedes,
  same_source_collision_count:collisions.length,
  rights_status:job.source?.rights_status||null,
  rights_evidence_reference:job.source?.rights_evidence_reference||null,
  rights_verified_date:job.source?.rights_verified_date||null,
  ingestion_policy:job.source?.ingestion_policy||null,
  promotion_mode:args.execute===true?'executed':'dry_run',
  note:'Promotion receipt binds the approved Case DNA bytes to the independently validated extraction/review/job chain.'
};

if(!args.execute){
  console.log(JSON.stringify({
    status:'ELIGIBLE_DRY_RUN',
    case_id:dna.case_id,
    case_sha256:caseHash,
    destination:caseFile,
    source_lineage:{
      source_reference:sourceReference,
      same_source_matches:collisions,
      supersedes_case_id:supersedes
    },
    receipt,
    files_written:0
  },null,2));
  process.exit(0);
}

fs.mkdirSync(dest,{recursive:true});
if(fs.existsSync(caseFile)||fs.existsSync(receiptFile)){
  console.error('Promotion REFUSED: destination already contains case or receipt. No implicit overwrite is allowed.');
  process.exit(1);
}
fs.writeFileSync(caseFile,caseText);
receipt.promotion_mode='executed';
receipt.promoted_at=new Date().toISOString();
fs.writeFileSync(receiptFile,stable(receipt));

console.log(JSON.stringify({
  status:'PROMOTED_TO_PRIVATE_CORPUS_DIRECTORY',
  case_id:dna.case_id,
  case_sha256:caseHash,
  case_file:caseFile,
  receipt_file:receiptFile
},null,2));
