import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = process.cwd();
const validateCase = path.join(repo, 'tools/mystery-corpus/validate-case-dna.mjs');
const validateCorpus = path.join(repo, 'tools/mystery-corpus/validate-corpus.mjs');

function fixture(overrides = {}) {
  return {
    schema_version:'case_dna_v1',
    case_id:'test-case',
    title:'Test Case',
    source:{
      source_type:'synthetic',
      rights_status:'owned',
      ingestion_policy:'full_text_allowed',
      provenance:'test fixture',
      raw_text_retained:false
    },
    incident:{category:'test',surface_problem:'test',setting:'test',stakes:'test',crime_required:false},
    mechanism:{core_mechanism:'test',mechanism_tags:['test'],secondary_traces:[]},
    evidence:[{
      id:'E1',type:'other',provenance:'test',fact:'fact',
      availability_stage:0,reliability:'high',supports:['H1'],weakens:[],
      essential:true,corroborated_by:[],source_reason:'test'
    }],
    hypotheses:[{
      id:'H1',claim:'claim',supporting_evidence:['E1'],contradicting_evidence:[],
      viable_until_stage:1,canonical:true
    }],
    reveal:{
      recontextualized_facts:['fact'],causal_compression:'compression',
      signature_moment:'',retell_hook:'hook',new_answer_changing_fact:false
    },
    fingerprint:{
      incident_tags:['test'],setting_tags:['test'],mechanism_tags:['test'],motive_tags:[],
      character_topology:[],evidence_topology:['test'],reversal_tags:[],
      decisive_proof_tags:['test'],signature_action_tags:[]
    },
    ...overrides
  };
}

test('single Case DNA validator accepts a valid record', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-case-'));
  const file = path.join(dir, 'case.json');
  fs.writeFileSync(file, JSON.stringify(fixture()));
  const r = spawnSync(process.execPath, [validateCase, file], {encoding:'utf8'});
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Case DNA VALID/);
});

test('rights boundary rejects unknown rights without restrictive policy', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-rights-'));
  const file = path.join(dir, 'case.json');
  const d = fixture();
  d.source.rights_status = 'unknown';
  d.source.ingestion_policy = 'full_text_allowed';
  fs.writeFileSync(file, JSON.stringify(d));
  const r = spawnSync(process.execPath, [validateCase, file], {encoding:'utf8'});
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /unknown rights_status requires prohibited_pending_review/);
});

test('corpus validator rejects duplicate case ids', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-dir-'));
  fs.writeFileSync(path.join(dir, 'a.json'), JSON.stringify(fixture()));
  fs.writeFileSync(path.join(dir, 'b.json'), JSON.stringify({...fixture(), title:'Second'}));
  const r = spawnSync(process.execPath, [validateCorpus, dir], {encoding:'utf8'});
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /duplicate case_id/);
});
