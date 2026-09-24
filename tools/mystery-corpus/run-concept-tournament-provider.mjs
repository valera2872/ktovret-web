#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

function argsOf(argv){const out={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))continue;const k=argv[i].slice(2),n=argv[i+1];if(!n||n.startsWith('--'))out[k]=true;else{out[k]=n;i++;}}return out;}
function run(script,args){const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'child failed').trim());return r.stdout;}
const args=argsOf(process.argv.slice(2));
if(!args.manifest||!args.brief||!args.outdir){console.error('Usage: node run-concept-tournament-provider.mjs --manifest layers.json --brief <text> --outdir <dir> [--endpoint url] [--pair-id id]');process.exit(2)}
const endpoint=String(args.endpoint||process.env.CASE_CONCEPT_ENDPOINT||'');
if(!/^https?:\/\//i.test(endpoint)){console.error('Case concept provider endpoint must be http(s).');process.exit(2)}
const pairId=String(args['pair-id']||'concept-pair-001');
const outdir=path.resolve(args.outdir);fs.mkdirSync(outdir,{recursive:true});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-concept-tournament-'));
const here=path.dirname(new URL(import.meta.url).pathname);
const contextBuilder=path.join(here,'build-case-architect-context.mjs');
const requestBuilder=path.join(here,'build-case-concept-request.mjs');
const provider=path.join(here,'run-case-concept-provider.mjs');
const anonymizer=path.join(here,'build-concept-evaluation-packet.mjs');

const contextFile=path.join(tmp,'approved-context.json');
fs.writeFileSync(contextFile,run(contextBuilder,['--manifest',path.resolve(args.manifest),'--brief',String(args.brief),'--mode','approved','--limit',String(args.limit||10)]));
const baseReq=path.join(tmp,'baseline-request.json'),corpusReq=path.join(tmp,'corpus-request.json');
fs.writeFileSync(baseReq,run(requestBuilder,['--brief',String(args.brief),'--variant','baseline','--run-id',pairId+':baseline']));
fs.writeFileSync(corpusReq,run(requestBuilder,['--brief',String(args.brief),'--variant','corpus','--context',contextFile,'--run-id',pairId+':corpus']));

const baselineFile=path.join(outdir,'baseline.concept.json');
const corpusFile=path.join(outdir,'corpus.concept.json');
run(provider,['--request',baseReq,'--endpoint',endpoint,'--out',baselineFile]);
run(provider,['--request',corpusReq,'--endpoint',endpoint,'--out',corpusFile]);

const hash=crypto.createHash('sha256').update(pairId).digest();
const swap=(hash[0]&1)===1;
const left=swap?corpusFile:baselineFile,right=swap?baselineFile:corpusFile;
const evaluationFile=path.join(outdir,'evaluation.packet.json');
fs.writeFileSync(evaluationFile,run(anonymizer,['--left',left,'--right',right,'--pair-id',pairId]));

const mapping={
  schema_version:'case_concept_tournament_mapping_v1',
  pair_id:pairId,
  brief:String(args.brief),
  evaluator_left:swap?'corpus':'baseline',
  evaluator_right:swap?'baseline':'corpus',
  baseline_file:path.basename(baselineFile),
  corpus_file:path.basename(corpusFile),
  evaluation_file:path.basename(evaluationFile),
  approved_context_case_ids:JSON.parse(fs.readFileSync(contextFile,'utf8')).similarity_watchlist?.map(x=>x.case_id)||[],
  note:'Keep this mapping away from the evaluator until evaluation is complete.'
};
fs.writeFileSync(path.join(outdir,'tournament.mapping.private.json'),JSON.stringify(mapping,null,2)+'\n');
console.log(JSON.stringify({status:'TOURNAMENT_PAIR_READY',pair_id:pairId,outdir,evaluation_file:evaluationFile,evaluator_mapping_withheld:true},null,2));
