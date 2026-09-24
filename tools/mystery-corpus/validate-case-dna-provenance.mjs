#!/usr/bin/env node
import fs from 'node:fs';

function argsOf(argv) {
  const out={};
  for(let i=0;i<argv.length;i++) {
    if(!argv[i].startsWith('--')) continue;
    const key=argv[i].slice(2), next=argv[i+1];
    if(!next || next.startsWith('--')) out[key]=true;
    else {out[key]=next;i++;}
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.case || !args.provenance) {
  console.error('Usage: node validate-case-dna-provenance.mjs --case <case-dna.json> --provenance <provenance.json> [--require-approved]');
  process.exit(2);
}

const d=JSON.parse(fs.readFileSync(args.case,'utf8'));
const p=JSON.parse(fs.readFileSync(args.provenance,'utf8'));
const errors=[], warnings=[];

if(p.schema_version!=='case_dna_provenance_v1') errors.push('provenance.schema_version must equal case_dna_provenance_v1');
if(p.case_id!==d.case_id) errors.push(`case_id mismatch: provenance=${p.case_id} case=${d.case_id}`);
if(!Array.isArray(p.claims)||p.claims.length===0) errors.push('provenance.claims must contain at least one claim');

if(p.source_snapshot?.rights_status==='unknown' && p.source_snapshot?.ingestion_policy!=='prohibited_pending_review') {
  errors.push('unknown rights_status requires prohibited_pending_review');
}
if(p.source_snapshot?.ingestion_policy==='metadata_and_analysis_only' && p.source_snapshot?.snapshot_hash) {
  warnings.push('metadata_and_analysis_only has snapshot_hash: verify that hash identifies metadata/authorized snapshot, not retained protected raw text');
}

const criticalPrefixes=[
  '$.incident',
  '$.mechanism.core_mechanism',
  '$.evidence',
  '$.hypotheses',
  '$.reveal'
];
const claims=p.claims||[];

for(const [i,c] of claims.entries()) {
  if(!c.case_dna_path) errors.push(`claims[${i}] missing case_dna_path`);
  if(!['source_supported','abstracted_from_source','editorial_inference','unknown','not_applicable'].includes(c.status)) {
    errors.push(`claims[${i}] invalid status: ${c.status}`);
  }
  if(c.materiality==='critical') {
    if(c.status==='editorial_inference') errors.push(`critical claim cannot be editorial_inference: ${c.case_dna_path}`);
    if(c.status==='unknown') warnings.push(`critical claim remains UNKNOWN: ${c.case_dna_path}`);
    if(['source_supported','abstracted_from_source'].includes(c.status) && !c.source_locator) {
      errors.push(`supported critical claim requires source_locator: ${c.case_dna_path}`);
    }
  }
}

for(const prefix of criticalPrefixes) {
  const matching=claims.filter(c=>c.case_dna_path===prefix || c.case_dna_path.startsWith(prefix+'.') || c.case_dna_path.startsWith(prefix+'['));
  if(!matching.length) errors.push(`missing provenance coverage for critical area: ${prefix}`);
}

if(args['require-approved']) {
  if(p.review?.review_status!=='approved') errors.push('provenance review must be approved');
  const unknownCritical=claims.filter(c=>c.materiality==='critical'&&c.status==='unknown');
  if(unknownCritical.length) errors.push(`approved ingestion cannot contain UNKNOWN critical claims (${unknownCritical.length})`);
}

if(errors.length) {
  console.error('Case DNA provenance INVALID');
  for(const e of errors) console.error('- '+e);
  for(const w of warnings) console.error('WARN - '+w);
  process.exit(1);
}

console.log('Case DNA provenance VALID');
console.log(JSON.stringify({
  case_id:d.case_id,
  claims:claims.length,
  critical:claims.filter(c=>c.materiality==='critical').length,
  unknown_critical:claims.filter(c=>c.materiality==='critical'&&c.status==='unknown').length,
  review_status:p.review?.review_status||null,
  warnings
},null,2));
