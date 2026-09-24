import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const build=path.join(repo,'tools/mystery-corpus/build-blind-packet.mjs');
const runBlind=path.join(repo,'tools/mystery-corpus/run-blind-baseline.mjs');

function fixture() {
  return {
    schema_version:'case_dna_v1',
    case_id:'blind-canary',
    title:'Canary',
    source:{source_type:'synthetic',rights_status:'owned',ingestion_policy:'full_text_allowed',provenance:'test'},
    incident:{category:'loss',surface_problem:'Во время проверки пропал прототип.',setting:'lab',stakes:'Нужно понять, что произошло.',crime_required:true},
    mechanism:{core_mechanism:'SECRET_CANARY_X9 hidden mechanism',mechanism_tags:['hidden']},
    characters:[
      {id:'P1',role:'инженер',knowledge:['SECRET_CANARY_X9'],errors:[],lies:[],human_goal:'сохранить работу'},
      {id:'P2',role:'охранник',knowledge:[],errors:[],lies:[],human_goal:'избежать выговора'}
    ],
    timeline:[],
    evidence:[
      {id:'E1',type:'document',provenance:'журнал доступа',fact:'Инженер вошёл в лабораторию в 14:00.',availability_stage:0,reliability:'high',supports:['HC'],weakens:[],essential:false,corroborated_by:[],source_reason:'автоматический журнал'},
      {id:'E2',type:'physical',provenance:'осмотр помещения',fact:'У выхода найден повреждённый транспортный ярлык.',availability_stage:1,reliability:'high',supports:['HC'],weakens:['HA'],essential:true,corroborated_by:[],source_reason:'осмотр'}
    ],
    lies_and_misdirection:[],
    hypotheses:[
      {id:'HC',claim:'SECRET_CANARY_X9 canonical answer',supporting_evidence:['E1','E2'],contradicting_evidence:[],viable_until_stage:1,canonical:true},
      {id:'HA',claim:'ошибка учёта',supporting_evidence:[],contradicting_evidence:['E2'],viable_until_stage:1,canonical:false}
    ],
    deductions:[],
    reveal:{recontextualized_facts:['E2'],causal_compression:'SECRET_CANARY_X9 reveal',signature_moment:'',retell_hook:'',new_answer_changing_fact:false},
    fingerprint:{mechanism_tags:['hidden'],evidence_topology:['doc+physical'],reversal_tags:[],decisive_proof_tags:['label'],incident_tags:[],setting_tags:[],motive_tags:[],character_topology:[],signature_action_tags:[]}
  };
}

function writeCase() {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'blind-orch-'));
  const file=path.join(dir,'case.json');
  fs.writeFileSync(file,JSON.stringify(fixture()));
  return {dir,file};
}

test('builder strips private theory/reliability/mechanism data',()=>{
  const {dir,file}=writeCase();
  const out=path.join(dir,'packet.json');
  const r=spawnSync(process.execPath,[build,'--case',file,'--stage','1','--out',out],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const text=fs.readFileSync(out,'utf8');
  assert.doesNotMatch(text,/SECRET_CANARY_X9/);
  assert.doesNotMatch(text,/"supports"/);
  assert.doesNotMatch(text,/"weakens"/);
  assert.doesNotMatch(text,/"reliability"/);
  const p=JSON.parse(text);
  assert.equal(p.evidence.length,2);
  assert.equal(p.characters.length,2);
});

test('blind runner is solution-isolated by canary',()=>{
  const {dir,file}=writeCase();
  const out=path.join(dir,'run.json');
  const r=spawnSync(process.execPath,[runBlind,'--case',file,'--out',out],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const text=fs.readFileSync(out,'utf8');
  assert.doesNotMatch(text,/SECRET_CANARY_X9/);
  const run=JSON.parse(text);
  assert.equal(run.schema_version,'blind_run_v1');
  assert.equal(run.checkpoints.length,2);
  assert.equal(run.checkpoints[0].stage,0);
  assert.equal(run.checkpoints[1].stage,1);
});

test('later stage exposes only evidence unlocked by availability_stage',()=>{
  const {dir,file}=writeCase();
  const p0=path.join(dir,'p0.json'), p1=path.join(dir,'p1.json');
  spawnSync(process.execPath,[build,'--case',file,'--stage','0','--out',p0],{encoding:'utf8'});
  spawnSync(process.execPath,[build,'--case',file,'--stage','1','--out',p1],{encoding:'utf8'});
  assert.deepEqual(JSON.parse(fs.readFileSync(p0,'utf8')).state.opened_evidence_ids,['E1']);
  assert.deepEqual(JSON.parse(fs.readFileSync(p1,'utf8')).state.opened_evidence_ids,['E1','E2']);
});
