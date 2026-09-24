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
  console.error('Usage: node run-adversarial-provider.mjs --packet <packet.json> [--blind-run <blind-run.json>] [--endpoint <url>] [--out <theories.json>]');
  process.exit(2);
}
const endpoint=String(args.endpoint||process.env.ADVERSARIAL_THEORY_ENDPOINT||process.env.BLIND_INVESTIGATOR_ENDPOINT||'');
if(!/^https?:\/\//i.test(endpoint)) {
  console.error('Adversarial provider endpoint must be http(s).');
  process.exit(2);
}

const here=path.dirname(new URL(import.meta.url).pathname);
const builder=path.join(here,'build-adversarial-theory-prompt.mjs');
const validator=path.join(here,'validate-adversarial-theories.mjs');
const buildArgs=['--packet',args.packet];
if(args['blind-run']) buildArgs.push('--blind-run',args['blind-run']);
const prompt=JSON.parse(nodeOut(builder,buildArgs));
const request={
  schema_version:'adversarial_provider_request_v1',
  request_id:`${prompt.player_packet.case_id}:${prompt.player_packet.stage}:${Date.now()}`,
  prompt_contract:prompt
};

const headers={'content-type':'application/json'};
const token=process.env.ADVERSARIAL_THEORY_TOKEN||process.env.BLIND_INVESTIGATOR_TOKEN;
if(token) headers.authorization=`Bearer ${token}`;
const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(request)});
if(!response.ok) {
  console.error(`Adversarial provider HTTP ${response.status}`);
  process.exit(1);
}
const payload=await response.json();
const theories=payload.theories ?? payload;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'adv-provider-'));
const tf=path.join(tmp,'theories.json');
fs.writeFileSync(tf,JSON.stringify(theories,null,2));
try {
  nodeOut(validator,['--packet',args.packet,'--theories',tf]);
} catch(error) {
  console.error(error.message);
  process.exit(1);
}
const text=JSON.stringify(theories,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text);
else process.stdout.write(text);
