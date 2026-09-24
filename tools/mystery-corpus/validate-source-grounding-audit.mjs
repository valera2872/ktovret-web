#!/usr/bin/env node
import fs from 'node:fs';

const file=process.argv[2];
if(!file){
  console.error('Usage: node validate-source-grounding-audit.mjs <audit.json>');
  process.exit(2);
}
const a=JSON.parse(fs.readFileSync(file,'utf8'));
const errors=[];
if(a.schema_version!=='corpus_source_grounding_audit_v1') errors.push('schema_version must equal corpus_source_grounding_audit_v1');
if(a.independent_review!==false) errors.push('source-grounding audit must set independent_review=false');
if(a.can_approve!==false) errors.push('source-grounding audit can never approve');
if(!Array.isArray(a.items)||!a.items.length) errors.push('items must be non-empty');
const ids=new Set();
for(const [i,x] of (a.items||[]).entries()){
  if(!x.case_id) errors.push(`items[${i}] missing case_id`);
  else if(ids.has(x.case_id)) errors.push(`duplicate case_id: ${x.case_id}`);
  else ids.add(x.case_id);
  if(!['ready_for_independent_review','needs_extractor_repair','blocked_source_access'].includes(x.status)) errors.push(`items[${i}] invalid status`);
  if(typeof x.source_access!=='boolean') errors.push(`items[${i}] source_access must be boolean`);
  if(typeof x.rights_evidence_access!=='boolean') errors.push(`items[${i}] rights_evidence_access must be boolean`);
  if(x.status==='ready_for_independent_review' && (!x.source_access || !x.rights_evidence_access)){
    errors.push(`items[${i}] cannot be ready without source and rights evidence access`);
  }
}
const ready=(a.items||[]).filter(x=>x.status==='ready_for_independent_review').length;
const repair=(a.items||[]).filter(x=>x.status==='needs_extractor_repair').length;
const blocked=(a.items||[]).filter(x=>x.status==='blocked_source_access').length;
if(a.summary?.total!==(a.items||[]).length) errors.push('summary.total mismatch');
if(a.summary?.ready!==ready) errors.push('summary.ready mismatch');
if(a.summary?.needs_repair!==repair) errors.push('summary.needs_repair mismatch');
if(a.summary?.blocked!==blocked) errors.push('summary.blocked mismatch');
if(a.summary?.independent_review_still_required!==true) errors.push('independent review must remain required');

if(errors.length){
  console.error('Source Grounding Audit INVALID');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
console.log('Source Grounding Audit VALID / NON-INDEPENDENT');
console.log(JSON.stringify({audit_id:a.audit_id,total:a.items.length,ready,repair,blocked,can_approve:false},null,2));
