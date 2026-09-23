import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const merge=path.join(repo,'tools/mystery-corpus/merge-adversarial-theories.mjs');

function baseCase() {
  return {
    case_id:'c',
    evidence:[
      {id:'E1',type:'physical',availability_stage:0,reliability:'high',supports:['HC'],weakens:[]},
      {id:'E2',type:'document',availability_stage:1,reliability:'high',supports:['HC'],weakens:[]}
    ],
    hypotheses:[
      {id:'HC',claim:'canon',canonical:true,supporting_evidence:['E1','E2'],contradicting_evidence:[]}
    ],
    reveal:{new_answer_changing_fact:false}
  };
}
function theory(overrides={}) {
  return {
    schema_version:'adversarial_theory_v1',
    theory_id:'A1',
    claim:'Alternative explanation',
    explains_evidence_ids:['E1'],
    conflicts_evidence_ids:['E2'],
    assumptions:['one assumption'],
    requires_new_answer_fact:false,
    discriminating_checks:[],
    ...overrides
  };
}
function run(t) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'adv-merge-'));
  const cf=path.join(dir,'case.json'), tf=path.join(dir,'theories.json'), out=path.join(dir,'out.json');
  fs.writeFileSync(cf,JSON.stringify(baseCase()));
  fs.writeFileSync(tf,JSON.stringify(t));
  const r=spawnSync(process.execPath,[merge,'--case',cf,'--theories',tf,'--out',out],{encoding:'utf8'});
  return {r,out};
}

test('merges a fair adversarial theory into Case DNA graph',()=>{
  const {r,out}=run(theory());
  assert.equal(r.status,0,r.stderr);
  const d=JSON.parse(fs.readFileSync(out,'utf8'));
  const h=d.hypotheses.find(x=>x.id==='ADV:A1');
  assert.ok(h);
  assert.deepEqual(h.supporting_evidence,['E1']);
  assert.deepEqual(h.contradicting_evidence,['E2']);
  assert.ok(d.evidence.find(x=>x.id==='E1').supports.includes('ADV:A1'));
  assert.ok(d.evidence.find(x=>x.id==='E2').weakens.includes('ADV:A1'));
});

test('rejects an adversarial theory that references unavailable evidence',()=>{
  const {r}=run(theory({explains_evidence_ids:['E99']}));
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/unknown evidence: E99/);
});

test('rejects an alternative that needs a new answer-changing fact',()=>{
  const {r}=run(theory({requires_new_answer_fact:true}));
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/cannot be merged as a fair competing theory/);
});
