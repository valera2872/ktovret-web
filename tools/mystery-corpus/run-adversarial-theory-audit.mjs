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
function runNode(script,args,{allowFail=false}={}) {
  const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
  if(r.status!==0 && !allowFail) {
    throw new Error((r.stderr||r.stdout||`failed: ${path.basename(script)}`).trim());
  }
  return r;
}

const args=argsOf(process.argv.slice(2));
if(!args.case) {
  console.error('Usage: node run-adversarial-theory-audit.mjs --case <private-case-dna.json> [--blind-run <blind-run.json>] [--endpoint <url>] [--out <report.json>]');
  process.exit(2);
}

const endpoint=String(args.endpoint||process.env.ADVERSARIAL_THEORY_ENDPOINT||process.env.BLIND_INVESTIGATOR_ENDPOINT||'');
if(!/^https?:\/\//i.test(endpoint)) {
  console.error('Adversarial provider endpoint must be http(s).');
  process.exit(2);
}

const source=JSON.parse(fs.readFileSync(args.case,'utf8'));
const maxStage=Math.max(0,...(source.evidence||[]).map(e=>Number(e.availability_stage||0)));
const here=path.dirname(new URL(import.meta.url).pathname);
const buildPacket=path.join(here,'build-blind-packet.mjs');
const validateBoundary=path.join(here,'validate-blind-boundary.mjs');
const runProvider=path.join(here,'run-adversarial-provider.mjs');
const merge=path.join(here,'merge-adversarial-theories.mjs');
const audit=path.join(here,'theory-audit.mjs');

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-adv-audit-'));
const packet=path.join(tmp,'final-packet.json');
const theories=path.join(tmp,'theories.json');
const merged=path.join(tmp,'merged-case.json');

runNode(buildPacket,['--case',args.case,'--stage',String(maxStage),'--out',packet]);
runNode(validateBoundary,[packet]);

const providerArgs=['--packet',packet,'--endpoint',endpoint,'--out',theories];
if(args['blind-run']) providerArgs.push('--blind-run',args['blind-run']);
runNode(runProvider,providerArgs);

runNode(merge,['--case',args.case,'--theories',theories,'--out',merged]);
const auditRun=runNode(audit,['--case',merged,'--require-canonical'],{allowFail:true});

let auditJson;
try {
  auditJson=JSON.parse(auditRun.stdout||'{}');
} catch {
  throw new Error('Theory audit did not return valid JSON: '+(auditRun.stderr||auditRun.stdout));
}
const theoryJson=JSON.parse(fs.readFileSync(theories,'utf8'));
const theoryList=Array.isArray(theoryJson)?theoryJson:(theoryJson.theories||[theoryJson]);

const report={
  schema_version:'adversarial_theory_audit_report_v1',
  case_id:source.case_id,
  final_player_stage:maxStage,
  generated_theory_count:theoryList.length,
  generated_theory_ids:theoryList.map(t=>t.theory_id),
  audit:auditJson,
  provider_boundary:{
    private_case_sent_to_provider:false,
    packet_validated_before_provider:true,
    provider_response_validated_against_visible_evidence:true
  },
  note:'Provider received only the final player-visible packet (and optional blind-run observations), never Private CANON.'
};

const text=JSON.stringify(report,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text);
else process.stdout.write(text);

if(auditRun.status!==0) process.exitCode=1;
