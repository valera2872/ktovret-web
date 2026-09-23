#!/usr/bin/env node
import fs from 'node:fs';

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
if(!args.job){
  console.error('Usage: node build-extractor-prompt.mjs --job <job.json> [--extractor-id id]');
  process.exit(2);
}
const job=JSON.parse(fs.readFileSync(args.job,'utf8'));
if(job.schema_version!=='corpus_ingestion_job_v1'){
  console.error('Expected corpus_ingestion_job_v1');
  process.exit(1);
}
if(job.source?.rights_status==='unknown'||job.source?.ingestion_policy==='prohibited_pending_review'){
  console.error('Blocked source cannot be sent to extractor');
  process.exit(1);
}
const extractorId=String(args['extractor-id']||'corpus-extractor');
const prompt={
  role:'You are the Mystery Logic Corpus Extractor. You analyze sources; you do not write a new detective story.',
  extractor_id:extractorId,
  job,
  instructions:[
    'Work only from the source named in the job and clearly identified supporting public/authorized material.',
    'Preserve source uncertainty. If a critical fact cannot be supported, mark it UNKNOWN or omit it; never fill gaps from genre knowledge.',
    'Extract abstract investigation structure: incident, mechanism, evidence topology, competing hypotheses, deductions, misdirection, reveal/recontextualization and editorial lessons.',
    'Do not imitate source prose and do not produce a renamed copy of a distinctive plot.',
    'For metadata_and_analysis_only sources, do not return or retain source text. Paraphrase factual structure.',
    'Every critical Case DNA area must have provenance entries with usable source locators.',
    'Reconstructed competing hypotheses must be labeled abstracted_from_source and should not be presented as historical claims unless the source supports that wording.',
    'Return one JSON object with schema_version corpus_extraction_result_v1 and fields extraction_run_id, job_id, extractor_id, extracted_at, case_dna, provenance, extraction_notes.',
    'Set provenance.review.review_status to needs_review. The extractor is never allowed to self-approve an ingestion.'
  ],
  hard_output_rules:{
    provenance_review_status:'needs_review',
    retain_raw_text:job.constraints?.retain_raw_text===true,
    fabricate_unknowns:false,
    copy_distinctive_plot:false
  }
};
process.stdout.write(JSON.stringify(prompt,null,2)+'\n');
