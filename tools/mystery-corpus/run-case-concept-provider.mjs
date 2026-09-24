#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function argsOf(argv){const out={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))continue;const k=argv[i].slice(2),n=argv[i+1];if(!n||n.startsWith('--'))out[k]=true;else{out[k]=n;i++;}}return out;}
function nodeOut(script,args){const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'child failed').trim());return r.stdout;}
const args=argsOf(process.argv.slice(2));
if(!args.request){console.error('Usage: node run-case-concept-provider.mjs --request request.json [--endpoint url] [--out concept.json]');process.exit(2)}
const endpoint=String(args.endpoint||process.env.CASE_CONCEPT_ENDPOINT||'');
if(!/^https?:\/\//i.test(endpoint)){console.error('Case concept provider endpoint must be http(s).');process.exit(2)}
const request=JSON.parse(fs.readFileSync(args.request,'utf8'));
if(request.schema_version!=='case_concept_provider_request_v1'){console.error('invalid concept provider request');process.exit(1)}

const headers={'content-type':'application/json'};
const token=process.env.CASE_CONCEPT_TOKEN;
if(token)headers.authorization=`Bearer ${token}`;
const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(request)});
if(!response.ok){console.error(`Case concept provider HTTP ${response.status}`);process.exit(1)}
const payload=await response.json();
const concept=payload.concept??payload;

if(concept?.generation_audit?.variant!==request.variant){
  console.error('provider concept variant does not match request variant');process.exit(1);
}
if(request.variant==='baseline'){
  if(concept?.generation_audit?.context_mode!=='none'||(concept?.generation_audit?.retrieved_case_ids||[]).length){
    console.error('baseline concept claims corpus retrieval');process.exit(1);
  }
}else{
  if(concept?.generation_audit?.context_mode!=='approved'){console.error('corpus concept must declare approved context');process.exit(1)}
  const allowed=new Set(request.generation_audit_requirements?.retrieved_case_ids||[]);
  for(const id of concept?.generation_audit?.retrieved_case_ids||[]){
    if(!allowed.has(id)){console.error('corpus concept references a case outside supplied context: '+id);process.exit(1)}
  }
}

const here=path.dirname(new URL(import.meta.url).pathname);
const validator=path.join(here,'validate-case-concept.mjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-concept-provider-'));
const cf=path.join(tmp,'concept.json');fs.writeFileSync(cf,JSON.stringify(concept,null,2));
try{nodeOut(validator,[cf]);}catch(error){console.error(error.message);process.exit(1)}
const text=JSON.stringify(concept,null,2)+'\n';
if(args.out)fs.writeFileSync(args.out,text);else process.stdout.write(text);
