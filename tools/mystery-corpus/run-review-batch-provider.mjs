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
if(!args['batch-dir'] || !args['reviewer-id']){
  console.error('Usage: node run-review-batch-provider.mjs --batch-dir <unpacked-review-batch> --reviewer-id <id> [--endpoint <url>] [--out <report.json>]');
  process.exit(2);
}
const endpoint=String(args.endpoint||process.env.CORPUS_REVIEWER_ENDPOINT||'');
if(!/^https?:\/\//i.test(endpoint)){
  console.error('Corpus reviewer endpoint must be http(s).');
  process.exit(2);
}

const batchDir=path.resolve(args['batch-dir']);
const here=path.dirname(new URL(import.meta.url).pathname);
const preflight=path.join(here,'validate-review-batch.mjs');
const lockVerifier=path.join(here,'validate-review-batch-lock.mjs');

for(const [label,script] of [['preflight',preflight],['integrity lock',lockVerifier]]){
  const check=run(script,['--batch-dir',batchDir]);
  if(check.status!==0){
    console.error(`Review batch ${label} failed`);
    console.error((check.stderr||check.stdout||'validation failed').trim());
    process.exit(1);
  }
}

const manifestPath=path.join(batchDir,'batch-manifest.json');
if(!fs.existsSync(manifestPath)){
  console.error('batch-manifest.json not found');
  process.exit(2);
}
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const reviewerId=String(args['reviewer-id']);
if(manifest.extractor_id && manifest.extractor_id===reviewerId){
  console.error('reviewer-id must differ from batch extractor_id');
  process.exit(1);
}

const orchestrator=path.join(here,'run-review-promotion-check.mjs');
const items=[];

for(const c of manifest.candidates||[]){
  const dir=path.join(batchDir,'candidates',c.folder);
  const resultFile=path.join(dir,'extraction-result.json');
  const jobFile=path.join(dir,'job.json');
  if(!fs.existsSync(resultFile)||!fs.existsSync(jobFile)){
    items.push({
      folder:c.folder,
      case_id:c.case_id||null,
      status:'invalid_batch_item',
      eligible_for_private_corpus:false,
      error:'missing extraction-result.json or job.json'
    });
    continue;
  }

  const outFile=path.join(dir,'.review-promotion-report.tmp.json');
  const r=run(orchestrator,[
    '--result',resultFile,
    '--job',jobFile,
    '--reviewer-id',reviewerId,
    '--endpoint',endpoint,
    '--out',outFile
  ]);

  let report=null;
  if(fs.existsSync(outFile)){
    try{ report=JSON.parse(fs.readFileSync(outFile,'utf8')); }catch{}
    try{ fs.unlinkSync(outFile); }catch{}
  }
  items.push({
    folder:c.folder,
    case_id:c.case_id||report?.case_id||null,
    process_exit_code:r.status,
    review_status:report?.review_verdict||report?.status||'invalid',
    eligible_for_private_corpus:report?.eligible_for_private_corpus===true,
    issues:report?.review_issues||[],
    error:report?.promotion_error||report?.error||((r.stderr||'').trim()||null)
  });
}

const summary={
  total:items.length,
  eligible:items.filter(x=>x.eligible_for_private_corpus).length,
  blocked:items.filter(x=>!x.eligible_for_private_corpus).length,
  invalid:items.filter(x=>x.review_status==='invalid'||x.review_status==='review_invalid'||x.status==='invalid_batch_item').length
};

const report={
  schema_version:'corpus_review_batch_report_v1',
  batch_id:manifest.batch_id||null,
  reviewer_id:reviewerId,
  extractor_id:manifest.extractor_id||null,
  generated_at:new Date().toISOString(),
  summary,
  items,
  note:'Batch review reports eligibility only. It never promotes or moves corpus files.'
};

const text=JSON.stringify(report,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text); else process.stdout.write(text);
if(summary.blocked>0) process.exitCode=1;
