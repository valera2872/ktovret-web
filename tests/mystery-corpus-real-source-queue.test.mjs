import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const queueFile=path.join(repo,'docs/corpus/source-queue-v0.2.json');
const validator=path.join(repo,'tools/mystery-corpus/validate-source-queue.mjs');
const planner=path.join(repo,'tools/mystery-corpus/build-ingestion-plan.mjs');

test('committed v0.2 source queue is valid',()=>{
  const r=spawnSync(process.execPath,[validator,queueFile],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const q=JSON.parse(fs.readFileSync(queueFile,'utf8'));
  assert.equal(q.items.length,56);
  assert.equal(q.items.filter(x=>x.ingestion_policy==='prohibited_pending_review').length,16);
  assert.equal(q.items.filter(x=>x.status==='rights_verified').length,40);
});

test('committed v0.2 queue never plans blocked copyright candidates',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'real-source-plan-'));
  const out=path.join(dir,'plan.json');
  const r=spawnSync(process.execPath,[planner,'--queue',queueFile,'--limit','20','--out',out],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const p=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(p.selected_count,20);
  assert.ok(p.items.every(x=>x.ingestion_policy!=='prohibited_pending_review'));
  assert.ok(p.items.every(x=>x.rights_status!=='unknown'));
  const families=new Set(p.items.map(x=>x.source_family));
  assert.ok(families.size>=4,'first batch should be source-diverse');
});

test('checked-in batch1 equals a valid subset of the queue',()=>{
  const q=JSON.parse(fs.readFileSync(queueFile,'utf8'));
  const batch=JSON.parse(fs.readFileSync(path.join(repo,'docs/corpus/ingestion-plan-v0.2-batch1.json'),'utf8'));
  const byId=new Map(q.items.map(x=>[x.source_id,x]));
  assert.equal(batch.selected_count,batch.items.length);
  for(const x of batch.items){
    const src=byId.get(x.source_id);
    assert.ok(src,`missing source in queue: ${x.source_id}`);
    assert.notEqual(src.rights_status,'unknown');
    assert.notEqual(src.ingestion_policy,'prohibited_pending_review');
  }
});
