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
if(!args.packet) {
  console.error('Usage: node build-adversarial-theory-prompt.mjs --packet <final-stage-packet.json> [--blind-run <blind-run.json>]');
  process.exit(2);
}
const packet=JSON.parse(fs.readFileSync(args.packet,'utf8'));
const blindRun=args['blind-run']?JSON.parse(fs.readFileSync(args['blind-run'],'utf8')):null;

const visibleIds=(packet.evidence||[]).map(e=>e.id);
const out={
  role:'You are a solution-isolated adversarial mystery auditor.',
  rules:[
    'Use ONLY the player-visible packet and optional blind-run observations supplied below.',
    'You do not know the canonical solution and must not assume one.',
    'Generate plausible competing explanations that fit as much visible evidence as possible.',
    'A suspicious lie or omission does not by itself prove guilt.',
    'Do not invent new answer-changing evidence.',
    'Every evidence reference must use an ID present in visible_evidence_ids.',
    'For each theory, explicitly state which visible facts it explains and which visible facts conflict with it.',
    'Propose discriminating checks that could distinguish the theory using information available before reveal.',
    'Return JSON only: an array of adversarial_theory_v1 objects.'
  ],
  visible_evidence_ids:visibleIds,
  player_packet:packet,
  blind_run_observations:blindRun
};
process.stdout.write(JSON.stringify(out,null,2)+'\n');
