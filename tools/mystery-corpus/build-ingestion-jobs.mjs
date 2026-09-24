#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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
if(!args.plan || !args.outdir){
  console.error('Usage: node build-ingestion-jobs.mjs --plan <ingestion-plan.json> --outdir <dir> [--language en]');
  process.exit(2);
}
const plan=JSON.parse(fs.readFileSync(args.plan,'utf8'));
const outdir=path.resolve(args.outdir);
const lang=String(args.language||'en');
fs.mkdirSync(outdir,{recursive:true});
const written=[];

for(const src of plan.items||[]){
  if(src.rights_status==='unknown'||src.ingestion_policy==='prohibited_pending_review'){
    console.error('Refusing blocked source in ingestion plan: '+src.source_id);
    process.exit(1);
  }
  if(!src.rights_evidence_reference || !src.rights_verified_date){
    console.error('Refusing source without rights evidence in ingestion plan: '+src.source_id);
    process.exit(1);
  }
  const job={
    schema_version:'corpus_ingestion_job_v1',
    job_id:`${plan.batch_id||plan.queue_id}:${src.source_id}`,
    source:{
      source_id:src.source_id,
      title:src.title,
      source_family:src.source_family,
      source_type:src.source_type,
      source_reference:src.source_reference,
      source_locator:src.source_locator||null,
      rights_status:src.rights_status,
      rights_evidence_reference:src.rights_evidence_reference,
      rights_verified_date:src.rights_verified_date,
      ingestion_policy:src.ingestion_policy,
      raw_text_retained:src.raw_text_retained===true,
      target_pattern_tags:src.target_pattern_tags||[]
    },
    constraints:{
      retain_raw_text:src.raw_text_retained===true,
      copy_distinctive_plot:false,
      fabricate_unknowns:false,
      critical_claims_need_locators:true,
      output_language:lang,
      notes:[
        'Extract investigation structure, evidence topology, competing hypotheses and editorial lessons; do not imitate prose.',
        'Do not silently resolve unknown facts.',
        'For analysis-only sources, paraphrase abstract patterns and do not retain source text.',
        'Every critical Case DNA claim must map to a provenance-sidecar locator or remain UNKNOWN.'
      ]
    },
    required_outputs:['case_dna_v1','case_dna_provenance_v1','extraction_notes']
  };
  const file=path.join(outdir,`${src.source_id}.job.json`);
  fs.writeFileSync(file,JSON.stringify(job,null,2)+'\n');
  written.push(file);
}
console.log(JSON.stringify({jobs:written.length,outdir,files:written},null,2));
