import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';

const repo=process.cwd();
const orchestrator=path.join(repo,'tools/mystery-corpus/run-adversarial-theory-audit.mjs');

function privateCase() {
  return {
    schema_version:'case_dna_v1',
    case_id:'e2e-canary',
    title:'E2E Canary',
    source:{source_type:'synthetic',rights_status:'owned',ingestion_policy:'full_text_allowed',provenance:'test'},
    incident:{category:'loss',surface_problem:'Во время проверки исчез тестовый объект.',setting:'lab',stakes:'Нужно понять причину.',crime_required:true},
    mechanism:{core_mechanism:'PRIVATE_CANON_E2E_X91',mechanism_tags:['hidden']},
    characters:[
      {id:'P1',role:'инженер',knowledge:['PRIVATE_CANON_E2E_X91'],errors:[],lies:[],human_goal:'работа'}
    ],
    timeline:[],
    evidence:[
      {id:'E1',type:'document',provenance:'журнал',fact:'Журнал показывает плановую операцию.',availability_stage:0,reliability:'high',supports:['HC'],weakens:[],essential:true,corroborated_by:[],source_reason:'автоматическая запись'},
      {id:'E2',type:'physical',provenance:'осмотр',fact:'Физическая метка объекта не соответствует обычной плановой операции.',availability_stage:1,reliability:'high',supports:['HC'],weakens:[],essential:true,corroborated_by:[],source_reason:'осмотр'}
    ],
    lies_and_misdirection:[],
    hypotheses:[
      {id:'HC',claim:'PRIVATE_CANON_E2E_X91 canonical solution',supporting_evidence:['E1','E2'],contradicting_evidence:[],viable_until_stage:1,canonical:true}
    ],
    deductions:[],
    reveal:{recontextualized_facts:['E1','E2'],causal_compression:'PRIVATE_CANON_E2E_X91',signature_moment:'',retell_hook:'',new_answer_changing_fact:false},
    fingerprint:{incident_tags:[],setting_tags:[],mechanism_tags:['hidden'],motive_tags:[],character_topology:[],evidence_topology:['document+physical'],reversal_tags:[],decisive_proof_tags:['physical-mark'],signature_action_tags:[]}
  };
}
function alternative(conflict='E2') {
  return [{
    schema_version:'adversarial_theory_v1',
    theory_id:'PROCESS_ERROR',
    claim:'Исчезновение объясняется ошибкой учёта без умысла.',
    explains_evidence_ids:['E1'],
    conflicts_evidence_ids:[conflict],
    assumptions:['Журнал отражает плановый процесс, но не гарантирует физическое состояние объекта.'],
    requires_new_answer_fact:false,
    discriminating_checks:[{question:'Сверить физическую метку объекта с регламентом.',expected_difference:'При обычной ошибке метка должна соответствовать штатной операции.',available_before_reveal:true}],
    origin:'solution-isolated-test-provider'
  }];
}
async function withServer(responseTheories,fn) {
  let captured='';
  const server=http.createServer((req,res)=>{
    let body='';
    req.on('data',d=>body+=d);
    req.on('end',()=>{
      captured=body;
      res.writeHead(200,{'content-type':'application/json'});
      res.end(JSON.stringify({theories:responseTheories}));
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const {port}=server.address();
    await fn(`http://127.0.0.1:${port}/adv`,()=>captured);
  } finally {
    await new Promise(resolve=>server.close(resolve));
  }
}
function run(endpoint,file,out) {
  return new Promise(resolve=>{
    const child=spawn(process.execPath,[orchestrator,'--case',file,'--endpoint',endpoint,'--out',out],{
      cwd:repo,env:process.env,stdio:['ignore','pipe','pipe']
    });
    let stdout='',stderr='';
    child.stdout.on('data',d=>stdout+=d);
    child.stderr.on('data',d=>stderr+=d);
    child.on('close',code=>resolve({code,stdout,stderr}));
  });
}

test('end-to-end adversarial audit passes without leaking private canon to provider',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'adv-e2e-good-'));
  const cf=path.join(dir,'case.json'), out=path.join(dir,'report.json');
  fs.writeFileSync(cf,JSON.stringify(privateCase()));
  await withServer(alternative(),async(endpoint,captured)=>{
    const r=await run(endpoint,cf,out);
    assert.equal(r.code,0,r.stderr);
    assert.doesNotMatch(captured(),/PRIVATE_CANON_E2E_X91/);
    assert.match(captured(),/плановую операцию|плановый процесс/i);
  });
  const report=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(report.audit.verdict,'PASS');
  assert.equal(report.generated_theory_count,1);
  assert.ok(report.audit.stage_matrix.at(-1).hypotheses.some(h=>h.hypothesis_id==='ADV:PROCESS_ERROR'));
  assert.equal(report.provider_boundary.private_case_sent_to_provider,false);
});

test('end-to-end audit fails when generated alternative survives all visible evidence',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'adv-e2e-fail-'));
  const cf=path.join(dir,'case.json'), out=path.join(dir,'report.json');
  fs.writeFileSync(cf,JSON.stringify(privateCase()));
  const survivor=alternative();
  survivor[0].conflicts_evidence_ids=[];
  await withServer(survivor,async endpoint=>{
    const r=await run(endpoint,cf,out);
    assert.notEqual(r.code,0);
  });
  const report=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(report.audit.verdict,'FAIL');
  assert.ok(report.audit.issues.some(x=>x.code==='UNRESOLVED_ALTERNATIVE'&&x.hypothesis_id==='ADV:PROCESS_ERROR'));
});
