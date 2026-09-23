import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';

const repo=process.cwd();
const runner=path.join(repo,'tools/mystery-corpus/run-extraction-review-provider.mjs');
const orchestrator=path.join(repo,'tools/mystery-corpus/run-review-promotion-check.mjs');

function fixture(){
  const caseDna={
    schema_version:'case_dna_v1',case_id:'review-provider-derived',title:'Derived',
    source:{source_type:'real_case',rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',provenance:'agency page',source_reference:'https://example.test/source',raw_text_retained:false},
    incident:{category:'fraud',surface_problem:'A discrepancy must be explained.',setting:'office',stakes:'Find cause',crime_required:true},
    mechanism:{core_mechanism:'records conceal actual state',mechanism_tags:['false-records'],secondary_traces:[]},
    evidence:[{id:'E1',type:'document',provenance:'§3',fact:'Record A conflicts with record B.',availability_stage:0,reliability:'high',supports:['HC'],weakens:['HA'],essential:true,corroborated_by:[],source_reason:'official report'}],
    hypotheses:[
      {id:'HC',claim:'intentional falsification',supporting_evidence:['E1'],contradicting_evidence:[],viable_until_stage:0,canonical:true},
      {id:'HA',claim:'clerical error',supporting_evidence:[],contradicting_evidence:['E1'],viable_until_stage:0,canonical:false}
    ],
    reveal:{recontextualized_facts:['E1'],causal_compression:'Systematic conflict.',signature_moment:'',retell_hook:'',new_answer_changing_fact:false},
    fingerprint:{incident_tags:['fraud'],setting_tags:['office'],mechanism_tags:['false-records'],motive_tags:[],character_topology:[],evidence_topology:['document-conflict'],reversal_tags:[],decisive_proof_tags:['cross-record-conflict'],signature_action_tags:[]}
  };
  const provenance={
    schema_version:'case_dna_provenance_v1',case_id:'review-provider-derived',
    source_snapshot:{provenance:'agency page',source_reference:'https://example.test/source',rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',snapshot_hash:null,snapshot_date:'2026-09-23'},
    claims:[
      {case_dna_path:'$.incident.surface_problem',status:'abstracted_from_source',materiality:'critical',source_locator:'§1',support_note:null,reviewer_note:null},
      {case_dna_path:'$.mechanism.core_mechanism',status:'abstracted_from_source',materiality:'critical',source_locator:'§2',support_note:null,reviewer_note:null},
      {case_dna_path:'$.evidence[0]',status:'source_supported',materiality:'critical',source_locator:'§3',support_note:null,reviewer_note:null},
      {case_dna_path:'$.hypotheses[0]',status:'abstracted_from_source',materiality:'critical',source_locator:'§4',support_note:null,reviewer_note:null},
      {case_dna_path:'$.reveal',status:'abstracted_from_source',materiality:'critical',source_locator:'§5',support_note:null,reviewer_note:null}
    ],
    review:{review_status:'needs_review',reviewed_at:null,reviewer:null,notes:null}
  };
  const job={
    schema_version:'corpus_ingestion_job_v1',job_id:'batch:review-provider',
    source:{source_id:'review-provider',title:'Source',source_family:'fbi_history',source_type:'real_case',source_reference:'https://example.test/source',source_locator:null,rights_status:'government_public_record',rights_evidence_reference:'https://example.test/rights',rights_verified_date:'2026-09-23',ingestion_policy:'metadata_and_analysis_only',raw_text_retained:false,target_pattern_tags:[]},
    constraints:{retain_raw_text:false,copy_distinctive_plot:false,fabricate_unknowns:false,critical_claims_need_locators:true,output_language:'en',notes:[]},
    required_outputs:['case_dna_v1','case_dna_provenance_v1','extraction_notes']
  };
  const result={schema_version:'corpus_extraction_result_v1',extraction_run_id:'run-provider-1',job_id:job.job_id,extractor_id:'extractor-A',extracted_at:'2026-09-23',case_dna:caseDna,provenance,extraction_notes:{}};
  return {job,result};
}
function approvedReview(){
  return {
    schema_version:'corpus_extraction_review_v1',
    extraction_run_id:'run-provider-1',
    job_id:'batch:review-provider',
    case_id:'review-provider-derived',
    extractor_id:'extractor-A',
    reviewer_id:'reviewer-B',
    reviewed_at:'2026-09-24T00:00:00Z',
    checks:{rights_policy_match:true,critical_claims_supported:true,unknowns_preserved:true,hypotheses_grounded:true,no_raw_text_leakage:true,no_distinctive_plot_copy:true},
    verdict:'approved',
    issues:[],
    notes:'independent source verification passed'
  };
}
function writeFixture(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'review-provider-'));
  const {job,result}=fixture();
  const jf=path.join(dir,'job.json'),rf=path.join(dir,'result.json');
  fs.writeFileSync(jf,JSON.stringify(job)); fs.writeFileSync(rf,JSON.stringify(result));
  return {dir,jf,rf};
}
async function server(reply,fn){
  let captured='';
  const s=http.createServer((req,res)=>{
    let body=''; req.on('data',d=>body+=d); req.on('end',()=>{
      captured=body;
      res.writeHead(200,{'content-type':'application/json'});
      res.end(JSON.stringify(reply));
    });
  });
  await new Promise(r=>s.listen(0,'127.0.0.1',r));
  try{ await fn(`http://127.0.0.1:${s.address().port}/review`,()=>captured); }
  finally{ await new Promise(r=>s.close(r)); }
}
function run(script,args,env={}){
  return new Promise(resolve=>{
    const c=spawn(process.execPath,[script,...args],{cwd:repo,env:{...process.env,...env},stdio:['ignore','pipe','pipe']});
    let stdout='',stderr=''; c.stdout.on('data',d=>stdout+=d); c.stderr.on('data',d=>stderr+=d);
    c.on('close',code=>resolve({code,stdout,stderr}));
  });
}

test('review provider gets review contract and cannot inherit unrelated private canary env',async()=>{
  const {jf,rf}=writeFixture();
  let body='';
  await server({review:approvedReview()},async(endpoint,captured)=>{
    const r=await run(runner,['--result',rf,'--job',jf,'--reviewer-id','reviewer-B','--endpoint',endpoint],{PRIVATE_CANON_CANARY:'DO_NOT_SEND_X321'});
    assert.equal(r.code,0,r.stderr);
    body=captured();
  });
  assert.match(body,/corpus_review_provider_request_v1/);
  assert.match(body,/reviewer-B/);
  assert.match(body,/https:\/\/example\.test\/source/);
  assert.doesNotMatch(body,/DO_NOT_SEND_X321/);
});

test('review provider rejects identity substitution',async()=>{
  const {jf,rf}=writeFixture();
  const bad=approvedReview(); bad.reviewer_id='reviewer-C';
  await server({review:bad},async endpoint=>{
    const r=await run(runner,['--result',rf,'--job',jf,'--reviewer-id','reviewer-B','--endpoint',endpoint]);
    assert.notEqual(r.code,0);
    assert.match(r.stderr,/Reviewer identity mismatch/);
  });
});

test('approved reviewer result becomes eligible but orchestrator never promotes files itself',async()=>{
  const {dir,jf,rf}=writeFixture();
  const out=path.join(dir,'report.json');
  await server({review:approvedReview()},async endpoint=>{
    const r=await run(orchestrator,['--result',rf,'--job',jf,'--reviewer-id','reviewer-B','--endpoint',endpoint,'--out',out]);
    assert.equal(r.code,0,r.stderr);
  });
  const report=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(report.eligible_for_private_corpus,true);
  assert.equal(report.promotion_status,'eligible_for_private_corpus');
  assert.match(report.note,/never moves files/i);
});

test('needs_rework reviewer result remains blocked',async()=>{
  const {dir,jf,rf}=writeFixture();
  const out=path.join(dir,'report.json');
  const review=approvedReview();
  review.verdict='needs_rework';
  review.checks.critical_claims_supported=false;
  review.issues=[{severity:'fail',code:'GROUNDING',message:'critical claim unsupported',case_dna_path:'$.mechanism.core_mechanism',source_locator:'§2'}];
  await server({review},async endpoint=>{
    const r=await run(orchestrator,['--result',rf,'--job',jf,'--reviewer-id','reviewer-B','--endpoint',endpoint,'--out',out]);
    assert.notEqual(r.code,0);
  });
  const report=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(report.eligible_for_private_corpus,false);
  assert.equal(report.review_verdict,'needs_rework');
});
