import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const wrapper=path.join(repo,'tools/mystery-corpus/run-openai-review-batch.mjs');
const adapter=path.join(repo,'tools/mystery-corpus/openai-reviewer-adapter.mjs');

test('one-command OpenAI review runner refuses execution without API key',()=>{
  const env={...process.env};
  delete env.OPENAI_API_KEY;
  const r=spawnSync(process.execPath,[wrapper,'--batch-dir','/tmp/does-not-matter','--reviewer-id','reviewer-X'],{
    cwd:repo,env,encoding:'utf8'
  });
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/OPENAI_API_KEY is required/);
});

test('OpenAI adapter supports ephemeral port for isolated local execution',()=>{
  const src=fs.readFileSync(adapter,'utf8');
  assert.match(src,/server\.address\(\)/);
  assert.match(src,/actualPort/);
});

test('one-command runner launches stateless adapter and existing batch runner',()=>{
  const src=fs.readFileSync(wrapper,'utf8');
  assert.match(src,/openai-reviewer-adapter\.mjs/);
  assert.match(src,/run-review-batch-provider\.mjs/);
  assert.match(src,/CORPUS_REVIEWER_PORT:'0'/);
  assert.match(src,/SIGTERM/);
});
