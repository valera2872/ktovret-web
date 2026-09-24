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
if(!args.case || !args.theories) {
  console.error('Usage: node merge-adversarial-theories.mjs --case <case-dna.json> --theories <theories.json> [--out <merged.json>]');
  process.exit(2);
}

const d=JSON.parse(fs.readFileSync(args.case,'utf8'));
const input=JSON.parse(fs.readFileSync(args.theories,'utf8'));
const theories=Array.isArray(input)?input:(Array.isArray(input.theories)?input.theories:[input]);
const evidenceIds=new Set((d.evidence||[]).map(e=>e.id));
const hypothesisIds=new Set((d.hypotheses||[]).map(h=>h.id));
const errors=[];

for(const [i,t] of theories.entries()) {
  if(t.schema_version!=='adversarial_theory_v1') errors.push(`theories[${i}].schema_version must equal adversarial_theory_v1`);
  if(!t.theory_id) errors.push(`theories[${i}] missing theory_id`);
  if(!t.claim) errors.push(`theories[${i}] missing claim`);
  if(t.requires_new_answer_fact===true) errors.push(`theories[${i}] requires a new answer-changing fact and cannot be merged as a fair competing theory`);
  const id=`ADV:${t.theory_id}`;
  if(hypothesisIds.has(id)) errors.push(`duplicate hypothesis id after merge: ${id}`);
  for(const field of ['explains_evidence_ids','conflicts_evidence_ids']) {
    if(!Array.isArray(t[field])) errors.push(`theories[${i}].${field} must be array`);
    for(const eid of (t[field]||[])) {
      if(!evidenceIds.has(eid)) errors.push(`theories[${i}].${field} references unknown evidence: ${eid}`);
    }
  }
}
if(errors.length) {
  console.error('Adversarial theory merge INVALID');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}

const out=structuredClone(d);
out.hypotheses=out.hypotheses||[];
out.evidence=out.evidence||[];

for(const t of theories) {
  const id=`ADV:${t.theory_id}`;
  out.hypotheses.push({
    id,
    claim:t.claim,
    supporting_evidence:[...(t.explains_evidence_ids||[])],
    contradicting_evidence:[...(t.conflicts_evidence_ids||[])],
    viable_until_stage:null,
    canonical:false
  });
  for(const e of out.evidence) {
    e.supports=Array.isArray(e.supports)?e.supports:[];
    e.weakens=Array.isArray(e.weakens)?e.weakens:[];
    if((t.explains_evidence_ids||[]).includes(e.id) && !e.supports.includes(id)) e.supports.push(id);
    if((t.conflicts_evidence_ids||[]).includes(e.id) && !e.weakens.includes(id)) e.weakens.push(id);
  }
}

const text=JSON.stringify(out,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text);
else process.stdout.write(text);
