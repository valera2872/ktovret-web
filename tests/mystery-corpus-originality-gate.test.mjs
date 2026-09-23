import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo=process.cwd();
const gate=path.join(repo,'tools/mystery-corpus/originality-gate.mjs');
const taxonomy=path.join(repo,'docs/corpus/fingerprint-taxonomy-v0.1.json');

function corpusCase(id,fp) {
  return {
    schema_version:'case_dna_v1',
    case_id:id,
    title:id,
    source:{
      source_type:'synthetic',
      rights_status:'owned',
      ingestion_policy:'full_text_allowed',
      provenance:'fixture',
      raw_text_retained:false
    },
    incident:{category:'x',surface_problem:'x'},
    mechanism:{core_mechanism:'x',mechanism_tags:fp.mechanism_tags||[]},
    evidence:[{id:'E1',type:'other',provenance:'x',fact:'x',availability_stage:0,reliability:'high'}],
    hypotheses:[{id:'H1',claim:'x',canonical:true}],
    reveal:{recontextualized_facts:['x'],causal_compression:'x'},
    fingerprint:fp
  };
}

function run(candidate,existing) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'orig-gate-'));
  fs.writeFileSync(path.join(dir,'existing.json'),JSON.stringify(corpusCase('existing',existing)));
  const c=path.join(dir,'candidate.tmp');
  fs.writeFileSync(c,JSON.stringify({case_id:'candidate',fingerprint:candidate}));
  const r=spawnSync(process.execPath,[gate,'--candidate',c,'--dir',dir,'--taxonomy',taxonomy],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  return JSON.parse(r.stdout);
}

test('semantic aliases can trigger structural review',()=>{
  const existing={
    mechanism_tags:['controlled-demonstration','representation-vs-reality'],
    evidence_topology:['claims+technical+financial'],
    reversal_tags:['demo-is-not-general-capability'],
    decisive_proof_tags:['independent-operational-records'],
    signature_action_tags:[],incident_tags:[],setting_tags:[],motive_tags:[],character_topology:[]
  };
  const candidate={
    mechanism_tags:['demo-vs-operation','configuration-divergence'],
    evidence_topology:['technical+financial+records'],
    reversal_tags:['demo-capability-not-production-capability'],
    decisive_proof_tags:['process-record-convergence'],
    signature_action_tags:[],incident_tags:[],setting_tags:[],motive_tags:[],character_topology:[]
  };
  const out=run(candidate,existing);
  assert.notEqual(out.gate,'PASS');
  assert.ok(out.neighbors[0].dimensions.mechanism_tags.shared.includes('demo-vs-operation'));
});

test('one abstract inspiration does not automatically fail a distinct concept',()=>{
  const existing={
    mechanism_tags:['longitudinal-investigation'],
    evidence_topology:['property+behavior+cooperator'],
    reversal_tags:['strong-alibi-is-not-exoneration'],
    decisive_proof_tags:['corroborated-insider'],
    signature_action_tags:[],incident_tags:[],setting_tags:[],motive_tags:[],character_topology:[]
  };
  const candidate={
    mechanism_tags:['preauthorized-process','institutional-rule-exploit'],
    evidence_topology:['authorization+physical+institutional-record'],
    reversal_tags:['alibi-is-true-but-irrelevant'],
    decisive_proof_tags:['precondition-trace+benefit-chain'],
    signature_action_tags:['test-alibi-against-causality'],
    incident_tags:[],setting_tags:[],motive_tags:[],character_topology:[]
  };
  const out=run(candidate,existing);
  assert.equal(out.gate,'PASS');
});
