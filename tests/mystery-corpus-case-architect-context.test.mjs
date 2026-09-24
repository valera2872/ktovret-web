import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const tool=path.join(repo,'tools/mystery-corpus/build-case-architect-context.mjs');

function dna(id,tag,secret){
 return {
  schema_version:'case_dna_v1',case_id:id,title:id,
  source:{source_type:'public_domain_fiction',rights_status:'public_domain',ingestion_policy:'full_text_allowed',provenance:'fixture',source_reference:'https://example.test/'+id,raw_text_retained:false},
  incident:{category:'theft',surface_problem:'SECRET_INCIDENT_'+secret},
  mechanism:{core_mechanism:'SECRET_CORE_'+secret,mechanism_tags:[tag]},
  evidence:[{id:'E1',type:'physical',provenance:'fixture',fact:'SECRET_EVIDENCE_'+secret,availability_stage:0,reliability:'high'}],
  hypotheses:[{id:'H1',claim:'SECRET_SOLUTION_'+secret}],
  quality:{editorial_lessons:['separate observation from inference']},
  reveal:{recontextualized_facts:['SECRET_REVEAL_'+secret],causal_compression:'SECRET_CAUSAL_'+secret,new_answer_changing_fact:false},
  fingerprint:{incident_tags:['theft'],setting_tags:[],mechanism_tags:[tag],motive_tags:[],character_topology:[],evidence_topology:['physical+document'],reversal_tags:['meaning-shift'],decisive_proof_tags:['cross-check'],signature_action_tags:['compare-records']}
 };
}
function setup(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'architect-context-'));
 const approved=path.join(root,'approved');fs.mkdirSync(approved);
 fs.writeFileSync(path.join(approved,'a.json'),JSON.stringify(dna('a','identity-substitution','X1')));
 fs.writeFileSync(path.join(approved,'b.json'),JSON.stringify(dna('b','record-mismatch','X2')));
 const manifest=path.join(root,'layers.json');
 fs.writeFileSync(manifest,JSON.stringify({schema_version:'corpus_layer_manifest_v1',manifest_id:'m',layers:[
  {layer_id:'approved',status:'approved_legacy',path:'approved',retrieval_allowed:true,shadow_only:false}
 ]}));
 return{root,manifest};
}
test('Case Architect context contains abstract patterns but no evidence facts or solution text',()=>{
 const {manifest}=setup();
 const r=spawnSync(process.execPath,[tool,'--manifest',manifest,'--brief','identity record cross check','--mode','approved'],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);
 assert.equal(out.schema_version,'case_architect_context_pack_v1');
 assert.equal(out.corpus_policy.no_raw_source_text,true);
 assert.ok(out.pattern_palette.length>0);
 assert.match(r.stdout,/identity-substitution|record-mismatch/);
 assert.doesNotMatch(r.stdout,/SECRET_EVIDENCE|SECRET_SOLUTION|SECRET_REVEAL|SECRET_INCIDENT|SECRET_CORE|SECRET_CAUSAL/);
});
test('approved mode context declares approved-only policy',()=>{
 const {manifest}=setup();
 const r=spawnSync(process.execPath,[tool,'--manifest',manifest,'--brief','identity','--mode','approved'],{cwd:repo,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);
 assert.equal(out.corpus_policy.approved_only,true);
 assert.equal(out.shadow_warning,null);
});
