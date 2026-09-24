#!/usr/bin/env node
import fs from 'node:fs';

function argsOf(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2),n=argv[i+1];
    if(!n||n.startsWith('--'))out[k]=true;else{out[k]=n;i++;}
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.brief||!args.variant){
  console.error('Usage: node build-case-concept-request.mjs --brief <text> --variant baseline|corpus [--context context.json] [--run-id id]');
  process.exit(2);
}
const variant=String(args.variant);
if(!['baseline','corpus'].includes(variant)){console.error('--variant must be baseline or corpus');process.exit(2)}
if(variant==='baseline'&&args.context){console.error('baseline variant MUST NOT receive --context');process.exit(1)}
if(variant==='corpus'&&!args.context){console.error('corpus variant requires --context');process.exit(1)}
let context=null;
if(args.context){
  context=JSON.parse(fs.readFileSync(args.context,'utf8'));
  if(context.schema_version!=='case_architect_context_pack_v1'){console.error('invalid Case Architect context pack');process.exit(1)}
  if(context.mode!=='approved'){console.error('concept tournament corpus variant requires approved context only');process.exit(1)}
}
const retrievedIds=context?.similarity_watchlist?.map(x=>x.case_id)||[];
const request={
  schema_version:'case_concept_provider_request_v1',
  request_id:String(args['run-id']||'concept-run'),
  variant,
  brief:String(args.brief),
  role:'Case Architect v2 concept generator',
  rules:[
    'Create a fresh detective concept, not an implementation and not final prose.',
    'Build CANON before PLAYER PLOT: WHO/WHY/HOW/WHERE/WHEN must be causally coherent.',
    'Create at least three plausible competing hypotheses.',
    'Lie or secrecy is not proof of guilt.',
    'Red herrings require causal reasons, not arbitrary suspicious decoration.',
    'All answer-changing facts must exist before reveal; reveal may change meaning, not invent the deciding fact.',
    'Prefer multiple independent evidence modalities and at least two lines for important conclusions.',
    'Do not copy a known plot, relationship topology, clue chain and reveal as one package.',
    'Return JSON only matching case_concept_v1.'
  ],
  corpus_context:variant==='corpus'?context:null,
  generation_audit_requirements:{
    variant,
    context_mode:variant==='corpus'?'approved':'none',
    retrieved_case_ids:variant==='corpus'?retrievedIds:[],
    copied_source_plot:false
  }
};
process.stdout.write(JSON.stringify(request,null,2)+'\n');
