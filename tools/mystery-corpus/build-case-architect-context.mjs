#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function argsOf(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2),n=argv[i+1];
    if(!n||n.startsWith('--')) out[k]=true; else {out[k]=n;i++;}
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.manifest || !args.brief){
  console.error('Usage: node build-case-architect-context.mjs --manifest <layers.json> --brief <text> [--mode approved|shadow] [--limit 10] [--out file.json]');
  process.exit(2);
}
const mode=String(args.mode||'approved');
if(!['approved','shadow'].includes(mode)){
  console.error('--mode must be approved or shadow');
  process.exit(2);
}
const here=path.dirname(new URL(import.meta.url).pathname);
const safeRetriever=path.join(here,'retrieve-patterns-safe.mjs');
const r=spawnSync(process.execPath,[
  safeRetriever,
  '--manifest',path.resolve(args.manifest),
  '--query',String(args.brief),
  '--mode',mode,
  '--limit',String(args.limit||10),
  '--max-per-family',String(args['max-per-family']||3)
],{encoding:'utf8'});
if(r.status!==0){
  console.error((r.stderr||r.stdout||'safe retrieval failed').trim());
  process.exit(r.status||1);
}
const retrieval=JSON.parse(r.stdout);
const results=retrieval.results||[];

const palette=[];
for(const x of results){
  const pattern=x.pattern||{};
  palette.push({
    case_id:x.case_id,
    source_type:x.source_type,
    corpus_origin:x.corpus_origin,
    matched_dimensions:x.matched_dimensions||[],
    mechanism_tags:pattern.mechanism_tags||[],
    evidence_topology:pattern.evidence_topology||[],
    reversal_tags:pattern.reversal_tags||[],
    decisive_proof_tags:pattern.decisive_proof_tags||[],
    editorial_lessons:pattern.editorial_lessons||[]
  });
}

const sourceFamilies=[...new Set(results.map(x=>x.source_type).filter(Boolean))];
const context={
  schema_version:'case_architect_context_pack_v1',
  mode,
  brief:String(args.brief),
  corpus_policy:{
    approved_only:mode==='approved',
    shadow_is_unverified:mode==='shadow',
    no_raw_source_text:true,
    no_case_evidence_facts:true,
    no_plot_summary:true
  },
  retrieval_summary:{
    result_count:results.length,
    source_types:sourceFamilies,
    layers:retrieval.corpus_layers||[]
  },
  pattern_palette:palette,
  similarity_watchlist:results.map(x=>({
    case_id:x.case_id,
    title:x.title,
    source_type:x.source_type,
    score:x.score,
    matched_dimensions:x.matched_dimensions||[],
    corpus_origin:x.corpus_origin
  })),
  generation_constraints:[
    'Treat retrieved material as abstract structural reference, never as a plot template.',
    'Do not copy a distinctive combination of mechanism + relationship topology + clue chain + reveal from one source.',
    'Prefer cross-source synthesis: combine independently chosen structural ideas from at least three different retrieved cases when the pool permits.',
    'Invent a fresh CANON before PLAYER PLOT: WHO/WHY/HOW/WHERE/WHEN, timeline, knowledge, errors and lies.',
    'A lie or secret is not evidence of guilt by itself.',
    'Important conclusions should preferably be supported by at least two independent evidence lines.',
    'Red herrings must have a causal reason: true fact with natural misinterpretation, or a real lie for another reason.',
    'Twists may change the meaning of known facts but must not introduce a new answer-changing fact at reveal.',
    'After concept generation, run Originality Gate, Theory Audit and solution-isolated Blind Investigator before release.'
  ],
  shadow_warning:mode==='shadow'
    ?'This context contains unapproved needs_review/candidate patterns. Use only for research/diagnostics; they are not corpus truth.'
    :null
};
const text=JSON.stringify(context,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text); else process.stdout.write(text);
