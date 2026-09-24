import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';

const repo=process.cwd();
const runner=path.join(repo,'tools/mystery-corpus/run-concept-tournament-provider.mjs');

function approvedCase(){
 return {schema_version:'case_dna_v1',case_id:'APPROVED_CONTEXT_CASE',title:'Approved',
  source:{source_type:'public_domain_fiction',rights_status:'public_domain',ingestion_policy:'full_text_allowed',provenance:'fixture',source_reference:'https://example.test/a',raw_text_retained:false},
  incident:{category:'theft',surface_problem:'SOURCE_SECRET_INCIDENT'},mechanism:{core_mechanism:'SOURCE_SECRET_CORE',mechanism_tags:['identity-substitution']},
  evidence:[{id:'E1',type:'physical',provenance:'fixture',fact:'SOURCE_SECRET_EVIDENCE',availability_stage:0,reliability:'high'}],
  hypotheses:[{id:'H1',claim:'SOURCE_SECRET_SOLUTION'}],quality:{editorial_lessons:['separate observation from inference']},
  reveal:{recontextualized_facts:['SOURCE_SECRET_REVEAL'],causal_compression:'SOURCE_SECRET_CAUSAL',new_answer_changing_fact:false},
  fingerprint:{incident_tags:['theft'],setting_tags:[],mechanism_tags:['identity-substitution'],motive_tags:[],character_topology:[],evidence_topology:['physical+document'],reversal_tags:['identity-frame'],decisive_proof_tags:['cross-check'],signature_action_tags:['compare-records']}};
}
function concept(req){
 const ids=req.generation_audit_requirements.retrieved_case_ids||[];
 return {schema_version:'case_concept_v1',concept_id:'generated-concept',working_title:'Fresh Concept',hook:'A fresh hook',role:'investigator',mode:'solo',incident:'A newly invented incident',
  canon_skeleton:{who:'new actor',why:'new motive',how:'new mechanism',where:'new place',when:'new timeline'},
  hypotheses:['version one','version two','version three'],
  evidence_plan:[1,2,3,4,5].map(i=>({type:['physical','document','digital','witness','institutional'][i-1],function:'function '+i,player_fact:'new fact '+i,supports_or_discriminates:['version '+i]})),
  lies_and_secrets:['secret for another reason','mistaken statement'],red_herrings:['true fact misread','real lie unrelated to guilt'],
  recontextualization:'Known facts change meaning.',signature_action:'Player physically compares two independent records.',final_reconstruction:'WHO WHY HOW WHERE WHEN from pre-reveal facts.',differentiation:'Fresh mechanism and setting.',
  generation_audit:{variant:req.variant,context_mode:req.variant==='corpus'?'approved':'none',retrieved_case_ids:req.variant==='corpus'?ids:[],used_pattern_dimensions:req.variant==='corpus'?['evidence_topology']:[],copied_source_plot:false}};
}
function setup(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'concept-tournament-'));
 const approved=path.join(root,'approved');fs.mkdirSync(approved);
 fs.writeFileSync(path.join(approved,'a.json'),JSON.stringify(approvedCase()));
 const manifest=path.join(root,'layers.json');
 fs.writeFileSync(manifest,JSON.stringify({schema_version:'corpus_layer_manifest_v1',manifest_id:'m',layers:[{layer_id:'approved',status:'approved_legacy',path:'approved',retrieval_allowed:true,shadow_only:false}]}));
 return{root,manifest,out:path.join(root,'out')};
}
async function withServer(fn){
 const captured=[];
 const server=http.createServer((req,res)=>{let body='';req.on('data',d=>body+=d);req.on('end',()=>{const parsed=JSON.parse(body);captured.push(parsed);res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({concept:concept(parsed)}));});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{await fn(`http://127.0.0.1:${server.address().port}/concept`,captured);}finally{await new Promise(r=>server.close(r));}
}
function run(manifest,out,endpoint){
 return new Promise(resolve=>{const c=spawn(process.execPath,[runner,'--manifest',manifest,'--brief','premium solo identity evidence','--outdir',out,'--endpoint',endpoint,'--pair-id','pair-007'],{cwd:repo,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';c.stdout.on('data',d=>stdout+=d);c.stderr.on('data',d=>stderr+=d);c.on('close',code=>resolve({code,stdout,stderr}));});
}
test('tournament makes isolated baseline and corpus provider calls and anonymizes evaluation',async()=>{
 const {manifest,out}=setup();
 await withServer(async(endpoint,captured)=>{
  const r=await run(manifest,out,endpoint);assert.equal(r.code,0,r.stderr);
  assert.equal(captured.length,2);
  const base=captured.find(x=>x.variant==='baseline'),corp=captured.find(x=>x.variant==='corpus');
  assert.ok(base);assert.ok(corp);
  assert.equal(base.corpus_context,null);
  assert.deepEqual(base.generation_audit_requirements.retrieved_case_ids,[]);
  assert.ok(corp.generation_audit_requirements.retrieved_case_ids.includes('APPROVED_CONTEXT_CASE'));
  assert.doesNotMatch(JSON.stringify(corp),/SOURCE_SECRET_EVIDENCE|SOURCE_SECRET_SOLUTION|SOURCE_SECRET_REVEAL|SOURCE_SECRET_INCIDENT|SOURCE_SECRET_CORE|SOURCE_SECRET_CAUSAL/);
  const evalText=fs.readFileSync(path.join(out,'evaluation.packet.json'),'utf8');
  assert.doesNotMatch(evalText,/generation_audit|APPROVED_CONTEXT_CASE|baseline|corpus/);
  const mapping=JSON.parse(fs.readFileSync(path.join(out,'tournament.mapping.private.json'),'utf8'));
  assert.equal(mapping.pair_id,'pair-007');
  assert.equal(mapping.evaluator_mapping_withheld,undefined);
 });
});
