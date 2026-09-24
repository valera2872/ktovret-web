import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const validator=path.join(repo,'tools/mystery-corpus/validate-source-grounding-audit.mjs');

function audit(){
 return {
  schema_version:'corpus_source_grounding_audit_v1',
  audit_id:'audit-1',
  auditor_context_id:'extractor-context',
  independent_review:false,
  can_approve:false,
  created_at:'2026-09-24',
  items:[{
    case_id:'case-1',
    status:'ready_for_independent_review',
    source_access:true,
    rights_evidence_access:true,
    critical_claims_checked:['$.mechanism.core_mechanism'],
    findings:[],
    repairs_applied:[]
  }],
  summary:{total:1,ready:1,needs_repair:0,blocked:0,independent_review_still_required:true}
 };
}
function run(a){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ground-audit-'));
 const f=path.join(dir,'audit.json'); fs.writeFileSync(f,JSON.stringify(a));
 return spawnSync(process.execPath,[validator,f],{cwd:repo,encoding:'utf8'});
}
test('non-independent grounding audit may mark ready but never approved',()=>{
 const r=run(audit());
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/NON-INDEPENDENT/);
});
test('grounding audit cannot claim approval authority',()=>{
 const a=audit(); a.can_approve=true;
 const r=run(a);
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/can never approve/);
});
test('ready status requires source and rights evidence access',()=>{
 const a=audit(); a.items[0].rights_evidence_access=false;
 const r=run(a);
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/cannot be ready/);
});
