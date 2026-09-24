import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const tool=path.join(repo,'tools/mystery-corpus/build-review-batch-lock.mjs');

function batch(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'batch-lock-'));
  fs.mkdirSync(path.join(root,'candidates','01-a'),{recursive:true});
  fs.writeFileSync(path.join(root,'batch-manifest.json'),JSON.stringify({schema_version:'corpus_review_batch_v1',batch_id:'b1',version:'0.1'}));
  fs.writeFileSync(path.join(root,'candidates','01-a','job.json'),JSON.stringify({x:1}));
  fs.writeFileSync(path.join(root,'candidates','01-a','case-dna.json'),JSON.stringify({y:2}));
  return root;
}
test('creates and verifies per-file SHA-256 lock',()=>{
  const root=batch();
  const a=spawnSync(process.execPath,[tool,'--batch-dir',root],{cwd:repo,encoding:'utf8'});
  assert.equal(a.status,0,a.stderr);
  const lock=JSON.parse(fs.readFileSync(path.join(root,'review-batch.lock.json'),'utf8'));
  assert.equal(lock.algorithm,'sha256');
  assert.equal(lock.files.length,3);
  const b=spawnSync(process.execPath,[tool,'--batch-dir',root,'--verify-only'],{cwd:repo,encoding:'utf8'});
  assert.equal(b.status,0,b.stderr);
  assert.match(b.stdout,/Lock VALID/);
});
test('verification fails after a locked file is modified',()=>{
  const root=batch();
  spawnSync(process.execPath,[tool,'--batch-dir',root],{cwd:repo,encoding:'utf8'});
  fs.writeFileSync(path.join(root,'candidates','01-a','job.json'),JSON.stringify({x:999}));
  const r=spawnSync(process.execPath,[tool,'--batch-dir',root,'--verify-only'],{cwd:repo,encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/hash mismatch/);
});
test('verification fails when an unlocked file is added',()=>{
  const root=batch();
  spawnSync(process.execPath,[tool,'--batch-dir',root],{cwd:repo,encoding:'utf8'});
  fs.writeFileSync(path.join(root,'extra.json'),'{}');
  const r=spawnSync(process.execPath,[tool,'--batch-dir',root,'--verify-only'],{cwd:repo,encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/unlocked file present/);
});
