import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const safe=path.join(repo,'tools/mystery-corpus/retrieve-patterns-safe.mjs');
const score=path.join(repo,'tools/mystery-corpus/case-dna-quality-scorecard.mjs');

function dna(id,tag,type='real_case'){
 return {schema_version:'case_dna_v1',case_id:id,title:id,source:{source_type:type,rights_status:'owned',ingestion_policy:'metadata_and_analysis_only',provenance:'fixture',raw_text_retained:false},
 incident:{category:'test',surface_problem:'test'},mechanism:{core_mechanism:tag,mechanism_tags:[tag]},
 evidence:[{id:'E1',type:'document',provenance:'fixture',fact:tag,availability_stage:0,reliability:'high',supports:['H1'],weakens:[],essential:true,corroborated_by:[],source_reason:'fixture'}],
 hypotheses:[{id:'H1',claim:'claim',supporting_evidence:['E1'],contradicting_evidence:[],viable_until_stage:0,canonical:true}],
 deductions:[],reveal:{recontextualized_facts:['E1'],causal_compression:'x',new_answer_changing_fact:false},
 fingerprint:{incident_tags:[],setting_tags:[],mechanism_tags:[tag],motive_tags:[],character_topology:[],evidence_topology:['document'],reversal_tags:[],decisive_proof_tags:['document'],signature_action_tags:[]}};
}
function setup(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'safe-retrieve-'));
 const approved=path.join(root,'approved'),shadow=path.join(root,'shadow');fs.mkdirSync(approved);fs.mkdirSync(shadow);
 fs.writeFileSync(path.join(approved,'a.json'),JSON.stringify(dna('approved-a','identity-substitution')));
 fs.writeFileSync(path.join(shadow,'b.json'),JSON.stringify(dna('shadow-b','ledger-manipulation')));
 const manifest={schema_version:'corpus_layer_manifest_v1',manifest_id:'m1',layers:[
  {layer_id:'approved',status:'approved_legacy',path:'approved',retrieval_allowed:true,shadow_only:false},
  {layer_id:'shadow',status:'needs_review',path:'shadow',retrieval_allowed:true,shadow_only:true}
 ]};
 const mf=path.join(root,'layers.json');fs.writeFileSync(mf,JSON.stringify(manifest));
 return{root,approved,shadow,mf};
}
test('approved mode excludes needs_review layer',()=>{
 const {mf}=setup();
 const r=spawnSync(process.execPath,[safe,'--manifest',mf,'--query','ledger manipulation','--mode','approved'],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);
 assert.equal(out.mode,'approved');
 assert.ok(out.corpus_layers.every(x=>x.role==='approved'));
 assert.ok(!out.results.some(x=>x.case_id==='shadow-b'));
});
test('shadow mode may include needs_review and labels its origin',()=>{
 const {mf}=setup();
 const r=spawnSync(process.execPath,[safe,'--manifest',mf,'--query','ledger manipulation','--mode','shadow'],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);
 const hit=out.results.find(x=>x.case_id==='shadow-b');
 assert.ok(hit);
 assert.equal(hit.corpus_origin.role,'shadow');
 assert.match(out.warning,/unapproved/);
});
test('scorecard is diagnostic and flags thin structure without declaring fail',()=>{
 const {root,approved}=setup();
 const file=path.join(approved,'a.json');
 const r=spawnSync(process.execPath,[score,'--case',file],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);
 assert.equal(out.diagnostics_only,true);
 assert.ok(Array.isArray(out.summary.attention_ids));
 assert.ok(out.guardrails.some(x=>/not a quality verdict/i.test(x)));
});
