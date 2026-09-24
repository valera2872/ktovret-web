#!/usr/bin/env node
import fs from 'node:fs';

function argsOf(argv){const out={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))continue;const k=argv[i].slice(2),n=argv[i+1];if(!n||n.startsWith('--'))out[k]=true;else{out[k]=n;i++;}}return out;}
const args=argsOf(process.argv.slice(2));
if(!args.left||!args.right){console.error('Usage: node build-concept-evaluation-packet.mjs --left concept.json --right concept.json [--pair-id id]');process.exit(2)}
function clean(file,label){
  const c=JSON.parse(fs.readFileSync(file,'utf8'));
  const {generation_audit,concept_id,...rest}=c;
  const publicConcept={...rest,concept_id:label};
  return {label,concept:publicConcept};
}
const packet={
  schema_version:'case_concept_evaluation_packet_v1',
  pair_id:String(args['pair-id']||'pair-1'),
  evaluator_rules:[
    'Judge only the two concepts shown. Do not infer which one used retrieval.',
    'Compare originality, causal compression, hypothesis depth, evidence variety, fair-play risk, red-herring causality, signature action, retell hook and structural similarity risk.',
    'Do not reward length or jargon.',
    'A twist that requires a new deciding fact at reveal is a defect.',
    'A lie is not proof of guilt.',
    'Identify concrete strengths/risks for both concepts.'
  ],
  concepts:[clean(args.left,'X'),clean(args.right,'Y')]
};
process.stdout.write(JSON.stringify(packet,null,2)+'\n');
