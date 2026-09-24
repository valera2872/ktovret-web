import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const tool=path.join(repo,'tools/mystery-corpus/shadow-retrieval-regression.mjs');

function dna(id,type,mechanism,evidence,sourceReference=null){
 return {
  schema_version:'case_dna_v1',case_id:id,title:id,
  source:{source_type:type,rights_status:'owned',ingestion_policy:'metadata_and_analysis_only',provenance:'fixture',source_reference:sourceReference,raw_text_retained:false},
  incident:{category:'test',surface_problem:'test'},
  mechanism:{core_mechanism:mechanism,mechanism_tags:[mechanism]},
  evidence:[{id:'E1',type:'other',provenance:'fixture',fact:'fact',availability_stage:0,reliability:'high'}],
  hypotheses:[{id:'H1',claim:'claim'}],
  reveal:{recontextualized_facts:['fact'],causal_compression:'x',new_answer_changing_fact:false},
  fingerprint:{incident_tags:['test'],setting_tags:[],mechanism_tags:[mechanism],motive_tags:[],character_topology:[],evidence_topology:[evidence],reversal_tags:[],decisive_proof_tags:[evidence],signature_action_tags:[]}
 };
}
function setup({sameSource=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'shadow-reg-'));
 const base=path.join(root,'base'),overlay=path.join(root,'overlay');
 fs.mkdirSync(base);fs.mkdirSync(overlay);
 const ref=sameSource?'https://example.test/work':null;
 fs.writeFileSync(path.join(base,'a.json'),JSON.stringify(dna('base-a','public_domain_fiction','identity-substitution','document-forensics',ref)));
 fs.writeFileSync(path.join(overlay,'b.json'),JSON.stringify(dna('overlay-b','real_case','repeated-ledger-manipulation','institutional-records',ref)));
 const q=path.join(root,'q.json');
 fs.writeFileSync(q,JSON.stringify({queries:[{id:'finance',query:'financial repeated ledger institutional records'}]}));
 return {root,base,overlay,q};
}
test('shadow regression never modifies base corpus and reports overlay hits separately',()=>{
 const {root,base,overlay,q}=setup();
 const before=fs.readdirSync(base).sort();
 const out=path.join(root,'report.json');
 const r=spawnSync(process.execPath,[tool,'--base',base,'--overlay',overlay,'--queries',q,'--out',out],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 assert.deepEqual(fs.readdirSync(base).sort(),before);
 const report=JSON.parse(fs.readFileSync(out,'utf8'));
 assert.equal(report.mode,'shadow_only');
 assert.equal(report.approved_corpus_modified,false);
 assert.equal(report.overlay_case_count,1);
 assert.ok(report.queries[0].shadow_after.overlay_hits.some(x=>x.case_id==='overlay-b'));
});
test('same-source overlay replaces legacy copy in temporary merged view',()=>{
 const {root,base,overlay,q}=setup({sameSource:true});
 const out=path.join(root,'report.json');
 const r=spawnSync(process.execPath,[tool,'--base',base,'--overlay',overlay,'--queries',q,'--out',out],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const report=JSON.parse(fs.readFileSync(out,'utf8'));
 assert.equal(report.same_source_replacement_count,1);
 assert.equal(report.same_source_replacements[0].base_case_id,'base-a');
 assert.equal(report.same_source_replacements[0].overlay_case_id,'overlay-b');
 assert.ok(!report.queries[0].shadow_after.top_case_ids.includes('base-a'));
 assert.ok(report.queries[0].shadow_after.top_case_ids.includes('overlay-b'));
});
test('shadow regression refuses empty overlay',()=>{
 const {root,base,q}=setup();
 const overlay=path.join(root,'empty');fs.mkdirSync(overlay);
 const r=spawnSync(process.execPath,[tool,'--base',base,'--overlay',overlay,'--queries',q],{cwd:repo,encoding:'utf8'});
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/overlay contains no case_dna_v1/);
});
