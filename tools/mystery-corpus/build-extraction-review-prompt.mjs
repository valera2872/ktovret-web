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
if(!args.result || !args.job || !args['reviewer-id']){
  console.error('Usage: node build-extraction-review-prompt.mjs --result <result.json> --job <job.json> --reviewer-id <id>');
  process.exit(2);
}
const result=JSON.parse(fs.readFileSync(args.result,'utf8'));
const job=JSON.parse(fs.readFileSync(args.job,'utf8'));
const reviewerId=String(args['reviewer-id']);

if(result.schema_version!=='corpus_extraction_result_v1'){
  console.error('Expected corpus_extraction_result_v1');
  process.exit(1);
}
if(job.schema_version!=='corpus_ingestion_job_v1'){
  console.error('Expected corpus_ingestion_job_v1');
  process.exit(1);
}
if(result.job_id!==job.job_id){
  console.error('result.job_id must match job.job_id');
  process.exit(1);
}
if(reviewerId===result.extractor_id){
  console.error('reviewer-id must differ from extractor_id');
  process.exit(1);
}

const prompt={
  role:'You are the independent Mystery Logic Corpus Reviewer. You did not perform this extraction.',
  reviewer_id:reviewerId,
  source_to_verify:{
    source_reference:job.source.source_reference,
    source_locator:job.source.source_locator||null,
    title:job.source.title,
    source_family:job.source.source_family,
    rights_status:job.source.rights_status,
    rights_evidence_reference:job.source.rights_evidence_reference,
    rights_verified_date:job.source.rights_verified_date,
    ingestion_policy:job.source.ingestion_policy
  },
  extraction_result:result,
  review_rules:[
    'Open and verify the authorized/public source independently. Do not trust the extractor notes merely because they are present.',
    'Check every critical provenance locator against the source.',
    'Reject or request rework if a critical fact is unsupported, overstated, silently resolved from UNKNOWN, or imported from general genre knowledge.',
    'Reconstructed hypotheses are allowed only as clearly marked analytical abstractions; do not convert them into historical claims.',
    'For metadata_and_analysis_only sources, fail if source prose or large source excerpts are retained in the result.',
    'Check that the extraction captures reusable investigation structure rather than copying a distinctive plot or prose.',
    'Do not improve or rewrite the Case DNA during review. Record issues only.',
    'Return one corpus_extraction_review_v1 JSON object. Approval requires every hard check=true and no fail issues.'
  ],
  required_checks:[
    'rights_policy_match',
    'critical_claims_supported',
    'unknowns_preserved',
    'hypotheses_grounded',
    'no_raw_text_leakage',
    'no_distinctive_plot_copy'
  ],
  output_shape:{
    schema_version:'corpus_extraction_review_v1',
    extraction_run_id:result.extraction_run_id,
    job_id:result.job_id,
    case_id:result.case_dna?.case_id,
    extractor_id:result.extractor_id,
    reviewer_id:reviewerId,
    reviewed_at:'ISO-8601 timestamp',
    checks:{
      rights_policy_match:'boolean',
      critical_claims_supported:'boolean',
      unknowns_preserved:'boolean',
      hypotheses_grounded:'boolean',
      no_raw_text_leakage:'boolean',
      no_distinctive_plot_copy:'boolean'
    },
    verdict:'approved | needs_rework | rejected',
    issues:[{
      severity:'info | warn | fail',
      code:'string',
      message:'string',
      case_dna_path:'string|null',
      source_locator:'string|null'
    }],
    notes:'string|null'
  }
};
process.stdout.write(JSON.stringify(prompt,null,2)+'\n');
