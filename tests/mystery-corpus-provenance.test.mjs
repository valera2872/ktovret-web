import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const validator=path.join(repo,'tools/mystery-corpus/validate-case-dna-provenance.mjs');

function caze() {
  return {
    schema_version:'case_dna_v1',
    case_id:'prov-test',
    incident:{surface_problem:'x'},
    mechanism:{core_mechanism:'y'},
    evidence:[{id:'E1'}],
    hypotheses:[{id:'H1'}],
    reveal:{causal_compression:'z'}
  };
}
function provenance() {
  return {
    schema_version:'case_dna_provenance_v1',
    case_id:'prov-test',
    source_snapshot:{
      provenance:'test source',
      source_reference:'https://example.test/source',
      rights_status:'owned',
      ingestion_policy:'full_text_allowed',
      snapshot_hash:null,
      snapshot_date:'2026-09-23'
    },
    claims:[
      {case_dna_path:'$.incident.surface_problem',status:'source_supported',materiality:'critical',source_locator:'L1',support_note:null,reviewer_note:null},
      {case_dna_path:'$.mechanism.core_mechanism',status:'abstracted_from_source',materiality:'critical',source_locator:'L2-L4',support_note:'abstracted mechanism',reviewer_note:null},
      {case_dna_path:'$.evidence[0]',status:'source_supported',materiality:'critical',source_locator:'L5',support_note:null,reviewer_note:null},
      {case_dna_path:'$.hypotheses[0]',status:'abstracted_from_source',materiality:'critical',source_locator:'L6-L7',support_note:null,reviewer_note:null},
      {case_dna_path:'$.reveal',status:'source_supported',materiality:'critical',source_locator:'L8',support_note:null,reviewer_note:null}
    ],
    review:{review_status:'approved',reviewed_at:'2026-09-23',reviewer:'test',notes:null}
  };
}
function run(p,extra=[]) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'prov-test-'));
  const cf=path.join(dir,'case.json'), pf=path.join(dir,'prov.json');
  fs.writeFileSync(cf,JSON.stringify(caze()));
  fs.writeFileSync(pf,JSON.stringify(p));
  return spawnSync(process.execPath,[validator,'--case',cf,'--provenance',pf,...extra],{encoding:'utf8'});
}

test('approved provenance passes when all critical areas are source-grounded',()=>{
  const r=run(provenance(),['--require-approved']);
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/Case DNA provenance VALID/);
});

test('critical editorial inference fails',()=>{
  const p=provenance();
  p.claims[1].status='editorial_inference';
  const r=run(p);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/critical claim cannot be editorial_inference/);
});

test('approved ingestion fails when a critical claim is unknown',()=>{
  const p=provenance();
  p.claims[1].status='unknown';
  p.claims[1].source_locator=null;
  const r=run(p,['--require-approved']);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/approved ingestion cannot contain UNKNOWN critical claims/);
});

test('missing evidence provenance area fails',()=>{
  const p=provenance();
  p.claims=p.claims.filter(x=>!x.case_dna_path.startsWith('$.evidence'));
  const r=run(p);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/missing provenance coverage for critical area: \$\.evidence/);
});
