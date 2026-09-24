#!/usr/bin/env node
import fs from 'node:fs';

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
const args=argsOf(process.argv.slice(2));
if(!args.packet || !args.run) {
  console.error('Usage: node validate-blind-run.mjs --packet <packet.json> --run <blind-run-or-checkpoint.json>');
  process.exit(2);
}

const p=JSON.parse(fs.readFileSync(args.packet,'utf8'));
const r=JSON.parse(fs.readFileSync(args.run,'utf8'));
const errors=[];
const available=new Set((p.evidence||[]).map(e=>e.id));
const checkpoints=Array.isArray(r.checkpoints)?r.checkpoints:[r];

for(const [i,cp] of checkpoints.entries()) {
  if(cp.stage!==p.stage) errors.push(`checkpoint[${i}].stage ${cp.stage} != packet stage ${p.stage}`);
  if(!Array.isArray(cp.theories)) errors.push(`checkpoint[${i}].theories must be array`);
  for(const [j,t] of (cp.theories||[]).entries()) {
    if(typeof t.claim!=='string'||!t.claim.trim()) errors.push(`checkpoint[${i}].theories[${j}] missing claim`);
    if(typeof t.confidence!=='number'||t.confidence<0||t.confidence>1) errors.push(`checkpoint[${i}].theories[${j}] confidence must be 0..1`);
    for(const field of ['supporting_evidence_ids','contradicting_evidence_ids']) {
      for(const id of (t[field]||[])) {
        if(!available.has(id)) errors.push(`checkpoint[${i}].theories[${j}].${field} references unavailable evidence: ${id}`);
      }
    }
  }
  if(typeof cp.next_action!=='string') errors.push(`checkpoint[${i}].next_action must be string`);
  if(!Array.isArray(cp.established_facts)) errors.push(`checkpoint[${i}].established_facts must be array`);
  if(!Array.isArray(cp.unresolved_questions)) errors.push(`checkpoint[${i}].unresolved_questions must be array`);
  if(!Array.isArray(cp.confusion)) errors.push(`checkpoint[${i}].confusion must be array`);
}

if(r.case_id && r.case_id!==p.case_id) errors.push(`run.case_id ${r.case_id} != packet.case_id ${p.case_id}`);

if(errors.length) {
  console.error('Blind run INVALID');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
console.log('Blind run VALID');
console.log(JSON.stringify({
  case_id:p.case_id,
  stage:p.stage,
  checkpoints:checkpoints.length,
  available_evidence:[...available]
},null,2));
