#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function argsOf(argv) {
  const out={};
  for(let i=0;i<argv.length;i++) {
    const a=argv[i];
    if(!a.startsWith('--')) continue;
    const k=a.slice(2), n=argv[i+1];
    if(!n || n.startsWith('--')) out[k]=true;
    else { out[k]=n; i++; }
  }
  return out;
}
function execNode(script,args) {
  const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
  if(r.status!==0) {
    throw new Error((r.stderr||r.stdout||`failed: ${script}`).trim());
  }
  return r.stdout;
}

const args=argsOf(process.argv.slice(2));
if(!args.case) {
  console.error('Usage: node run-blind-baseline.mjs --case <private-case-dna.json> [--out <blind-run.json>]');
  process.exit(2);
}

const d=JSON.parse(fs.readFileSync(args.case,'utf8'));
const maxStage=Math.max(0,...(d.evidence||[]).map(e=>Number(e.availability_stage||0)));
const here=path.dirname(new URL(import.meta.url).pathname);
const build=path.join(here,'build-blind-packet.mjs');
const validate=path.join(here,'validate-blind-boundary.mjs');
const investigator=path.join(here,'blind-investigator-baseline.mjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-blind-'));
const checkpoints=[];

for(let stage=0;stage<=maxStage;stage++) {
  const packet=path.join(tmp,`stage-${stage}.json`);
  execNode(build,['--case',args.case,'--stage',String(stage),'--out',packet]);
  execNode(validate,[packet]);
  const out=JSON.parse(execNode(investigator,['--packet',packet,'--persona','baseline-evidence-first']));
  const cp=out.checkpoints?.[0];
  if(!cp) throw new Error(`No checkpoint returned for stage ${stage}`);
  checkpoints.push(cp);
}

const result={
  schema_version:'blind_run_v1',
  run_id:`${d.case_id}:blind-baseline-v1`,
  case_id:d.case_id,
  persona:'baseline-evidence-first',
  checkpoints,
  final:{
    reconstruction:checkpoints.at(-1)?.theories?.[0]?.claim||'Недостаточно данных для реконструкции.',
    certainty:checkpoints.at(-1)?.theories?.[0]?.confidence||0,
    reasoning_mode:'inference',
    evidence_ids:checkpoints.at(-1)?.theories?.[0]?.supporting_evidence_ids||[],
    felt_fair:null,
    felt_led_by_ui:null,
    stuck_points:[]
  }
};

const text=JSON.stringify(result,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text);
else process.stdout.write(text);
