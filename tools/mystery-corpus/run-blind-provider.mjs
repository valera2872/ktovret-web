#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

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
function nodeOut(script,args) {
  const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
  if(r.status!==0) throw new Error((r.stderr||r.stdout||'child process failed').trim());
  return r.stdout;
}

const args=argsOf(process.argv.slice(2));
if(!args.packet) {
  console.error('Usage: node run-blind-provider.mjs --packet <packet.json> [--endpoint <url>] [--out <checkpoint.json>]');
  process.exit(2);
}
const endpoint=String(args.endpoint||process.env.BLIND_INVESTIGATOR_ENDPOINT||'');
if(!/^https?:\/\//i.test(endpoint)) {
  console.error('Blind provider endpoint must be http(s). Set --endpoint or BLIND_INVESTIGATOR_ENDPOINT.');
  process.exit(2);
}

const here=path.dirname(new URL(import.meta.url).pathname);
const promptBuilder=path.join(here,'build-blind-investigator-prompt.mjs');
const validator=path.join(here,'validate-blind-run.mjs');
const prompt=JSON.parse(nodeOut(promptBuilder,['--packet',args.packet,'--persona',String(args.persona||'skeptical-investigator')]));
const request={
  schema_version:'blind_provider_request_v1',
  request_id:`${prompt.player_packet.case_id}:${prompt.player_packet.stage}:${Date.now()}`,
  prompt_contract:prompt
};

const headers={'content-type':'application/json'};
const token=process.env.BLIND_INVESTIGATOR_TOKEN;
if(token) headers.authorization=`Bearer ${token}`;

const response=await fetch(endpoint,{
  method:'POST',
  headers,
  body:JSON.stringify(request)
});
if(!response.ok) {
  console.error(`Blind provider HTTP ${response.status}`);
  process.exit(1);
}
const payload=await response.json();
const checkpoint=payload.checkpoint ?? payload;

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'blind-provider-'));
const rf=path.join(tmp,'checkpoint.json');
fs.writeFileSync(rf,JSON.stringify(checkpoint,null,2));
try {
  nodeOut(validator,['--packet',args.packet,'--run',rf]);
} catch(error) {
  console.error(error.message);
  process.exit(1);
}

const text=JSON.stringify(checkpoint,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text);
else process.stdout.write(text);
