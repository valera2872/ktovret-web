import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const validate=path.join(repo,'tools/mystery-corpus/validate-source-queue.mjs');
const plan=path.join(repo,'tools/mystery-corpus/build-ingestion-plan.mjs');

function queue() {
  return {
    schema_version:'corpus_source_queue_v1',
    queue_id:'q1',
    created_date:'2026-09-23',
    items:[
      {source_id:'pg-ready',title:'Ready Book',creator:'A',source_family:'project_gutenberg',source_type:'public_domain_fiction',source_reference:'https://example/pg',source_locator:'book',jurisdiction:'US',year:1900,rights_status:'public_domain',ingestion_policy:'full_text_allowed',raw_text_retained:false,priority:'P0',status:'rights_verified',rights_evidence_reference:'https://example/pg',rights_verified_date:'2026-09-23',target_pattern_tags:['misdirection'],notes:null},
      {source_id:'fbi-ready',title:'Ready Case',creator:null,source_family:'fbi_history',source_type:'real_case',source_reference:'https://example/fbi',source_locator:'case',jurisdiction:'US',year:1950,rights_status:'government_public_record',ingestion_policy:'metadata_and_analysis_only',raw_text_retained:false,priority:'P0',status:'rights_verified',rights_evidence_reference:'https://example/fbi',rights_verified_date:'2026-09-23',target_pattern_tags:['forensics'],notes:null},
      {source_id:'blocked',title:'Unknown Film',creator:null,source_family:'other',source_type:'film',source_reference:'https://example/film',source_locator:null,jurisdiction:null,year:2000,rights_status:'unknown',ingestion_policy:'prohibited_pending_review',raw_text_retained:false,priority:'P1',status:'candidate',target_pattern_tags:[],notes:null}
    ]
  };
}
function write(q) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'source-queue-'));
  const file=path.join(dir,'q.json');
  fs.writeFileSync(file,JSON.stringify(q));
  return {dir,file};
}

test('valid queue accepts ready and blocked candidates',()=>{
  const {file}=write(queue());
  const r=spawnSync(process.execPath,[validate,file],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/Source Queue VALID/);
});

test('unknown rights cannot silently enter queue',()=>{
  const q=queue();
  q.items[2].status='queued';
  const {file}=write(q);
  const r=spawnSync(process.execPath,[validate,file],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/unknown rights cannot be queued/);
});

test('planner excludes blocked sources and balances source families',()=>{
  const {dir,file}=write(queue());
  const out=path.join(dir,'plan.json');
  const r=spawnSync(process.execPath,[plan,'--queue',file,'--limit','3','--out',out],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const p=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(p.selected_count,2);
  assert.deepEqual(new Set(p.items.map(x=>x.source_id)),new Set(['pg-ready','fbi-ready']));
  assert.equal(p.blocked_count,1);
});

test('rights-verified source requires rights evidence and verification date',()=>{
  const q=queue();
  delete q.items[0].rights_evidence_reference;
  delete q.items[0].rights_verified_date;
  const {file}=write(q);
  const r=spawnSync(process.execPath,[validate,file],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/requires rights_evidence_reference/);
  assert.match(r.stderr,/requires rights_verified_date/);
});
