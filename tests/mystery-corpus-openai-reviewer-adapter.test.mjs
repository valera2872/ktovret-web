import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const file=new URL('../tools/mystery-corpus/openai-reviewer-adapter.mjs',import.meta.url);
const src=fs.readFileSync(file,'utf8');

test('OpenAI reviewer adapter is stateless and uses Responses API structured output',()=>{
  assert.match(src,/api\.openai\.com\/v1/);
  assert.match(src,/\/responses/);
  assert.match(src,/type:'json_schema'/);
  assert.match(src,/strict:true/);
  assert.match(src,/corpus_extraction_review_v1/);
});

test('OpenAI reviewer adapter enables live web search and restricts domains when possible',()=>{
  assert.match(src,/type:'web_search'/);
  assert.match(src,/external_web_access:true/);
  assert.match(src,/allowed_domains/);
  assert.match(src,/source_reference/);
  assert.match(src,/rights_evidence_reference/);
});

test('OpenAI reviewer adapter rejects extractor-reviewer identity reuse',()=>{
  assert.match(src,/reviewer_must_differ_from_extractor/);
  assert.match(src,/reviewer_id===contract\.extraction_result\.extractor_id/);
});

test('OpenAI reviewer adapter does not persist conversations or previous response ids',()=>{
  assert.doesNotMatch(src,/previous_response_id/);
  assert.doesNotMatch(src,/conversation_id/);
  assert.doesNotMatch(src,/store\s*:\s*true/);
});
