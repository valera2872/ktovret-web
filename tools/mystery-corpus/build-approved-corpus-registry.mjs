#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function argsOf(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2),n=argv[i+1];
    if(!n||n.startsWith('--')) out[k]=true; else {out[k]=n;i++;}
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.dir){console.error('Usage: node build-approved-corpus-registry.mjs --dir <approved-dir> [--out registry.json]');process.exit(2)}
const dir=path.resolve(args.dir),errors=[],items=[];
const receipts=fs.readdirSync(dir).filter(x=>x.endsWith('.promotion.json')).sort();
const caseIds=new Set(), hashes=new Set();
for(const name of receipts){
  const r=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
  if(r.schema_version!=='corpus_promotion_receipt_v1') errors.push(`${name}: invalid receipt schema`);
  if(r.review_verdict!=='approved') errors.push(`${name}: review_verdict must be approved`);
  if(r.promotion_mode!=='executed') errors.push(`${name}: receipt must be executed promotion`);
  if(!r.reviewer_id||r.reviewer_id===r.extractor_id) errors.push(`${name}: independent reviewer identity missing/invalid`);
  const cf=path.join(dir,`${r.case_id}.json`);
  if(!fs.existsSync(cf)){errors.push(`${name}: missing case file`);continue}
  const bytes=fs.readFileSync(cf);
  const h=crypto.createHash('sha256').update(bytes).digest('hex');
  if(h!==r.case_sha256) errors.push(`${name}: case hash mismatch`);
  let d;try{d=JSON.parse(bytes)}catch{errors.push(`${name}: invalid case JSON`);continue}
  if(d.schema_version!=='case_dna_v1') errors.push(`${name}: case schema is not case_dna_v1`);
  if(d.case_id!==r.case_id) errors.push(`${name}: receipt/case ID mismatch`);
  if(caseIds.has(r.case_id)) errors.push(`duplicate case_id: ${r.case_id}`);caseIds.add(r.case_id);
  if(hashes.has(h)) errors.push(`duplicate Case DNA hash: ${h}`);hashes.add(h);
  items.push({case_id:r.case_id,case_sha256:h,source_id:r.source_id,reviewer_id:r.reviewer_id,reviewed_at:r.reviewed_at,promoted_at:r.promoted_at,rights_status:r.rights_status,ingestion_policy:r.ingestion_policy});
}
if(errors.length){
  console.error('Approved Corpus Registry INVALID');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
const out={schema_version:'approved_corpus_registry_v1',generated_at:new Date().toISOString(),case_count:items.length,items};
const text=JSON.stringify(out,null,2)+'\n';
if(args.out)fs.writeFileSync(args.out,text);else process.stdout.write(text);
