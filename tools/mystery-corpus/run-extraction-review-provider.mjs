#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
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
function nodeOut(script,args){
  const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
  if(r.status!==0) throw new Error((r.stderr||r.stdout||'child process failed').trim());
  return r.stdout;
}

const args=argsOf(process.argv.slice(2));
if(!args.result || !args.job || !args['reviewer-id']){
  console.error('Usage: node run-extraction-review-provider.mjs --result <result.json> --job <job.json> --reviewer-id <id> [--endpoint <url>] [--out <review.json>]');
  process.exit(2);
}
const endpoint=String(args.endpoint||process.env.CORPUS_REVIEWER_ENDPOINT||'');
if(!/^https?:\/\//i.test(endpoint)){
  console.error('Corpus reviewer endpoint must be http(s). Set --endpoint or CORPUS_REVIEWER_ENDPOINT.');
  process.exit(2);
}

const here=path.dirname(new URL(import.meta.url).pathname);
const promptBuilder=path.join(here,'build-extraction-review-prompt.mjs');
const reviewValidator=path.join(here,'validate-extraction-review.mjs');
const prompt=JSON.parse(nodeOut(promptBuilder,[
  '--result',args.result,
  '--job',args.job,
  '--reviewer-id',String(args['reviewer-id'])
]));

const request={
  schema_version:'corpus_review_provider_request_v1',
  request_id:`${prompt.extraction_result.extraction_run_id}:${prompt.reviewer_id}`,
  review_contract:prompt
};
const headers={'content-type':'application/json'};
const token=process.env.CORPUS_REVIEWER_TOKEN;
if(token) headers.authorization=`Bearer ${token}`;

const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(request)});
if(!response.ok){
  console.error(`Corpus reviewer HTTP ${response.status}`);
  process.exit(1);
}
const payload=await response.json();
const review=payload.review ?? payload;

if(review.reviewer_id!==String(args['reviewer-id'])){
  console.error(`Reviewer identity mismatch: expected ${args['reviewer-id']} got ${review.reviewer_id}`);
  process.exit(1);
}

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-corpus-review-'));
const rf=path.join(tmp,'review.json');
fs.writeFileSync(rf,JSON.stringify(review,null,2));
try{
  nodeOut(reviewValidator,['--result',args.result,'--review',rf]);
}catch(error){
  console.error(error.message);
  process.exit(1);
}

const text=JSON.stringify(review,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text);
else process.stdout.write(text);
