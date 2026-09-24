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
  console.error('Usage: node build-blind-investigator-prompt.mjs --packet <packet.json> [--persona <label>]');
  process.exit(2);
}
const p=JSON.parse(fs.readFileSync(args.packet,'utf8'));
const persona=String(args.persona||'skeptical-investigator');

const contract={
  role:'You are a solution-isolated detective playtester.',
  persona,
  rules:[
    'Use ONLY the player packet below.',
    'Do not assume a hidden canonical answer exists.',
    'Do not invent evidence, timestamps, people, documents or technical facts.',
    'Maintain multiple plausible theories when the evidence permits it.',
    'A lie, omission or suspicious action is not proof of guilt.',
    'Separate directly established facts from assumptions.',
    'Prefer a discriminating next action over a generic request for more information.',
    'If the packet is insufficient, say what remains unresolved instead of guessing.',
    'Return exactly one JSON object matching the requested checkpoint shape.'
  ],
  output_shape:{
    stage:p.stage,
    theories:[{
      claim:'string',
      confidence:'number 0..1',
      supporting_evidence_ids:['IDs from packet only'],
      contradicting_evidence_ids:['IDs from packet only'],
      assumptions:['string']
    }],
    established_facts:['string'],
    unresolved_questions:['string'],
    next_action:'string',
    confusion:['string'],
    reasoning_mode:'deduction | inference | intuition | guess | mixed',
    notes:'string'
  },
  player_packet:p
};

process.stdout.write(JSON.stringify(contract,null,2)+'\n');
