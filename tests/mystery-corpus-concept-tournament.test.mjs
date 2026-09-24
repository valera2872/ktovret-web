import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const build=path.join(repo,'tools/mystery-corpus/build-case-concept-request.mjs');
const anonymize=path.join(repo,'tools/mystery-corpus/build-concept-evaluation-packet.mjs');

test('baseline request physically contains no corpus context or case ids',()=>{
 const r=spawnSync(process.execPath,[build,'--brief','premium solo','--variant','baseline','--run-id','A1'],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);
 assert.equal(out.variant,'baseline');
 assert.equal(out.corpus_context,null);
 assert.deepEqual(out.generation_audit_requirements.retrieved_case_ids,[]);
 assert.doesNotMatch(r.stdout,/CORPUS_CANARY_CASE_X9/);
});
test('corpus request accepts only approved safe context',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'concept-request-'));
 const cf=path.join(dir,'context.json');
 fs.writeFileSync(cf,JSON.stringify({
  schema_version:'case_architect_context_pack_v1',mode:'approved',
  similarity_watchlist:[{case_id:'CORPUS_CANARY_CASE_X9'}],
  pattern_palette:[{mechanism_tags:['pattern-only']}]
 }));
 const r=spawnSync(process.execPath,[build,'--brief','premium solo','--variant','corpus','--context',cf,'--run-id','B1'],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);
 assert.equal(out.variant,'corpus');
 assert.equal(out.corpus_context.mode,'approved');
 assert.deepEqual(out.generation_audit_requirements.retrieved_case_ids,['CORPUS_CANARY_CASE_X9']);
});
test('baseline rejects accidental context injection',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'concept-baseline-'));
 const cf=path.join(dir,'context.json');fs.writeFileSync(cf,'{}');
 const r=spawnSync(process.execPath,[build,'--brief','x','--variant','baseline','--context',cf],{cwd:repo,encoding:'utf8'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/MUST NOT receive/);
});
test('evaluation packet strips generation audit and retrieval identity',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'concept-eval-'));
 function concept(id,variant){
  return {schema_version:'case_concept_v1',concept_id:id,working_title:id,hook:'h',role:'investigator',mode:'solo',incident:'i',
   canon_skeleton:{who:'w',why:'y',how:'h',where:'x',when:'t'},hypotheses:['a','b','c'],
   evidence_plan:[1,2,3,4,5].map(i=>({type:'document',function:'f'+i,player_fact:'p'+i})),
   lies_and_secrets:['l1','l2'],red_herrings:['r1','r2'],recontextualization:'rr',signature_action:'s',final_reconstruction:'fr',differentiation:'d',
   generation_audit:{variant,context_mode:variant==='corpus'?'approved':'none',retrieved_case_ids:variant==='corpus'?['SECRET_CORPUS_ID']:[],used_pattern_dimensions:[],copied_source_plot:false}};
 }
 const a=path.join(dir,'a.json'),b=path.join(dir,'b.json');fs.writeFileSync(a,JSON.stringify(concept('A','baseline')));fs.writeFileSync(b,JSON.stringify(concept('B','corpus')));
 const r=spawnSync(process.execPath,[anonymize,'--left',a,'--right',b],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 assert.doesNotMatch(r.stdout,/generation_audit|SECRET_CORPUS_ID|baseline|corpus/);
 const out=JSON.parse(r.stdout);assert.deepEqual(out.concepts.map(x=>x.label),['X','Y']);
});
