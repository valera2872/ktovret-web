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
if(!args.packet || !args.theories) {
  console.error('Usage: node validate-adversarial-theories.mjs --packet <packet.json> --theories <theories.json>');
  process.exit(2);
}
const p=JSON.parse(fs.readFileSync(args.packet,'utf8'));
const raw=JSON.parse(fs.readFileSync(args.theories,'utf8'));
const list=Array.isArray(raw)?raw:(Array.isArray(raw.theories)?raw.theories:[raw]);
const available=new Set((p.evidence||[]).map(e=>e.id));
const ids=new Set();
const errors=[];

if(list.length<1) errors.push('at least one adversarial theory is required');

for(const [i,t] of list.entries()) {
  if(t.schema_version!=='adversarial_theory_v1') errors.push(`theories[${i}].schema_version must equal adversarial_theory_v1`);
  if(typeof t.theory_id!=='string'||!t.theory_id.trim()) errors.push(`theories[${i}] missing theory_id`);
  else if(ids.has(t.theory_id)) errors.push(`duplicate theory_id: ${t.theory_id}`);
  else ids.add(t.theory_id);
  if(typeof t.claim!=='string'||!t.claim.trim()) errors.push(`theories[${i}] missing claim`);
  for(const field of ['explains_evidence_ids','conflicts_evidence_ids']) {
    if(!Array.isArray(t[field])) errors.push(`theories[${i}].${field} must be array`);
    for(const id of (t[field]||[])) {
      if(!available.has(id)) errors.push(`theories[${i}].${field} references unavailable evidence: ${id}`);
    }
  }
  if(!Array.isArray(t.assumptions)) errors.push(`theories[${i}].assumptions must be array`);
  if(typeof t.requires_new_answer_fact!=='boolean') errors.push(`theories[${i}].requires_new_answer_fact must be boolean`);
  if(!Array.isArray(t.discriminating_checks)) errors.push(`theories[${i}].discriminating_checks must be array`);
  for(const [j,c] of (t.discriminating_checks||[]).entries()) {
    if(typeof c.question!=='string'||!c.question.trim()) errors.push(`theories[${i}].discriminating_checks[${j}] missing question`);
    if(typeof c.expected_difference!=='string'||!c.expected_difference.trim()) errors.push(`theories[${i}].discriminating_checks[${j}] missing expected_difference`);
  }
}

if(errors.length) {
  console.error('Adversarial theories INVALID');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
console.log('Adversarial theories VALID');
console.log(JSON.stringify({case_id:p.case_id,stage:p.stage,theories:list.length,visible_evidence:[...available]},null,2));
