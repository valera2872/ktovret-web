#!/usr/bin/env node
import fs from 'node:fs';

const file=process.argv[2];
if(!file) {
  console.error('Usage: node validate-source-queue.mjs <source-queue.json>');
  process.exit(2);
}
const q=JSON.parse(fs.readFileSync(file,'utf8'));
const errors=[], warnings=[];
if(q.schema_version!=='corpus_source_queue_v1') errors.push('schema_version must equal corpus_source_queue_v1');
if(!Array.isArray(q.items)||!q.items.length) errors.push('items must be a non-empty array');

const ids=new Set();
const locators=new Set();
for(const [i,x] of (q.items||[]).entries()) {
  const p=`items[${i}]`;
  for(const k of ['source_id','title','source_family','source_type','source_reference','rights_status','ingestion_policy','raw_text_retained','priority','status']) {
    if(!(k in x)) errors.push(`${p} missing ${k}`);
  }
  if(ids.has(x.source_id)) errors.push(`duplicate source_id: ${x.source_id}`);
  ids.add(x.source_id);

  const locatorKey=`${x.source_reference}::${x.source_locator||''}`.toLowerCase();
  if(locators.has(locatorKey)) warnings.push(`possible duplicate source locator: ${x.source_id}`);
  locators.add(locatorKey);

  if(x.rights_status==='unknown') {
    if(x.ingestion_policy!=='prohibited_pending_review') errors.push(`${x.source_id}: unknown rights requires prohibited_pending_review`);
    if(x.status!=='candidate' && x.status!=='rejected') errors.push(`${x.source_id}: unknown rights cannot be ${x.status}`);
  }

  if(x.ingestion_policy==='metadata_and_analysis_only' && x.raw_text_retained===true) {
    errors.push(`${x.source_id}: metadata_and_analysis_only cannot retain raw text`);
  }
  if(x.ingestion_policy==='prohibited_pending_review' && x.raw_text_retained===true) {
    errors.push(`${x.source_id}: prohibited source cannot retain raw text`);
  }

  if(x.rights_status==='analysis_only' && x.ingestion_policy==='full_text_allowed') {
    errors.push(`${x.source_id}: analysis_only cannot use full_text_allowed`);
  }

  if(x.rights_status==='government_public_record' && x.ingestion_policy==='full_text_allowed') {
    warnings.push(`${x.source_id}: government_public_record marked full_text_allowed; verify agency-specific reuse terms`);
  }

  if(['rights_verified','queued','ingested'].includes(x.status)) {
    if(x.rights_status==='unknown') errors.push(`${x.source_id}: verified/queued/ingested source cannot have unknown rights`);
    if(x.ingestion_policy==='prohibited_pending_review') errors.push(`${x.source_id}: verified/queued/ingested source cannot be prohibited_pending_review`);
    if(!x.rights_evidence_reference) errors.push(`${x.source_id}: verified/queued/ingested source requires rights_evidence_reference`);
    if(!x.rights_verified_date) errors.push(`${x.source_id}: verified/queued/ingested source requires rights_verified_date`);
  }

  if(x.raw_text_retained===true && x.ingestion_policy!=='full_text_allowed' && x.ingestion_policy!=='permitted_excerpts_only') {
    errors.push(`${x.source_id}: raw text retention incompatible with ingestion policy`);
  }
}

if(errors.length) {
  console.error('Source Queue INVALID');
  for(const e of errors) console.error('- '+e);
  for(const w of warnings) console.error('WARN - '+w);
  process.exit(1);
}
console.log('Source Queue VALID');
const counts={};
for(const x of q.items||[]) counts[x.source_family]=(counts[x.source_family]||0)+1;
console.log(JSON.stringify({
  queue_id:q.queue_id,
  items:q.items.length,
  ready:(q.items||[]).filter(x=>['rights_verified','queued','ingested'].includes(x.status)&&x.ingestion_policy!=='prohibited_pending_review').length,
  blocked:(q.items||[]).filter(x=>x.ingestion_policy==='prohibited_pending_review').length,
  source_families:counts,
  warnings
},null,2));
