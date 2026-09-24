import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = process.cwd();
const retrieve = path.join(repo, 'tools/mystery-corpus/retrieve-patterns.mjs');
const compare = path.join(repo, 'tools/mystery-corpus/compare-fingerprints.mjs');

function baseCase(id, sourceType, fingerprint, mechanismTags = []) {
  return {
    schema_version:'case_dna_v1',
    case_id:id,
    title:id,
    source:{
      source_type:sourceType,
      rights_status:'owned',
      ingestion_policy:'full_text_allowed',
      provenance:'fixture',
      raw_text_retained:false
    },
    incident:{category:'test',surface_problem:'test',setting:'test',stakes:'test',crime_required:false},
    mechanism:{core_mechanism:mechanismTags.join(' '),mechanism_tags:mechanismTags,secondary_traces:[]},
    evidence:[{
      id:'E1',type:'other',provenance:'fixture',fact:'fact',
      availability_stage:0,reliability:'high',supports:['H1'],weakens:[],
      essential:true,corroborated_by:[],source_reason:'fixture'
    }],
    hypotheses:[{id:'H1',claim:'claim',supporting_evidence:['E1'],contradicting_evidence:[],canonical:true}],
    reveal:{recontextualized_facts:['fact'],causal_compression:'x',new_answer_changing_fact:false},
    quality:{fair_play:'pass',technical_reality:'pass',wow_status:'valid',editorial_lessons:[]},
    fingerprint:{
      incident_tags:[],setting_tags:[],mechanism_tags:[],motive_tags:[],character_topology:[],
      evidence_topology:[],reversal_tags:[],decisive_proof_tags:[],signature_action_tags:[],
      ...fingerprint
    }
  };
}

function makeCorpus() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'mystery-corpus-retrieval-'));
  fs.writeFileSync(path.join(dir,'invisible.json'), JSON.stringify(baseCase('invisible','public_domain_fiction',{
    mechanism_tags:['social-invisibility','attention-blindness'],
    evidence_topology:['witness-negative+role-access'],
    reversal_tags:['nobody-means-unnoticed-person'],
    decisive_proof_tags:['role-opportunity']
  },['social-invisibility','attention-blindness'])));
  fs.writeFileSync(path.join(dir,'digital.json'), JSON.stringify(baseCase('digital','real_case',{
    mechanism_tags:['metadata','digital-trace'],
    evidence_topology:['metadata+institutional-link'],
    reversal_tags:['deleted-data-is-not-gone'],
    decisive_proof_tags:['metadata-corroborated']
  },['metadata','digital-trace'])));
  return dir;
}

test('retriever finds role/invisibility pattern from Russian query', () => {
  const dir = makeCorpus();
  const r = spawnSync(process.execPath,[retrieve,'--dir',dir,'--query','невидимый участник роль доступ','--limit','2'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const out=JSON.parse(r.stdout);
  assert.equal(out.results[0].case_id,'invisible');
});

test('fingerprint comparator exposes structural dimensions', () => {
  const dir = makeCorpus();
  const candidate=path.join(dir,'candidate.tmp');
  fs.writeFileSync(candidate,JSON.stringify({case_id:'c',fingerprint:{
    incident_tags:[],setting_tags:[],mechanism_tags:['social-invisibility','attention-blindness'],
    motive_tags:[],character_topology:[],
    evidence_topology:['witness-negative+role-access'],
    reversal_tags:['nobody-means-unnoticed-person'],
    decisive_proof_tags:['role-opportunity'],
    signature_action_tags:[]
  }}));
  const r=spawnSync(process.execPath,[compare,'--candidate',candidate,'--dir',dir,'--limit','2'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const out=JSON.parse(r.stdout);
  assert.equal(out.results[0].case_id,'invisible');
  assert.ok(out.results[0].structural_similarity > 0.9);
  assert.equal(out.results[0].dimensions.evidence_topology.score,1);
});
