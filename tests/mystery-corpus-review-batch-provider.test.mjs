import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn,spawnSync} from 'node:child_process';

const repo=process.cwd();
const runner=path.join(repo,'tools/mystery-corpus/run-review-batch-provider.mjs');
const lockTool=path.join(repo,'tools/mystery-corpus/build-review-batch-lock.mjs');

function makeCandidate(dir,caseId,runId,jobId){
  const caseDna={
    schema_version:'case_dna_v1',case_id:caseId,title:'Derived',
    source:{source_type:'real_case',rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',provenance:'agency',source_reference:'https://example.test/source',raw_text_retained:false},
    incident:{category:'fraud',surface_problem:'Discrepancy.',setting:'office',stakes:'Find cause',crime_required:true},
    mechanism:{core_mechanism:'record mismatch',mechanism_tags:['record-mismatch'],secondary_traces:[]},
    evidence:[{id:'E1',type:'document',provenance:'§1',fact:'A conflicts with B.',availability_stage:0,reliability:'high',supports:['HC'],weakens:['HA'],essential:true,corroborated_by:[],source_reason:'source'}],
    hypotheses:[{id:'HC',claim:'intentional',supporting_evidence:['E1'],contradicting_evidence:[],viable_until_stage:0,canonical:true},{id:'HA',claim:'error',supporting_evidence:[],contradicting_evidence:['E1'],viable_until_stage:0,canonical:false}],
    reveal:{recontextualized_facts:['E1'],causal_compression:'systematic',signature_moment:'',retell_hook:'',new_answer_changing_fact:false},
    fingerprint:{incident_tags:['fraud'],setting_tags:['office'],mechanism_tags:['record-mismatch'],motive_tags:[],character_topology:[],evidence_topology:['doc-conflict'],reversal_tags:[],decisive_proof_tags:['doc-conflict'],signature_action_tags:[]}
  };
  const prov={
    schema_version:'case_dna_provenance_v1',case_id:caseId,
    source_snapshot:{provenance:'agency',source_reference:'https://example.test/source',rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',snapshot_hash:null,snapshot_date:'2026-09-23'},
    claims:[
      {case_dna_path:'$.incident',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
      {case_dna_path:'$.mechanism.core_mechanism',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
      {case_dna_path:'$.evidence[0]',status:'source_supported',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
      {case_dna_path:'$.hypotheses[0]',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
      {case_dna_path:'$.reveal',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null}
    ],
    review:{review_status:'needs_review',reviewed_at:null,reviewer:null,notes:null}
  };
  const job={
    schema_version:'corpus_ingestion_job_v1',job_id:jobId,
    source:{source_id:caseId,title:'Source',source_family:'fbi_history',source_type:'real_case',source_reference:'https://example.test/source',source_locator:null,rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',raw_text_retained:false,target_pattern_tags:[]},
    constraints:{retain_raw_text:false,copy_distinctive_plot:false,fabricate_unknowns:false,critical_claims_need_locators:true,output_language:'en',notes:[]},
    required_outputs:['case_dna_v1','case_dna_provenance_v1','extraction_notes']
  };
  const result={schema_version:'corpus_extraction_result_v1',extraction_run_id:runId,job_id:jobId,extractor_id:'extractor-A',extracted_at:'2026-09-23',case_dna:caseDna,provenance:prov,extraction_notes:{}};
  const notes={};
  result.extraction_notes=notes;
  const reviewRequest={
    schema_version:'corpus_extraction_review_request_v1',
    extraction_run_id:runId,
    job_id:jobId,
    case_id:caseId,
    extractor_id:'extractor-A',
    reviewer_must_differ_from_extractor:true,
    source_references:['https://example.test/source'],
    checks_required:['critical_claims_supported','rights_policy_match'],
    review_instructions:['verify independently'],
    rights_evidence_reference:'https://example.test/rights',
    rights_verified_date:'2026-09-23'
  };
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'job.json'),JSON.stringify(job));
  fs.writeFileSync(path.join(dir,'extraction-result.json'),JSON.stringify(result));
  fs.writeFileSync(path.join(dir,'case-dna.json'),JSON.stringify(caseDna));
  fs.writeFileSync(path.join(dir,'provenance.json'),JSON.stringify(prov));
  fs.writeFileSync(path.join(dir,'extraction-notes.json'),JSON.stringify(notes));
  fs.writeFileSync(path.join(dir,'review-request.json'),JSON.stringify(reviewRequest));
}
function mkBatch(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'review-batch-'));
  fs.mkdirSync(path.join(root,'candidates'));
  makeCandidate(path.join(root,'candidates','01-a'),'case-a','run-a','job-a');
  makeCandidate(path.join(root,'candidates','02-b'),'case-b','run-b','job-b');
  fs.writeFileSync(path.join(root,'batch-manifest.json'),JSON.stringify({
    schema_version:'corpus_review_batch_v1',
    batch_id:'batch-test',
    version:'0.1',
    extractor_id:'extractor-A',
    reviewer_must_differ_from_extractor:true,
    rights_evidence_required:true,
    candidates:[
      {folder:'01-a',case_id:'case-a',source_family:'fbi_history',status:'needs_review'},
      {folder:'02-b',case_id:'case-b',source_family:'fbi_history',status:'needs_review'}
    ]
  }));
  const lock=spawnSync(process.execPath,[lockTool,'--batch-dir',root],{cwd:repo,encoding:'utf8'});
  assert.equal(lock.status,0,lock.stderr);
  return root;
}
function reviewFor(contract,approved=true){
  const r=contract.extraction_result;
  return {
    schema_version:'corpus_extraction_review_v1',
    extraction_run_id:r.extraction_run_id,
    job_id:r.job_id,
    case_id:r.case_dna.case_id,
    extractor_id:r.extractor_id,
    reviewer_id:'reviewer-B',
    reviewed_at:'2026-09-24T00:00:00Z',
    checks:{rights_policy_match:approved,critical_claims_supported:approved,unknowns_preserved:true,hypotheses_grounded:approved,no_raw_text_leakage:true,no_distinctive_plot_copy:true},
    verdict:approved?'approved':'needs_rework',
    issues:approved?[]:[{severity:'fail',code:'GROUNDING',message:'needs rework',case_dna_path:'$.mechanism.core_mechanism',source_locator:'§1'}],
    notes:null
  };
}
async function withServer(handler,fn){
  const server=http.createServer((req,res)=>{
    let body=''; req.on('data',d=>body+=d); req.on('end',()=>{
      const request=JSON.parse(body);
      const reply=handler(request);
      res.writeHead(200,{'content-type':'application/json'});
      res.end(JSON.stringify({review:reply}));
    });
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{ await fn(`http://127.0.0.1:${server.address().port}/review`); }
  finally{ await new Promise(r=>server.close(r)); }
}
function run(batch,endpoint,out){
  return new Promise(resolve=>{
    const c=spawn(process.execPath,[runner,'--batch-dir',batch,'--reviewer-id','reviewer-B','--endpoint',endpoint,'--out',out],{cwd:repo,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr=''; c.stdout.on('data',d=>stdout+=d); c.stderr.on('data',d=>stderr+=d);
    c.on('close',code=>resolve({code,stdout,stderr}));
  });
}

test('batch runner reports all candidates eligible when independent reviews approve',async()=>{
  const batch=mkBatch(), out=path.join(batch,'report.json');
  await withServer(req=>reviewFor(req.review_contract,true),async endpoint=>{
    const r=await run(batch,endpoint,out);
    assert.equal(r.code,0,r.stderr);
  });
  const report=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(report.summary.total,2);
  assert.equal(report.summary.eligible,2);
  assert.equal(report.summary.blocked,0);
  assert.match(report.note,/never promotes/i);
});

test('batch runner keeps whole result visible when one candidate needs rework',async()=>{
  const batch=mkBatch(), out=path.join(batch,'report.json');
  let calls=0;
  await withServer(req=>reviewFor(req.review_contract,++calls!==2),async endpoint=>{
    const r=await run(batch,endpoint,out);
    assert.notEqual(r.code,0);
  });
  const report=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(report.summary.eligible,1);
  assert.equal(report.summary.blocked,1);
  assert.equal(report.items[1].review_status,'needs_rework');
});

test('batch runner rejects same reviewer and extractor identity',async()=>{
  const batch=mkBatch();
  const r=await new Promise(resolve=>{
    const c=spawn(process.execPath,[runner,'--batch-dir',batch,'--reviewer-id','extractor-A','--endpoint','http://127.0.0.1:1'],{cwd:repo,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr=''; c.stdout.on('data',d=>stdout+=d); c.stderr.on('data',d=>stderr+=d);
    c.on('close',code=>resolve({code,stdout,stderr}));
  });
  assert.notEqual(r.code,0);
  assert.match(r.stderr,/must differ from batch extractor_id/);
});


test('batch runner refuses tampered package before calling reviewer',async()=>{
  const batch=mkBatch(), out=path.join(batch,'report.json');
  fs.writeFileSync(path.join(batch,'candidates','01-a','job.json'),'{"tampered":true}');
  let called=false;
  await withServer(req=>{called=true;return reviewFor(req.review_contract,true)},async endpoint=>{
    const r=await run(batch,endpoint,out);
    assert.notEqual(r.code,0);
    assert.match(r.stderr,/preflight failed|integrity lock failed|hash mismatch|validation failed/i);
  });
  assert.equal(called,false);
});
