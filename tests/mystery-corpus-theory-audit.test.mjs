import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo=process.cwd();
const audit=path.join(repo,'tools/mystery-corpus/theory-audit.mjs');

function run(data) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'theory-audit-'));
  const file=path.join(dir,'case.json');
  fs.writeFileSync(file,JSON.stringify(data));
  return spawnSync(process.execPath,[audit,'--case',file,'--require-canonical'],{encoding:'utf8'});
}

function base() {
  return {
    case_id:'c',
    reveal:{new_answer_changing_fact:false},
    evidence:[
      {id:'E1',type:'physical',availability_stage:1,reliability:'high',supports:['HC'],weakens:['HA']},
      {id:'E2',type:'document',availability_stage:2,reliability:'high',supports:['HC'],weakens:['HB']},
      {id:'E3',type:'witness',availability_stage:0,reliability:'medium',supports:['HA','HB'],weakens:[]}
    ],
    hypotheses:[
      {id:'HC',claim:'canon',canonical:true,supporting_evidence:['E1','E2']},
      {id:'HA',claim:'alt a',supporting_evidence:['E3'],contradicting_evidence:['E1']},
      {id:'HB',claim:'alt b',supporting_evidence:['E3'],contradicting_evidence:['E2']}
    ]
  };
}

test('passes when every alternative is discriminated and canon has independent support',()=>{
  const r=run(base());
  assert.equal(r.status,0,r.stderr);
  const out=JSON.parse(r.stdout);
  assert.equal(out.verdict,'PASS');
  assert.equal(out.final_discrimination,'PASS');
  assert.equal(out.approximate_minimum_discriminating_set.length,2);
});

test('fails when an alternative survives without contradictory evidence',()=>{
  const data=base();
  data.evidence[1].weakens=[];
  data.hypotheses[2].contradicting_evidence=[];
  const r=run(data);
  assert.notEqual(r.status,0);
  const out=JSON.parse(r.stdout);
  assert.equal(out.verdict,'FAIL');
  assert.ok(out.issues.some(x=>x.code==='UNRESOLVED_ALTERNATIVE'&&x.hypothesis_id==='HB'));
});

test('fails fair play when reveal introduces answer-changing fact',()=>{
  const data=base();
  data.reveal.new_answer_changing_fact=true;
  const r=run(data);
  assert.notEqual(r.status,0);
  const out=JSON.parse(r.stdout);
  assert.ok(out.issues.some(x=>x.code==='NEW_ANSWER_CHANGING_FACT'));
});
